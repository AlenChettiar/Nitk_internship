import React from 'react';
import { Cpu, Zap, Activity, CheckCircle, BarChart2, ShieldCheck, Layers, FileCode } from 'lucide-react';
import { INITIAL_AI_MODEL_STATS } from '../mockData';

export default function AIAnalyticsCard() {
  const stats = INITIAL_AI_MODEL_STATS;

  return (
    <div className="w-full h-full glass-panel rounded-2xl p-6 border border-cyan-500/20 space-y-6 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-cyan-500/20 pb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-blue-600/20 border border-blue-400/40 text-blue-400">
            <Cpu className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="font-mono text-lg font-bold text-white tracking-wider flex items-center gap-2">
              PYTORCH RESNET-18 AI NEURAL ENGINE
              <span className="text-xs px-2.5 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                FP16 TENSORRT ACTIVE
              </span>
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              Deep Learning RF Spectrogram Image Classifier • 99.4% Accuracy
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 text-xs font-mono">
          <span className="text-slate-400">MODEL WEIGHTS:</span>
          <span className="px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-cyan-300 font-bold">
            {stats.weightsFile}
          </span>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-1">
          <span className="text-xs font-mono text-slate-400">INFERENCE LATENCY</span>
          <div className="text-2xl font-mono font-bold text-emerald-400">{stats.inferenceLatencyMs} ms</div>
          <p className="text-[10px] font-mono text-slate-500">Real-time sub-10ms batch throughput</p>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-1">
          <span className="text-xs font-mono text-slate-400">CLASSIFICATION SPEED</span>
          <div className="text-2xl font-mono font-bold text-cyan-400">{stats.fps} FPS</div>
          <p className="text-[10px] font-mono text-slate-500">Spectrogram frames per second</p>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-1">
          <span className="text-xs font-mono text-slate-400">OVERALL ACCURACY</span>
          <div className="text-2xl font-mono font-bold text-blue-400">{stats.overallAccuracy}%</div>
          <p className="text-[10px] font-mono text-slate-500">Validation dataset accuracy</p>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-1">
          <span className="text-xs font-mono text-slate-400">HARDWARE ACCELERATOR</span>
          <div className="text-sm font-mono font-bold text-white truncate mt-1">CUDA TensorRT</div>
          <p className="text-[10px] font-mono text-slate-500">NVIDIA FP16 Precision</p>
        </div>
      </div>

      {/* Classes & Model Architecture */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Classes List */}
        <div className="glass-panel p-5 rounded-xl border border-slate-800 space-y-4">
          <h3 className="font-mono text-xs font-bold text-slate-300 tracking-wider uppercase flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-cyan-400" />
            Trained RF Signal Protocol Classes
          </h3>

          <div className="space-y-3 font-mono text-xs">
            {[
              { name: 'DJI OcuSync 3.0 (2.4/5.8G)', score: 99.4, color: 'bg-cyan-400' },
              { name: 'Autel SkyLink 2.0', score: 98.6, color: 'bg-blue-500' },
              { name: 'FPV Analog Video (5.8 GHz)', score: 96.2, color: 'bg-amber-400' },
              { name: 'Generic Wi-Fi Drone Protocol', score: 92.1, color: 'bg-emerald-400' },
              { name: 'Ambient Background RF Noise', score: 99.9, color: 'bg-slate-500' },
            ].map((cls) => (
              <div key={cls.name} className="space-y-1">
                <div className="flex justify-between text-slate-300">
                  <span>{cls.name}</span>
                  <span className="font-bold text-cyan-300">{cls.score}%</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className={`${cls.color} h-full`} style={{ width: `${cls.score}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FFT Preprocessing Specs */}
        <div className="glass-panel p-5 rounded-xl border border-slate-800 space-y-4">
          <h3 className="font-mono text-xs font-bold text-slate-300 tracking-wider uppercase flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-400" />
            IQ Signal Preprocessing Pipeline
          </h3>

          <div className="space-y-3 font-mono text-xs text-slate-300">
            <div className="flex justify-between py-2 border-b border-slate-800">
              <span className="text-slate-400">IQ Sample Buffer:</span>
              <span className="font-bold text-white">2,000,000 Complex Samples</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-800">
              <span className="text-slate-400">FFT Window Size (NFFT):</span>
              <span className="font-bold text-white">1024 points (Hanning)</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-800">
              <span className="text-slate-400">Spectrogram Input Tensor:</span>
              <span className="font-bold text-cyan-400">[1, 3, 224, 224] RGB</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-800">
              <span className="text-slate-400">Confidence Threshold:</span>
              <span className="font-bold text-amber-400">85.0% Min Trigger</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-slate-400">PyTorch Script:</span>
              <span className="font-bold text-emerald-400">live_detector.py</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
