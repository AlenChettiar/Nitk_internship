import React, { useRef, useEffect, useState } from 'react';
import { ShieldAlert, Crosshair, MapPin, Compass, Navigation, Radio } from 'lucide-react';

export default function TacticalRadar({ targets, selectedTarget, setSelectedTarget, isScanning }) {
  const canvasRef = useRef(null);
  const [maxRangeMeters, setMaxRangeMeters] = useState(3000);
  const sweepAngleRef = useRef(0);
  const animationFrameRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const render = () => {
      // Resize canvas to match display size
      const width = canvas.parentElement.clientWidth;
      const height = canvas.parentElement.clientHeight;
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      const centerX = width / 2;
      const centerY = height / 2;
      const radius = Math.min(centerX, centerY) - 30;

      // 1. Clear background
      ctx.fillStyle = '#0D1117';
      ctx.fillRect(0, 0, width, height);

      // 2. Draw Radar Background Gradient
      const bgGlow = ctx.createRadialGradient(centerX, centerY, 5, centerX, centerY, radius);
      bgGlow.addColorStop(0, 'rgba(0, 240, 255, 0.04)');
      bgGlow.addColorStop(0.7, 'rgba(0, 114, 255, 0.02)');
      bgGlow.addColorStop(1, 'rgba(13, 17, 23, 0.9)');
      ctx.fillStyle = bgGlow;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fill();

      // 3. Draw Range Rings (Concentric Circles)
      const ringCount = 4;
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.15)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);

      for (let i = 1; i <= ringCount; i++) {
        const ringRadius = (radius / ringCount) * i;
        ctx.beginPath();
        ctx.arc(centerX, centerY, ringRadius, 0, Math.PI * 2);
        ctx.stroke();

        // Ring distance label
        const distanceLabel = `${Math.round((maxRangeMeters / ringCount) * i)}m`;
        ctx.fillStyle = 'rgba(0, 240, 255, 0.4)';
        ctx.font = '10px monospace';
        ctx.fillText(distanceLabel, centerX + 6, centerY - ringRadius + 12);
      }
      ctx.setLineDash([]); // Reset line dash

      // 4. Draw Radial Azimuth Lines & Degrees
      const angles = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];
      const cardinalLabels = { 0: 'N (0°)', 90: 'E (90°)', 180: 'S (180°)', 270: 'W (270°)' };

      ctx.strokeStyle = 'rgba(0, 240, 255, 0.12)';
      ctx.lineWidth = 1;

      angles.forEach((deg) => {
        const rad = (deg - 90) * (Math.PI / 180);
        const endX = centerX + radius * Math.cos(rad);
        const endY = centerY + radius * Math.sin(rad);

        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(endX, endY);
        ctx.stroke();

        // Cardinal / Degree Labels
        const labelRad = (deg - 90) * (Math.PI / 180);
        const labelX = centerX + (radius + 16) * Math.cos(labelRad);
        const labelY = centerY + (radius + 16) * Math.sin(labelRad);

        ctx.fillStyle = cardinalLabels[deg] ? '#00F0FF' : 'rgba(148, 163, 184, 0.5)';
        ctx.font = cardinalLabels[deg] ? 'bold 11px monospace' : '9px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(cardinalLabels[deg] || `${deg}°`, labelX, labelY);
      });

      // 5. Draw Radar Outer Ring Frame
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.stroke();

      // Outer Ticks
      for (let deg = 0; deg < 360; deg += 5) {
        const rad = (deg - 90) * (Math.PI / 180);
        const tickLength = deg % 15 === 0 ? 8 : 4;
        const innerX = centerX + (radius - tickLength) * Math.cos(rad);
        const innerY = centerY + (radius - tickLength) * Math.sin(rad);
        const outerX = centerX + radius * Math.cos(rad);
        const outerY = centerY + radius * Math.sin(rad);

        ctx.strokeStyle = deg % 15 === 0 ? 'rgba(0, 240, 255, 0.6)' : 'rgba(0, 240, 255, 0.2)';
        ctx.beginPath();
        ctx.moveTo(innerX, innerY);
        ctx.lineTo(outerX, outerY);
        ctx.stroke();
      }

      // 6. Rotating Sweep Arc Line
      if (isScanning) {
        sweepAngleRef.current = (sweepAngleRef.current + 0.025) % (Math.PI * 2);
      }
      const currentSweep = sweepAngleRef.current;

      // Draw Sector Fill behind sweep line
      const sweepSector = ctx.createConicalGradient ? null : null; // Polyfill fallback gradient
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, currentSweep - 0.4, currentSweep);
      ctx.closePath();
      const sweepGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
      sweepGradient.addColorStop(0, 'rgba(0, 240, 255, 0.25)');
      sweepGradient.addColorStop(1, 'rgba(0, 240, 255, 0.02)');
      ctx.fillStyle = sweepGradient;
      ctx.fill();
      ctx.restore();

      // Sharp Sweep Line
      const sweepEndX = centerX + radius * Math.cos(currentSweep);
      const sweepEndY = centerY + radius * Math.sin(currentSweep);
      ctx.strokeStyle = '#00F0FF';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = '#00F0FF';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(sweepEndX, sweepEndY);
      ctx.stroke();
      ctx.shadowBlur = 0; // Reset glow

      // 7. Render Drone Target Blips
      targets.forEach((target) => {
        // Map target azimuth & distance to Canvas X, Y
        const normDistance = Math.min(target.distanceMeters / maxRangeMeters, 0.98);
        const targetRadius = normDistance * radius;
        const targetRad = (target.azimuthDeg - 90) * (Math.PI / 180);

        const targetX = centerX + targetRadius * Math.cos(targetRad);
        const targetY = centerY + targetRadius * Math.sin(targetRad);

        const isSelected = selectedTarget?.id === target.id;
        const color = target.threatLevel === 'CRITICAL' ? '#FF3366' : target.threatLevel === 'WARNING' ? '#FFB800' : '#00F0FF';

        // Blip pulse ring
        ctx.strokeStyle = color;
        ctx.lineWidth = isSelected ? 2 : 1;
        ctx.beginPath();
        ctx.arc(targetX, targetY, isSelected ? 16 : 10, 0, Math.PI * 2);
        ctx.stroke();

        // Inner solid dot
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = isSelected ? 15 : 8;
        ctx.beginPath();
        ctx.arc(targetX, targetY, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Target Lock Crosshair Box if Selected
        if (isSelected) {
          ctx.strokeStyle = '#00F0FF';
          ctx.lineWidth = 1.5;
          const boxSize = 22;
          ctx.strokeRect(targetX - boxSize / 2, targetY - boxSize / 2, boxSize, boxSize);

          // Vector direction line
          ctx.beginPath();
          ctx.moveTo(targetX, targetY);
          ctx.lineTo(targetX + 25 * Math.cos(targetRad), targetY + 25 * Math.sin(targetRad));
          ctx.stroke();
        }

        // Label next to target
        ctx.fillStyle = color;
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`${target.id} [${target.model}]`, targetX + 12, targetY - 4);

        ctx.fillStyle = 'rgba(240, 246, 252, 0.7)';
        ctx.font = '9px monospace';
        ctx.fillText(`${target.distanceMeters}m • ${(target.frequencyGHz).toFixed(3)}GHz`, targetX + 12, targetY + 8);
      });

      // 8. Center SDR Base Station Marker
      ctx.fillStyle = '#00F0FF';
      ctx.beginPath();
      ctx.arc(centerX, centerY, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(centerX - 8, centerY - 8, 16, 16);

      ctx.fillStyle = '#00F0FF';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('HACKRF BASE', centerX, centerY + 22);

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [targets, selectedTarget, maxRangeMeters, isScanning]);

  // Click on Canvas to Select Target
  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(centerX, centerY) - 30;

    let closest = null;
    let minDistance = 25; // threshold px

    targets.forEach((target) => {
      const normDistance = Math.min(target.distanceMeters / maxRangeMeters, 0.98);
      const targetRadius = normDistance * radius;
      const targetRad = (target.azimuthDeg - 90) * (Math.PI / 180);

      const targetX = centerX + targetRadius * Math.cos(targetRad);
      const targetY = centerY + targetRadius * Math.sin(targetRad);

      const dist = Math.hypot(clickX - targetX, clickY - targetY);
      if (dist < minDistance) {
        minDistance = dist;
        closest = target;
      }
    });

    setSelectedTarget(closest);
  };

  return (
    <div className="relative w-full h-full flex flex-col glass-panel rounded-2xl p-4 overflow-hidden border border-cyan-500/20">
      {/* Radar Overlay Header Controls */}
      <div className="flex items-center justify-between z-10 mb-2">
        <div className="flex items-center space-x-2">
          <Crosshair className="w-5 h-5 text-cyan-400 animate-spin" style={{ animationDuration: '8s' }} />
          <h2 className="font-mono text-sm font-bold text-white tracking-wider flex items-center gap-2">
            360° TACTICAL RF RADAR
            <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              AZIMUTH / BEARING TRACKER
            </span>
          </h2>
        </div>

        {/* Range Selector */}
        <div className="flex items-center space-x-2 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
          <span className="text-[10px] font-mono text-slate-400 pl-2">RANGE:</span>
          {[1000, 3000, 5000].map((range) => (
            <button
              key={range}
              onClick={() => setMaxRangeMeters(range)}
              className={`px-2.5 py-1 rounded-lg font-mono text-[11px] transition-all ${
                maxRangeMeters === range
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {range / 1000} KM
            </button>
          ))}
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="relative flex-1 w-full h-full min-h-[420px] cursor-crosshair">
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          className="absolute inset-0 w-full h-full rounded-xl"
        />

        {/* Target Telemetry Card if target selected */}
        {selectedTarget && (
          <div className="absolute bottom-4 left-4 w-72 glass-panel-accent p-3.5 rounded-xl border border-cyan-400/40 text-xs font-mono space-y-2 z-20 shadow-2xl">
            <div className="flex items-center justify-between border-b border-cyan-500/30 pb-2">
              <span className="font-bold text-cyan-300 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                {selectedTarget.id}
              </span>
              <button
                onClick={() => setSelectedTarget(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-slate-400">Model:</span>
                <p className="font-semibold text-white">{selectedTarget.model}</p>
              </div>
              <div>
                <span className="text-slate-400">Protocol:</span>
                <p className="font-semibold text-cyan-400">{selectedTarget.protocol}</p>
              </div>
              <div>
                <span className="text-slate-400">Distance:</span>
                <p className="font-semibold text-white">{selectedTarget.distanceMeters} m</p>
              </div>
              <div>
                <span className="text-slate-400">Bearing:</span>
                <p className="font-semibold text-amber-400">{selectedTarget.azimuthDeg}° Az</p>
              </div>
              <div>
                <span className="text-slate-400">Freq:</span>
                <p className="font-semibold text-white">{(selectedTarget.frequencyGHz).toFixed(3)} GHz</p>
              </div>
              <div>
                <span className="text-slate-400">AI Confidence:</span>
                <p className="font-semibold text-emerald-400">{selectedTarget.confidence}%</p>
              </div>
            </div>

            <div className="pt-1 flex gap-2">
              <button 
                onClick={() => alert(`Target ${selectedTarget.id} locked for active RF monitoring.`)}
                className="w-full py-1 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 text-[10px] font-bold"
              >
                LOCK TARGET
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
