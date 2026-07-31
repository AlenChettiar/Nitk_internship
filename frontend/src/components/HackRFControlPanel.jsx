import React from 'react';
import { Radio, Sliders, Zap, Cpu, Settings, ShieldCheck, Thermometer, Database } from 'lucide-react';
import { FREQUENCY_BANDS } from '../mockData';

export default function HackRFControlPanel({ hackrfState, setHackrfState }) {
  const handleFreqChange = (freqGHz) => {
    setHackrfState(prev => ({
      ...prev,
      centerFrequency: Math.round(freqGHz * 1e9)
    }));
  };

  return (
    <div className="w-full h-full glass-panel rounded-2xl p-6 border border-cyan-500/20 space-y-6 overflow-y-auto">
      {/* Panel Header */}
      <div className="flex items-center justify-between border-b border-cyan-500/20 pb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Radio className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="font-mono text-lg font-bold text-white tracking-wider flex items-center gap-2">
              HACKRF ONE SDR CONTROL PANEL
              <span className="text-xs px-2.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                CONNECTED
              </span>
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              Hardware RF Receiver Config • USB 2.0 High-Speed • 1 MHz - 6 GHz Range
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-4 text-xs font-mono text-slate-300">
          <div className="flex items-center space-x-1.5 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800">
            <Thermometer className="w-4 h-4 text-amber-400" />
            <span>TEMP: {hackrfState.temperatureCelsius}°C</span>
          </div>
          <div className="flex items-center space-x-1.5 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800">
            <Database className="w-4 h-4 text-cyan-400" />
            <span>IQ BUFFER: {hackrfState.iqBufferUsage}%</span>
          </div>
        </div>
      </div>

      {/* Preset Frequency Bands */}
      <div className="space-y-3">
        <label className="text-xs font-mono font-bold tracking-widest text-slate-400 uppercase">
          Target Frequency Band Presets
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {FREQUENCY_BANDS.map((band) => {
            const isCurrent = Math.abs(hackrfState.centerFrequency / 1e9 - band.defaultCenter) < 0.05;
            return (
              <button
                key={band.name}
                onClick={() => handleFreqChange(band.defaultCenter)}
                className={`p-3.5 rounded-xl text-left font-mono transition-all duration-200 border ${
                  isCurrent
                    ? 'bg-gradient-to-r from-cyan-500/20 to-blue-600/20 border-cyan-400 text-white shadow-[0_0_15px_rgba(0,240,255,0.2)]'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <div className="text-xs font-bold text-cyan-300">{band.name}</div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Range: {band.start} - {band.end} GHz
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Sliders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Center Frequency & Sample Rate */}
        <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-slate-300">CENTER FREQUENCY</span>
            <span className="text-sm font-mono font-bold text-cyan-400">
              {(hackrfState.centerFrequency / 1e9).toFixed(3)} GHz ({hackrfState.centerFrequency / 1e6} MHz)
            </span>
          </div>

          <input
            type="range"
            min="2400000000"
            max="2500000000"
            step="1000000"
            value={hackrfState.centerFrequency}
            onChange={(e) => setHackrfState({ ...hackrfState, centerFrequency: Number(e.target.value) })}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />

          <div className="flex justify-between text-[10px] font-mono text-slate-500">
            <span>2.400 GHz</span>
            <span>2.450 GHz</span>
            <span>2.500 GHz</span>
          </div>

          <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
            <span className="text-xs font-mono text-slate-300">SAMPLE RATE</span>
            <div className="flex space-x-2 font-mono text-xs">
              {[10000000, 20000000].map((rate) => (
                <button
                  key={rate}
                  onClick={() => setHackrfState({ ...hackrfState, sampleRate: rate })}
                  className={`px-3 py-1 rounded-lg border ${
                    hackrfState.sampleRate === rate
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {rate / 1e6} MSPS
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* LNA & VGA Gain Controls */}
        <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-4">
          {/* LNA Gain */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-mono text-slate-300">LNA GAIN (LOW NOISE AMP)</span>
              <span className="text-xs font-mono text-cyan-400 font-bold">{hackrfState.lnaGain} dB</span>
            </div>
            <input
              type="range"
              min="0"
              max="40"
              step="8"
              value={hackrfState.lnaGain}
              onChange={(e) => setHackrfState({ ...hackrfState, lnaGain: Number(e.target.value) })}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
            <div className="flex justify-between text-[9px] font-mono text-slate-500 mt-1">
              <span>0 dB</span>
              <span>16 dB</span>
              <span>32 dB</span>
              <span>40 dB</span>
            </div>
          </div>

          {/* VGA Gain */}
          <div className="pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-mono text-slate-300">VGA GAIN (VARIABLE GAIN AMP)</span>
              <span className="text-xs font-mono text-cyan-400 font-bold">{hackrfState.vgaGain} dB</span>
            </div>
            <input
              type="range"
              min="0"
              max="62"
              step="2"
              value={hackrfState.vgaGain}
              onChange={(e) => setHackrfState({ ...hackrfState, vgaGain: Number(e.target.value) })}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
            <div className="flex justify-between text-[9px] font-mono text-slate-500 mt-1">
              <span>0 dB</span>
              <span>20 dB</span>
              <span>40 dB</span>
              <span>62 dB</span>
            </div>
          </div>
        </div>
      </div>

      {/* Hardware Info & RF Toggles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
        <div className="glass-panel p-4 rounded-xl border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-slate-400">RF PREAMP (14 dB)</div>
            <div className="text-white font-bold mt-0.5">{hackrfState.ampEnable ? 'ENABLED' : 'DISABLED'}</div>
          </div>
          <button
            onClick={() => setHackrfState({ ...hackrfState, ampEnable: !hackrfState.ampEnable })}
            className={`px-3 py-1.5 rounded-lg border font-bold ${
              hackrfState.ampEnable ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-slate-800 text-slate-400'
            }`}
          >
            TOGGLE
          </button>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-slate-400">HARDWARE SERIAL</div>
            <div className="text-cyan-400 font-bold mt-0.5 truncate max-w-[150px]">{hackrfState.serialNumber}</div>
          </div>
          <ShieldCheck className="w-5 h-5 text-cyan-400" />
        </div>

        <div className="glass-panel p-4 rounded-xl border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-slate-400">FIRMWARE VERSION</div>
            <div className="text-emerald-400 font-bold mt-0.5">{hackrfState.firmwareVersion}</div>
          </div>
          <Cpu className="w-5 h-5 text-emerald-400" />
        </div>
      </div>
    </div>
  );
}
