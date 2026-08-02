import React, { useState } from 'react';
import { Sliders, Radio, Server, Volume2, Save, RefreshCw, Cpu, ShieldCheck } from 'lucide-react';

export default function SettingsView({ hackrfState, setHackrfState, audioEnabled, setAudioEnabled }) {
  const [apiEndpoint, setApiEndpoint] = useState('http://localhost:8000/api/v1');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = () => {
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  return (
    <div className="space-y-6 font-mono max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-cyan-500/20 pb-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Sliders className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-white tracking-wider">
              DRONERF AI SYSTEM CONFIGURATION
            </h2>
            <p className="text-xs text-slate-400">
              Hardware SDR parameters, PyTorch daemon endpoint, and alert settings.
            </p>
          </div>
        </div>

        <button
          onClick={handleSave}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold text-xs flex items-center space-x-2 shadow-[0_0_15px_rgba(0,240,255,0.25)]"
        >
          <Save className="w-4 h-4" />
          <span>{saveSuccess ? 'SAVED SUCCESSFULLY!' : 'SAVE PREFERENCES'}</span>
        </button>
      </div>

      {/* SDR Hardware Config */}
      <div className="glass-panel p-6 rounded-2xl border border-cyan-500/20 space-y-4">
        <h3 className="text-sm font-bold text-cyan-300 tracking-wider uppercase border-b border-slate-800 pb-2 flex items-center gap-2">
          <Radio className="w-4 h-4 text-cyan-400" />
          HackRF One Hardware Default Parameters
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="text-slate-400 block mb-1">DEFAULT CENTER FREQUENCY (Hz)</label>
            <input
              type="number"
              value={hackrfState.centerFrequency}
              onChange={(e) => setHackrfState({ ...hackrfState, centerFrequency: Number(e.target.value) })}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-cyan-300 font-bold"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1">SAMPLE RATE (SPS)</label>
            <select
              value={hackrfState.sampleRate}
              onChange={(e) => setHackrfState({ ...hackrfState, sampleRate: Number(e.target.value) })}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white font-bold"
            >
              <option value={10000000}>10 MSPS (10 MHz)</option>
              <option value={20000000}>20 MSPS (20 MHz)</option>
            </select>
          </div>

          <div>
            <label className="text-slate-400 block mb-1">DEFAULT LNA GAIN (dB)</label>
            <input
              type="number"
              value={hackrfState.lnaGain}
              onChange={(e) => setHackrfState({ ...hackrfState, lnaGain: Number(e.target.value) })}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white font-bold"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1">DEFAULT VGA GAIN (dB)</label>
            <input
              type="number"
              value={hackrfState.vgaGain}
              onChange={(e) => setHackrfState({ ...hackrfState, vgaGain: Number(e.target.value) })}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white font-bold"
            />
          </div>
        </div>
      </div>

      {/* Backend Daemon Config */}
      <div className="glass-panel p-6 rounded-2xl border border-cyan-500/20 space-y-4">
        <h3 className="text-sm font-bold text-white tracking-wider uppercase border-b border-slate-800 pb-2 flex items-center gap-2">
          <Server className="w-4 h-4 text-blue-400" />
          Python Backend API Endpoint
        </h3>

        <div className="text-xs space-y-2">
          <label className="text-slate-400 block">WEBSOCKET / REST DAEMON URL</label>
          <input
            type="text"
            value={apiEndpoint}
            onChange={(e) => setApiEndpoint(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-cyan-300 font-bold"
          />
          <p className="text-[10px] text-slate-500">
            Endpoint for live PyTorch inference server (`live_detector.py`).
          </p>
        </div>
      </div>
    </div>
  );
}
