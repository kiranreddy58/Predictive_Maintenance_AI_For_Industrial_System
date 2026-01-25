import React from 'react';
import { NavLink } from 'react-router-dom';
import { BarChart2, Database, GitMerge, Activity, ShieldCheck, PieChart, Home, Brain } from 'lucide-react';

export default function Sidebar() {
    const navItems = [

        { to: "/", icon: Home, label: "Manual Prediction" },
        { to: "/eda", icon: BarChart2, label: "A. Data Analysis" },
        { to: "/preprocessing", icon: GitMerge, label: "B. Feature Eng." },
        { to: "/performance", icon: Activity, label: "C. Model Performance" },
        { to: "/maintenance", icon: ShieldCheck, label: "D. Maintenance" },
        { to: "/analytics", icon: Brain, label: "E. Advanced Analytics" },
        { to: "/presentation", icon: PieChart, label: "F. Technical Report" },
    ];

    return (
        <div className="sidebar">
            <div className="sidebar-header">
                <h1 className="brand-title">
                    AI4I Analytics
                </h1>
                <p className="brand-subtitle">Industrial Intelligence</p>
            </div>
            <nav className="nav-menu">
                {navItems.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                    >
                        <item.icon size={20} />
                        <span style={{ marginLeft: '0.75rem', fontWeight: 500, fontSize: '0.9rem' }}>{item.label}</span>
                    </NavLink>
                ))}
            </nav>
            <div className="sidebar-footer">
                v2.1.0 • Stable
            </div>
        </div>
    );
}
