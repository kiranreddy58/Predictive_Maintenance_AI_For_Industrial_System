# Industrial Predictive Maintenance AI System

[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Scikit-Learn](https://img.shields.io/badge/scikit_learn-F7931E?style=for-the-badge&logo=scikit-learn&logoColor=white)](https://scikit-learn.org/)
[![XGBoost](https://img.shields.io/badge/XGBoost-1b1b1b?style=for-the-badge)](https://xgboost.ai/)
[![Render](https://img.shields.io/badge/Render-46E3B7?style=for-the-badge&logo=render&logoColor=white)](https://render.com/)

An end-to-end intelligent monitoring system that predicts industrial machinery failures before they occur. The project leverages physics-aware feature engineering, cost-optimized classification, and explainable AI (SHAP) to provide actionable insights.

---

## 🚀 Key Features

- **Binary Prediction**: Detects imminent machine failure with high precision.
- **Multiclass Diagnosis**: Identifies the specific failure mode (Tool Wear, Power, Heat, Overstrain).
- **Physics-Aware Features**: Custom engineered interaction terms like *Mechanical Power* and *Wear-Strain*.
- **Real-Time Simulation**: Endpoint to simulate live sensor data influx.
- **Interactive Dashboard**: Full React-based dashboard for performance metrics and real-time alerts.
- **Explainable AI**: Global feature importance calculated via **SHAP**.

## 📊 Performance Metrics

Based on the AI4I 2020 dataset (10,000 samples):

| Metric | Score | Note |
| :--- | :--- | :--- |
| **Accuracy** | **98.05%** | Highly reliable prediction foundation |
| **F1-Score** | **0.74** | Robust balance in imbalanced scenarios |
| **ROC-AUC** | **0.97** | Exceptional class separation capability |
| **Recall** | **80.88%** | Minimized catastrophic missed failures |
| **Precision** | **67.90%** | Focused on high-confidence interventions |

## 🛠️ Tech Stack

- **Backend**: Python, FastAPI, Joblib, Scikit-learn, XGBoost, SMOTE (imbalanced-learn).
- **Frontend**: React 19, Vite, Recharts, Tailwind CSS, Framer Motion.
- **Deployment**: Configured for **Render** (Infrastructure as Code via `render.yaml`).

## 🧠 Model Architecture

1. **Preprocessing**: 
   - Standard scaling for sensor inputs.
   - SMOTE (Synthetic Minority Over-sampling Technique) to handle the 3.4% failure class imbalance.
2. **Primary Model**: 
   - XGBoost Classifier optimized via threshold moving to minimize cost (FN cost = 1000, FP cost = 100).
3. **Diagnostic Model**: 
   - Random Forest Classifier for per-mode failure classification.
4. **Interpretability**: 
   - SHAP Global Importance analysis (Primary drivers: Tool Wear, Rotational Speed).

## 📂 Project Structure

```text
├── backend/            # FastAPI Application
│   ├── main.py         # API Endpoints & Logic
│   └── requirements.txt # Python Dependencies
├── frontend/           # React + Vite Dashboard
│   ├── src/            # Components & Hooks
│   └── package.json    # Frontend Dependencies
├── ai4i2020.csv        # Dataset
├── model_ai4i.joblib   # Trained XGBoost Model
├── model_config_ai4i.json # Threshold & Metadata
├── render.yaml         # One-click Render Deployment
└── README.md           # This file
```

## ⚙️ Installation & Setup

### Prerequisites
- Python 3.10+
- Node.js & npm

### Backend Setup
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## 🌐 Deployment

This project is ready for one-click deployment on **Render**:
1. Push your code to a GitHub repository.
2. In the Render Dashboard, select **New + Blueprint**.
3. Connect your repository.
4. Render will automatically configure the Backend Service and Frontend Static Site using the `render.yaml` file.

---

## 📜 License
This project is for educational/resume purposes based on the AI4I 2020 Predictive Maintenance Dataset.
