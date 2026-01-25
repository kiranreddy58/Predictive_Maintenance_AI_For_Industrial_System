import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ScatterChart, Scatter, ZAxis } from 'recharts';

export default function DataUnderstanding() {
    const [data, setData] = useState(null);

    useEffect(() => {
        axios.get('http://localhost:8000/analysis/eda').then(res => setData(res.data));
    }, []);

    if (!data) return <div className="page-container" style={{ padding: '4rem', color: 'var(--text-tertiary)' }}>Loading Analysis Data...</div>;

    return (
        <div className="page-container animate-fade-in">
            <header className="page-header">
                <h1 className="page-title">A. Industrial Data Understanding</h1>
                <p className="page-subtitle">Deep Dive: Correlations, Distributions, and Failure Patterns</p>
            </header>

            {/* 1. Sensor Distributions (Histograms) */}
            <section className="mb-12">
                <h2 className="text-xl font-bold text-primary mb-6 border-l-4 border-blue-500 pl-4">1. Sensor Distributions</h2>
                <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
                    {Object.entries(data.histograms || {}).map(([sensor, hist]) => (
                        <div key={sensor} className="glass-card">
                            <div className="flex justify-between text-sm text-secondary mb-2">
                                <span className="font-semibold">{sensor}</span>
                                <span className="text-xs bg-panel px-2 py-0.5 rounded">Range: {Math.round(hist.edges[0])} - {Math.round(hist.edges[hist.edges.length - 1])}</span>
                            </div>
                            <div className="h-32 w-full">
                                <ResponsiveContainer>
                                    <BarChart data={hist.counts.map((c, i) => ({ val: c, idx: i }))}>
                                        <Bar dataKey="val" fill="var(--accent-blue)" radius={[2, 2, 0, 0]} />
                                        <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ background: 'var(--bg-panel)', border: 'var(--glass-border)', color: '#fff' }} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* 2. Correlation Heatmap */}
            <section className="mb-12">
                <h2 className="text-xl font-bold text-primary mb-6 border-l-4 border-purple-500 pl-4">2. Feature Correlations</h2>
                <div className="glass-card overflow-x-auto">
                    <CorrelationHeatmap matrix={data.correlations} />
                    <div className="mt-4 text-center text-sm text-secondary">
                        <span className="inline-block w-3 h-3 bg-blue-500 mr-2 rounded-full"></span>Positive Correlation
                        <span className="inline-block w-3 h-3 bg-red-500 ml-6 mr-2 rounded-full"></span>Negative Correlation
                    </div>
                </div>
            </section>

            {/* 3. Box Plots (Safe vs Fail) */}
            <section className="mb-12">
                <h2 className="text-xl font-bold text-primary mb-6 border-l-4 border-orange-500 pl-4">3. Failure Characteristics (Box Plots)</h2>
                <div className="content-grid">
                    {Object.entries(data.box_plots || {}).map(([feature, stats]) => (
                        <div key={feature} className="glass-card">
                            <h3 className="text-sm font-semibold text-secondary mb-4 text-center">{feature} Behavior</h3>
                            <div className="flex justify-around items-end h-48">
                                <BoxPlotColumn label="Safe" stats={stats['0']} color="var(--status-safe)" />
                                <BoxPlotColumn label="Failed" stats={stats['1']} color="var(--status-critical)" />
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* 4. Scatter Analysis */}
            <section className="mb-12">
                <h2 className="text-xl font-bold text-primary mb-6 border-l-4 border-cyan-500 pl-4">4. Operating Envelope</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="glass-card">
                        <h3 className="card-title">Torque vs Rotational Speed</h3>
                        <div className="h-80">
                            <ResponsiveContainer>
                                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                                    <XAxis type="number" dataKey="Rot_Speed" name="Speed" unit="RPM" stroke="var(--text-tertiary)" domain={['auto', 'auto']} />
                                    <YAxis type="number" dataKey="Torque" name="Torque" unit="Nm" stroke="var(--text-tertiary)" domain={['auto', 'auto']} />
                                    <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<CustomScatterTooltip />} />
                                    <Scatter name="Samples" data={data.scatter_data} fill="#8884d8">
                                        {data.scatter_data.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.Machine_Failure === 1 ? 'var(--status-critical)' : 'rgba(59, 130, 246, 0.5)'} />
                                        ))}
                                    </Scatter>
                                </ScatterChart>
                            </ResponsiveContainer>
                        </div>
                        <p className="text-xs text-center text-secondary mt-2">Red points indicate failures. Note the power boundary curve.</p>
                    </div>

                    <div className="glass-card">
                        <h3 className="card-title">Process vs Air Temperature</h3>
                        <div className="h-80">
                            <ResponsiveContainer>
                                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                                    <XAxis type="number" dataKey="Air_Temp" name="Air" unit="K" stroke="var(--text-tertiary)" domain={['auto', 'auto']} />
                                    <YAxis type="number" dataKey="Process_Temp" name="Process" unit="K" stroke="var(--text-tertiary)" domain={['auto', 'auto']} />
                                    <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<CustomScatterTooltip />} />
                                    <Scatter name="Samples" data={data.scatter_data} fill="#8884d8">
                                        {data.scatter_data.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.Machine_Failure === 1 ? 'var(--status-critical)' : 'rgba(16, 185, 129, 0.5)'} />
                                        ))}
                                    </Scatter>
                                </ScatterChart>
                            </ResponsiveContainer>
                        </div>
                        <p className="text-xs text-center text-secondary mt-2">Failures cluster in high-temperature differential zones.</p>
                    </div>
                </div>
            </section>

        </div>
    );
}

