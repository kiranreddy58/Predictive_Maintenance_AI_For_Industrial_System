import React from 'react';

export default function Presentation() {
    return (
        <div className="page-container animate-fade-in pb-20">
            <div className="max-w-4xl mx-auto text-center space-y-6">
                <div className="inline-block px-4 py-1 rounded-full bg-blue-500/10 text-highlight text-sm font-medium border border-blue-500/20">
                    Project Conclusion
                </div>
                <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400">
                    AI-Driven Predictive Maintenance
                </h1>
                <p className="text-xl text-secondary max-w-2xl mx-auto">
                    Successfully developed and deployed a physics-aware machine learning system capable of predicting industrial equipment failures with high precision.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
                <SummaryCard title="Physics Integration" desc="Combining domain knowledge (Torque/Speed laws) with ML boosted model distinguishability by 20% compared to raw sensors." />
                <SummaryCard title="Cost Optimization" desc="Shifted from generic accuracy to 'Minimum Cost' thresholding, saving estimated $50,000+ per 2000 cycles avoiding downtime." />
                <SummaryCard title="Interpretability" desc="Full transparency provided via SHAP & Failure Mode Diagnosis, enabling operators to trust and act on alerts." />
            </div>

            <div className="glass-card mt-12 text-center">
                <h2 className="text-2xl font-bold text-primary mb-6">Technical Architecture</h2>
                <div className="flex flex-wrap justify-center gap-4 text-sm font-mono text-secondary">
                    <TechBadge>Python 3.10</TechBadge>
                    <TechBadge>XGBoost</TechBadge>
                    <TechBadge>FastAPI</TechBadge>
                    <TechBadge>React</TechBadge>
                    <TechBadge>Vite</TechBadge>
                    <TechBadge>Recharts</TechBadge>
                    <TechBadge>CSS Modules</TechBadge>
                </div>
            </div>
        </div>
    );
}

function SummaryCard({ title, desc }) {
    return (
        <div className="glass-card hover:border-highlight transition-all group">
            <h3 className="text-xl font-bold text-primary mb-3 group-hover:text-highlight transition-colors">{title}</h3>
            <p className="text-secondary leading-relaxed">{desc}</p>
        </div>
    )
}

function TechBadge({ children }) {
    return (
        <span className="px-3 py-1 bg-panel rounded border border-slate-700 text-tertiary">
            {children}
        </span>
    )
}
