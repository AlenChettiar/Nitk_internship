import React, { useRef, useEffect } from 'react';
import { Activity, Signal, AlertTriangle } from 'lucide-react';

export default function SpectrumAnalyzer({ centerFrequency, isScanning, targets }) {
  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const render = () => {
      const width = canvas.parentElement.clientWidth;
      const height = canvas.parentElement.clientHeight || 240;
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      // Background
      ctx.fillStyle = '#0D1117';
      ctx.fillRect(0, 0, width, height);

      // Grid Lines
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.08)';
      ctx.lineWidth = 1;
      const horizontalGrids = 5;
      for (let i = 1; i < horizontalGrids; i++) {
        const y = (height / horizontalGrids) * i;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();

        // dBm Label
        const dbm = Math.round(-30 - (i * 15));
        ctx.fillStyle = 'rgba(0, 240, 255, 0.3)';
        ctx.font = '9px monospace';
        ctx.fillText(`${dbm} dBm`, 6, y - 4);
      }

      // Threshold Line (-70 dBm)
      const thresholdY = height * 0.65;
      ctx.strokeStyle = 'rgba(255, 51, 102, 0.5)';
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(0, thresholdY);
      ctx.lineTo(width, thresholdY);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(255, 51, 102, 0.8)';
      ctx.font = 'bold 9px monospace';
      ctx.fillText('AI DETECTION THRESHOLD (-70 dBm)', width - 200, thresholdY - 4);

      // Generate Spectral Curve
      ctx.beginPath();
      ctx.strokeStyle = '#00F0FF';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#00F0FF';
      ctx.shadowBlur = 8;

      const points = [];
      const numPoints = width;

      for (let x = 0; x < numPoints; x++) {
        let baseDbmY = height * 0.85 + (Math.random() * 8 - 4); // Noise floor around -90 dBm

        // Calculate Target Peaks
        targets.forEach((target) => {
          const normFreq = (target.frequencyGHz - 2.400) / 0.100;
          const targetX = Math.floor(normFreq * numPoints);

          const distance = Math.abs(x - targetX);
          if (distance < 25) {
            const peakHeight = (target.snrdB / 40) * (height * 0.6) * Math.exp(-Math.pow(distance / 8, 2));
            baseDbmY -= peakHeight;
          }
        });

        points.push({ x, y: Math.max(baseDbmY, 15) });
      }

      // Draw Curve
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      ctx.stroke();

      // Fill Gradient under spectrum
      ctx.lineTo(width, height);
      ctx.lineTo(0, height);
      ctx.closePath();
      const fillGlow = ctx.createLinearGradient(0, 0, 0, height);
      fillGlow.addColorStop(0, 'rgba(0, 240, 255, 0.25)');
      fillGlow.addColorStop(1, 'rgba(0, 114, 255, 0.01)');
      ctx.fillStyle = fillGlow;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Draw Peak Annotations for Targets
      targets.forEach((target) => {
        const normFreq = (target.frequencyGHz - 2.400) / 0.100;
        const targetX = Math.floor(normFreq * numPoints);
        const peakY = points[targetX]?.y || height * 0.4;

        ctx.fillStyle = '#FF3366';
        ctx.beginPath();
        ctx.arc(targetX, peakY, 4, 0, Math.PI * 2);
        ctx.fill();

        // Marker box
        ctx.fillStyle = 'rgba(22, 27, 34, 0.9)';
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
        ctx.fillRect(targetX - 45, peakY - 32, 90, 24);
        ctx.strokeRect(targetX - 45, peakY - 32, 90, 24);

        ctx.fillStyle = '#00F0FF';
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${(target.frequencyGHz).toFixed(3)} GHz`, targetX, peakY - 20);
        ctx.fillStyle = '#FF3366';
        ctx.fillText(`${target.rssidBm} dBm`, targetX, peakY - 10);
      });

      if (isScanning) {
        animationFrameRef.current = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isScanning, targets, centerFrequency]);

  return (
    <div className="w-full h-full flex flex-col glass-panel rounded-2xl p-4 border border-cyan-500/20">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <Activity className="w-5 h-5 text-cyan-400" />
          <h2 className="font-mono text-sm font-bold text-white tracking-wider flex items-center gap-2">
            2D FFT SPECTRUM ANALYZER
            <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              POWER DENSITY (dBm)
            </span>
          </h2>
        </div>
        <div className="text-xs font-mono text-slate-400">
          SPAN: 100 MHz • RBW: 10 kHz
        </div>
      </div>

      <div className="relative flex-1 w-full min-h-[200px] bg-[#0D1117] rounded-xl overflow-hidden border border-slate-800">
        <canvas ref={canvasRef} className="w-full h-full" />
      </div>
    </div>
  );
}
