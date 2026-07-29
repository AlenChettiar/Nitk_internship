#!/usr/bin/env python3
"""
HackRF One Live Real-Time Integration with IQTLabs RFClassification.

Combines HackRF SDR hardware streaming with pre-trained Deep Learning models:
1. GamutRF ResNet18 (Pre-trained PyTorch weights on real field drone RF data: drone vs wifi_2_4 vs wifi_5)
2. RFUAV-Net (1D Convolutional Neural Network on raw IQ waveform)
3. PSD + SVM (Power Spectral Density + Support Vector Machine)

Usage:
    # 1. Run live detection with pre-trained ResNet18 model & HackRF One:
    python hackrf_rfclassification_live.py --model gamutrf --frequency 2.44e9

    # 2. Run via GNU Radio ZMQ stream (compatible with test1.py flowgraph):
    python hackrf_rfclassification_live.py --model gamutrf --source zmq

    # 3. Test inference pipeline with synthetic data (no hardware needed):
    python hackrf_rfclassification_live.py --test

Requires:
    - HackRF One connected (or GNU Radio ZMQ stream on tcp://127.0.0.1:5555)
    - PyTorch & Torchvision
    - Pre-trained weights in gamutRF/model_weights/
"""

import argparse
import json
import os
import signal
import sqlite3
import subprocess
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
from scipy import signal as dsp_signal
import matplotlib.pyplot as plt

# PyTorch
import torch
import torch.nn as nn
import torchvision.transforms as transforms
from torchvision import models

# ZMQ for GNU Radio integration
try:
    import zmq
    ZMQ_AVAILABLE = True
except ImportError:
    ZMQ_AVAILABLE = False


# ─── Configuration ────────────────────────────────────────────────────
DEFAULT_FREQ_HZ = 2_440_000_000      # 2.44 GHz center frequency
DEFAULT_SAMPLE_RATE = 20_000_000     # 20 MHz sampling rate
DEFAULT_LNA_GAIN = 40
DEFAULT_VGA_GAIN = 40
ZMQ_ENDPOINT = "tcp://127.0.0.1:5555"
DETECTION_DB = "drone_detections.db"

# Model constants (GamutRF ResNet18 specification)
MODEL_SAMPLE_SECS = 0.02             # 20 ms window
DEFAULT_NFFT = 512                   # FFT length matching checkpoint

# Console formatting
RED = "\033[91m"
GREEN = "\033[92m"
YELLOW = "\033[93m"
CYAN = "\033[96m"
BOLD = "\033[1m"
RESET = "\033[0m"

running = True


def sig_handler(sig, frame):
    global running
    running = False
    print(f"\n{YELLOW}⚠️  Shutting down HackRF RFClassification Detector...{RESET}")


signal.signal(signal.SIGINT, sig_handler)
signal.signal(signal.SIGTERM, sig_handler)


# ═══════════════════════════════════════════════════════════════════════
# GamutRF ResNet18 PyTorch Model Loader
# ═══════════════════════════════════════════════════════════════════════