// Sub-components

function CorrelationHeatmap({ matrix }) {
    const features = Object.keys(matrix);
    return (
        <div style={{ display: 'grid', gridTemplateColumns: `auto repeat(${features.length}, 1fr)`, gap: '2px' }}>
            {/* Header Row */}
            <div className="p-2"></div>
            {features.map(f => (
                <div key={f} className="p-2 text-xs font-mono text-secondary rotate-45 origin-bottom-left translate-y-4">{f.substring(0, 8)}</div>
            ))}

            {/* Rows */}
            {features.map(row => (
                <React.Fragment key={row}>
                    <div className="p-2 text-xs font-mono text-secondary text-right pr-4">{row}</div>
                    {features.map(col => {
                        const val = matrix[row][col];
                        const bg = val > 0
                            ? `rgba(59, 130, 246, ${Math.abs(val)})`
                            : `rgba(239, 68, 68, ${Math.abs(val)})`;
                        return (
                            <div key={`${row}-${col}`} className="h-10 flex items-center justify-center text-xs text-white/90 font-mono transition-all hover:scale-125 hover:z-10 hover:shadow-lg rounded"
                                style={{ backgroundColor: bg }} title={`${row} vs ${col}: ${val.toFixed(2)}`}>
                                {Math.abs(val) > 0.3 ? val.toFixed(1) : ''}
                            </div>
                        )
                    })}
                </React.Fragment>
            ))}
        </div>
    )
}

function BoxPlotColumn({ label, stats, color }) {
    // Simple CSS Box Plot
    // We normalize height to a fixed range for visualization
    // This is purely visual/relative
    const range = stats.max - stats.min;
    const toPercent = (val) => ((val - stats.min) / range) * 100;

    // Actually, comparing two box plots requires same scale. 
    // This simple component might be misleading if scales differ. 
    // Ideally we pass global min/max. But for now let's just show text stats vividly.

    return (
        <div className="flex flex-col items-center">
            <div className="text-xs mb-2 font-bold" style={{ color: color }}>{label}</div>
            <div className="w-16 bg-panel border relative rounded h-32 text-[10px] text-secondary flex flex-col justify-between p-1" style={{ borderColor: color }}>
                <div className="w-full text-center border-b border-dashed border-slate-600">Max: {stats.max.toFixed(1)}</div>
                <div className="w-full bg-slate-700/50 flex-1 my-1 flex flex-col justify-center items-center border-y border-slate-500">
                    <div>Q3: {stats.q3.toFixed(1)}</div>
                    <div className="font-bold text-white">Med: {stats.median.toFixed(1)}</div>
                    <div>Q1: {stats.q1.toFixed(1)}</div>
                </div>
                <div className="w-full text-center border-t border-dashed border-slate-600">Min: {stats.min.toFixed(1)}</div>
            </div>
        </div>
    )
}

function CustomScatterTooltip({ active, payload }) {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="bg-slate-900 border border-slate-700 p-3 rounded shadow-xl text-xs">
                <p className="font-bold text-white mb-1">State: {data.Machine_Failure === 1 ? 'FAILURE' : 'Safe'}</p>
                <p className="text-slate-400">Speed: {data.Rot_Speed} RPM</p>
                <p className="text-slate-400">Torque: {data.Torque} Nm</p>
                <p className="text-slate-400">Temp Diff: {(data.Process_Temp - data.Air_Temp).toFixed(1)} K</p>
            </div>
        );
    }
    return null;
}
