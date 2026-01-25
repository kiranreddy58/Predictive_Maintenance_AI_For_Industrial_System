import React from 'react';
import { Activity } from 'lucide-react';
import './DashboardHeader.css';

export default function DashboardHeader() {
    return (
        <header className="dashboard-header">
            <div className="brand-section">
                <Activity className="brand-icon" size={32} />
                <h1 className="brand-title">Predictive Maintenance Console</h1>
            </div>
            <div className="system-status">
                <span className="status-indicator"></span>
                <span>System Status:</span>
                <span className="status-text">ONLINE</span>
            </div>
        </header>
    );
}