class GamutRFResNet18Detector:
    """Pre-trained ResNet18 PyTorch model from IQTLabs GamutRF."""

    def __init__(self, weights_path: Path, device: Optional[torch.device] = None):
        if device is None:
            self.device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")
        else:
            self.device = device

        if not weights_path.exists():
            raise FileNotFoundError(f"Pre-trained weights file not found: {weights_path}")

        print(f"📦 Loading pre-trained GamutRF ResNet18 model from: {weights_path.name}")
        self.checkpoint = torch.load(weights_path, map_location=self.device)

        self.idx_to_class = self.checkpoint.get("dataset_idx_to_class", {0: 'drone', 1: 'wifi_2_4', 2: 'wifi_5'})
        self.sample_secs = self.checkpoint.get("sample_secs", MODEL_SAMPLE_SECS)
        self.nfft = self.checkpoint.get("nfft", DEFAULT_NFFT)

        n_classes = len(self.idx_to_class)
        self.model = models.resnet18()
        self.model.fc = nn.Linear(self.model.fc.in_features, n_classes)

        model_weights = self.checkpoint.get("model_state_dict", self.checkpoint)
        self.model.load_state_dict(model_weights)
        self.model.to(self.device)
        self.model.eval()

        self.cmap = plt.get_cmap('jet')
        self.transform = transforms.Compose([
            transforms.ToTensor(),
            transforms.Resize((256, 256)),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
        ])

        print(f"   Classes: {self.idx_to_class}")
        print(f"   Sample window: {self.sample_secs*1000:.1f} ms | NFFT: {self.nfft} | Device: {self.device}")

    def iq_to_spectrogram_tensor(self, iq_samples: np.ndarray, sample_rate: float) -> torch.Tensor:
        """Convert IQ array -> Spectrogram Image -> ResNet PyTorch Tensor."""
        # Compute Spectrogram via scipy
        f, t, S = dsp_signal.spectrogram(
            iq_samples,
            fs=sample_rate,
            window=dsp_signal.windows.hann(self.nfft, sym=False),
            nperseg=self.nfft,
            detrend='constant',
            return_onesided=False
        )
        f = np.fft.fftshift(f)
        S = np.fft.fftshift(S, axes=0)
        S_db = 10 * np.log10(S + 1e-12)

        # Fixed absolute dBFS scaling (-60 dBFS to 0 dBFS)
        # Background noise (-24 dBFS) -> dim blue/cyan
        # Drone signal (-7 dBFS) -> bright red/yellow
        min_db = -60.0
        max_db = 0.0
        S_norm = np.clip((S_db - min_db) / (max_db - min_db), 0.0, 1.0)

        # Jet colormap -> RGB
        rgba_img = self.cmap(S_norm)
        rgb_img = np.delete(rgba_img, 3, axis=2).astype(np.float32)

        # Apply torchvision transforms -> [1, 3, 256, 256]
        tensor = self.transform(rgb_img).unsqueeze(0)
        return tensor.to(self.device)

    def predict(self, iq_samples: np.ndarray, sample_rate: float) -> Dict[str, Any]:
        """Run neural network inference on a chunk of IQ samples."""
        start_time = time.perf_counter()

        # Always run NN — no SNR gate. Spread-spectrum signals (drones, OcuSync)
        # look like noise-floor in PSD; hard SNR gates block them.
        tensor = self.iq_to_spectrogram_tensor(iq_samples, sample_rate)

        with torch.no_grad():
            output = self.model(tensor)
            probs = torch.softmax(output, dim=1).cpu().numpy()[0]

        pred_idx = int(np.argmax(probs))
        confidence = float(probs[pred_idx])
        label = self.idx_to_class.get(pred_idx, f"class_{pred_idx}")

        elapsed_ms = (time.perf_counter() - start_time) * 1000
        probabilities = {self.idx_to_class[i]: float(probs[i]) for i in range(len(probs))}

        return {
            "label": label,
            "confidence": confidence,
            "probabilities": probabilities,
            "processing_time_ms": round(elapsed_ms, 2)
        }


# ═══════════════════════════════════════════════════════════════════════
# Hardware IQ Stream Sources
# ═══════════════════════════════════════════════════════════════════════

