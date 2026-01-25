import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';

export default function Performance() {
    const [perf, setPerf] = useState(null);
    const [imp, setImp] = useState(null);

    useEffect(() => {
        axios.get('http://localhost:8000/analysis/performance').then(res => setPerf(res.data));
        axios.get('http://localhost:8000/analysis/importance').then(res => setImp(res.data));
    }, []);

    if (!perf) return <div className="page-container" style={{ padding: '4rem', color: 'var(--text-tertiary)' }}>Loading Performance Metrics...</div>;

    // Prepare ROC Data
    const rocData = perf.roc_curve ? perf.roc_curve.fpr.map((f, i) => ({
        fpr: f,
        tpr: perf.roc_curve.tpr[i]
    })) : [];
    const displayRoc = rocData.filter((_, i) => i % 5 === 0);
    const cm = perf.confusion_matrix;

    // Prepare SHAP Data
    const shapData = imp ? Object.entries(imp).slice(0, 10).map(([k, v]) => ({ feature: k, importance: v })) : [];

    return (
        <div className="page-container animate-fade-in">
            <header className="page-header">
                <h1 className="page-title">C. Model Performance & Interpretability</h1>
                <p className="page-subtitle">Evaluation on Unseen Test Data</p>
            </header>

            {/* Hero Metrics */}
            <div className="stats-grid">
                <MetricCard label="Recall (Failures)" value={(perf.recall * 100).toFixed(1) + '%'} color="text-safe" />
                <MetricCard label="Precision" value={(perf.precision * 100).toFixed(1) + '%'} color="text-highlight" />
                <MetricCard label="ROC-AUC" value={perf.roc_auc.toFixed(3)} color="text-warning" />
                <MetricCard label="F1-Score" value={perf.f1.toFixed(3)} color="text-primary" />
            </div>

            <div className="content-grid">

                {/* Left Col: ROC & Matrix */}
                <div className="space-y-8">
                    <div className="glass-card">
                        <h3 className="card-title">ROC Curve</h3>
                        <div style={{ height: '300px', width: '100%' }}>
                            <ResponsiveContainer>
                                <AreaChart data={displayRoc}>
                                    <defs>
                                        <linearGradient id="colorRoc" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="var(--accent-purple)" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="var(--accent-purple)" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                    <XAxis dataKey="fpr" type="number" domain={[0, 1]} label={{ value: 'False Positive Rate', position: 'insideBottom', offset: -5 }} stroke="var(--text-tertiary)" />
                                    <YAxis dataKey="tpr" type="number" domain={[0, 1]} label={{ value: 'True Positive Rate', angle: -90, position: 'insideLeft' }} stroke="var(--text-tertiary)" />
                                    <Tooltip contentStyle={{ background: 'var(--bg-panel)', border: 'var(--glass-border)', color: 'var(--text-primary)' }} />
                                    <Area type="monotone" dataKey="tpr" stroke="var(--accent-purple)" fillOpacity={1} fill="url(#colorRoc)" strokeWidth={3} />
                                    <Area type="monotone" dataKey="fpr" stroke="var(--text-tertiary)" strokeDasharray="5 5" fill="none" strokeWidth={1} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="glass-card flex flex-col items-center justify-center">
                        <h3 className="card-title">Confusion Matrix</h3>
                        <div className="grid grid-cols-2 gap-2 text-center w-full max-w-sm">
                            <div className="p-4 rounded-lg border border-green-500/20 bg-green-500/10">
                                <div className="text-xs text-secondary uppercase">True Negatives</div>
                                <div className="text-2xl font-bold text-safe">{cm.TN}</div>
                            </div>
                            <div className="p-4 rounded-lg border border-yellow-500/20 bg-yellow-500/10">
                                <div className="text-xs text-secondary uppercase">False Positives</div>
                                <div className="text-2xl font-bold text-warning">{cm.FP}</div>
                            </div>
                            <div className="p-4 rounded-lg border border-red-500/20 bg-red-500/10">
                                <div className="text-xs text-secondary uppercase">False Negatives</div>
                                <div className="text-2xl font-bold text-critical">{cm.FN}</div>
                            </div>
                            <div className="p-4 rounded-lg border border-blue-500/20 bg-blue-500/10">
                                <div className="text-xs text-secondary uppercase">True Positives</div>
                                <div className="text-2xl font-bold text-highlight">{cm.TP}</div>
                            </div>
                        </div>
                    </div>
                </div>



                {/* Right Col: Feature Importance & Cost Analysis */}
                <div className="space-y-8">

                    {/* Strategy Explanation */}
                    <div className="glass-card bg-blue-900/10 border-blue-500/20">
                        <h3 className="card-title text-highlight">Optimization Strategy</h3>
                        <div className="text-sm text-secondary space-y-2">
                            <p><strong>1. Handling Imbalance:</strong> Applied <strong>SMOTE</strong> (Synthetic Minority Over-sampling) to training data to teach the model failure patterns effectively.</p>
                            <p><strong>2. Cost-Sensitive Thresholding:</strong> Standard 0.5 threshold is suboptimal for industrial safety. We optimized the decision boundary to minimize total financial risk.</p>
                        </div>
                    </div>

                    {/* Cost Curve */}
                    <div className="glass-card">
                        <h3 className="card-title">Threshold Optimization</h3>
                        <div style={{ height: '200px', width: '100%' }}>
                            <ResponsiveContainer>
                                <AreaChart data={perf.cost_curve ? perf.cost_curve.thresholds.map((t, i) => ({ t, cost: perf.cost_curve.costs[i] })) : []}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                    <XAxis dataKey="t" type="number" domain={[0, 1]} label={{ value: 'Decision Threshold', position: 'insideBottom', offset: -5 }} stroke="var(--text-tertiary)" />
                                    <YAxis dataKey="cost" stroke="var(--text-tertiary)" />
                                    <Tooltip contentStyle={{ background: 'var(--bg-panel)', border: 'var(--glass-border)', color: 'var(--text-primary)' }} />
                                    <Area type="monotone" dataKey="cost" stroke="var(--accent-orange)" fill="url(#colorCost)" fillOpacity={0.2} strokeWidth={2} name="Total Cost" />
                                    <defs>
                                        <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="var(--accent-orange)" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="var(--accent-orange)" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                        <p className="text-secondary text-xs mt-2 text-center">
                            Optimal Threshold: <strong>{perf.optimized_threshold.toFixed(2)}</strong> (Minimizes impact of missed failures)
                        </p>
                    </div>

                    <div className="glass-card">
                        <h3 className="card-title">Global Feature Importance (SHAP)</h3>
                        <div style={{ height: '500px', width: '100%' }}>
                            <ResponsiveContainer>
                                <BarChart data={shapData} layout="vertical" margin={{ left: 40, bottom: 20 }}>
                                    <XAxis type="number" stroke="var(--text-tertiary)" />
                                    <YAxis dataKey="feature" type="category" width={100} stroke="var(--text-primary)" tick={{ fontSize: 11 }} />
                                    <Tooltip contentStyle={{ background: 'var(--bg-panel)', border: 'var(--glass-border)', color: '#fff' }} />
                                    <Bar dataKey="importance" fill="var(--accent-cyan)" radius={[0, 4, 4, 0]}>
                                        {shapData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={index < 3 ? 'var(--accent-cyan)' : 'var(--text-tertiary)'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

            </div>
        </div >
    );
}

function MetricCard({ label, value, color }) {
    return (
        <div className="stat-card text-center">
            <div className="stat-label mb-2">{label}</div>
            <div className={`text-3xl font-bold ${color}`}>{value}</div>
        </div>
    )
}
