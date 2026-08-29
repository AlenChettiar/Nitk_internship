#!/usr/bin/env python3
"""
Guided Training Data Collector for DroneCMD ML Classifier.

Walks you through capturing labeled IQ samples from your HackRF One
for training the drone detection ML model.

Usage:
    python collect_training_data.py                    # Full guided mode
    python collect_training_data.py --label noise      # Capture noise only
    python collect_training_data.py --label drone      # Capture drone only
    python collect_training_data.py --dry-run           # Test without saving
    python collect_training_data.py --source zmq        # Use GNU Radio ZMQ stream

Requires:
    - HackRF One connected (for --source hackrf, the default)
    - OR GNU Radio flowgraph running with ZMQ push on tcp://127.0.0.1:5555
"""

from __future__ import annotations

import argparse
import json
import os
import signal
import subprocess
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

import numpy as np

# Optional ZMQ support for GNU Radio integration
try:
    import zmq
    ZMQ_AVAILABLE = True
except ImportError:
    ZMQ_AVAILABLE = False


# ─── Configuration ────────────────────────────────────────────────────
DEFAULT_FREQ_HZ = 2_440_000_000      # 2.44 GHz center (DJI OcuSync)
DEFAULT_SAMPLE_RATE = 20_000_000     # 20 MHz bandwidth
DEFAULT_DURATION_S = 30              # 30 seconds per capture
DEFAULT_GAIN = 40                    # LNA gain in dB
DEFAULT_VGA_GAIN = 40                # VGA gain in dB
DEFAULT_CAPTURES_DIR = "captures"
ZMQ_ENDPOINT = "tcp://127.0.0.1:5555"

LABELS = {
    "noise":       "unknown",         # Maps to DroneCMD's 'unknown' class
    "wifi":        "unknown",         # Wi-Fi background → 'unknown' class
    "drone":       "dji_ocusync",     # Default drone protocol label
    "dji_ocusync": "dji_ocusync",
    "dji_wifi":    "dji_wifi",
    "parrot":      "parrot",
    "mavlink":     "mavlink",
}


def print_banner():
    print("\n" + "=" * 65)
    print("📡  DroneCMD — ML Training Data Collector")
    print("    HackRF One → Labeled IQ Captures → sklearn Classifier")
    print("=" * 65)


def check_hackrf() -> bool:
    """Verify HackRF is connected."""
    try:
        result = subprocess.run(
            ["hackrf_info"], capture_output=True, text=True, timeout=10
        )
        if "Found HackRF" in result.stdout:
            serial = "unknown"
            for line in result.stdout.splitlines():
                if "Serial number:" in line:
                    serial = line.split(":")[-1].strip()
            print(f"  ✅ HackRF One detected (serial: {serial})")
            return True
        else:
            print("  ❌ HackRF not found. Is it plugged in?")
            return False
    except FileNotFoundError:
        print("  ❌ 'hackrf_info' command not found. Install hackrf tools.")
        return False
    except subprocess.TimeoutExpired:
        print("  ❌ HackRF check timed out.")
        return False


def capture_iq_hackrf(
    output_path: Path,
    freq_hz: int = DEFAULT_FREQ_HZ,
    sample_rate: int = DEFAULT_SAMPLE_RATE,
    duration_s: int = DEFAULT_DURATION_S,
    lna_gain: int = DEFAULT_GAIN,
    vga_gain: int = DEFAULT_VGA_GAIN,
    dry_run: bool = False,
) -> bool:
    """Capture IQ samples using hackrf_transfer CLI tool."""
    # hackrf_transfer captures 8-bit signed I/Q pairs
    # Total bytes = sample_rate * 2 (I+Q) * duration
    num_samples = sample_rate * duration_s

    cmd = [
        "hackrf_transfer",
        "-r", str(output_path),
        "-f", str(freq_hz),
        "-s", str(sample_rate),
        "-n", str(num_samples),
        "-l", str(lna_gain),
        "-g", str(vga_gain),
    ]

    if dry_run:
        print(f"  [DRY RUN] Would execute: {' '.join(cmd)}")
        return True

    print(f"  📻 Capturing {duration_s}s at {freq_hz/1e9:.3f} GHz, {sample_rate/1e6:.0f} MHz BW...")
    print(f"     LNA gain: {lna_gain} dB, VGA gain: {vga_gain} dB")
    print(f"     Output: {output_path}")

    try:
        process = subprocess.Popen(
            cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE
        )

        # Show progress
        start = time.time()
        while process.poll() is None:
            elapsed = time.time() - start
            remaining = max(0, duration_s - elapsed)
            bar_len = 30
            progress = min(1.0, elapsed / duration_s)
            filled = int(bar_len * progress)
            bar = "█" * filled + "░" * (bar_len - filled)
            sys.stdout.write(
                f"\r     [{bar}] {elapsed:.0f}s / {duration_s}s "
                f"({remaining:.0f}s remaining)  "
            )
            sys.stdout.flush()
            time.sleep(0.5)

        print()  # newline after progress bar

        if process.returncode == 0:
            file_size = output_path.stat().st_size if output_path.exists() else 0
            print(f"  ✅ Capture complete: {file_size / 1e6:.1f} MB")
            return True
        else:
            stderr = process.stderr.read().decode() if process.stderr else ""
            print(f"  ❌ hackrf_transfer failed (exit {process.returncode})")
            if stderr:
                print(f"     {stderr.strip()}")
            return False

    except FileNotFoundError:
        print("  ❌ 'hackrf_transfer' not found. Install hackrf tools.")
        return False
    except Exception as e:
        print(f"  ❌ Capture error: {e}")
        return False


