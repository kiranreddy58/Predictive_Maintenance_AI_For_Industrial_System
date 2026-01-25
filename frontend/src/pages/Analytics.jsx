import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Brain, Activity } from 'lucide-react';
import WhatIfSimulator from '../components/WhatIfSimulator';

export default function Analytics() {
    const [perf, setPerf] = useState(null);
    const [chartsReady, setChartsReady] = useState(false);

    useEffect(() => {
        axios.get('http://localhost:8000/analysis/performance').then(res => setPerf(res.data));
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => setChartsReady(true), 1000);
        return () => clearTimeout(timer);
    }, []);

    if (!perf) return <div className="page-container">Loading Analytics...</div>;

    const comparison = perf.model_comparison || [];
    const pdp = perf.pdp || {};

    return (
        <div className="page-container animate-fade-in">
            <header className="page-header">
                <h1 className="page-title">E. Advanced Analytics</h1>
                <p className="page-subtitle">Model Benchmarking & Deep Interpretability</p>
            </header>

            <div className="content-grid">

                {/* 1. Model Comparison */}
                <div className="glass-card col-span-1 lg:col-span-2">
                    <h3 className="card-title text-primary"><Brain className="mr-2" /> Algorithm Benchmarking</h3>
                    <p className="text-secondary text-sm mb-4">Comparing production XGBoost against standard baselines.</p>
                    <div style={{ height: '300px', width: '99%', minWidth: 0 }}>
                        {chartsReady && comparison.length > 0 && (
                            <ResponsiveContainer>
                                <BarChart data={comparison}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                    <XAxis dataKey="name" stroke="var(--text-tertiary)" />
                                    <YAxis stroke="var(--text-tertiary)" domain={[0, 1]} />
                                    <Tooltip contentStyle={{ background: 'var(--bg-panel)', border: 'var(--glass-border)', color: 'var(--text-primary)' }} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                                    <Legend />
                                    <Bar dataKey="f1" name="F1 Score" fill="var(--accent-purple)" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="auc" name="ROC AUC" fill="var(--accent-blue)" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                {/* 2. Partial Dependence Plots */}
                <div className="glass-card col-span-1 lg:col-span-2">
                    <h3 className="card-title text-highlight"><Activity className="mr-2" /> Causal Impact (Partial Dependence)</h3>
                    <p className="text-secondary text-sm mb-4">Marginal effect of key physics variables on failure probability.</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Object.keys(pdp).map(feature => (
                            <div key={feature} className="bg-panel/50 p-4 rounded-lg border border-white/5">
                                <h4 className="text-sm font-semibold text-primary mb-2 text-center">{feature} Impact</h4>
                                <div style={{ height: '200px', width: '99%', minWidth: 0 }}>
                                    {chartsReady && pdp[feature] && pdp[feature].x && (
                                        <ResponsiveContainer>
                                            <LineChart data={pdp[feature].x.map((x, i) => ({ x, y: pdp[feature].y[i] }))}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                                <XAxis dataKey="x" type="number" stroke="var(--text-tertiary)" fontSize={10} tickFormatter={(val) => val.toFixed(1)} />
                                                <YAxis dataKey="y" stroke="var(--text-tertiary)" fontSize={10} />
                                                <Tooltip labelFormatter={(val) => `${feature}: ${val.toFixed(2)}`} formatter={(val) => val.toFixed(4)} contentStyle={{ background: 'var(--bg-panel)', border: 'var(--glass-border)', color: 'var(--text-primary)' }} />
                                                <Line type="monotone" dataKey="y" stroke="var(--accent-orange)" strokeWidth={2} dot={false} />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 3. Decision Support Simulator */}
                <WhatIfSimulator />

            </div>
        </div>
    );
}
