import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { DollarSign, AlertOctagon } from 'lucide-react';

export default function Maintenance() {
    const [perf, setPerf] = useState(null);

    useEffect(() => {
        axios.get('http://localhost:8000/analysis/performance').then(res => setPerf(res.data));
    }, []);

    if (!perf) return <div className="page-container" style={{ padding: '4rem', color: 'var(--text-tertiary)' }}>Loading Maintenance Data...</div>;

    const cm = perf.confusion_matrix;
    // Costs
    const costFN = cm.FN * 1000;
    const costFP = cm.FP * 100;
    const costTP = cm.TP * 100;
    const totalCost = costFN + costFP + costTP;

    // Baseline (Run to failure)
    const totalFailures = cm.TP + cm.FN;
    const baselineCost = totalFailures * 1000;
    const savings = baselineCost - totalCost;

    const costData = [
        { name: 'Missed Failures (FN)', value: costFN, color: '#ef4444' },
        { name: 'False Alarms (FP)', value: costFP, color: '#f59e0b' },
        { name: 'Proactive Fixes (TP)', value: costTP, color: '#3b82f6' }
    ];

    return (
        <div className="page-container animate-fade-in">
            <header className="page-header">
                <h1 className="page-title">D. Maintenance & Cost Analysis</h1>
                <p className="page-subtitle">Business Impact & Operational Diagnostics</p>
            </header>

            <div className="content-grid">
                {/* Cost Dashboard */}
                <div className="glass-card">
                    <h3 className="card-title text-primary">
                        <DollarSign /> Cost Impact Model
                    </h3>

                    <div className="flex flex-col md:flex-row items-center gap-8">
                        <div className="h-64 w-64 relative">
                            <ResponsiveContainer>
                                <PieChart>
                                    <Pie data={costData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                        {costData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(val) => `$${val.toLocaleString()}`} contentStyle={{ background: 'var(--bg-panel)', border: 'var(--glass-border)', color: 'var(--text-primary)' }} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="text-center">
                                    <div className="text-xs text-secondary">Total</div>
                                    <div className="text-lg font-bold text-primary">${totalCost.toLocaleString()}</div>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 space-y-4 w-full">
                            <CostRow label="Missed Failures (Risk)" value={costFN} color="text-critical" />
                            <CostRow label="False Alarms (Waste)" value={costFP} color="text-warning" />
                            <CostRow label="Maintenance Actions" value={costTP} color="text-highlight" />

                            <div className="mt-6 pt-6 border-t border-slate-700">
                                <div className="text-sm text-secondary mb-1">Projected Savings vs Run-to-Failure</div>
                                <div className="text-3xl font-bold text-safe">+${savings.toLocaleString()}</div>
                                <div className="text-xs text-safe opacity-50 mt-1">ROI: {((savings / totalCost) * 100).toFixed(0)}%</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Diagnostics Explanation */}
                <div className="glass-card relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-32 bg-blue-500/5 blur-[100px] rounded-full pointer-events-none"></div>
                    <h3 className="card-title text-primary">
                        <AlertOctagon /> Incident Response Protocol
                    </h3>

                    <div className="space-y-6 relative z-10">
                        <ProtocolStep
                            risk="Low Risk (<50%)"
                            action="Standard Monitoring"
                            desc="Continue normal operations. Machine health requires no intervention."
                            color="border-l-4 border-green-500"
                        />
                        <ProtocolStep
                            risk="Warning (50-80%)"
                            action="Schedule Inspection"
                            desc="Flag for review during next shift. Check cooling metrics (Temp Diff)."
                            color="border-l-4 border-yellow-500"
                        />
                        <ProtocolStep
                            risk="Critical (>80%)"
                            action="Immediate Stop"
                            desc="Halt process immediately. Investigate diagnosed root cause (e.g. Overstrain)."
                            color="border-l-4 border-red-500"
                        />
                    </div>
                </div>
            </div>

            {/* Detailed Performance Metrics */}
            <div className="content-grid mt-8">

                {/* 1. Per-Type Performance */}
                <div className="glass-card">
                    <h3 className="card-title text-primary">Machine Type Reliability</h3>
                    <p className="text-secondary text-sm mb-4">Detection performance across machine quality grades.</p>
                    <div style={{ height: '300px', width: '100%' }}>
                        <ResponsiveContainer>
                            <BarChart data={perf ? Object.keys(perf.type_metrics).map(k => ({ name: 'Type ' + k, ...perf.type_metrics[k] })) : []}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                <XAxis dataKey="name" stroke="var(--text-tertiary)" />
                                <YAxis stroke="var(--text-tertiary)" domain={[0, 1]} />
                                <Tooltip contentStyle={{ background: 'var(--bg-panel)', border: 'var(--glass-border)', color: 'var(--text-primary)' }} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                                <Legend />
                                <Bar dataKey="recall" name="Recall (Safety)" fill="var(--accent-blue)" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="precision" name="Precision" fill="var(--text-tertiary)" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 2. Failure Mode Accuracy */}
                <div className="glass-card">
                    <h3 className="card-title text-highlight">Failure Mode Diagnosis</h3>
                    <p className="text-secondary text-sm mb-4">Accuracy in identifying specific root causes (TWF, HDF, etc.).</p>
                    <div style={{ height: '300px', width: '100%' }}>
                        <ResponsiveContainer>
                            <BarChart data={perf ? Object.keys(perf.mode_metrics).map(k => ({ name: k, ...perf.mode_metrics[k] })) : []} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                <XAxis type="number" domain={[0, 1]} stroke="var(--text-tertiary)" />
                                <YAxis dataKey="name" type="category" width={50} stroke="var(--text-tertiary)" />
                                <Tooltip contentStyle={{ background: 'var(--bg-panel)', border: 'var(--glass-border)', color: 'var(--text-primary)' }} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                                <Legend />
                                <Bar dataKey="f1" name="F1 Score" fill="var(--accent-purple)" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

            </div>
        </div>
    );
}

function CostRow({ label, value, color }) {
    return (
        <div className="flex justify-between items-center text-sm">
            <span className="text-secondary">{label}</span>
            <span className={`font-mono font-bold ${color}`}>${value.toLocaleString()}</span>
        </div>
    )
}

function ProtocolStep({ risk, action, desc, color }) {
    return (
        <div className={`p-4 rounded-r-lg ${color}`} style={{ background: 'rgba(30, 41, 59, 0.5)' }}>
            <div className="flex justify-between mb-1">
                <span className="font-bold text-primary">{risk}</span>
                <span className="text-xs uppercase tracking-wider font-semibold bg-panel px-2 py-0.5 rounded text-white">{action}</span>
            </div>
            <p className="text-sm text-secondary">{desc}</p>
        </div>
    )
}
