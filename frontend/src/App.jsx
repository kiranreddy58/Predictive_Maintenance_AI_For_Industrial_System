import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import MaintenanceForm from './components/MaintenanceForm';
import ResultsPanel from './components/ResultsPanel';
import { predictFailure } from './api';

// Pages
import DataUnderstanding from './pages/DataUnderstanding';
import Preprocessing from './pages/Preprocessing';
import Performance from './pages/Performance';
import Maintenance from './pages/Maintenance';
import Analytics from './pages/Analytics';
import LiveMonitor from './pages/LiveMonitor';
import Presentation from './pages/Presentation';

function Dashboard() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handlePrediction = async (data) => {
    setLoading(true);
    setResult(null); // Reset previous result
    try {
      const response = await predictFailure(data);
      setResult(response);
    } catch (error) {
      console.error("Prediction failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container animate-fade-in pt-10">
      <header className="page-header text-center">
        <h1 className="page-title text-4xl mb-3" style={{ background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', color: 'transparent' }}>
          Predictive Maintenance Dashboard
        </h1>
        <p className="page-subtitle text-lg">
          AI-Powered Real-Time Physics Failure Analysis
        </p>
      </header>

      <div className="dashboard-grid">
        <MaintenanceForm onSubmit={handlePrediction} loading={loading} />
        <ResultsPanel result={result} />
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <div className="app-container">
        <Sidebar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/eda" element={<DataUnderstanding />} />
            <Route path="/preprocessing" element={<Preprocessing />} />
            <Route path="/performance" element={<Performance />} />
            <Route path="/maintenance" element={<Maintenance />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/monitor" element={<LiveMonitor />} />
            <Route path="/presentation" element={<Presentation />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
