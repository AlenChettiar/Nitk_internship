#!/usr/bin/env python3
"""
PyTorch ResNet18 Trainer for HackRF Drone Detection.

Fine-tunes a ResNet18 Deep Learning model directly on your local IQ captures
(captures/unknown vs captures/dji_ocusync).

Saves PyTorch weights compatible with hackrf_rfclassification_live.py.

Usage (from /Users/alen/Documents/hackrf):
    DroneCMD/venv/bin/python train_resnet.py \
        --data-dir captures \
        --output-weights RFClassification/gamutRF/model_weights/resnet18_custom_hackrf.pt \
        --epochs 8
"""

import argparse
import os
import sys
import time
from pathlib import Path
from typing import Dict, List, Tuple

import numpy as np
import matplotlib.pyplot as plt
from scipy import signal as dsp_signal

import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
import torchvision.transforms as transforms
from torchvision import models


# ─── Spectrogram & Dataset Builder ─────────────────────────────────────

SAMPLE_SECS = 0.02         # 20 ms window
NFFT = 512                 # FFT length
SAMPLES_PER_WINDOW = 400_000 # 20 ms @ 20 MHz


def load_iq_int8(path: Path, max_samples: int = 40_000_000) -> np.ndarray:
    """Load HackRF int8 IQ file as complex64 array."""
    raw = np.fromfile(str(path), dtype=np.int8, count=max_samples * 2)
    raw = raw[: (len(raw) // 2) * 2]
    i_ch = raw[0::2].astype(np.float32) / 128.0
    q_ch = raw[1::2].astype(np.float32) / 128.0
    return (i_ch + 1j * q_ch).astype(np.complex64)


def iq_chunk_to_rgb(iq_chunk: np.ndarray, sample_rate: float = 20e6, nfft: int = NFFT, cmap=None) -> np.ndarray:
    """Convert raw 20ms IQ chunk -> Spectrogram RGB image array (H, W, 3) with absolute dBFS scaling."""
    if cmap is None:
        cmap = plt.get_cmap('jet')

    f, t, S = dsp_signal.spectrogram(
        iq_chunk,
        fs=sample_rate,
        window=dsp_signal.windows.hann(nfft, sym=False),
        nperseg=nfft,
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

    rgba_img = cmap(S_norm)
    rgb_img = np.delete(rgba_img, 3, axis=2).astype(np.float32)
    return rgb_img


class HackRFSpectrogramDataset(Dataset):
    """PyTorch Dataset that extracts 20ms Spectrogram images from IQ captures."""

    def __init__(self, data_dir: Path, sample_rate: float = 20e6, max_samples_per_file: int = 40_000_000):
        self.sample_rate = sample_rate
        self.cmap = plt.get_cmap('jet')
        self.transform = transforms.Compose([
            transforms.ToTensor(),
            transforms.Resize((256, 256)),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
        ])

        self.samples: List[Tuple[np.ndarray, int]] = []
        label_dirs = sorted([d for d in data_dir.iterdir() if d.is_dir()])

        if not label_dirs:
            raise FileNotFoundError(f"No label directories found in {data_dir}")

        self.classes = [d.name for d in label_dirs]
        self.class_to_idx = {name: i for i, name in enumerate(self.classes)}
        self.idx_to_class = {i: name for i, name in enumerate(self.classes)}

        print(f"📊 Scanning dataset in {data_dir}...")
        for label_dir in label_dirs:
            cls_idx = self.class_to_idx[label_dir.name]
            iq_files = sorted(label_dir.glob("*.iq"))
            print(f"  📂 {label_dir.name}/ : {len(iq_files)} .iq capture file(s)")

            for iq_file in iq_files:
                try:
                    iq = load_iq_int8(iq_file, max_samples=max_samples_per_file)
                except Exception as e:
                    print(f"     ⚠️  Could not read {iq_file.name}: {e}")
                    continue

                n_chunks = len(iq) // SAMPLES_PER_WINDOW
                ignored = 0
                for c in range(n_chunks):
                    chunk = iq[c * SAMPLES_PER_WINDOW : (c + 1) * SAMPLES_PER_WINDOW]
                    # Power check: ignore silent/quiet chunks for drone class
                    if label_dir.name != "unknown":
                        power_db = 10 * np.log10(np.mean(chunk.real**2 + chunk.imag**2) + 1e-12)
                        if power_db < -15.0:
                            ignored += 1
                            continue  # Automatically ignore without deleting file on disk
                    self.samples.append((chunk, cls_idx))

                if ignored > 0:
                    print(f"     ⚠️  {iq_file.name}: skipped {ignored} silent chunks (power < -15 dBFS)")

        print(f"✅ Total 20ms Spectrogram windows generated: {len(self.samples)}")
        for idx, name in self.idx_to_class.items():
            count = sum(1 for _, label in self.samples if label == idx)
            print(f"   - {name}: {count} spectrograms")

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, i):
        chunk, label = self.samples[i]
        rgb_img = iq_chunk_to_rgb(chunk, sample_rate=self.sample_rate, cmap=self.cmap)
        tensor = self.transform(rgb_img)
        return tensor, label


# ─── Training Function ────────────────────────────────────────────────

def train_resnet(data_dir: Path, output_weights: Path, epochs: int = 8, batch_size: int = 16, lr: float = 0.0003):
    device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")
    print(f"\n🚀 Training PyTorch ResNet18 on Device: {device}")

    # Build dataset
    dataset = HackRFSpectrogramDataset(data_dir)
    if len(dataset) < 20:
        print("❌ Not enough dataset samples to train. Need at least 20 spectrogram windows.")
        sys.exit(1)

    # Train/Test Split (80/20)
    train_size = int(0.8 * len(dataset))
    val_size = len(dataset) - train_size
    train_dataset, val_dataset = torch.utils.data.random_split(dataset, [train_size, val_size])

    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True)
    val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False)

    # Initialize ResNet18
    num_classes = len(dataset.classes)
    model = models.resnet18(weights=models.ResNet18_Weights.DEFAULT)

    # Fine-tune layer weights
    for param in model.parameters():
        param.requires_grad = True

    model.fc = nn.Linear(model.fc.in_features, num_classes)
    model = model.to(device)

    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=lr, weight_decay=1e-4)

    print(f"\n🧠 Fine-tuning ResNet18 for {epochs} epochs...\n")

    best_acc = 0.0
    best_model_state = {k: v.cpu().clone() for k, v in model.state_dict().items()}

    for epoch in range(1, epochs + 1):
        start_t = time.time()
        model.train()
        running_loss = 0.0
        correct = 0
        total = 0

        for inputs, labels in train_loader:
            inputs, labels = inputs.to(device), labels.to(device)
            optimizer.zero_grad()
            outputs = model(inputs)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()

            running_loss += loss.item() * inputs.size(0)
            _, preds = torch.max(outputs, 1)
            correct += torch.sum(preds == labels.data).item()
            total += labels.size(0)

        epoch_loss = running_loss / total
        epoch_acc = correct / total

        # Validation
        model.eval()
        val_correct = 0
        val_total = 0
        with torch.no_grad():
            for val_inputs, val_labels in val_loader:
                val_inputs, val_labels = val_inputs.to(device), val_labels.to(device)
                val_outputs = model(val_inputs)
                _, val_preds = torch.max(val_outputs, 1)
                val_correct += torch.sum(val_preds == val_labels.data).item()
                val_total += val_labels.size(0)

        val_acc = val_correct / val_total if val_total > 0 else 0.0
        elapsed = time.time() - start_t

        print(f"Epoch {epoch:2d}/{epochs:2d} [{elapsed:.1f}s] — "
              f"Train Loss: {epoch_loss:.4f} | Train Acc: {epoch_acc*100:.1f}% | "
              f"Val Acc: {val_acc*100:.1f}%")

        if val_acc >= best_acc:
            best_acc = val_acc
            best_model_state = {k: v.cpu().clone() for k, v in model.state_dict().items()}

    # Save Checkpoint with Best Weights
    output_weights.parent.mkdir(parents=True, exist_ok=True)
    checkpoint = {
        "model_state_dict": best_model_state,
        "dataset_idx_to_class": dataset.idx_to_class,
        "sample_secs": SAMPLE_SECS,
        "nfft": NFFT,
        "experiment_name": "custom_hackrf_resnet18"
    }

    torch.save(checkpoint, str(output_weights))

    print(f"\n{'='*65}")
    print(f"🎉 ResNet18 Training Complete! Best Validation Accuracy: {best_acc*100:.1f}%")
    print(f"💾 Checkpoint saved to: {output_weights.resolve()}")
    print(f"\n🚀 Start Live Deep Learning Detection:")
    print(f"   DroneCMD/venv/bin/python RFClassification/hackrf_rfclassification_live.py \\")
    print(f"     --weights {output_weights.resolve()} \\")
    print(f"     --frequency 2.44e9 \\")
    print(f"     --min-confidence 0.85")
    print(f"{'='*65}\n")


def main():
    parser = argparse.ArgumentParser(description="Train ResNet18 Deep Learning model on local HackRF captures.")
    parser.add_argument("--data-dir", default="captures", help="Path to captures directory. Default: captures")
    parser.add_argument("--output-weights", default="RFClassification/gamutRF/model_weights/resnet18_custom_hackrf.pt",
                        help="Output path for PyTorch weights .pt file.")
    parser.add_argument("--epochs", type=int, default=8, help="Number of training epochs. Default: 8")
    parser.add_argument("--batch-size", type=int, default=16, help="Batch size. Default: 16")
    parser.add_argument("--lr", type=float, default=0.0003, help="Learning rate. Default: 0.0003")

    args = parser.parse_args()

    train_resnet(
        data_dir=Path(args.data_dir),
        output_weights=Path(args.output_weights),
        epochs=args.epochs,
        batch_size=args.batch_size,
        lr=args.lr
    )


if __name__ == "__main__":
    main()