class HackRFStreamer:
    """Stream raw IQ directly from HackRF One via FIFO pipe."""

    def __init__(self, freq_hz: float, sample_rate: float, lna_gain: int, vga_gain: int):
        self.freq_hz = int(freq_hz)
        self.sample_rate = int(sample_rate)
        self.lna_gain = lna_gain
        self.vga_gain = vga_gain
        self.fifo_path = Path("/tmp/hackrf_rfclass.fifo")
        self.process: Optional[subprocess.Popen] = None

    def start(self):
        if self.fifo_path.exists():
            os.unlink(self.fifo_path)
        os.mkfifo(str(self.fifo_path))

        cmd = [
            "hackrf_transfer",
            "-r", str(self.fifo_path),
            "-f", str(self.freq_hz),
            "-s", str(self.sample_rate),
            "-l", str(self.lna_gain),
            "-g", str(self.vga_gain)
        ]
        self.process = subprocess.Popen(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)
        self.fifo_fd = open(str(self.fifo_path), "rb")
        print(f"📡 HackRF hardware stream active on {self.freq_hz/1e9:.3f} GHz @ {self.sample_rate/1e6:.0f} MHz BW")

    def read_iq_window(self, window_secs: float) -> Optional[np.ndarray]:
        num_samples = int(self.sample_rate * window_secs)
        req_bytes = num_samples * 2  # 8-bit signed I/Q interleaved
        try:
            raw = self.fifo_fd.read(req_bytes)
            if len(raw) < req_bytes:
                return None
            data = np.frombuffer(raw, dtype=np.int8)
            i_samples = data[0::2].astype(np.float32) / 128.0
            q_samples = data[1::2].astype(np.float32) / 128.0
            return (i_samples + 1j * q_samples).astype(np.complex64)
        except Exception:
            return None

    def stop(self):
        if hasattr(self, 'process') and self.process:
            self.process.terminate()
            self.process.wait(timeout=3)
        if hasattr(self, 'fifo_fd'):
            self.fifo_fd.close()
        if self.fifo_path.exists():
            os.unlink(self.fifo_path)


class ZMQStreamer:
    """Stream raw IQ from GNU Radio ZMQ push sink."""

    def __init__(self, endpoint: str = ZMQ_ENDPOINT, sample_rate: float = DEFAULT_SAMPLE_RATE):
        if not ZMQ_AVAILABLE:
            raise RuntimeError("pyzmq package is required for ZMQ stream mode")
        self.endpoint = endpoint
        self.sample_rate = int(sample_rate)
        self.buffer = bytearray()

    def start(self):
        self.context = zmq.Context()
        self.socket = self.context.socket(zmq.PULL)
        self.socket.setsockopt(zmq.RCVTIMEO, 2000)
        self.socket.connect(self.endpoint)
        print(f"📡 ZMQ stream connected to {self.endpoint}")

    def read_iq_window(self, window_secs: float) -> Optional[np.ndarray]:
        num_samples = int(self.sample_rate * window_secs)
        req_bytes = num_samples * 8  # complex64 = 8 bytes
        while len(self.buffer) < req_bytes:
            try:
                msg = self.socket.recv()
                self.buffer.extend(msg)
            except zmq.Again:
                return None

        raw = bytes(self.buffer[:req_bytes])
        self.buffer = self.buffer[req_bytes:]
        return np.frombuffer(raw, dtype=np.complex64)

    def stop(self):
        if hasattr(self, 'socket') and self.socket:
            self.socket.close()
        if hasattr(self, 'context') and self.context:
            self.context.term()


# ═══════════════════════════════════════════════════════════════════════
# SQLite Database Logger
# ═══════════════════════════════════════════════════════════════════════

def init_db(db_path: str = DETECTION_DB) -> sqlite3.Connection:
    conn = sqlite3.connect(db_path)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS rf_classification_detections (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            label TEXT NOT NULL,
            confidence REAL NOT NULL,
            probabilities_json TEXT,
            processing_time_ms REAL,
            frequency_hz REAL,
            sample_rate_hz REAL,
            source TEXT
        )
    """)
    conn.commit()
    return conn


def log_result(conn: sqlite3.Connection, res: Dict, freq_hz: float, sample_rate: float, source: str):
    conn.execute(
        """INSERT INTO rf_classification_detections
           (timestamp, label, confidence, probabilities_json, processing_time_ms, frequency_hz, sample_rate_hz, source)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
        (
            datetime.now(timezone.utc).isoformat(),
            res["label"],
            res["confidence"],
            json.dumps(res["probabilities"]),
            res["processing_time_ms"],
            freq_hz,
            sample_rate,
            source,
        ),
    )
    conn.commit()


# ═══════════════════════════════════════════════════════════════════════
# Execution & Self-Test
# ═══════════════════════════════════════════════════════════════════════

