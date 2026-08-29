import React, { useRef, useEffect, useState } from 'react';
import { Waves, Zap, Sliders, Maximize2 } from 'lucide-react';

export default function RFWaterfall({ centerFrequency, isScanning, targets }) {
  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);
  const [colorPalette, setColorPalette] = useState('CYAN_THERMAL'); // CYAN_THERMAL, RAINBOW, MONO_CYAN

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const width = canvas.parentElement.clientWidth;
    const height = canvas.parentElement.clientHeight || 300;
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    const numBins = width;

    // Color mapper for dBm intensity (-100 dBm to -30 dBm)
    const getdBmColor = (val) => {
      // val normalized 0 to 1
      if (colorPalette === 'CYAN_THERMAL') {
        if (val < 0.2) return [13, 17, 23]; // Background obsidian
        if (val < 0.4) return [0, 80, 160]; // Deep Blue
        if (val < 0.65) return [0, 240, 255]; // Cyan
        if (val < 0.85) return [255, 200, 0]; // Yellow
        return [255, 51, 102]; // Alert Red
      } else {
        // Neon Rainbow
        if (val < 0.2) return [13, 17, 23];
        if (val < 0.4) return [0, 255, 136];
        if (val < 0.7) return [0, 240, 255];
        return [255, 0, 128];
      }
    };

    const render = () => {
      if (!isScanning) {
        animationFrameRef.current = requestAnimationFrame(render);
        return;
      }

      // Shift existing image down by 1 pixel
      ctx.drawImage(canvas, 0, 0, width, height - 1, 0, 1, width, height - 1);

      // Generate new top line of FFT spectral density
      const lineData = ctx.createImageData(width, 1);
      const data = lineData.data;

      // Base noise floor
      for (let x = 0; x < width; x++) {
        let noise = 0.15 + Math.random() * 0.1;

        // Add signal spikes corresponding to active drone targets
        targets.forEach((target) => {
          // Normalize target freq relative to 2.4 GHz - 2.5 GHz
          const freqStart = 2.400;
          const freqEnd = 2.500;
          const normFreq = (target.frequencyGHz - freqStart) / (freqEnd - freqStart);
          const targetBin = Math.floor(normFreq * width);

          const distance = Math.abs(x - targetBin);
          if (distance < 20) {
            // Gaussian signal peak shape
            const peakStrength = (target.snrdB / 30) * Math.exp(-Math.pow(distance / 5, 2));
            noise += peakStrength;
          }
        });

        const val = Math.min(Math.max(noise, 0), 1.0);
        const [r, g, b] = getdBmColor(val);

        const index = x * 4;
        data[index] = r;
        data[index + 1] = g;
        data[index + 2] = b;
        data[index + 3] = 255;
      }

      // Draw top line
      ctx.putImageData(lineData, 0, 0);

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isScanning, targets, colorPalette, centerFrequency]);

  return (
    <div className="w-full h-full flex flex-col glass-panel rounded-2xl p-4 border border-cyan-500/20">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <Waves className="w-5 h-5 text-cyan-400" />
          <h2 className="font-mono text-sm font-bold text-white tracking-wider flex items-center gap-2">
            RF SPECTROGRAM WATERFALL
            <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              TIME VS FREQUENCY HEATMAP
            </span>
          </h2>
        </div>

        {/* Controls */}
        <div className="flex items-center space-x-3 text-xs font-mono">
          <span className="text-slate-400 hidden sm:inline">CENTER: {(centerFrequency / 1e9).toFixed(3)} GHz</span>
          
          <button
            onClick={() => setColorPalette(colorPalette === 'CYAN_THERMAL' ? 'RAINBOW' : 'CYAN_THERMAL')}
            className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white"
          >
            PALETTE: {colorPalette}
          </button>
        </div>
      </div>

      {/* Frequency Band Scale Bar */}
      <div className="w-full flex justify-between text-[10px] font-mono text-cyan-400/80 px-1 py-1 border-b border-cyan-500/20 bg-slate-950/60 rounded-t-lg">
        <span>2.400 GHz</span>
        <span>2.425 GHz</span>
        <span className="font-bold text-cyan-300">2.450 GHz (CENTER)</span>
        <span>2.475 GHz</span>
        <span>2.500 GHz</span>
      </div>

      {/* Waterfall Canvas */}
      <div className="relative flex-1 w-full min-h-[260px] bg-[#0D1117] rounded-b-lg overflow-hidden border border-slate-800">
        <canvas ref={canvasRef} className="w-full h-full" />
        
        {/* Color Legend Sidebar */}
        <div className="absolute right-2 top-2 bottom-2 w-3 rounded flex flex-col justify-between p-0.5 bg-slate-900/80 border border-slate-700 pointer-events-none">
          <div className="w-full h-full rounded bg-gradient-to-b from-[#FF3366] via-[#FFB800] via-[#00F0FF] to-[#0D1117]" />
        </div>
      </div>
    </div>
  );
}
