import React, { useState } from 'react';

export default function MaintenanceForm({ onSubmit, loading }) {
    const [formData, setFormData] = useState({
        Air_Temp: '298.0',
        Process_Temp: '308.0',
        Rot_Speed: '1500',
        Torque: '40.0',
        Tool_Wear: '0',
        Type: 'L'
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const payload = {
            Air_Temp: parseFloat(formData.Air_Temp),
            Process_Temp: parseFloat(formData.Process_Temp),
            Rot_Speed: parseInt(formData.Rot_Speed, 10),
            Torque: parseFloat(formData.Torque),
            Tool_Wear: parseInt(formData.Tool_Wear, 10),
            Type: formData.Type
        };
        onSubmit(payload);
    };

    return (
        <div className="sensor-form animate-fade-in">
            <div className="mb-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <span className="w-2 h-6 bg-blue-500 rounded-full"></span>
                    Sensor Inputs
                </h2>
                <p className="text-sm text-slate-400 mt-1 ml-4">Configure current operating parameters</p>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="sensor-grid">
                    <InputGroup label="Air Temp [K]" name="Air_Temp" value={formData.Air_Temp} onChange={handleChange} step="0.1" />
                    <InputGroup label="Process Temp [K]" name="Process_Temp" value={formData.Process_Temp} onChange={handleChange} step="0.1" />
                    <InputGroup label="Speed [RPM]" name="Rot_Speed" value={formData.Rot_Speed} onChange={handleChange} />
                    <InputGroup label="Torque [Nm]" name="Torque" value={formData.Torque} onChange={handleChange} step="0.1" />
                    <InputGroup label="Tool Wear [min]" name="Tool_Wear" value={formData.Tool_Wear} onChange={handleChange} />

                    <div className="input-group">
                        <label className="input-label">Machine Type</label>
                        <select
                            name="Type" value={formData.Type} onChange={handleChange}
                            className="sensor-input" style={{ height: '48px' }}
                        >
                            <option value="L">Type L (Standard)</option>
                            <option value="M">Type M (Premium)</option>
                            <option value="H">Type H (Heavy Duty)</option>
                        </select>
                    </div>
                </div>

                <button type="submit" disabled={loading} className="analyze-btn">
                    {loading ? 'Processing Physics Model...' : 'Run Failure Prediction'}
                </button>
            </form>
        </div>
    );
}

function InputGroup({ label, name, value, onChange, step }) {
    return (
        <div className="input-group">
            <label className="input-label">{label}</label>
            <input
                type="number" step={step} name={name}
                value={value} onChange={onChange} required
                className="sensor-input"
            />
        </div>
    )
}
