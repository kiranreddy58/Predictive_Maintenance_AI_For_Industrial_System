import React, { useState, useEffect } from 'react';
import { Sliders, RefreshCw, ArrowRight } from 'lucide-react';
import axios from 'axios';

export default function WhatIfSimulator() {
    const [inputs, setInputs] = useState({
        Air_Temp: 300,
        Process_Temp: 310,
        Rot_Speed: 1500,
        Torque: 40,
        Tool_Wear: 100,
        Type: 'M'
    });
    const [prediction, setPrediction] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setInputs(prev => ({
            ...prev,
            [name]: name === 'Type' ? value : parseFloat(value)
        }));
    };

    const simulate = async () => {
        setLoading(true);
        try {
            const res = await axios.post('http://localhost:8000/predict', inputs);
            setPrediction(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Auto-simulate on debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            simulate();
        }, 500);
        return () => clearTimeout(timer);
    }, [inputs]);

    return (
        <div className="glass-card col-span-1 lg:col-span-3">
            <h3 className="card-title text-highlight"><Sliders className="mr-2" /> Decision Support: What-If Analysis</h3>
            <p className="text-secondary text-sm mb-6">Interactive Physics Simulator. Adjust operating parameters to observe impact on failure risk.</p>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Controls */}
                <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Control label="Torque (Nm)" name="Torque" value={inputs.Torque} min={0} max={100} onChange={handleChange} />
                    <Control label="Rotational Speed (RPM)" name="Rot_Speed" value={inputs.Rot_Speed} min={1000} max={3000} onChange={handleChange} />
                    <Control label="Tool Wear (min)" name="Tool_Wear" value={inputs.Tool_Wear} min={0} max={300} onChange={handleChange} />
                    <Control label="Process Temp (K)" name="Process_Temp" value={inputs.Process_Temp} min={300} max={320} onChange={handleChange} />
                </div>

                {/* Outcome */}
                <div className="bg-panel/50 p-6 rounded-xl border border-white/10 flex flex-col items-center justify-center text-center">
                    <div className="text-sm text-secondary mb-2">PREDICTED RISK</div>
                    {loading ? (
                        <RefreshCw className="animate-spin text-primary" size={32} />
                    ) : prediction ? (
                        <>
                            <div className={`text-4xl font-bold mb-2 ${prediction.probability > 0.5 ? 'text-critical' : 'text-success'}`}>
                                {(prediction.probability * 100).toFixed(1)}%
                            </div>
                            <div className={`text-xs px-2 py-1 rounded bg-white/10 ${prediction.probability > 0.5 ? 'text-critical' : 'text-success'}`}>
                                {prediction.risk_level}
                            </div>
                            {prediction.diagnosed_failure_mode && prediction.diagnosed_failure_mode !== 'N/A' && (
                                <div className="mt-4 text-xs text-red-400">
                                    Likely Mode: {prediction.diagnosed_failure_mode}
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="text-secondary">Adjust sliders to simulate...</div>
                    )}
                </div>
            </div>
        </div>
    );
}

function Control({ label, name, value, min, max, onChange }) {
    return (
        <div>
            <div className="flex justify-between text-xs text-secondary mb-1">
                <span>{label}</span>
                <span>{value}</span>
            </div>
            <input
                type="range"
                name={name}
                min={min}
                max={max}
                step={name === 'Torque' ? 0.1 : 1}
                value={value}
                onChange={onChange}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
        </div>
    );
}
