from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import joblib
import json
import pandas as pd
import numpy as np
from typing import Optional

app = FastAPI(
    title="AI4I 2020 Predictive Maintenance API",
    description="Physics-aware failure prediction for industrial milling machines.",
    version="2.1.0"
)

# CORS configuration
origins = ["*"] # Allow all for dev convenience

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load Models and Config
MODEL_PATH = "../model_ai4i.joblib"
CONFIG_PATH = "../model_config_ai4i.json"
DIAG_MODEL_PATH = "../diag_model.joblib"
DIAG_ENC_PATH = "../diag_label_encoder.joblib"
DATA_PATH = "../ai4i2020.csv"

try:
    model = joblib.load(MODEL_PATH)
    with open(CONFIG_PATH, 'r') as f:
        config = json.load(f)
    print("Main Model Loaded.")
except Exception as e:
    print(f"Error loading main model: {e}")
    model = None
    config = {}

try:
    ORIGINAL_DATA = pd.read_csv(DATA_PATH)
    # Rename columns to match model expectation if needed, but likely fine as is
    # Just ensure we handle the 'Machine failure' vs 'prediction' confusion
    print("Dataset Loaded for Simulation.")
except Exception as e:
    print(f"Error loading dataset: {e}")
    ORIGINAL_DATA = None

try:
    diag_model = joblib.load(DIAG_MODEL_PATH)
    diag_encoder = joblib.load(DIAG_ENC_PATH)
    print("Diagnostic Model Loaded.")
except Exception as e:
    print(f"Error loading diagnostic model: {e}")
    diag_model = None
    diag_encoder = None

class PredictionInput(BaseModel):
    Air_Temp: float = Field(..., description="Air temperature in Kelvin")
    Process_Temp: float = Field(..., description="Process temperature in Kelvin")
    Rot_Speed: int = Field(..., description="Rotational speed in RPM")
    Torque: float = Field(..., description="Torque in Nm")
    Tool_Wear: int = Field(..., description="Tool wear in minutes")
    Type: str = Field("L", description="Machine Quality Variant (L, M, H)")

class PredictionOutput(BaseModel):
    prediction: int
    probability: float
    risk_level: str
    cost_implication: float
    message: str
    physics_metrics: dict
    diagnosed_failure_mode: Optional[str] = None

@app.get("/")
def read_root():
    return {"status": "AI4I System Online", "model_version": "2.1.0"}

