import React from 'react';
import { AlertTriangle, CheckCircle, ShieldAlert, Zap, Thermometer, Activity, Wrench } from 'lucide-react';

export default function ResultsPanel({ result }) {
    if (!result) return (
        <div className="results-panel justify-center items-center opacity-50">
            <Activity size={48} className="text-blue-400 mb-4 animate-pulse" />
            <p className="text-slate-400 font-medium">Waiting for telemetry data...</p>
        </div>
    );

    const isSafe = result.risk_level === 'SAFE';
    const isCritical = result.risk_level === 'CRITICAL';

    const statusClass = isSafe ? 'status-safe' : isCritical ? 'status-critical' : 'status-warning';
    const Icon = isSafe ? CheckCircle : isCritical ? ShieldAlert : AlertTriangle;

    return (
        <div className={`results-panel animate-fade-in ${isCritical ? 'border-red-500/30 shadow-[0_0_30px_rgba(239,68,68,0.15)]' : ''}`}>
            <div className="results-header">
                <h2 className="text-xl font-bold text-white">Diagnostic Report</h2>
                <span className={`status-badge ${statusClass}`}>
                    {result.risk_level} OP
                </span>
            </div>

            <div className="results-content">
                <div className={`p-4 rounded-full mb-4 ${isSafe ? 'bg-green-500/10 text-green-400' : isCritical ? 'bg-red-500/10 text-red-500' : 'bg-orange-500/10 text-orange-400'}`}>
                    <Icon size={64} />
                </div>

                <h3 className="risk-percentage">
                    {(result.probability * 100).toFixed(1)}<span className="text-2xl">%</span>
                </h3>
                <p className="text-sm text-slate-400 uppercase tracking-widest font-semibold mb-2">Failure Probability</p>

                {/* Failure Mode Display */}
                {result.diagnosed_failure_mode && !isSafe && (
                    <div className={`diagnosis-box ${isCritical ? 'border-red-500/30 text-red-200' : ''}`}>
                        <Wrench size={18} />
                        <span>Root Cause: <strong className="text-white">{result.diagnosed_failure_mode}</strong></span>
                    </div>
                )}

                <p className="text-slate-400 mt-4 max-w-xs leading-relaxed">{result.message}</p>
            </div>

            {result.physics_metrics && (
                <div className="physics-metrics">
                    <Metric icon={Zap} label="Power Output" value={result.physics_metrics.Power_Watts} unit="W" />
                    <Metric icon={Thermometer} label="Heat Diff" value={result.physics_metrics.Temp_Diff} unit="K" />
                    <Metric icon={Activity} label="Wear Strain" value={result.physics_metrics.Wear_Strain} unit=" units" />
                </div>
            )}
        </div>
    );
}

function Metric({ icon: Icon, label, value, unit }) {
    return (
        <div className="metric-item">
            <div className="metric-name flex justify-center items-center gap-1">
                <Icon size={12} /> {label}
            </div>
            <div className="metric-val">
                {value}<span className="metric-unit">{unit}</span>
            </div>
        </div>
    )
}