def capture_iq_zmq(
    output_path: Path,
    sample_rate: int = DEFAULT_SAMPLE_RATE,
    duration_s: int = DEFAULT_DURATION_S,
    endpoint: str = ZMQ_ENDPOINT,
    dry_run: bool = False,
) -> bool:
    """Capture IQ samples from a GNU Radio ZMQ stream."""
    if not ZMQ_AVAILABLE:
        print("  ❌ pyzmq not installed. Run: pip install pyzmq")
        return False

    if dry_run:
        print(f"  [DRY RUN] Would capture {duration_s}s from ZMQ {endpoint}")
        return True

    print(f"  📻 Capturing {duration_s}s from ZMQ stream ({endpoint})...")

    context = zmq.Context()
    socket = context.socket(zmq.PULL)
    socket.setsockopt(zmq.RCVTIMEO, 5000)  # 5s timeout

    try:
        socket.connect(endpoint)
    except zmq.ZMQError as e:
        print(f"  ❌ Cannot connect to ZMQ at {endpoint}: {e}")
        print("     Is GNU Radio flowgraph running?")
        context.term()
        return False

    collected = []
    total_samples = 0
    target_samples = sample_rate * duration_s
    start = time.time()

    try:
        while total_samples < target_samples:
            try:
                raw_data = socket.recv()
                iq_samples = np.frombuffer(raw_data, dtype=np.complex64)
                collected.append(iq_samples)
                total_samples += len(iq_samples)

                elapsed = time.time() - start
                progress = min(1.0, total_samples / target_samples)
                bar_len = 30
                filled = int(bar_len * progress)
                bar = "█" * filled + "░" * (bar_len - filled)
                sys.stdout.write(
                    f"\r     [{bar}] {total_samples/1e6:.1f}M / "
                    f"{target_samples/1e6:.0f}M samples  "
                )
                sys.stdout.flush()

            except zmq.Again:
                print("\n  ❌ ZMQ timeout — no data received. Is GNU Radio running?")
                return False

        print()  # newline after progress bar

        # Concatenate and save as raw complex64
        all_samples = np.concatenate(collected)[:target_samples]
        all_samples.tofile(str(output_path))

        file_size = output_path.stat().st_size
        print(f"  ✅ Capture complete: {file_size / 1e6:.1f} MB ({len(all_samples)} samples)")
        return True

    except KeyboardInterrupt:
        print("\n  ⚠️  Capture interrupted by user")
        if collected:
            partial = np.concatenate(collected)
            partial.tofile(str(output_path))
            print(f"  💾 Saved partial capture: {len(partial)} samples")
            return True
        return False
    finally:
        socket.close()
        context.term()


def validate_capture(filepath: Path, sample_rate: int = DEFAULT_SAMPLE_RATE, data_format: str = "int8") -> dict:
    """Quick validation that a capture file has signal content."""
    try:
        if data_format == "complex64":
            iq = np.fromfile(str(filepath), dtype=np.complex64)
            if len(iq) < 512:
                return {"valid": False, "reason": "File too small"}
        else:
            # Read as 8-bit signed I/Q (hackrf_transfer format)
            raw = np.fromfile(str(filepath), dtype=np.int8)
            if len(raw) < 1024:
                return {"valid": False, "reason": "File too small"}

            # Separate I and Q
            i_samples = raw[0::2].astype(np.float32)
            q_samples = raw[1::2].astype(np.float32)
            iq = i_samples + 1j * q_samples

        # Compute power spectrum
        fft_data = np.fft.fftshift(np.fft.fft(iq[:min(len(iq), 65536)]))
        psd = 20 * np.log10(np.abs(fft_data) + 1e-12)

        noise_floor = np.median(psd)
        peak_power = np.max(psd)
        snr = peak_power - noise_floor
        duration = len(iq) / sample_rate

        return {
            "valid": True,
            "num_samples": len(iq),
            "duration_s": round(duration, 2),
            "noise_floor_db": round(float(noise_floor), 1),
            "peak_power_db": round(float(peak_power), 1),
            "snr_db": round(float(snr), 1),
            "file_size_mb": round(filepath.stat().st_size / 1e6, 1),
        }
    except Exception as e:
        return {"valid": False, "reason": str(e)}


