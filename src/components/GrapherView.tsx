import React, { useState, useEffect, useRef } from 'react';
import { plotPythonFormula } from '../utils/pythonApi';
import { PlotResponse } from '../types/calculator';
import { Play, LineChart, Download, RefreshCw, ZoomIn, ZoomOut } from 'lucide-react';

const PRESET_FORMULAS = [
  { label: 'Damped Oscillator', formula: 'math.exp(-0.15 * abs(x)) * math.cos(2 * x)', min: -10, max: 10 },
  { label: 'Cubic Polynomial', formula: '0.1 * x**3 - 1.5 * x', min: -6, max: 6 },
  { label: 'Gaussian Bell Curve', formula: '(1 / math.sqrt(2 * math.pi)) * math.exp(-0.5 * x**2)', min: -4, max: 4 },
  { label: 'Harmonic Beat Wave', formula: 'math.sin(2 * x) + math.sin(2.3 * x)', min: -15, max: 15 },
  { label: 'Sinc Wave (sin(x)/x)', formula: 'math.sin(x)/x if x != 0 else 1.0', min: -15, max: 15 },
  { label: 'Logistic Sigmoid', formula: '1 / (1 + math.exp(-x))', min: -6, max: 6 },
];

export const GrapherView: React.FC = () => {
  const [formula, setFormula] = useState<string>('math.exp(-0.15 * abs(x)) * math.cos(2 * x)');
  const [xMin, setXMin] = useState<number>(-10);
  const [xMax, setXMax] = useState<number>(10);
  const [samples, setSamples] = useState<number>(160);
  const [plotData, setPlotData] = useState<PlotResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hoverCoord, setHoverCoord] = useState<{ x: number; y: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const fetchPlot = async () => {
    setIsLoading(true);
    const data = await plotPythonFormula(formula, xMin, xMax, samples);
    setPlotData(data);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchPlot();
  }, []);

  const handlePresetSelect = (preset: typeof PRESET_FORMULAS[0]) => {
    setFormula(preset.formula);
    setXMin(preset.min);
    setXMax(preset.max);
    // Trigger immediate update
    setIsLoading(true);
    plotPythonFormula(preset.formula, preset.min, preset.max, samples).then((res) => {
      setPlotData(res);
      setIsLoading(false);
    });
  };

  const handleExportCSV = () => {
    if (!plotData || !plotData.points.length) return;
    const rows = ['x,y'];
    plotData.points.forEach((pt) => {
      if (pt.valid && pt.y !== null) {
        rows.push(`${pt.x},${pt.y}`);
      }
    });
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `plot_data_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // SVG coordinate transformation math
  const width = 800;
  const height = 400;
  const padding = 50;

  const validPoints = plotData?.points.filter((p) => p.valid && p.y !== null) || [];
  const yMin = plotData ? Math.min(plotData.yMin, 0) : -1;
  const yMax = plotData ? Math.max(plotData.yMax, 0) : 1;
  const ySpan = yMax - yMin || 1;
  const xSpan = xMax - xMin || 1;

  const toSvgX = (x: number) => padding + ((x - xMin) / xSpan) * (width - 2 * padding);
  const toSvgY = (y: number) => height - padding - ((y - yMin) / ySpan) * (height - 2 * padding);

  // Generate SVG path for line curve
  let pathD = '';
  let isDrawing = false;
  plotData?.points.forEach((pt) => {
    if (pt.valid && pt.y !== null) {
      const sx = toSvgX(pt.x);
      const sy = toSvgY(pt.y);
      if (!isDrawing) {
        pathD += `M ${sx} ${sy}`;
        isDrawing = true;
      } else {
        pathD += ` L ${sx} ${sy}`;
      }
    } else {
      isDrawing = false;
    }
  });

  const handleSvgMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current || !plotData) return;
    const rect = svgRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const ratioX = (mouseX - padding) / (width - 2 * padding);
    if (ratioX < 0 || ratioX > 1) {
      setHoverCoord(null);
      return;
    }

    const currentX = xMin + ratioX * xSpan;

    // Find closest point in dataset
    let closest = plotData.points[0];
    let minDiff = Infinity;
    for (const pt of plotData.points) {
      if (pt.valid && pt.y !== null) {
        const diff = Math.abs(pt.x - currentX);
        if (diff < minDiff) {
          minDiff = diff;
          closest = pt;
        }
      }
    }

    if (closest && closest.y !== null) {
      setHoverCoord({ x: closest.x, y: closest.y });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6">
      {/* Top Controls Ribbon */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <LineChart className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-semibold text-slate-100 font-mono">Python Function Plotter</h2>
          </div>

          {/* Preset Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-1">
            <span className="text-slate-500 text-xs font-mono whitespace-nowrap mr-1">Presets:</span>
            {PRESET_FORMULAS.map((preset) => (
              <button
                key={preset.label}
                onClick={() => handlePresetSelect(preset)}
                className="px-2.5 py-1 text-xs font-mono bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 rounded transition-colors whitespace-nowrap shrink-0"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Formula Input & Parameters */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
          <div className="md:col-span-6">
            <label className="block text-xs font-mono text-slate-400 mb-1.5">
              Function Formula y = f(x):
            </label>
            <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2">
              <span className="text-emerald-400 font-mono text-xs font-semibold">f(x) =</span>
              <input
                type="text"
                value={formula}
                onChange={(e) => setFormula(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchPlot()}
                className="w-full bg-transparent text-slate-100 font-mono text-sm focus:outline-none"
                placeholder="e.g. math.sin(x) * x"
              />
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-mono text-slate-400 mb-1.5">xMin:</label>
            <input
              type="number"
              value={xMin}
              onChange={(e) => setXMin(parseFloat(e.target.value) || -10)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-100 font-mono text-sm px-3 py-2 rounded-lg focus:outline-none"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-mono text-slate-400 mb-1.5">xMax:</label>
            <input
              type="number"
              value={xMax}
              onChange={(e) => setXMax(parseFloat(e.target.value) || 10)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-100 font-mono text-sm px-3 py-2 rounded-lg focus:outline-none"
            />
          </div>

          <div className="md:col-span-2 flex items-center gap-2">
            <button
              onClick={fetchPlot}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-semibold text-xs rounded-lg transition-colors font-mono"
            >
              {isLoading ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Play className="w-3.5 h-3.5 fill-current" />
              )}
              <span>{isLoading ? 'Computing...' : 'Plot Curve'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Plot Stage & Diagnostics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* SVG Plot Stage (8 cols) */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm flex flex-col">
          {/* HUD Status Bar */}
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-3 border-b border-slate-800 pb-2">
            <div className="flex items-center gap-3">
              <span>Domain: [{xMin}, {xMax}]</span>
              {plotData && (
                <span>· Range: [{plotData.yMin}, {plotData.yMax}]</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {plotData?.executionTimeMs !== undefined && (
                <span className="text-emerald-400 bg-emerald-950/40 border border-emerald-900/40 px-2 py-0.5 rounded text-[11px] tabular-nums">
                  {plotData.executionTimeMs} ms
                </span>
              )}
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-1 text-slate-400 hover:text-slate-200 transition-colors"
                title="Download CSV points"
              >
                <Download className="w-3 h-3" />
                <span>CSV</span>
              </button>
            </div>
          </div>

          {/* SVG Canvas */}
          <div className="relative w-full aspect-[2/1] bg-slate-950 border border-slate-800/80 rounded-lg overflow-hidden flex items-center justify-center">
            {plotData?.error ? (
              <div className="text-rose-400 font-mono text-xs p-4 text-center">
                Evaluation Error: {plotData.error}
              </div>
            ) : (
              <svg
                ref={svgRef}
                viewBox={`0 0 ${width} ${height}`}
                className="w-full h-full cursor-crosshair select-none"
                onMouseMove={handleSvgMouseMove}
                onMouseLeave={() => setHoverCoord(null)}
              >
                <defs>
                  <linearGradient id="plotGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Gridlines */}
                {[-1, -0.5, 0, 0.5, 1].map((val) => {
                  const targetY = yMin + ((val + 1) / 2) * ySpan;
                  const sy = toSvgY(targetY);
                  if (sy < padding || sy > height - padding) return null;
                  return (
                    <line
                      key={val}
                      x1={padding}
                      y1={sy}
                      x2={width - padding}
                      y2={sy}
                      stroke="#1e293b"
                      strokeWidth="1"
                      strokeDasharray="4 4"
                    />
                  );
                })}

                {/* X-Axis line (Y = 0) */}
                {0 >= yMin && 0 <= yMax && (
                  <line
                    x1={padding}
                    y1={toSvgY(0)}
                    x2={width - padding}
                    y2={toSvgY(0)}
                    stroke="#475569"
                    strokeWidth="1.5"
                  />
                )}

                {/* Y-Axis line (X = 0) */}
                {0 >= xMin && 0 <= xMax && (
                  <line
                    x1={toSvgX(0)}
                    y1={padding}
                    x2={toSvgX(0)}
                    y2={height - padding}
                    stroke="#475569"
                    strokeWidth="1.5"
                  />
                )}

                {/* Function Curve */}
                {pathD && (
                  <path
                    d={pathD}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}

                {/* Detected Roots (Zeros) */}
                {plotData?.roots.map((rootVal, idx) => {
                  const rx = toSvgX(rootVal);
                  const ry = toSvgY(0);
                  if (rx < padding || rx > width - padding) return null;
                  return (
                    <g key={idx}>
                      <circle cx={rx} cy={ry} r="4" fill="#06b6d4" stroke="#083344" strokeWidth="2" />
                      <text
                        x={rx}
                        y={ry - 8}
                        fill="#06b6d4"
                        fontSize="10"
                        fontFamily="JetBrains Mono"
                        textAnchor="middle"
                      >
                        root: {rootVal}
                      </text>
                    </g>
                  );
                })}

                {/* Hover Probe Indicator */}
                {hoverCoord && (
                  <g>
                    <line
                      x1={toSvgX(hoverCoord.x)}
                      y1={padding}
                      x2={toSvgX(hoverCoord.x)}
                      y2={height - padding}
                      stroke="#94a3b8"
                      strokeWidth="1"
                      strokeDasharray="2 2"
                    />
                    <line
                      x1={padding}
                      y1={toSvgY(hoverCoord.y)}
                      x2={width - padding}
                      y2={toSvgY(hoverCoord.y)}
                      stroke="#94a3b8"
                      strokeWidth="1"
                      strokeDasharray="2 2"
                    />
                    <circle
                      cx={toSvgX(hoverCoord.x)}
                      cy={toSvgY(hoverCoord.y)}
                      r="5"
                      fill="#38bdf8"
                      stroke="#0f172a"
                      strokeWidth="2"
                    />
                  </g>
                )}

                {/* Coordinate Axis Labels */}
                <text x={padding} y={height - 20} fill="#64748b" fontSize="11" fontFamily="JetBrains Mono">
                  x: {xMin}
                </text>
                <text x={width - padding} y={height - 20} fill="#64748b" fontSize="11" fontFamily="JetBrains Mono" textAnchor="end">
                  x: {xMax}
                </text>
                <text x={padding - 8} y={height - padding} fill="#64748b" fontSize="11" fontFamily="JetBrains Mono" textAnchor="end">
                  {yMin.toFixed(2)}
                </text>
                <text x={padding - 8} y={padding + 10} fill="#64748b" fontSize="11" fontFamily="JetBrains Mono" textAnchor="end">
                  {yMax.toFixed(2)}
                </text>
              </svg>
            )}

            {/* Floating Live Coordinates HUD */}
            {hoverCoord && (
              <div className="absolute top-3 right-3 bg-slate-900/90 border border-slate-700/80 rounded-md px-3 py-1.5 text-xs font-mono text-slate-200 shadow-md">
                <span className="text-slate-400">x: </span>
                <span className="text-emerald-400 font-semibold">{hoverCoord.x.toFixed(4)}</span>
                <span className="text-slate-400 ml-2.5">y: </span>
                <span className="text-cyan-400 font-semibold">{hoverCoord.y.toFixed(4)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Info Column: Mathematical Properties (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
            <h3 className="text-xs font-semibold text-slate-200 font-mono uppercase tracking-wider mb-3 pb-2 border-b border-slate-800">
              Analytical Summary
            </h3>

            <div className="space-y-3 text-xs font-mono">
              <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Domain Bounds:</span>
                <span className="text-slate-200">[{xMin}, {xMax}]</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Range Extrema:</span>
                <span className="text-emerald-400 tabular-nums">
                  [{plotData?.yMin ?? '—'}, {plotData?.yMax ?? '—'}]
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Computed Samples:</span>
                <span className="text-slate-200 tabular-nums">{validPoints.length} valid</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Detected Zeros / Roots:</span>
                <span className="text-cyan-400 tabular-nums font-semibold">
                  {plotData?.roots.length || 0}
                </span>
              </div>
            </div>

            {/* List of Detected Roots */}
            {plotData?.roots && plotData.roots.length > 0 && (
              <div className="mt-4 pt-3 border-t border-slate-800">
                <span className="text-[11px] text-slate-400 font-mono uppercase font-semibold block mb-2">
                  Zero Intercepts (x):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {plotData.roots.map((r, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 bg-cyan-950/40 text-cyan-300 border border-cyan-800/40 rounded text-xs font-mono"
                    >
                      x ≈ {r}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sampled Point Table Preview */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm text-xs font-mono flex-1">
            <div className="flex items-center justify-between text-slate-300 font-semibold mb-2">
              <span>Sample Points</span>
              <span className="text-slate-500 text-[11px]">{validPoints.length} points</span>
            </div>
            <div className="max-h-[200px] overflow-y-auto space-y-1">
              <div className="grid grid-cols-2 text-slate-500 font-semibold pb-1 border-b border-slate-800 text-[11px]">
                <span>x</span>
                <span className="text-right">y = f(x)</span>
              </div>
              {validPoints.slice(0, 40).map((pt, i) => (
                <div key={i} className="grid grid-cols-2 text-slate-400 hover:text-slate-200 py-0.5">
                  <span className="tabular-nums">{pt.x}</span>
                  <span className="text-right text-emerald-400 tabular-nums">{pt.y}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