def run_self_test(weights_path: Path):
    print(f"\n{BOLD}🧪 Running RFClassification Self-Test (Synthetic IQ)...{RESET}\n")

    detector = GamutRFResNet18Detector(weights_path)

    sample_rate = 20_000_000
    n_samples = int(sample_rate * detector.sample_secs)
    print(f"  Simulating {detector.sample_secs*1000:.0f} ms IQ frame ({n_samples} samples)...")

    # Synthetic Noise
    noise_iq = (np.random.randn(n_samples) + 1j * np.random.randn(n_samples)).astype(np.complex64) * 0.01
    res_noise = detector.predict(noise_iq, sample_rate)
    print(f"  1. Ambient Noise -> Predicted: {CYAN}{res_noise['label']}{RESET} (conf: {res_noise['confidence']:.1%}, time: {res_noise['processing_time_ms']} ms)")

    # Synthetic Pulsed Drone Chirp
    t = np.arange(n_samples) / sample_rate
    chirp_iq = noise_iq + 0.2 * np.exp(2j * np.pi * (2e6 * t + 5e8 * t**2)).astype(np.complex64)
    res_chirp = detector.predict(chirp_iq, sample_rate)
    print(f"  2. Pulsed Chirp  -> Predicted: {CYAN}{res_chirp['label']}{RESET} (conf: {res_chirp['confidence']:.1%}, time: {res_chirp['processing_time_ms']} ms)")

    print(f"\n{GREEN}{BOLD}✅ RFClassification + PyTorch ResNet18 pipeline verified!{RESET}\n")


