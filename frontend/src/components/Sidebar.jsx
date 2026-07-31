import React from 'react';
import { 
  LayoutDashboard, 
  Radar, 
  FolderPlus, 
  Waves, 
  Cpu, 
  History, 
  Sliders, 
  ChevronLeft, 
  ChevronRight,
  ShieldAlert
} from 'lucide-react';

export default function Sidebar({ 
  activeTab, 
  setActiveTab, 
  isCollapsed, 
  setIsCollapsed,
  activeThreatCount 
}) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'live_detection', label: 'Live Detection', icon: Radar, badge: 'LIVE' },
    { id: 'data_collection', label: 'Data Collection', icon: FolderPlus },
    { id: 'spectrogram', label: 'Spectrogram Viewer', icon: Waves },
    { id: 'model_training', label: 'Model Training', icon: Cpu, badge: 'PyTorch' },
    { id: 'history', label: 'Detection History', icon: History, badge: activeThreatCount > 0 ? activeThreatCount : null, alert: activeThreatCount > 0 },
    { id: 'settings', label: 'Settings', icon: Sliders },
  ];

  return (
    <aside 
      className={`relative bg-[#0D1117]/85 backdrop-blur-xl border-r border-cyan-500/20 flex flex-col justify-between p-3.5 shrink-0 select-none transition-all duration-300 z-30 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Top Section */}
      <div className="space-y-6">
        {/* Header & Collapse Toggle */}
        <div className="flex items-center justify-between px-2 pt-1">
          {!isCollapsed && (
            <span className="text-[10px] font-mono font-bold tracking-widest text-slate-500 uppercase">
              COMMAND NAVIGATION
            </span>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`p-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-400 hover:text-cyan-300 hover:border-cyan-500/40 transition-all ${
              isCollapsed ? 'mx-auto' : ''
            }`}
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4 text-cyan-400" /> : <ChevronLeft className="w-4 h-4 text-cyan-400" />}
          </button>
        </div>

        {/* Menu Items List */}
        <nav className="space-y-1.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                title={isCollapsed ? item.label : undefined}
                className={`w-full flex items-center ${
                  isCollapsed ? 'justify-center px-0 py-3' : 'justify-between px-3.5 py-3'
                } rounded-xl font-mono text-xs transition-all duration-200 group relative ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600/30 to-cyan-500/15 border border-cyan-400/60 text-cyan-300 shadow-[0_0_20px_rgba(0,114,255,0.25)] font-bold'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50 border border-transparent'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-4 h-4 transition-transform duration-200 ${
                    isActive ? 'text-cyan-400 scale-110' : 'text-slate-400 group-hover:text-cyan-400 group-hover:scale-105'
                  }`} />
                  {!isCollapsed && <span>{item.label}</span>}
                </div>

                {!isCollapsed && item.badge && (
                  <span className={`px-2 py-0.5 text-[9px] rounded font-mono font-bold ${
                    item.alert
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse'
                      : isActive
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'bg-slate-800 text-slate-400'
                  }`}>
                    {item.badge}
                  </span>
                )}

                {/* Collapsed Tooltip */}
                {isCollapsed && (
                  <div className="absolute left-full ml-3 px-3 py-1.5 bg-slate-900 text-cyan-300 border border-cyan-500/30 text-xs rounded-lg shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap font-mono">
                    {item.label}
                  </div>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Hardware Status Footer */}
      {!isCollapsed && (
        <div className="p-3.5 rounded-xl glass-panel border border-cyan-500/20 space-y-2.5">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400">HARDWARE ENGINE</span>
            <span className="text-cyan-400 font-bold">HackRF One</span>
          </div>

          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div className="bg-gradient-to-r from-cyan-400 to-blue-500 h-full w-[65%]" />
          </div>

          <div className="flex justify-between text-[10px] font-mono text-slate-400">
            <span>2.4 GHz ISM</span>
            <span>20 MSPS</span>
          </div>
        </div>
      )}
    </aside>
  );
}