def write_sidecar(
    iq_path: Path,
    protocol_label: str,
    freq_hz: int,
    sample_rate: int,
    drone_model: str = "",
    environment: str = "unknown",
    notes: str = "",
):
    """Write a JSON sidecar file for a capture (DroneCMD labeling format)."""
    sidecar = {
        "protocol": protocol_label,
        "frequency_hz": freq_hz,
        "sample_rate_hz": sample_rate,
        "capture_date": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        "capture_time": datetime.now(timezone.utc).strftime("%H:%M:%S UTC"),
        "drone_model": drone_model,
        "environment": environment,
        "notes": notes,
        "format": "int8_iq",  # hackrf_transfer native format
    }

    sidecar_path = iq_path.with_suffix(".json")
    with open(sidecar_path, "w") as f:
        json.dump(sidecar, f, indent=2)

    return sidecar_path


def run_guided_collection(args):
    """Interactive guided data collection session."""
    print_banner()

    captures_dir = Path(args.captures_dir)
    source = args.source

    # Step 0: Check hardware
    print("\n🔍 Step 0: Checking hardware...")
    if source == "hackrf":
        if not check_hackrf():
            print("\n💡 Tip: Use --source zmq if you want to capture via GNU Radio instead.")
            sys.exit(1)
    elif source == "zmq":
        if not ZMQ_AVAILABLE:
            print("  ❌ pyzmq not installed. Run: pip install pyzmq")
            sys.exit(1)
        print(f"  📡 ZMQ mode: will read from {ZMQ_ENDPOINT}")
        print("     Make sure GNU Radio flowgraph is running!")

    # Determine which labels to collect
    if args.label:
        labels_to_collect = [args.label]
    else:
        labels_to_collect = ["noise", "drone"]

    freq_hz = int(args.frequency)
    sample_rate = int(args.sample_rate)
    duration_s = int(args.duration)
    num_captures = args.count

    for label in labels_to_collect:
        protocol_label = LABELS.get(label, label)
        label_dir = captures_dir / protocol_label
        label_dir.mkdir(parents=True, exist_ok=True)

        print(f"\n{'='*65}")
        if label in ("noise", "wifi"):
            print(f"📋 Phase: Collecting '{label}' samples (→ label: '{protocol_label}')")
            print("   ⚠️  KEEP YOUR DRONE POWERED OFF!")
            print("   We're capturing the ambient RF environment (Wi-Fi, Bluetooth, etc.)")
        else:
            print(f"📋 Phase: Collecting '{label}' samples (→ label: '{protocol_label}')")
            print("   ✈️  POWER ON your drone and link the controller!")
            print("   Place the drone 5-20m away with line of sight.")
        print(f"{'='*65}")

        if not args.dry_run:
            input(f"\n   Press ENTER when ready to start {label} captures...")

        for i in range(1, num_captures + 1):
            # Generate race-safe filename using timestamp
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            filename = f"{label}_{timestamp}_{i:03d}.iq"
            output_path = label_dir / filename

            print(f"\n  ── Capture {i}/{num_captures}: {filename} ──")

            # Capture
            if source == "hackrf":
                success = capture_iq_hackrf(
                    output_path=output_path,
                    freq_hz=freq_hz,
                    sample_rate=sample_rate,
                    duration_s=duration_s,
                    lna_gain=int(args.lna_gain),
                    vga_gain=int(args.vga_gain),
                    dry_run=args.dry_run,
                )
            else:
                success = capture_iq_zmq(
                    output_path=output_path,
                    sample_rate=sample_rate,
                    duration_s=duration_s,
                    dry_run=args.dry_run,
                )

            if not success:
                print(f"  ⚠️  Capture {i} failed. Skipping.")
                continue

            if not args.dry_run:
                # Validate
                print("  🔬 Validating capture...")
                stats = validate_capture(
                    output_path, sample_rate,
                    data_format="complex64" if source == "zmq" else "int8"
                )
                if stats["valid"]:
                    print(f"     Duration: {stats['duration_s']}s | "
                          f"SNR: {stats['snr_db']:.1f} dB | "
                          f"Size: {stats['file_size_mb']:.1f} MB")

                    if label == "drone" and stats["snr_db"] < 5:
                        print("     ⚠️  Low SNR — drone signal may be too weak. "
                              "Move drone closer or increase gain.")

                # Write sidecar JSON
                sidecar_path = write_sidecar(
                    iq_path=output_path,
                    protocol_label=protocol_label,
                    freq_hz=freq_hz,
                    sample_rate=sample_rate,
                    drone_model=args.drone_model,
                    environment=args.environment,
                    notes=f"Capture {i}/{num_captures}, label={label}",
                )
                print(f"  📝 Sidecar: {sidecar_path.name}")
            else:
                print(f"  [DRY RUN] Would write sidecar JSON")

    # Summary
    print(f"\n{'='*65}")
    print("✅ Data collection complete!")
    print(f"{'='*65}")

    if not args.dry_run:
        print(f"\n📁 Captures saved to: {captures_dir.resolve()}")

        # Count files per label
        for subdir in sorted(captures_dir.iterdir()):
            if subdir.is_dir():
                iq_count = len(list(subdir.glob("*.iq")))
                if iq_count > 0:
                    print(f"   {subdir.name}/: {iq_count} captures")

        print(f"\n🚀 Next step — train the model:")
        print(f"   cd {Path.cwd()}")
        print(f"   dronecmd train --data-dir {captures_dir} --output-dir models/")
        print(f"\n   Or run:")
        print(f"   python -m training.train --data-dir {captures_dir} --output-dir models/")