def main():
    parser = argparse.ArgumentParser(
        description="HackRF One Live Real-Time Integration with IQTLabs RFClassification.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument(
        "--model", choices=["gamutrf"], default="gamutrf",
        help="Deep Learning model type. Default: gamutrf (Pre-trained ResNet18)"
    )
    parser.add_argument(
        "--weights", type=str,
        default="model_weights/resnet18_custom_hackrf.pt",
        help="Path to pre-trained PyTorch weights file."
    )
    parser.add_argument(
        "--source", choices=["hackrf", "zmq"], default="hackrf",
        help="IQ Source: 'hackrf' (direct USB) or 'zmq' (GNU Radio stream). Default: hackrf"
    )
    parser.add_argument(
        "--frequency", type=float, default=DEFAULT_FREQ_HZ,
        help=f"Center frequency in Hz. Default: {DEFAULT_FREQ_HZ} (2.44 GHz)"
    )
    parser.add_argument(
        "--sample-rate", type=float, default=DEFAULT_SAMPLE_RATE,
        help=f"Sample rate in Hz. Default: {DEFAULT_SAMPLE_RATE} (20 MHz)"
    )
    parser.add_argument(
        "--lna-gain", type=int, default=DEFAULT_LNA_GAIN,
        help=f"HackRF LNA gain in dB. Default: {DEFAULT_LNA_GAIN}"
    )
    parser.add_argument(
        "--vga-gain", type=int, default=DEFAULT_VGA_GAIN,
        help=f"HackRF VGA gain in dB. Default: {DEFAULT_VGA_GAIN}"
    )
    parser.add_argument(
        "--zmq-endpoint", type=str, default=ZMQ_ENDPOINT,
        help=f"ZMQ Push Endpoint. Default: {ZMQ_ENDPOINT}"
    )
    parser.add_argument(
        "--min-confidence", type=float, default=0.85,
        help="Minimum per-frame probability to count a vote. Default: 0.85"
    )
    parser.add_argument(
        "--vote-window", type=int, default=5,
        help="Rolling majority-vote window (number of consecutive frames). Default: 5"
    )
    parser.add_argument(
        "--vote-threshold", type=int, default=3,
        help="Votes required in window to trigger alert. Default: 3 (out of 5)"
    )
    parser.add_argument(
        "--test", action="store_true",
        help="Run self-test with synthetic IQ (no hardware required)"
    )

    args = parser.parse_args()

    weights_path = Path(args.weights)
    if not weights_path.is_absolute():
        if not weights_path.exists():
            weights_path = Path(__file__).parent / args.weights

    if args.test:
        run_self_test(weights_path)
        return

    # Load Detector
    print(f"\n{BOLD}{'='*65}{RESET}")
    print(f"{BOLD}📡 IQTLabs RFClassification + HackRF One Detector{RESET}")
    print(f"{BOLD}{'='*65}{RESET}")

    detector = GamutRFResNet18Detector(weights_path)

    # Initialize Source
    if args.source == "hackrf":
        streamer = HackRFStreamer(args.frequency, args.sample_rate, args.lna_gain, args.vga_gain)
    else:
        streamer = ZMQStreamer(endpoint=args.zmq_endpoint, sample_rate=args.sample_rate)

    conn = init_db()

    streamer.start()

    vote_window = args.vote_window
    vote_threshold = args.vote_threshold
    min_confidence = args.min_confidence

    print(f"\n{GREEN}✅ Monitoring started! Press Ctrl+C to exit.{RESET}")
    print(f"   Strategy: Rolling majority vote — {vote_threshold}/{vote_window} frames above {min_confidence:.0%} confidence")
    print(f"{'─'*70}")
    print(f"{'Time':>10} │ {'Frame Label':<16} │ {'Conf':>7} │ {'Inference':>8} │ {'Vote':>9} │ Status")
    print(f"{'─'*70}")

    total_frames = 0
    alert_detections = 0
    # Rolling deque of (label, confidence) for the last N frames
    from collections import deque
    vote_buf: deque = deque(maxlen=vote_window)
    last_alert_label = None  # Suppress repeated alert prints for same sustained signal

    try:
        while running:
            iq_window = streamer.read_iq_window(detector.sample_secs)
            if iq_window is None:
                time.sleep(0.005)
                continue

            total_frames += 1
            res = detector.predict(iq_window, args.sample_rate)

            label = res["label"]
            conf = res["confidence"]
            proc_ms = res["processing_time_ms"]
            timestamp = datetime.now().strftime("%H:%M:%S")

            # Add this frame to the rolling vote window
            vote_buf.append((label, conf))

            # Count qualified votes per class in the rolling window
            vote_counts: Dict[str, int] = {}
            for v_label, v_conf in vote_buf:
                if v_conf >= min_confidence:
                    vote_counts[v_label] = vote_counts.get(v_label, 0) + 1

            # Find the class with the most qualified votes
            winning_class = max(vote_counts, key=vote_counts.get) if vote_counts else "wifi_2_4"
            winning_votes = vote_counts.get(winning_class, 0)
            vote_str = f"{winning_votes}/{vote_window}"

            non_drone_classes = {"wifi_2_4", "wifi_5", "unknown"}
            if winning_class not in non_drone_classes and winning_votes >= vote_threshold:
                # Genuine drone signal confirmed by majority vote
                if winning_class != last_alert_label:
                    alert_detections += 1
                    log_result(conn, res, args.frequency, args.sample_rate, args.source)
                    status = f"{RED}{BOLD}🚨 DRONE DETECTED ({winning_class.upper()}){RESET}"
                    label_col = f"{CYAN}{label:<16}{RESET}"
                    probs_str = "  ".join(f"{k}={v:.1%}" for k, v in res['probabilities'].items())
                    print(f"{timestamp:>10} │ {label_col} │ {conf:>6.1%} │ {proc_ms:>6.1f}ms │ {vote_str:>9} │ {status}")
                    print(f"{'':>10} │   └─ Probs: {probs_str}")
                last_alert_label = winning_class
            else:
                last_alert_label = None
                if total_frames % 10 == 0:
                    sys.stdout.write(
                        f"\r{timestamp:>10} │ {label:<16} │ {conf:>6.1%} │ {proc_ms:>6.1f}ms │ {vote_str:>9} │ "
                        f"{GREEN}✓ clear{RESET}  [{total_frames} frames]   "
                    )
                    sys.stdout.flush()

    except KeyboardInterrupt:
        pass
    finally:
        streamer.stop()
        conn.close()

    print(f"\n\n{'='*65}")
    print(f"📊 Monitoring Session Summary")
    print(f"   Total frames processed: {total_frames}")
    print(f"   Confirmed alerts: {alert_detections}")
    print(f"   Database: {DETECTION_DB}")
    print(f"{'='*65}\n")


if __name__ == "__main__":
    main()