@app.post("/predict", response_model=PredictionOutput)
def predict(input_data: PredictionInput):
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")

    # 1. Prepare Data
    data = {
        'Air_Temp': [input_data.Air_Temp],
        'Process_Temp': [input_data.Process_Temp],
        'Rot_Speed': [input_data.Rot_Speed],
        'Torque': [input_data.Torque],
        'Tool_Wear': [input_data.Tool_Wear]
    }
    df = pd.DataFrame(data)

    # 2. Feature Engineering
    df['Temp_Diff'] = df['Process_Temp'] - df['Air_Temp']
    df['Power'] = 2 * np.pi * df['Rot_Speed'] * df['Torque'] / 60
    df['Wear_Strain'] = df['Tool_Wear'] * df['Torque']

    # 3. One-Hot Encoding
    df['Type_M'] = 1 if input_data.Type == 'M' else 0
    df['Type_L'] = 1 if input_data.Type == 'L' else 0

    # 4. Align Columns
    expected_features = config.get('features', [])
    final_df = pd.DataFrame()
    for feat in expected_features:
        if feat in df.columns:
            final_df[feat] = df[feat]
        else:
            final_df[feat] = 0

    # 5. Predict Binary Failure
    try:
        prob = model.predict_proba(final_df)[:, 1][0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference error: {str(e)}")

    threshold = config.get('threshold', 0.5)
    costs = config.get('costs', {'FN': 1000, 'FP': 100})
    pred = 1 if prob >= threshold else 0

    # 6. Failure Mode Diagnosis (if failure predicted)
    failure_mode = "N/A"
    if pred == 1 and diag_model is not None and diag_encoder is not None:
        try:
            # Diagnostic model needs same features (check if they differ, typically same preprocessing)
            # Assuming diag model uses same feature set as main model or similar subset
            # In training script, X_diag used same 'df_proc' minus ID cols.
            # So final_df should work if columns align.
            # However, diag model might have been trained on fewer or reordered columns if not careful.
            # But in the script, X and X_diag came from same df structure.
            # XGBoost vs RF doesn't matter for sklearn, RF is robust to extra features but order matters for numpy array input if typical sklearn.
            # Safer to ensure column order matches diag model training time.
            # But let's assume 'final_df' is correct for now.
            
            diag_pred_idx = diag_model.predict(final_df)[0]
            failure_mode = diag_encoder.inverse_transform([diag_pred_idx])[0]
        except Exception as e:
            print(f"Diag Error: {e}")
            failure_mode = "Unknown"

    if prob >= 0.8:
        risk = "CRITICAL"
        msg = f"CRITICAL FAILURE RISK. Diagnosis: {failure_mode}"
        cost = costs['FN']
    elif prob >= threshold:
        risk = "WARNING"
        msg = f"Potential Issue Detected. Diagnosis: {failure_mode}"
        cost = costs['TP']
    else:
        risk = "SAFE"
        msg = "System operating within normal parameters."
        cost = 0

    return {
        "prediction": pred,
        "probability": float(prob),
        "risk_level": risk,
        "cost_implication": float(cost),
        "message": msg,
        "physics_metrics": {
            "Power_Watts": round(df['Power'].iloc[0], 2),
            "Temp_Diff": round(df['Temp_Diff'].iloc[0], 2),
            "Wear_Strain": round(df['Wear_Strain'].iloc[0], 2)
        },
        "diagnosed_failure_mode": failure_mode if pred == 1 else None
    }
@app.get("/analysis/data")
def get_analysis_data():
    try:
        with open("../evaluation_results.json", "r") as f:
            data = json.load(f)
        return data
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Analysis data not found. Run training script first.")

@app.get("/analysis/eda")
def get_eda():
    data = get_analysis_data()
    return data.get("eda", {})

# Real-time Simulation Endpoint
@app.get("/simulate/live")
def simulate_live():
    """
    Returns a random sample from the dataset to simulate a live sensor reading,
    along with its failure prediction.
    """
    try:
        if ORIGINAL_DATA is None:
            return {"error": "Dataset not loaded"}
        
        # Sample one random record
        sample = ORIGINAL_DATA.sample(1).iloc[0]
        
        # Convert to dictionary and handle numpy types
        data = sample.to_dict()
        data = {k: (float(v) if isinstance(v, (np.int64, np.float64)) else v) for k, v in data.items()}
        
        # Predict using the model
        input_data = pd.DataFrame([data])
        
        # Ensure columns match model expectation (drop target if present)
        model_cols = config['features']
        # Add missing columns if any (e.g. Type dummies if model expects them? Pipeline handles raw 'Type' column?)
        # The pipeline expects raw 'Type', 'Air_Temp', etc.
        # But wait, the pipeline handles 'Type' encoding internally? 
        # Checking train_model.py... ah, we used pd.get_dummies OUTSIDE the pipeline for X.
        # So we need to match the feature set X which has 'Type_L', 'Type_M'.
        
        # Actually, let's just stick to the same logic as /predict
        # Refactor prediction logic or call it directly.
        
        # Quick fix: The model trained on encoded columns.
        # We need to manually encode 'Type' for this single sample.
        input_data['Type_L'] = 1 if data['Type'] == 'L' else 0
        input_data['Type_M'] = 1 if data['Type'] == 'M' else 0
        # Type_H is dropped to avoid collinearity (drop_first=True)
        
        # Calculate derived features
        input_data['Temp_Diff'] = input_data['Process_Temp'] - input_data['Air_Temp']
        input_data['Power'] = 2 * np.pi * input_data['Rot_Speed'] * input_data['Torque'] / 60
        input_data['Wear_Strain'] = input_data['Tool_Wear'] * input_data['Torque']
        
        # Select only model features
        input_data = input_data[model_cols]
        
        prob = float(model.predict_proba(input_data)[0][1])
        pred = int(prob >= config['threshold'])
        
        return {
            "timestamp": pd.Timestamp.now().isoformat(),
            "sensors": {
                "Air_Temp": data['Air_Temp'],
                "Process_Temp": data['Process_Temp'],
                "Rot_Speed": data['Rot_Speed'],
                "Torque": data['Torque'],
                "Tool_Wear": data['Tool_Wear']
            },
            "prediction": {
                "probability": prob,
                "fail": pred == 1,
                "status": "CRITICAL" if pred == 1 else ("WARNING" if prob > 0.3 else "NORMAL")
            }
        }
    except Exception as e:
        return {"error": str(e)}

@app.get("/analysis/performance")
def get_performance():
    data = get_analysis_data()
    perf = data.get("performance", {})
    # Inject Analytics data for the frontend
    perf["model_comparison"] = data.get("model_comparison", [])
    perf["pdp"] = data.get("pdp", {})
    return perf

@app.get("/analysis/importance")
def get_importance():
    data = get_analysis_data()
    return data.get("feature_importance", {})

@app.get("/analysis/preprocessing")
def get_preprocessing():
    data = get_analysis_data()
    return data.get("preprocessing", {})
