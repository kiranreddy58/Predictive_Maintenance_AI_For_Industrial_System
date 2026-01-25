import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, Thermometer, Zap, AlertTriangle, CheckCircle } from 'lucide-react';

export default function LiveMonitor() {
    const [history, setHistory] = useState([]);
    const [current, setCurrent] = useState(null);
    const [status, setStatus] = useState("NORMAL");
    const intervalRef = useRef(null);

    const [error, setError] = useState(null);

    const fetchLive = async () => {
        try {
            const res = await axios.get('http://localhost:8000/simulate/live');
            const data = res.data;
            if (data.error) return;

            setCurrent(data);
            setHistory(prev => {
                const newHist = [...prev, { ...data.sensors, time: new Date().toLocaleTimeString(), probability: data.prediction.probability }];
                return newHist.slice(-20); // Keep last 20 points
            });
            setStatus(data.prediction.status);
            setError(null);
        } catch (err) {
            console.error("Poll error", err);
            setError("Backend request failed. Is the server running?");
        }
    };

    const [chartsReady, setChartsReady] = useState(false);

    useEffect(() => {
        fetchLive(); // Fetch immediately
        intervalRef.current = setInterval(fetchLive, 2000); // 2 sec polling
        return () => clearInterval(intervalRef.current);
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => setChartsReady(true), 1000);
        return () => clearTimeout(timer);
    }, []);

    if (error) return (
        <div className="page-container flex flex-col items-center justify-center h-[50vh]">
            <div className="text-critical text-xl font-bold mb-2">Connection Error</div>
            <p className="text-secondary mb-4">{error}</p>
            <div className="text-sm text-tertiary">Ensure 'python main.py' is running on port 8000</div>
        </div>
    );

    if (!current) return <div className="page-container">Initializing Sensor Stream...</div>;

    const riskColor = status === 'CRITICAL' ? 'var(--status-critical)' : (status === 'WARNING' ? 'var(--status-warning)' : 'var(--status-safe)');

    return (
        <div className="page-container animate-fade-in">
            <header className="page-header flex justify-between items-center">
                <div>
                    <h1 className="page-title">Live Sensor Monitor</h1>
                    <p className="page-subtitle">Real-time Telemetry & Failure Inference</p>
                </div>
                <div className="flex items-center gap-4 px-6 py-3 rounded-lg border border-white/10 glass-card">
                    <div className="text-right">
                        <div className="text-xs text-secondary">SYSTEM STATUS</div>
                        <div className="text-xl font-bold" style={{ color: riskColor }}>{status}</div>
                    </div>
                    {status === 'CRITICAL' ? <AlertTriangle size={32} color={riskColor} /> : <CheckCircle size={32} color={riskColor} />}
                </div>
            </header>

            <div className="content-grid">
                {/* Real-time Charts */}
                <div className="glass-card col-span-1 lg:col-span-2">
                    <h3 className="card-title"><Activity className="mr-2" /> Live Torque & RPM</h3>
                    <div style={{ height: '300px', width: '99%', minWidth: 0 }}>
                        {chartsReady && history.length > 0 && (
                            <ResponsiveContainer>
                                <LineChart data={history}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                    <XAxis dataKey="time" stroke="var(--text-tertiary)" tick={false} />
                                    <YAxis yAxisId="left" stroke="var(--accent-blue)" />
                                    <YAxis yAxisId="right" orientation="right" stroke="var(--accent-purple)" />
                                    <Tooltip contentStyle={{ background: 'var(--bg-panel)', border: 'var(--glass-border)', color: '#fff' }} />
                                    <Line yAxisId="left" type="monotone" dataKey="Torque" stroke="var(--accent-blue)" dot={false} strokeWidth={2} />
                                    <Line yAxisId="right" type="monotone" dataKey="Rot_Speed" stroke="var(--accent-purple)" dot={false} strokeWidth={2} />
                                </LineChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                <div className="glass-card">
                    <h3 className="card-title text-critical"><Zap className="mr-2" /> Failure Probability</h3>
                    <div className="flex items-center justify-center h-[300px]">
                        <div className="relative w-48 h-48 rounded-full border-8 border-slate-700 flex items-center justify-center">
                            <div className="absolute inset-0 rounded-full border-8 border-transparent border-t-red-500 transform transition-transform duration-500"
                                style={{ transform: `rotate(${current.prediction.probability * 360}deg)` }}></div>
                            <div className="text-center">
                                <div className="text-4xl font-bold text-white">{(current.prediction.probability * 100).toFixed(1)}%</div>
                                <div className="text-xs text-secondary mt-1">RISK LEVEL</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Metric Cards */}
                <div className="col-span-1 lg:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <MetricBox label="Air Temp" val={current.sensors.Air_Temp.toFixed(1) + " K"} icon={Thermometer} />
                    <MetricBox label="Process Temp" val={current.sensors.Process_Temp.toFixed(1) + " K"} icon={Thermometer} />
                    <MetricBox label="Torque" val={current.sensors.Torque.toFixed(1) + " Nm"} icon={Activity} />
                    <MetricBox label="Tool Wear" val={current.sensors.Tool_Wear + " min"} icon={Zap} />
                </div>
            </div>
        </div>
    );
}

function MetricBox({ label, val, icon: Icon }) {
    return (
        <div className="glass-card p-4 flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 rounded-lg text-blue-400"><Icon size={24} /></div>
            <div>
                <div className="text-sm text-secondary">{label}</div>
                <div className="text-xl font-bold text-primary">{val}</div>
            </div>
        </div>
    )
}
