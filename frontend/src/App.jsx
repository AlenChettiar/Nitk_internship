import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import DashboardView from './views/DashboardView';
import TacticalRadar from './components/TacticalRadar';
import RFWaterfall from './components/RFWaterfall';
import SpectrumAnalyzer from './components/SpectrumAnalyzer';
import ThreatMatrixTable from './components/ThreatMatrixTable';
import DataCollectionView from './views/DataCollectionView';
import ModelTrainingView from './views/ModelTrainingView';
import DetectionHistoryView from './views/DetectionHistoryView';
import SettingsView from './views/SettingsView';
import SimulatorDrawer from './components/SimulatorDrawer';
import { INITIAL_HACKRF_STATE } from './mockData';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Exact required initial status indicators
  const [hackrfStatus, setHackrfStatus] = useState('Not Connected');
  const [backendStatus, setBackendStatus] = useState('Offline');
  const [modelStatus, setModelStatus] = useState('Not Loaded');

  const [hackrfState, setHackrfState] = useState(INITIAL_HACKRF_STATE);
  // Default clean empty targets on standby / initial load (no fake detections)
  const [targets, setTargets] = useState([]);
  const [selectedTarget, setSelectedTarget] = useState(null);
  const [isScanning, setIsScanning] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [simulatorOpen, setSimulatorOpen] = useState(false);

  const activeThreatCount = targets.filter(t => t.threatLevel === 'CRITICAL' || t.threatLevel === 'WARNING').length;

  const currentFrequencyDisplay = hackrfStatus === 'Connected' 
    ? `${(hackrfState.centerFrequency / 1e9).toFixed(3)} GHz` 
    : '--';

  const handleInjectTarget = (newTarget) => {
    setTargets(prev => [newTarget, ...prev]);
    setSelectedTarget(newTarget);
  };

  const handleClearTargets = () => {
    setTargets([]);
    setSelectedTarget(null);
  };

  return (
    <div className="min-h-screen bg-[#0D1117] text-[#F0F6FC] bg-tactical-grid flex flex-col font-sans select-none overflow-x-hidden">
      {/* Top Navbar */}
      <Navbar
        hackrfStatus={hackrfStatus}
        backendStatus={backendStatus}
        modelStatus={modelStatus}
        setHackrfStatus={setHackrfStatus}
        setBackendStatus={setBackendStatus}
        setModelStatus={setModelStatus}
        audioEnabled={audioEnabled}
        setAudioEnabled={setAudioEnabled}
        onOpenSimulator={() => setSimulatorOpen(true)}
      />

      {/* Main Workspace Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Collapsible Left Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
          activeThreatCount={activeThreatCount}
        />

        {/* Main View Area */}
        <main className="flex-1 p-6 overflow-y-auto min-w-0">
          {/* 1. Dashboard View */}
          {activeTab === 'dashboard' && (
            <DashboardView
              hackrfStatus={hackrfStatus}
              backendStatus={backendStatus}
              modelStatus={modelStatus}
              currentFrequency={currentFrequencyDisplay}
              targets={targets}
              setActiveTab={setActiveTab}
            />
          )}

          {/* 2. Live Detection View */}
          {activeTab === 'live_detection' && (
            <div className="flex flex-col gap-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[560px]">
                <div className="lg:col-span-7 h-full min-h-[480px]">
                  <TacticalRadar
                    targets={targets}
                    selectedTarget={selectedTarget}
                    setSelectedTarget={setSelectedTarget}
                    isScanning={isScanning && hackrfStatus === 'Connected'}
                  />
                </div>
                <div className="lg:col-span-5 flex flex-col gap-6 h-full">
                  <div className="flex-1 min-h-[250px]">
                    <RFWaterfall
                      centerFrequency={hackrfState.centerFrequency}
                      isScanning={isScanning && hackrfStatus === 'Connected'}
                      targets={targets}
                    />
                  </div>
                  <div className="flex-1 min-h-[210px]">
                    <SpectrumAnalyzer
                      centerFrequency={hackrfState.centerFrequency}
                      isScanning={isScanning && hackrfStatus === 'Connected'}
                      targets={targets}
                    />
                  </div>
                </div>
              </div>

              <div className="w-full min-h-[300px]">
                <ThreatMatrixTable
                  targets={targets}
                  selectedTarget={selectedTarget}
                  setSelectedTarget={setSelectedTarget}
                />
              </div>
            </div>
          )}

          {/* 3. Data Collection View */}
          {activeTab === 'data_collection' && (
            <DataCollectionView hackrfStatus={hackrfStatus} />
          )}

          {/* 4. Spectrogram Viewer */}
          {activeTab === 'spectrogram' && (
            <div className="flex flex-col gap-6 h-full min-h-[700px]">
              <div className="flex-1 min-h-[380px]">
                <RFWaterfall
                  centerFrequency={hackrfState.centerFrequency}
                  isScanning={isScanning && hackrfStatus === 'Connected'}
                  targets={targets}
                />
              </div>
              <div className="flex-1 min-h-[280px]">
                <SpectrumAnalyzer
                  centerFrequency={hackrfState.centerFrequency}
                  isScanning={isScanning && hackrfStatus === 'Connected'}
                  targets={targets}
                />
              </div>
            </div>
          )}

          {/* 5. Model Training View */}
          {activeTab === 'model_training' && (
            <ModelTrainingView
              modelStatus={modelStatus}
              setModelStatus={setModelStatus}
            />
          )}

          {/* 6. Detection History */}
          {activeTab === 'history' && (
            <DetectionHistoryView targets={targets} />
          )}

          {/* 7. Settings View */}
          {activeTab === 'settings' && (
            <SettingsView
              hackrfState={hackrfState}
              setHackrfState={setHackrfState}
              audioEnabled={audioEnabled}
              setAudioEnabled={setAudioEnabled}
            />
          )}
        </main>
      </div>

      {/* Simulator Overlay */}
      <SimulatorDrawer
        isOpen={simulatorOpen}
        onClose={() => setSimulatorOpen(false)}
        onInjectTarget={handleInjectTarget}
        onClearTargets={handleClearTargets}
        audioEnabled={audioEnabled}
        setAudioEnabled={setAudioEnabled}
      />
    </div>
  );
}
