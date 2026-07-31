import React from 'react';
import { Zap, AlertTriangle, ShieldCheck, RefreshCw, Volume2, PlusCircle, Trash2, X } from 'lucide-react';

export default function SimulatorDrawer({ isOpen, onClose, onInjectTarget, onClearTargets, audioEnabled, setAudioEnabled }) {
  if (!isOpen) return null;

  const sampleInjectables = [
    {
      id: `TRG-${Math.floor(1000 + Math.random() * 9000)}`,
      model: 'DJI Inspire 3 (OcuSync 3.0 Pro)',
      protocol: 'OcuSync 3.0 Cinema',
      threatLevel: 'CRITICAL',
      confidence: 99.7,
      frequencyGHz: 2.445,
      bandwidthMHz: 20.0,
      rssidBm: -42.1,
      snrdB: 32.0,
      distanceMeters: 350,
      azimuthDeg: Math.floor(Math.random() * 360),
      status: 'APPROACHING'
    },
    {
      id: `TRG-${Math.floor(1000 + Math.random() * 9000)}`,
      model: 'Custom FPV 5.8G VTX Swarm',
      protocol: 'Analog FPV 5.8G + ExpressLRS',
      threatLevel: 'WARNING',
      confidence: 95.4,
      frequencyGHz: 5.800,
      bandwidthMHz: 20.0,
      rssidBm: -58.4,
      snrdB: 22.0,
      distanceMeters: 820,
      azimuthDeg: Math.floor(Math.random() * 360),
      status: 'TRACKING'
    },
    {
      id: `TRG-${Math.floor(1000 + Math.random() * 9000)}`,
      model: 'Skydio X2 Defense Drone',
      protocol: 'Skydio Autonomy Link',
      threatLevel: 'WARNING',
      confidence: 92.8,
      frequencyGHz: 2.422,
      bandwidthMHz: 10.0,
      rssidBm: -68.0,
      snrdB: 16.5,
      distanceMeters: 1450,
      azimuthDeg: Math.floor(Math.random() * 360),
      status: 'LOITERING'
    }
  ];

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex justify-end transition-opacity">
      <div className="w-full max-w-md bg-[#0D1117] border-l border-cyan-500/30 h-full p-6 flex flex-col justify-between shadow-2xl overflow-y-auto font-mono">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-cyan-500/20 pb-4">
            <div className="flex items-center space-x-2">
              <Zap className="w-5 h-5 text-cyan-400 fill-current" />
              <h2 className="text-lg font-bold text-white tracking-wider">
                RF SIGNAL SIMULATOR
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <p className="text-xs text-slate-400">
            Inject synthetic RF signal captures into the HackRF receiver buffer to test real-time ResNet-18 classification, radar blips, and audio alert triggers.
          </p>

          {/* Inject Buttons */}
          <div className="space-y-3 pt-2">
            <label className="text-xs font-bold text-cyan-300 tracking-wider uppercase">
              INJECT SIMULATED TARGETS
            </label>

            {sampleInjectables.map((item) => (
              <button
                key={item.model}
                onClick={() => {
                  onInjectTarget(item);
                  if (audioEnabled) {
                    // Play synthesized warning beep
                    try {
                      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                      const osc = audioCtx.createOscillator();
                      const gain = audioCtx.createGain();
                      osc.type = 'sawtooth';
                      osc.frequency.setValueAtTime(880, audioCtx.currentTime);
                      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
                      osc.connect(gain);
                      gain.connect(audioCtx.destination);
                      osc.start();
                      osc.stop(audioCtx.currentTime + 0.3);
                    } catch (e) {}
                  }
                }}
                className="w-full p-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-400/50 hover:bg-slate-800/80 text-left transition-all group flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-bold text-white group-hover:text-cyan-300">
                    + {item.model}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {item.protocol} • {(item.frequencyGHz).toFixed(3)} GHz
                  </div>
                </div>

                <span className={`px-2 py-0.5 text-[9px] font-bold rounded ${
                  item.threatLevel === 'CRITICAL' ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'
                }`}>
                  {item.threatLevel}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="space-y-3 pt-6 border-t border-slate-800">
          <div className="flex justify-between items-center text-xs text-slate-300">
            <span>Audio Warnings:</span>
            <button
              onClick={() => setAudioEnabled(!audioEnabled)}
              className={`px-3 py-1 rounded-lg border font-bold ${
                audioEnabled ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {audioEnabled ? 'AUDIO ENABLED' : 'MUTED'}
            </button>
          </div>

          <button
            onClick={onClearTargets}
            className="w-full py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold text-xs flex items-center justify-center space-x-2"
          >
            <Trash2 className="w-4 h-4" />
            <span>CLEAR ALL ACTIVE TARGETS</span>
          </button>
        </div>
      </div>
    </div>
  );
}