def main():
    parser = argparse.ArgumentParser(
        description="Guided training data collector for DroneCMD ML classifier.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  %(prog)s                                  # Full guided mode
  %(prog)s --label noise --count 5          # 5 noise captures
  %(prog)s --label drone --count 10         # 10 drone captures
  %(prog)s --source zmq --label drone       # Capture via GNU Radio ZMQ
  %(prog)s --dry-run                        # Test without saving
  %(prog)s --frequency 5.8e9               # 5.8 GHz band
        """,
    )
    parser.add_argument(
        "--source", choices=["hackrf", "zmq"], default="hackrf",
        help="IQ source: 'hackrf' (direct) or 'zmq' (GNU Radio stream). Default: hackrf",
    )
    parser.add_argument(
        "--label", type=str, default=None,
        help="Single label to collect (noise, wifi, drone, dji_ocusync, parrot, mavlink). "
             "Omit for guided multi-phase collection.",
    )
    parser.add_argument(
        "--count", type=int, default=5,
        help="Number of captures per label. Default: 5",
    )
    parser.add_argument(
        "--duration", type=float, default=DEFAULT_DURATION_S,
        help=f"Duration per capture in seconds. Default: {DEFAULT_DURATION_S}",
    )
    parser.add_argument(
        "--frequency", type=float, default=DEFAULT_FREQ_HZ,
        help=f"Center frequency in Hz. Default: {DEFAULT_FREQ_HZ} (2.44 GHz)",
    )
    parser.add_argument(
        "--sample-rate", type=float, default=DEFAULT_SAMPLE_RATE,
        help=f"Sample rate in Hz. Default: {DEFAULT_SAMPLE_RATE} (20 MHz)",
    )
    parser.add_argument(
        "--lna-gain", type=int, default=DEFAULT_GAIN,
        help=f"HackRF LNA gain (dB). Default: {DEFAULT_GAIN}",
    )
    parser.add_argument(
        "--vga-gain", type=int, default=DEFAULT_VGA_GAIN,
        help=f"HackRF VGA gain (dB). Default: {DEFAULT_VGA_GAIN}",
    )
    parser.add_argument(
        "--captures-dir", type=str, default=DEFAULT_CAPTURES_DIR,
        help=f"Output directory for captures. Default: {DEFAULT_CAPTURES_DIR}",
    )
    parser.add_argument(
        "--drone-model", type=str, default="",
        help="Drone model name for metadata (e.g., 'DJI Mini 3 Pro')",
    )
    parser.add_argument(
        "--environment", type=str, default="unknown",
        choices=["indoor", "outdoor_open", "outdoor_urban", "unknown"],
        help="Capture environment for metadata. Default: unknown",
    )
    parser.add_argument(
        "--dry-run", action="store_true",
        help="Test run without actually capturing or saving files",
    )

    args = parser.parse_args()
    run_guided_collection(args)


if __name__ == "__main__":
    main()
