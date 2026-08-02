export const INITIAL_HACKRF_STATE = {
  connected: true,
  deviceModel: "HackRF One rev 2021.03",
  serialNumber: "0000000000000000a06063c82548231f",
  firmwareVersion: "2024.02.1",
  centerFrequency: 2437000000, // 2.437 GHz
  sampleRate: 20000000, // 20 MSPS
  lnaGain: 32, // 0 - 40 dB
  vgaGain: 20, // 0 - 62 dB
  ampEnable: true,
  antennaPort: "50 Ohm SMA (Rx)",
  sweepMode: true,
  sweepStartFreq: 2400000000,
  sweepEndFreq: 2500000000,
  iqBufferUsage: 38, // %
  temperatureCelsius: 41.2,
};

export const INITIAL_AI_MODEL_STATS = {
  modelName: "ResNet-18 DroneRF IQ Classifier",
  weightsFile: "resnet18_custom_hackrf.pt",
  device: "NVIDIA CUDA / TensorRT FP16",
  inferenceLatencyMs: 7.4,
  fps: 135,
  overallAccuracy: 98.8,
  classes: ["DJI OcuSync 3.0", "Autel SkyLink", "FPV Analog 5.8G", "Wi-Fi Drone", "Ambient Noise"],
  confidenceThreshold: 85.0,
};

export const INITIAL_THREAT_TARGETS = [
  {
    id: "TRG-9021",
    model: "DJI Mavic 3 Pro",
    protocol: "OcuSync 3.0+",
    threatLevel: "CRITICAL", // CRITICAL, WARNING, INFO
    confidence: 99.4,
    frequencyGHz: 2.437,
    bandwidthMHz: 10.0,
    rssidBm: -48.2,
    snrdB: 28.5,
    distanceMeters: 420,
    azimuthDeg: 42,
    elevationDeg: 14,
    elevationMeters: 85,
    status: "TRACKING",
    firstDetected: "14:32:05 UTC",
    lastSeen: "JUST NOW",
    coordinates: "12.9852° N, 74.8021° E",
    iqCaptureFile: "dji_m3p_2437mhz_001.iq"
  },
  {
    id: "TRG-8840",
    model: "Custom FPV Racing Quad",
    protocol: "Analog Video 5.8G + ExpressLRS",
    threatLevel: "WARNING",
    confidence: 94.1,
    frequencyGHz: 5.765,
    bandwidthMHz: 20.0,
    rssidBm: -62.7,
    snrdB: 18.2,
    distanceMeters: 1150,
    azimuthDeg: 215,
    elevationDeg: 8,
    elevationMeters: 40,
    status: "APPROACHING",
    firstDetected: "14:30:12 UTC",
    lastSeen: "2s AGO",
    coordinates: "12.9801° N, 74.7950° E",
    iqCaptureFile: "fpv_elrs_5765mhz.iq"
  },
  {
    id: "TRG-7104",
    model: "Autel EVO II Dual 640T",
    protocol: "Autel SkyLink 2.0",
    threatLevel: "WARNING",
    confidence: 91.8,
    frequencyGHz: 2.412,
    bandwidthMHz: 15.0,
    rssidBm: -71.4,
    snrdB: 14.1,
    distanceMeters: 1890,
    azimuthDeg: 135,
    elevationDeg: 22,
    elevationMeters: 160,
    status: "HOVERING",
    firstDetected: "14:28:40 UTC",
    lastSeen: "1s AGO",
    coordinates: "12.9780° N, 74.8110° E",
    iqCaptureFile: "autel_evo_2412mhz.iq"
  },
  {
    id: "TRG-6520",
    model: "Generic Wi-Fi Drone (Parrot)",
    protocol: "802.11n OFDM Broadcast",
    threatLevel: "INFO",
    confidence: 88.3,
    frequencyGHz: 2.462,
    bandwidthMHz: 20.0,
    rssidBm: -82.1,
    snrdB: 9.8,
    distanceMeters: 2600,
    azimuthDeg: 310,
    elevationDeg: 5,
    elevationMeters: 25,
    status: "LOITERING",
    firstDetected: "14:15:20 UTC",
    lastSeen: "4s AGO",
    coordinates: "12.9910° N, 74.7890° E",
    iqCaptureFile: "parrot_wifi_2462mhz.iq"
  }
];

export const FREQUENCY_BANDS = [
  { name: "2.4 GHz ISM Band (Drone Control / OcuSync)", start: 2.400, end: 2.500, defaultCenter: 2.437 },
  { name: "5.8 GHz ISM Band (FPV Video / SkyLink)", start: 5.725, end: 5.875, defaultCenter: 5.800 },
  { name: "915 MHz Sub-GHz Telemetry (ELRS / Crossfire)", start: 0.902, end: 0.928, defaultCenter: 0.915 },
  { name: "433 MHz Sub-GHz LRS Band", start: 0.433, end: 0.435, defaultCenter: 0.433 }
];
