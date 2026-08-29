import React, { useState, useEffect, useRef } from 'react';
import { Radio, User, Cpu, Server, WifiOff, Wifi, Volume2, VolumeX, ShieldAlert, Zap, ChevronDown } from 'lucide-react';

export default function Navbar({ 
  hackrfStatus, 
  backendStatus, 
  modelStatus, 
  setHackrfStatus,
  setBackendStatus,
  setModelStatus,
  audioEnabled,
  setAudioEnabled,
  onOpenSimulator
}) {
  const [currentTime, setCurrentTime] = useState('');
  const [profileOpen, setProfileOpen] = useState(false);
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const statusMenuRef = useRef(null);
  const profileMenuRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (statusMenuRef.current && !statusMenuRef.current.contains(e.target)) {
        setStatusMenuOpen(false);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toISOString().substring(11, 19) + ' UTC');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-16 bg-[#0D1117]/90 backdrop-blur-xl border-b border-cyan-500/20 px-6 flex items-center justify-between sticky top-0 z-40 select-none">
      {/* LEFT: Logo & Application Title */}
      <div className="flex items-center space-x-3">
        <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/30 border border-cyan-400/40 glow-cyan">
          <Radio className="w-5 h-5 text-cyan-400 animate-pulse" />
          <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
        </div>

        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-extrabold tracking-wider text-white flex items-center gap-1.5 font-mono">
              DRONERF <span className="text-cyan-400 glow-text-cyan">AI</span>
            </h1>
            <span className="px-2 py-0.5 text-[9px] font-mono font-bold tracking-wider rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-300">
              v2.4 TACTICAL
            </span>
          </div>
          <p className="text-[10px] text-slate-400 font-mono tracking-tight">
            SDR Drone Signal Detection & Classification Engine
          </p>
        </div>
      </div>

      {/* RIGHT: Status Indicators, Clock, Profile */}
      <div className="flex items-center space-x-4">
        {/* Hardware & System Status Indicators */}
        <div className="hidden md:flex items-center space-x-3 bg-slate-900/80 px-3.5 py-1.5 rounded-xl border border-slate-800 text-xs font-mono">
          {/* HackRF Status */}
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              hackrfStatus === 'Connected' ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-rose-500'
            }`} />
            <span className="text-slate-400">HackRF:</span>
            <span className={`font-bold ${
              hackrfStatus === 'Connected' ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              {hackrfStatus}
            </span>
          </div>

          <span className="text-slate-700">|</span>

          {/* Backend Status */}
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              backendStatus === 'Online' ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-rose-500'
            }`} />
            <span className="text-slate-400">Backend:</span>
            <span className={`font-bold ${
              backendStatus === 'Online' ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              {backendStatus}
            </span>
          </div>

          <span className="text-slate-700">|</span>

          {/* AI Model Status */}
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              modelStatus !== 'Not Loaded' ? 'bg-cyan-400 shadow-[0_0_8px_#00f0ff]' : 'bg-amber-500'
            }`} />
            <span className="text-slate-400">Model:</span>
            <span className={`font-bold ${
              modelStatus !== 'Not Loaded' ? 'text-cyan-300' : 'text-amber-400'
            }`}>
              {modelStatus}
            </span>
          </div>
        </div>

        {/* Quick Connection Simulation Switcher */}
        <div className="relative" ref={statusMenuRef}>
          <button
            onClick={() => setStatusMenuOpen(!statusMenuOpen)}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-cyan-300 text-xs font-mono flex items-center gap-1"
            title="Toggle Status Simulation"
          >
            <Server className="w-3.5 h-3.5 text-cyan-400" />
            <ChevronDown className="w-3 h-3" />
          </button>

          {statusMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 glass-panel-accent rounded-xl p-3 shadow-2xl z-50 text-xs font-mono space-y-2 border border-cyan-500/30">
              <div className="font-bold text-cyan-300 border-b border-cyan-500/20 pb-1 text-[11px]">
                STATUS CONTROLLER
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-300">HackRF SDR:</span>
                <button
                  onClick={() => setHackrfStatus(hackrfStatus === 'Connected' ? 'Not Connected' : 'Connected')}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    hackrfStatus === 'Connected' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  }`}
                >
                  {hackrfStatus === 'Connected' ? 'DISCONNECT' : 'CONNECT'}
                </button>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-300">Backend API:</span>
                <button
                  onClick={() => setBackendStatus(backendStatus === 'Online' ? 'Offline' : 'Online')}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    backendStatus === 'Online' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  }`}
                >
                  {backendStatus === 'Online' ? 'GO OFFLINE' : 'GO ONLINE'}
                </button>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-300">ResNet Model:</span>
                <button
                  onClick={() => setModelStatus(modelStatus === 'Not Loaded' ? 'ResNet-18 (FP16)' : 'Not Loaded')}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    modelStatus !== 'Not Loaded' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  }`}
                >
                  {modelStatus !== 'Not Loaded' ? 'UNLOAD' : 'LOAD MODEL'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Live Clock */}
        <div className="hidden lg:block px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-mono text-cyan-300 tracking-wider font-semibold">
          {currentTime}
        </div>

        {/* Audio Mute Button */}
        <button
          onClick={() => setAudioEnabled(!audioEnabled)}
          className={`p-2 rounded-xl border transition-all ${
            audioEnabled 
              ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20' 
              : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
          }`}
          title={audioEnabled ? "Mute Alarms" : "Enable Alarms"}
        >
          {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>

        {/* Simulator Button */}
        <button
          onClick={onOpenSimulator}
          className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-mono text-xs font-bold hover:from-blue-500 hover:to-cyan-400 transition-all shadow-[0_0_15px_rgba(0,240,255,0.2)] flex items-center space-x-1.5 border border-cyan-300/30"
        >
          <Zap className="w-3.5 h-3.5 fill-current" />
          <span className="hidden sm:inline">SIMULATOR</span>
        </button>

        {/* User Profile Avatar */}
        <div className="relative" ref={profileMenuRef}>
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-400 p-0.5 flex items-center justify-center hover:scale-105 transition-transform border border-cyan-300/40 glow-blue cursor-pointer"
          >
            <div className="w-full h-full rounded-[10px] bg-[#0D1117] flex items-center justify-center">
              <User className="w-4 h-4 text-cyan-400" />
            </div>
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-52 glass-panel rounded-xl p-3 shadow-2xl z-50 text-xs font-mono space-y-2 border border-cyan-500/30">
              <div className="flex items-center space-x-2.5 pb-2 border-b border-slate-800">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 font-bold">
                  OP
                </div>
                <div>
                  <p className="font-bold text-white">COMMANDER</p>
                  <p className="text-[10px] text-slate-400">Tactical Operator</p>
                </div>
              </div>

              <div className="space-y-1 text-slate-300 text-[11px]">
                <div className="p-1.5 rounded hover:bg-slate-800 cursor-pointer">Profile Settings</div>
                <div className="p-1.5 rounded hover:bg-slate-800 cursor-pointer">Security Key: HackRF-01</div>
                <div className="p-1.5 rounded hover:bg-slate-800 text-rose-400 cursor-pointer">Lock Console</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
