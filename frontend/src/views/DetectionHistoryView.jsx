import React, { useState } from 'react';
import { History, Search, Download, ShieldAlert, Filter, Calendar, FileText } from 'lucide-react';

export default function DetectionHistoryView({ targets }) {
  const [searchTerm, setSearchTerm] = useState('');

  const historyLogs = [
    {
      id: 'LOG-2026-0731-01',
      timestamp: '2026-07-31 14:32:05 UTC',
      targetId: 'TRG-9021',
      model: 'DJI Mavic 3 Pro',
      protocol: 'OcuSync 3.0+',
      threatLevel: 'CRITICAL',
      confidence: 99.4,
      freqGHz: 2.437,
      durationSec: 145,
      iqFile: 'dji_m3p_2437mhz_001.iq'
    },
    {
      id: 'LOG-2026-0731-02',
      timestamp: '2026-07-31 14:30:12 UTC',
      targetId: 'TRG-8840',
      model: 'Custom FPV Racing Quad',
      protocol: 'Analog Video 5.8G + ELRS',
      threatLevel: 'WARNING',
      confidence: 94.1,
      freqGHz: 5.765,
      durationSec: 82,
      iqFile: 'fpv_elrs_5765mhz.iq'
    },
    {
      id: 'LOG-2026-0731-03',
      timestamp: '2026-07-31 14:28:40 UTC',
      targetId: 'TRG-7104',
      model: 'Autel EVO II Dual 640T',
      protocol: 'Autel SkyLink 2.0',
      threatLevel: 'WARNING',
      confidence: 91.8,
      freqGHz: 2.412,
      durationSec: 210,
      iqFile: 'autel_evo_2412mhz.iq'
    },
    {
      id: 'LOG-2026-0731-04',
      timestamp: '2026-07-31 14:15:20 UTC',
      targetId: 'TRG-6520',
      model: 'Generic Wi-Fi Drone',
      protocol: '802.11n OFDM Broadcast',
      threatLevel: 'INFO',
      confidence: 88.3,
      freqGHz: 2.462,
      durationSec: 60,
      iqFile: 'parrot_wifi_2462mhz.iq'
    }
  ];

  const filtered = historyLogs.filter(log =>
    log.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.targetId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.protocol.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 font-mono">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-cyan-500/20 pb-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <History className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-white tracking-wider">
              DETECTION HISTORY LOGS & IQ ARCHIVES
            </h2>
            <p className="text-xs text-slate-400">
              Timestamped record of all detected RF drone transmissions and saved raw `.iq` signals.
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Filter history log..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Log Table */}
      <div className="glass-panel rounded-2xl border border-cyan-500/20 overflow-hidden">
        <table className="w-full text-left font-mono text-xs border-collapse">
          <thead>
            <tr className="bg-slate-900/90 text-slate-400 border-b border-slate-800">
              <th className="py-3 px-4">TIMESTAMP</th>
              <th className="py-3 px-4">TARGET ID</th>
              <th className="py-3 px-4">DRONE MODEL</th>
              <th className="py-3 px-4">PROTOCOL</th>
              <th className="py-3 px-4">THREAT LEVEL</th>
              <th className="py-3 px-4">CONFIDENCE</th>
              <th className="py-3 px-4">FREQ</th>
              <th className="py-3 px-4">DURATION</th>
              <th className="py-3 px-4 text-right">RAW IQ CAPTURE</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filtered.map((log) => (
              <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                <td className="py-3.5 px-4 text-slate-400">{log.timestamp}</td>
                <td className="py-3.5 px-4 text-cyan-300 font-bold">{log.targetId}</td>
                <td className="py-3.5 px-4 text-white font-semibold">{log.model}</td>
                <td className="py-3.5 px-4 text-slate-300">{log.protocol}</td>
                <td className="py-3.5 px-4">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    log.threatLevel === 'CRITICAL' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40' : 'bg-amber-500/20 text-amber-400'
                  }`}>
                    {log.threatLevel}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-emerald-400 font-bold">{log.confidence}%</td>
                <td className="py-3.5 px-4 text-white">{log.freqGHz.toFixed(3)} GHz</td>
                <td className="py-3.5 px-4 text-slate-400">{log.durationSec}s</td>
                <td className="py-3.5 px-4 text-right">
                  <button
                    onClick={() => alert(`Downloading raw IQ capture: ${log.iqFile}`)}
                    className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 text-[11px] font-bold flex items-center space-x-1 ml-auto"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{log.iqFile}</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
