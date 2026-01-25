import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { ArrowRight, Settings, Sliders, Layers, BarChart2, Activity, GitBranch } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Legend, LineChart, Line, ComposedChart } from 'recharts';

export default function Preprocessing() {
    const [data, setData] = useState(null);
    const [edu, setEdu] = useState(null);
    const [chartsReady, setChartsReady] = useState(false);

    useEffect(() => {
        axios.get('http://localhost:8000/analysis/preprocessing').then(res => setData(res.data));
        axios.get('http://localhost:8000/analysis/eda').then(res => setEdu(res.data));

        const timer = setTimeout(() => setChartsReady(true), 1000);
        return () => clearTimeout(timer);
    }, []);

    const smoteData = data ? [
        { name: 'Safe (Neg)', Original: data.original_counts['0'], Resampled: data.resampled_counts['0'] },
        { name: 'Fail (Pos)', Original: data.original_counts['1'], Resampled: data.resampled_counts['1'] }
    ] : [];

    // Prepare Split Stats
    const splitStats = edu && edu.split_stats ? Object.keys(edu.split_stats.train).map(k => ({
        name: k.replace('_0', ' Safe').replace('_1', ' Fail'),
        Train: edu.split_stats.train[k],
        Test: edu.split_stats.test[k]
    })) : [];

    return (
        <div className="page-container animate-fade-in">
            <header className="page-header">
                <h1 className="page-title">B. Advanced Feature Engineering</h1>
                <p className="page-subtitle">From Raw Signals to Predictive Insights</p>
            </header>

            <div className="content-grid">

                {/* LEFT COLUMN */}
                <div className="space-y-8">

                    {/* 1. Splitting Strategy */}
                    <div className="glass-card">
                        <h3 className="card-title text-safe"><GitBranch className="mr-2" /> Stratified Data Splitting</h3>
                        <p className="text-secondary text-sm mb-4">
                            Ensuring representative sampling across both <strong>Machine Type</strong> (L/M/H) and <strong>Failure Status</strong>.
                        </p>
                        <div style={{ height: '250px', width: '100%', minWidth: 0 }}>
                            {chartsReady && (
                                <ResponsiveContainer>
                                    <BarChart data={splitStats} layout="vertical">
                                        <XAxis type="number" stroke="var(--text-tertiary)" />
                                        <YAxis dataKey="name" type="category" width={80} stroke="var(--text-secondary)" tick={{ fontSize: 10 }} />
                                        <Tooltip contentStyle={{ background: 'var(--bg-panel)', border: 'var(--glass-border)', color: '#fff' }} />
                                        <Legend />
                                        <Bar dataKey="Train" stackId="a" fill="var(--accent-blue)" />
                                        <Bar dataKey="Test" stackId="a" fill="var(--accent-purple)" />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>

                    {/* 2. SMOTE */}
                    <div className="glass-card">
                        <h3 className="card-title text-warning"><Sliders className="mr-2" /> Handling Imbalance (SMOTE)</h3>
                        <div style={{ height: '200px', width: '100%', minWidth: 0 }}>
                            {chartsReady && (
                                <ResponsiveContainer>
                                    <BarChart data={smoteData}>
                                        <XAxis dataKey="name" stroke="var(--text-tertiary)" />
                                        <YAxis stroke="var(--text-tertiary)" />
                                        <Tooltip contentStyle={{ background: 'var(--bg-panel)', border: 'var(--glass-border)', color: '#fff' }} />
                                        <Legend />
                                        <Bar dataKey="Original" fill="var(--text-tertiary)" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="Resampled" fill="var(--accent-cyan)" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                        <p className="text-secondary text-xs mt-2 text-center opacity-70">Synthetic Minority Over-sampling Technique applied to Training set.</p>
                    </div>

                </div>

                {/* RIGHT COLUMN */}
                <div className="space-y-8">

                    {/* 3. Physics Features (Interactions) */}
                    <div className="glass-card">
                        <h3 className="card-title text-highlight">Signal Interaction Features</h3>
                        <div className="space-y-3">
                            <FeatureRow name="Power [W]" eq="Torque × Rot_Speed" desc="Mechanical Work Rate" />
                            <FeatureRow name="Wear Strain" eq="Tool_Wear × Torque" desc="Cumulative Stress Load" />
                            <FeatureRow name="Temp Diff" eq="Process - Air Temp" desc="Heat Dissipation Capacity" />
                        </div>
                    </div>

                    {/* 4. Time Series Aggregation (Rolling) */}
                    <div className="glass-card">
                        <h3 className="card-title text-primary"><Activity className="mr-2" /> Time-Based Aggregation</h3>
                        <p className="text-secondary text-sm mb-4">
                            <strong>Rolling Means</strong> (Window=50) smooth out sensor noise to reveal underlying trends.
                        </p>
                        {edu && edu.time_series_data && (
                            <div style={{ height: '250px', width: '100%', minWidth: 0 }}>
                                {chartsReady && (
                                    <ResponsiveContainer>
                                        <ComposedChart data={edu.time_series_data}>
                                            <XAxis dataKey="UDI" stroke="var(--text-tertiary)" tick={false} />
                                            <YAxis stroke="var(--text-tertiary)" domain={['auto', 'auto']} />
                                            <Tooltip contentStyle={{ background: 'var(--bg-panel)', border: 'var(--glass-border)', color: '#fff' }} />
                                            <Legend />
                                            <Line type="monotone" dataKey="Torque" stroke="var(--text-tertiary)" strokeOpacity={0.5} dot={false} strokeWidth={1} name="Raw Torque" />
                                            <Line type="monotone" dataKey="Rolling_Torque" stroke="var(--accent-orange)" dot={false} strokeWidth={3} name="Rolling Mean (50)" />
                                        </ComposedChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="glass-card bg-blue-900/10 border-blue-500/20">
                        <h4 className="font-bold text-blue-400 mb-2">Statistical Features (Torque)</h4>
                        <div className="flex flex-wrap gap-4">
                            {edu && edu.statistical_features ? (
                                <>
                                    <StatBadge label="Skewness" value={edu.statistical_features.Torque.skew.toFixed(3)} />
                                    <StatBadge label="Kurtosis" value={edu.statistical_features.Torque.kurtosis.toFixed(3)} />
                                    <StatBadge label="Speed Skew" value={edu.statistical_features.Rot_Speed.skew.toFixed(3)} />
                                </>
                            ) : (
                                <span className="text-secondary text-xs">Loading stats...</span>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}

function StatBadge({ label, value }) {
    return (
        <div className="flex flex-col bg-panel px-3 py-2 rounded border border-slate-700">
            <span className="text-[10px] text-tertiary uppercase">{label}</span>
            <span className="text-sm font-mono text-primary">{value}</span>
        </div>
    )
}

function FeatureRow({ name, eq, desc }) {
    return (
        <div className="flex items-center justify-between p-3 rounded bg-panel border border-slate-700">
            <div>
                <div className="font-bold text-sm text-primary">{name}</div>
                <div className="text-xs text-secondary">{desc}</div>
            </div>
            <div className="font-mono text-xs text-accent-cyan bg-slate-900 px-2 py-1 rounded">
                {eq}
            </div>
        </div>
    )
}
