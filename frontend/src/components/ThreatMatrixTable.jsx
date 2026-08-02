import React, { useState } from 'react';
import { ShieldAlert, Crosshair, Download, ExternalLink, Filter, Search, CheckCircle2, AlertTriangle, Info } from 'lucide-react';

export default function ThreatMatrixTable({ targets, selectedTarget, setSelectedTarget }) {
  const [filterLevel, setFilterLevel] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTargets = targets.filter((target) => {
    const matchesFilter = filterLevel === 'ALL' || target.threatLevel === filterLevel;
    const matchesSearch = 
      target.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      target.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      target.protocol.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getThreatBadge = (level) => {
    switch (level) {
      case 'CRITICAL':
        return (
          <span className="px-2.5 py-1 rounded-md text-[10px] font-mono font-bold bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center gap-1.5 w-fit animate-pulse">
            <AlertTriangle className="w-3 h-3 text-rose-400" />
            CRITICAL
          </span>
        );
      case 'WARNING':
        return (
          <span className="px-2.5 py-1 rounded-md text-[10px] font-mono font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center gap-1.5 w-fit">
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            WARNING
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-md text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 flex items-center gap-1.5 w-fit">
            <Info className="w-3 h-3 text-cyan-400" />
            INFO
          </span>
        );
    }
  };

  return (
    <div className="w-full h-full glass-panel rounded-2xl p-6 border border-cyan-500/20 flex flex-col overflow-hidden">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-cyan-500/20">
        <div>
          <h2 className="font-mono text-lg font-bold text-white tracking-wider flex items-center gap-2">
            THREAT MATRIX & TARGET FEED
            <span className="text-xs px-2.5 py-0.5 rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/30">
              {targets.length} DETECTED
            </span>
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Real-time RF Classification & Signal Analysis Stream
          </p>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search target or model..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Level Filter Tabs */}
          <div className="flex items-center bg-slate-900/80 p-1 rounded-xl border border-slate-800 text-xs font-mono">
            {['ALL', 'CRITICAL', 'WARNING', 'INFO'].map((level) => (
              <button
                key={level}
                onClick={() => setFilterLevel(level)}
                className={`px-3 py-1 rounded-lg transition-all ${
                  filterLevel === level
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Target Table */}
      <div className="flex-1 overflow-x-auto overflow-y-auto rounded-xl border border-slate-800">
        <table className="w-full text-left font-mono text-xs border-collapse">
          <thead>
            <tr className="bg-slate-900/90 text-slate-400 border-b border-slate-800">
              <th className="py-3 px-4 font-semibold">TARGET ID</th>
              <th className="py-3 px-4 font-semibold">DRONE MODEL</th>
              <th className="py-3 px-4 font-semibold">PROTOCOL</th>
              <th className="py-3 px-4 font-semibold">THREAT LEVEL</th>
              <th className="py-3 px-4 font-semibold">AI CONFIDENCE</th>
              <th className="py-3 px-4 font-semibold">FREQ (GHz)</th>
              <th className="py-3 px-4 font-semibold">RSSI / SNR</th>
              <th className="py-3 px-4 font-semibold">DISTANCE</th>
              <th className="py-3 px-4 font-semibold">AZIMUTH</th>
              <th className="py-3 px-4 font-semibold text-right">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filteredTargets.length === 0 ? (
              <tr>
                <td colSpan="10" className="py-8 text-center text-slate-500 font-mono">
                  No drone signals matching criteria in current RF sweep range.
                </td>
              </tr>
            ) : (
              filteredTargets.map((target) => {
                const isSelected = selectedTarget?.id === target.id;
                return (
                  <tr
                    key={target.id}
                    onClick={() => setSelectedTarget(target)}
                    className={`transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-500/10 border-l-4 border-l-cyan-400'
                        : 'hover:bg-slate-800/40'
                    }`}
                  >
                    <td className="py-3.5 px-4 font-bold text-cyan-300 flex items-center gap-2">
                      <Crosshair className="w-3.5 h-3.5 text-cyan-400" />
                      {target.id}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-white">{target.model}</td>
                    <td className="py-3.5 px-4 text-slate-300">{target.protocol}</td>
                    <td className="py-3.5 px-4">{getThreatBadge(target.threatLevel)}</td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-emerald-400">{target.confidence}%</span>
                    </td>
                    <td className="py-3.5 px-4 text-white">{(target.frequencyGHz).toFixed(3)}</td>
                    <td className="py-3.5 px-4">
                      <span className="text-white font-bold">{target.rssidBm} dBm</span>
                      <span className="text-slate-400 ml-1">({target.snrdB}dB SNR)</span>
                    </td>
                    <td className="py-3.5 px-4 text-cyan-300 font-semibold">{target.distanceMeters} m</td>
                    <td className="py-3.5 px-4 text-amber-400">{target.azimuthDeg}°</td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            alert(`Exporting Raw .IQ Capture for ${target.id}`);
                          }}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700"
                          title="Export IQ Raw Recording"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTarget(target);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 text-[11px] font-bold"
                        >
                          TRACK
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
