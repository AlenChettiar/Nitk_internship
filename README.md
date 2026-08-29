# Final Drone Detection System (PyTorch ResNet18 + HackRF One)

This directory contains the self-contained, standalone production version of the **HackRF PyTorch ResNet18 Drone Detection System**.

All files, training data, trained neural network weights, and execution scripts are organized here.

---

## Directory Layout

```
final_drone_detection/
├── README.md                   ← System Guide & Instructions
├── live_detector.py            ← Real-time PyTorch ResNet18 Live Detector
├── train_resnet.py             ← PyTorch ResNet18 Trainer Script
├── collect_training_data.py    ← Guided HackRF Training Data Collector
├── model_weights/
│   └── resnet18_custom_hackrf.pt  ← Fine-tuned PyTorch ResNet18 Model Weights
└── captures/
    ├── unknown/                ← Ambient background noise .iq captures
    └── dji_ocusync/            ← Active drone RF transmission .iq captures
```

---

## 1. Quick Start — Live Real-Time Detection

To start live drone detection using your pre-trained ResNet18 model:

```bash
cd ./final_drone_detection

../DroneCMD/venv/bin/python live_detector.py --frequency 2.44e9
```

---

## 2. Retraining ResNet18 on New Captures

If you collect new RF captures or want to retrain the neural network:

```bash
cd ./final_drone_detection

../DroneCMD/venv/bin/python train_resnet.py --data-dir captures --epochs 8
```

---

## 3. Collecting New Training Captures

To record new RF captures from your HackRF One:

```bash
cd ./final_drone_detection

# Capture Ambient Background Noise (Drone OFF)
../DroneCMD/venv/bin/python collect_training_data.py --label noise --count 5 --duration 30

# Capture Active Drone RF Transmission (Drone ON & Linked)
../DroneCMD/venv/bin/python collect_training_data.py --label drone --count 5 --duration 30
```

---

## 4. Synthetic Pipeline Self-Test (No Hardware Needed)

```bash
cd ./final_drone_detection

../DroneCMD/venv/bin/python live_detector.py --test
```
