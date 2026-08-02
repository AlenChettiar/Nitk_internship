import React from 'react';
import { Radio, Server, Cpu, Activity, Radar, FolderPlus, History, Sliders, WifiOff, AlertTriangle, ShieldCheck, ArrowRight } from 'lucide-react';

export default function DashboardView({ 
  hackrfStatus, 
  backendStatus, 
  modelStatus, 
  currentFrequency = "--", 
  targets = [], 
  setActiveTab 
}) {
  // Determine RF Spectrum Placeholder Status
  const getSpectrumPlaceholder = () => {
    if (hackrfStatus === 'Not Connected') {
      return {
        icon: WifiOff,
        title: 'Waiting for HackRF One',
        message: 'Connect a HackRF One SDR device via USB to initiate live RF signal ingestion.'
      };
    }
    if (backendStatus === 'Offline') {
      return {
        icon: Server,
        title: 'Backend Offline',
        message: 'Start the PyTorch live detection backend daemon (`live_detector.py`) to process signals.'
      };
    }
    return null; // Ready
  };

  const spectrumPlaceholder = getSpectrumPlaceholder();

  return (
    <div className="space-y-6 font-mono select-none">
      {/* 1. TOP FOUR STATUS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: HackRF Status */}
        <div className="glass-panel p-5 rounded-2xl border border-cyan-500/20 space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-bold tracking-wider uppercase text-slate-400">HackRF Status</span>
            <Radio className={`w-4 h-4 ${hackrfStatus === 'Connected' ? 'text-emerald-400' : 'text-rose-400'}`} />
          </div>
          <div className="text-xl font-bold text-white flex items-center gap-2.5">
            <span className={`w-3 h-3 rounded-full ${
              hackrfStatus === 'Connected' ? 'bg-emerald-400 shadow-[0_0_10px_#34d399]' : 'bg-rose-500 shadow-[0_0_10px_#f43f5e]'
            }`} />
            <span className={hackrfStatus === 'Connected' ? 'text-emerald-400' : 'text-rose-400'}>
              {hackrfStatus}
            </span>
          </div>
          <p className="text-[10px] text-slate-500">USB Hardware Receiver</p>
        </div>

        {/* Card 2: Backend Status */}
        <div className="glass-panel p-5 rounded-2xl border border-cyan-500/20 space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-bold tracking-wider uppercase text-slate-400">Backend Status</span>
            <Server className={`w-4 h-4 ${backendStatus === 'Online' ? 'text-emerald-400' : 'text-rose-400'}`} />
          </div>
          <div className="text-xl font-bold text-white flex items-center gap-2.5">
            <span className={`w-3 h-3 rounded-full ${
              backendStatus === 'Online' ? 'bg-emerald-400 shadow-[0_0_10px_#34d399]' : 'bg-rose-500 shadow-[0_0_10px_#f43f5e]'
            }`} />
            <span className={backendStatus === 'Online' ? 'text-emerald-400' : 'text-rose-400'}>
              {backendStatus}
            </span>
          </div>
          <p className="text-[10px] text-slate-500">PyTorch Real-time Service</p>
        </div>

        {/* Card 3: Loaded Model */}
        <div className="glass-panel p-5 rounded-2xl border border-cyan-500/20 space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-bold tracking-wider uppercase text-slate-400">Loaded Model</span>
            <Cpu className={`w-4 h-4 ${modelStatus !== 'Not Loaded' ? 'text-cyan-400' : 'text-amber-400'}`} />
          </div>
          <div className="text-xl font-bold text-white flex items-center gap-2.5">
            <span className={`w-3 h-3 rounded-full ${
              modelStatus !== 'Not Loaded' ? 'bg-cyan-400 shadow-[0_0_10px_#00f0ff]' : 'bg-amber-500'
            }`} />
            <span className={modelStatus !== 'Not Loaded' ? 'text-cyan-300' : 'text-amber-400'}>
              {modelStatus}
            </span>
          </div>
          <p className="text-[10px] text-slate-500">ResNet-18 Classifier</p>
        </div>

        {/* Card 4: Current Frequency */}
        <div className="glass-panel p-5 rounded-2xl border border-cyan-500/20 space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-bold tracking-wider uppercase text-slate-400">Current Frequency</span>
            <Activity className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-xl font-bold text-white flex items-center gap-2.5">
            <span className="w-3 h-3 rounded-full bg-cyan-400 shadow-[0_0_10px_#00f0ff]" />
            <span className="text-cyan-300 font-bold">
              {currentFrequency}
            </span>
          </div>
          <p className="text-[10px] text-slate-500">Active SDR Band</p>
        </div>
      </div>

      {/* 2. TWO LARGE PANELS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[380px]">
        {/* Left Panel: Live RF Spectrum */}
        <div className="lg:col-span-7 glass-panel p-6 rounded-2xl border border-cyan-500/20 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-cyan-500/20 pb-3 mb-4">
            <h3 className="font-mono text-sm font-bold text-white tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              LIVE RF SPECTRUM
            </h3>
            <span className="text-[10px] text-slate-500">2D FFT POWER SPECTRAL DENSITY</span>
          </div>

          {/* Clean Placeholder when disconnected / offline */}
          {spectrumPlaceholder ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center rounded-xl bg-slate-950/70 border border-slate-800/80 my-2 space-y-3">
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-slate-500">
                <spectrumPlaceholder.icon className="w-8 h-8 text-slate-400" />
              </div>
              <h4 className="text-base font-bold text-slate-200 tracking-wider">
                {spectrumPlaceholder.title}
              </h4>
              <p className="text-xs text-slate-400 max-w-sm">
                {spectrumPlaceholder.message}
              </p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center rounded-xl bg-slate-950/70 border border-slate-800/80 my-2 space-y-2">
              <Activity className="w-8 h-8 text-cyan-400 animate-pulse" />
              <h4 className="text-sm font-bold text-cyan-300">SYSTEM STANDBY — SIGNAL SCAN ACTIVE</h4>
              <p className="text-xs text-slate-400">Monitoring 2.4 GHz & 5.8 GHz ISM frequencies.</p>
            </div>
          )}

          <div className="flex justify-between items-center text-[11px] text-slate-500 pt-3 border-t border-slate-800/80">
            <span>SPAN: 100 MHz</span>
            <span>NOISE FLOOR: -95 dBm</span>
            <span>STATUS: {hackrfStatus === 'Connected' && backendStatus === 'Online' ? 'ACTIVE' : 'STANDBY'}</span>
          </div>
        </div>

        {/* Right Panel: Recent Detection Summary */}
        <div className="lg:col-span-5 glass-panel p-6 rounded-2xl border border-cyan-500/20 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-cyan-500/20 pb-3 mb-4">
            <h3 className="font-mono text-sm font-bold text-white tracking-wider flex items-center gap-2">
              <Radar className="w-4 h-4 text-cyan-400" />
              RECENT DETECTION SUMMARY
            </h3>
            <span className="text-[10px] text-slate-500">{targets.length} DETECTED</span>
          </div>

          {targets.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center rounded-xl bg-slate-950/70 border border-slate-800/80 my-2 space-y-3">
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-slate-500">
                <Radar className="w-8 h-8 text-slate-400" />
              </div>
              <h4 className="text-base font-bold text-slate-200 tracking-wider">
                No Recent Detections
              </h4>
              <p className="text-xs text-slate-400 max-w-xs">
                No drone RF signal transmissions detected in current sweep range.
              </p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto space-y-2.5 my-2 max-h-[220px] pr-1">
              {targets.map((target) => (
                <div key={target.id} className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-cyan-300">{target.id}</span>
                    <span className="text-slate-400 ml-2 font-semibold">{target.model}</span>
                    <p className="text-[10px] text-slate-500">{(target.frequencyGHz).toFixed(3)} GHz • {target.distanceMeters}m</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                    target.threatLevel === 'CRITICAL' ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'
                  }`}>
                    {target.threatLevel}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-between items-center text-[11px] text-slate-500 pt-3 border-t border-slate-800/80">
            <span>RESNET-18 AI ENGINE</span>
            <button 
              onClick={() => setActiveTab('history')}
              className="text-cyan-400 hover:underline text-[10px] font-bold"
            >
              VIEW ALL HISTORY →
            </button>
          </div>
        </div>
      </div>

      {/* 3. QUICK ACTION CARDS AT THE BOTTOM */}
      <div className="space-y-3">
        <h3 className="text-xs font-mono font-bold tracking-widest text-slate-400 uppercase">
          QUICK ACTIONS
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {/* Action 1: Start Live Detection */}
          <button
            onClick={() => setActiveTab('live_detection')}
            className="glass-panel p-4 rounded-2xl border border-cyan-500/20 hover:border-cyan-400/60 hover:bg-slate-800/50 transition-all text-left group flex flex-col justify-between space-y-3 cursor-pointer"
          >
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 group-hover:scale-110 transition-transform w-fit">
              <Radar className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white group-hover:text-cyan-300">
                Start Live Detection
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">360° Tactical Radar & Spectrogram</p>
            </div>
          </button>

          {/* Action 2: Collect Dataset */}
          <button
            onClick={() => setActiveTab('data_collection')}
            className="glass-panel p-4 rounded-2xl border border-cyan-500/20 hover:border-cyan-400/60 hover:bg-slate-800/50 transition-all text-left group flex flex-col justify-between space-y-3 cursor-pointer"
          >
            <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 group-hover:scale-110 transition-transform w-fit">
              <FolderPlus className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white group-hover:text-cyan-300">
                Collect Dataset
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">Guided HackRF `.iq` Sample Recorder</p>
            </div>
          </button>

          {/* Action 3: Train Model */}
          <button
            onClick={() => setActiveTab('model_training')}
            className="glass-panel p-4 rounded-2xl border border-cyan-500/20 hover:border-cyan-400/60 hover:bg-slate-800/50 transition-all text-left group flex flex-col justify-between space-y-3 cursor-pointer"
          >
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 group-hover:scale-110 transition-transform w-fit">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white group-hover:text-cyan-300">
                Train Model
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">PyTorch ResNet-18 Neural Training</p>
            </div>
          </button>

          {/* Action 4: View Detection History */}
          <button
            onClick={() => setActiveTab('history')}
            className="glass-panel p-4 rounded-2xl border border-cyan-500/20 hover:border-cyan-400/60 hover:bg-slate-800/50 transition-all text-left group flex flex-col justify-between space-y-3 cursor-pointer"
          >
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 group-hover:scale-110 transition-transform w-fit">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white group-hover:text-cyan-300">
                View Detection History
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">Timestamped Logs & `.iq` Captures</p>
            </div>
          </button>

          {/* Action 5: Settings */}
          <button
            onClick={() => setActiveTab('settings')}
            className="glass-panel p-4 rounded-2xl border border-cyan-500/20 hover:border-cyan-400/60 hover:bg-slate-800/50 transition-all text-left group flex flex-col justify-between space-y-3 cursor-pointer"
          >
            <div className="p-2.5 rounded-xl bg-slate-500/10 border border-slate-500/30 text-slate-400 group-hover:scale-110 transition-transform w-fit">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white group-hover:text-cyan-300">
                Settings
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">SDR Gain & System Parameters</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
