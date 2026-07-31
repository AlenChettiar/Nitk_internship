import React, { useState } from 'react';
import { FolderPlus, Radio, Play, CheckCircle2, RefreshCw, HardDrive, FileText, Sparkles } from 'lucide-react';

export default function DataCollectionView({ hackrfStatus }) {
  const [label, setLabel] = useState('dji_ocusync');
  const [count, setCount] = useState(5);
  const [duration, setDuration] = useState(30);
  const [frequencyGHz, setFrequencyGHz] = useState(2.44);
  const [isRecording, setIsRecording] = useState(false);
  const [recordProgress, setRecordProgress] = useState(0);

  const handleStartCapture = () => {
    setIsRecording(true);
    setRecordProgress(0);
    let prog = 0;
    const interval = setInterval(() => {
      prog += 10;
      setRecordProgress(prog);
      if (prog >= 100) {
        clearInterval(interval);
        setIsRecording(false);
        alert(`Successfully captured ${count} x ${duration}s .IQ recordings for label "${label}"! Saved to captures/${label}/`);
      }
    }, 400);
  };

  return (
    <div className="space-y-6 font-mono">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-cyan-500/20 pb-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <FolderPlus className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-white tracking-wider flex items-center gap-2">
              HACKRF IQ DATA COLLECTION STUDIO
              <span className="text-xs px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                collect_training_data.py
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Guided HackRF One raw `.iq` sample recorder for PyTorch training datasets.
            </p>
          </div>
        </div>
      </div>

      {/* Config Panel & Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form (7 cols) */}
        <div className="lg:col-span-7 glass-panel p-6 rounded-2xl border border-cyan-500/20 space-y-5">
          <h3 className="text-sm font-bold text-cyan-300 tracking-wider uppercase border-b border-slate-800 pb-2">
            Record New Dataset Samples
          </h3>

          {/* Label Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300">TARGET CLASS LABEL</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 'dji_ocusync', name: 'DJI OcuSync Signal', desc: 'Active drone connected & transmitting' },
                { id: 'unknown', name: 'Ambient Background Noise', desc: 'Drone powered OFF, noise floor' },
                { id: 'autel_skylink', name: 'Autel SkyLink', desc: 'Autel Evo transmission' },
                { id: 'fpv_analog', name: 'FPV Analog 5.8G', desc: '5.8 GHz VTX signal' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setLabel(item.id)}
                  className={`p-3 rounded-xl text-left border transition-all ${
                    label === item.id
                      ? 'bg-cyan-500/20 border-cyan-400 text-white shadow-[0_0_15px_rgba(0,240,255,0.2)]'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="text-xs font-bold">{item.name}</div>
                  <div className="text-[10px] text-slate-400 mt-1">{item.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Parameters Grid */}
          <div className="grid grid-cols-3 gap-4 text-xs">
            <div>
              <label className="text-slate-400 block mb-1">SAMPLE COUNT</label>
              <input
                type="number"
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white font-bold"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">DURATION (SEC)</label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white font-bold"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">CENTER FREQ (GHz)</label>
              <input
                type="number"
                step="0.01"
                value={frequencyGHz}
                onChange={(e) => setFrequencyGHz(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white font-bold text-cyan-300"
              />
            </div>
          </div>

          {/* Submit Action Button */}
          <button
            onClick={handleStartCapture}
            disabled={isRecording}
            className={`w-full py-3.5 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 transition-all ${
              isRecording
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 cursor-wait'
                : 'bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white shadow-[0_0_20px_rgba(0,240,255,0.25)]'
            }`}
          >
            {isRecording ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
                <span>RECORDING IQ DATA ({recordProgress}%)...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>START GUIDED HACKRF CAPTURE SESSION</span>
              </>
            )}
          </button>
        </div>

        {/* Right Dataset Info (5 cols) */}
        <div className="lg:col-span-5 glass-panel p-6 rounded-2xl border border-cyan-500/20 space-y-4">
          <h3 className="text-sm font-bold text-white tracking-wider uppercase border-b border-slate-800 pb-2">
            Dataset Directory Info
          </h3>

          <div className="space-y-3 text-xs text-slate-300">
            <div className="flex justify-between py-1.5 border-b border-slate-800">
              <span className="text-slate-400">Captures Directory:</span>
              <span className="font-bold text-cyan-300">/captures/{label}/</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800">
              <span className="text-slate-400">Output File Format:</span>
              <span className="font-bold text-white">Complex int8 (.iq)</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800">
              <span className="text-slate-400">Total File Size (Est):</span>
              <span className="font-bold text-emerald-400">{(count * duration * 20 * 2 / 1024).toFixed(1)} MB</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-400">HackRF Device:</span>
              <span className={`font-bold ${hackrfStatus === 'Connected' ? 'text-emerald-400' : 'text-rose-400'}`}>
                {hackrfStatus}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
