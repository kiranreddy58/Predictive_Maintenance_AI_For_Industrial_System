import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import confusion_matrix, recall_score, precision_score, roc_auc_score, f1_score, classification_report, roc_curve
from xgboost import XGBClassifier
from sklearn.ensemble import RandomForestClassifier
from imblearn.over_sampling import SMOTE
from imblearn.pipeline import Pipeline as ImbPipeline
import joblib
import json
import shap

# 1. Load Data
# ---------------------------------------------------------
print("Loading data...")
try:
    df = pd.read_csv('ai4i2020.csv')
except FileNotFoundError:
    print("Error: ai4i2020.csv not found")
    exit(1)

df.columns = ['UDI', 'Product_ID', 'Type', 'Air_Temp', 'Process_Temp', 'Rot_Speed', 'Torque', 'Tool_Wear', 'Machine_Failure', 'TWF', 'HDF', 'PWF', 'OSF', 'RNF']

# Calculate EDA Stats BEFORE processing
eda_stats = {
    "total_samples": len(df),
    "failure_rate": float(df['Machine_Failure'].mean()),
    "failure_modes": df[['TWF', 'HDF', 'PWF', 'OSF', 'RNF']].sum().to_dict(),
    "type_distribution": df['Type'].value_counts().to_dict(),
    "type_failure_rates": df.groupby('Type')['Machine_Failure'].mean().to_dict(),
    "histograms": {
        col: {"counts": np.histogram(df[col], bins=20)[0].tolist(), "edges": np.histogram(df[col], bins=20)[1].tolist()}
        for col in ['Air_Temp', 'Process_Temp', 'Rot_Speed', 'Torque', 'Tool_Wear']
    }
}

# 2. Feature Engineering
# ---------------------------------------------------------
print("Feature engineering...")
df_proc = df.copy()
df_proc['Temp_Diff'] = df_proc['Process_Temp'] - df_proc['Air_Temp']
df_proc['Power'] = 2 * np.pi * df_proc['Rot_Speed'] * df_proc['Torque'] / 60
df_proc['Wear_Strain'] = df_proc['Tool_Wear'] * df_proc['Torque']

# Correlation Matrix (Numerical only)
corr_cols = ['Air_Temp', 'Process_Temp', 'Rot_Speed', 'Torque', 'Tool_Wear', 'Temp_Diff', 'Power', 'Wear_Strain', 'Machine_Failure']
corr_matrix = df_proc[corr_cols].corr().to_dict()
eda_stats["correlations"] = corr_matrix

# Box Plot Stats (Split by Target)
box_stats = {}
for col in ['Air_Temp', 'Process_Temp', 'Rot_Speed', 'Torque', 'Tool_Wear', 'Power', 'Wear_Strain']:
    box_stats[col] = {}
    for label in [0, 1]:
        subset = df_proc[df_proc['Machine_Failure'] == label][col]
        box_stats[col][str(label)] = {
            "min": float(subset.min()),
            "q1": float(subset.quantile(0.25)),
            "median": float(subset.median()),
            "q3": float(subset.quantile(0.75)),
            "max": float(subset.max())
        }
eda_stats["box_plots"] = box_stats

# Scatter Plot Downsampling (for Visualization)
# Sample 500 points for 'Torque vs Rot_Speed' and 'Air vs Process Temp'
sample_df = df_proc.sample(n=500, random_state=42)
eda_stats["scatter_data"] = sample_df[['Rot_Speed', 'Torque', 'Air_Temp', 'Process_Temp', 'Machine_Failure']].to_dict(orient='records')

# 3. Splitting
# ---------------------------------------------------------
# 3. Splitting & Advanced Feature Stats
# ---------------------------------------------------------

# A. Time-Based Aggregations (Rolling Window)
# Simulate time-series nature (Assuming UDI implies order)
df_ts = df_proc.sort_values('UDI').copy()
df_ts['Rolling_Torque'] = df_ts['Torque'].rolling(window=50).mean()
df_ts['Rolling_Torque_Std'] = df_ts['Torque'].rolling(window=50).std()

# Extract a sample segment for Visualization (200 points)
ts_segment = df_ts.iloc[500:800][['UDI', 'Torque', 'Rolling_Torque']].to_dict(orient='records')
eda_stats['time_series_data'] = ts_segment

# B. Stratified Splitting by Type AND Failure
# Rolling features in df_ts, not df_proc, so no need to drop them from df_proc.
drop_cols = ['UDI', 'Product_ID', 'TWF', 'HDF', 'PWF', 'OSF', 'RNF']

# Calculate Statistical Features for Dashboard
eda_stats['statistical_features'] = {
    "Torque": {
        "skew": float(df_proc['Torque'].skew()),
        "kurtosis": float(df_proc['Torque'].kurtosis())
    },
    "Rot_Speed": {
        "skew": float(df_proc['Rot_Speed'].skew()),
        "kurtosis": float(df_proc['Rot_Speed'].kurtosis())
    }
}

X = df_proc.drop(['Machine_Failure'] + drop_cols, axis=1)
y = df_proc['Machine_Failure']

# Create Composite Stratify Column
stratify_col = df_proc['Type'].astype(str) + "_" + df_proc['Machine_Failure'].astype(str)

X = pd.get_dummies(X, columns=['Type'], drop_first=True)

X_train, X_test, y_train, y_test, strat_train, strat_test = train_test_split(
    X, y, stratify_col, test_size=0.2, stratify=stratify_col, random_state=42
)

# Capture Split Stats for Visualization
split_stats = {
    "train": pd.Series(strat_train).value_counts().to_dict(),
    "test": pd.Series(strat_test).value_counts().to_dict()
}
eda_stats['split_stats'] = split_stats

X_train, X_val, y_train, y_val = train_test_split(X_train, y_train, test_size=0.2, stratify=y_train, random_state=42)

# 4. Modeling
# ---------------------------------------------------------
print("Training...")
COST_FN = 1000; COST_FP = 100; COST_TP = 100; COST_TN = 0

# Capture Pre-SMOTE Stats
original_counts = y_train.value_counts().to_dict()

scaler = StandardScaler()
pipeline = ImbPipeline([
    ('scaler', scaler),
    ('smote', SMOTE(random_state=42)),
    ('classifier', XGBClassifier(n_estimators=200, learning_rate=0.05, max_depth=6, eval_metric='logloss', random_state=42, use_label_encoder=False))
])

# Fit (SMOTE happens inside fit for pipeline, but we want stats. 
# So let's do manual SMOTE just to get stats for the report, relying on Pipeline for actual training? 
# Actually, let's just use the known SMOTE behavior: it balances classes.)
# But for the chart, we need numbers.
sm = SMOTE(random_state=42)
X_res, y_res = sm.fit_resample(X_train, y_train)
resampled_counts = y_res.value_counts().to_dict()

# Re-fit pipeline for consistency in production (Pipeline handles scaling+SMOTE on transform/fit)
pipeline.fit(X_train, y_train)

# Threshold Optimization
probs_val = pipeline.predict_proba(X_val)[:, 1]
thresholds = np.linspace(0, 1, 100)
costs = []
def get_cost(y_true, y_pred):
    tn, fp, fn, tp = confusion_matrix(y_true, y_pred).ravel()
    return (fn * COST_FN) + (fp * COST_FP) + (tp * COST_TP) + (tn * COST_TN)

for t in thresholds:
    cost_val = get_cost(y_val, (probs_val >= t).astype(int))
    costs.append(float(cost_val))

best_thresh = thresholds[np.argmin(costs)]
print(f"Best Threshold: {best_thresh:.2f}")

# Evaluation (Test Set)
probs_test = pipeline.predict_proba(X_test)[:, 1]
preds_test = (probs_test >= best_thresh).astype(int)
tn, fp, fn, tp = confusion_matrix(y_test, preds_test).ravel()
fpr, tpr, _ = roc_curve(y_test, probs_test)



# 5. Diagnostic Model (Result Generation) & Type Analysis
# ---------------------------------------------------------

# A. Per-Type Performance (Binary Model)
# Reconstruct Type from X_test dummies for analysis
X_test_type = X_test.copy()
def get_type(row):
    if row['Type_L'] == 1: return 'L'
    elif row['Type_M'] == 1: return 'M'
    else: return 'H'

X_test_type['Type_Str'] = X_test_type.apply(get_type, axis=1)
type_metrics = {}

for t_type in ['L', 'M', 'H']:
    mask = X_test_type['Type_Str'] == t_type
    if mask.sum() > 0:
        y_true_t = y_test[mask]
        y_pred_t = preds_test[mask]
        type_metrics[t_type] = {
            "samples": int(mask.sum()),
            "recall": float(recall_score(y_true_t, y_pred_t, zero_division=0)),
            "precision": float(precision_score(y_true_t, y_pred_t, zero_division=0))
        }

# B. Failure Mode Classification
print("Training Diagnostics...")
def get_failure_type(row):
    if row['Machine_Failure'] == 0: return 'No Failure'
    for mode in ['TWF', 'HDF', 'PWF', 'OSF', 'RNF']:
        if row[mode] == 1: return mode
    return 'Unknown'

df_proc['Failure_Class'] = df_proc.apply(get_failure_type, axis=1)
failed_df = df_proc[df_proc['Machine_Failure'] == 1].copy()

# Filter out 'Unknown' or multiple failures if necessary, but keep simple for now
failed_df = failed_df[failed_df['Failure_Class'] != 'Unknown']

X_diag = failed_df.drop(['Machine_Failure', 'Failure_Class'] + drop_cols, axis=1)
X_diag = pd.get_dummies(X_diag, columns=['Type'], drop_first=True)
y_diag = failed_df['Failure_Class']

le = LabelEncoder()
y_diag_encoded = le.fit_transform(y_diag)

# Split for evaluation
X_d_train, X_d_test, y_d_train, y_d_test = train_test_split(X_diag, y_diag_encoded, test_size=0.3, random_state=42, stratify=y_diag_encoded)

diag_model = RandomForestClassifier(n_estimators=100, random_state=42, class_weight='balanced')
diag_model.fit(X_d_train, y_d_train)
y_d_pred = diag_model.predict(X_d_test)

# Calculate Per-Mode Metrics
diag_report = classification_report(y_d_test, y_d_pred, target_names=le.classes_, output_dict=True)
# Convert to simple dict for JSON
mode_metrics = {}
for mode in le.classes_:
    if mode in diag_report:
        mode_metrics[mode] = {
            "precision": float(diag_report[mode]['precision']),
            "recall": float(diag_report[mode]['recall']),
            "f1": float(diag_report[mode]['f1-score']),
            "support": int(diag_report[mode]['support'])
        }

performance_metrics = {
    "recall": float(recall_score(y_test, preds_test)),
    "precision": float(precision_score(y_test, preds_test)),
    "f1": float(f1_score(y_test, preds_test)),
    "roc_auc": float(roc_auc_score(y_test, probs_test)),
    "roc_curve": {"fpr": fpr.tolist(), "tpr": tpr.tolist()},
    "confusion_matrix": {"TN": int(tn), "FP": int(fp), "FN": int(fn), "TP": int(tp)},
    "optimized_threshold": float(best_thresh),
    "total_cost": float(get_cost(y_test, preds_test)),
    "cost_curve": {"thresholds": thresholds.tolist(), "costs": costs},
    "type_metrics": type_metrics,
    "mode_metrics": mode_metrics
}

# Retrain on full diagnostic data for production artifact
diag_model.fit(X_diag, y_diag_encoded)


# 6. SHAP Importance
# ---------------------------------------------------------
print("Calculating SHAP...")
try:
    model_xgb = pipeline.named_steps['classifier']
    X_test_scaled = pipeline.named_steps['scaler'].transform(X_test)
    expr = shap.Explainer(model_xgb)
    shap_values = expr(X_test_scaled)
    feature_names = X.columns.tolist()
    global_imp = np.abs(shap_values.values).mean(0)
    shap_dict = {feature_names[i]: float(global_imp[i]) for i in range(len(feature_names))}
    
    # Sort
    shap_sorted = dict(sorted(shap_dict.items(), key=lambda item: item[1], reverse=True))
except Exception as e:
    print(f"SHAP Error: {e}")
    shap_sorted = dict(sorted(shap_dict.items(), key=lambda item: item[1], reverse=True))
except Exception as e:
    print(f"SHAP Error: {e}")
    shap_sorted = {}

# 8. Comparison Models (XGB vs RF vs MLP)
# ---------------------------------------------------------
print("Training Comparison Models...")
from sklearn.neural_network import MLPClassifier
from sklearn.ensemble import GradientBoostingClassifier

models_bench = {
    "XGB": pipeline.named_steps['classifier'],
    "RF": RandomForestClassifier(n_estimators=100, random_state=42),
    "GBM": GradientBoostingClassifier(n_estimators=100, random_state=42)
}

comparison_results = []
for name, model in models_bench.items():
    if name != "XGB": # XGB already trained
        model.fit(X_train, y_train) # Note: Does not use SMOTE pipeline, simple benchmark on imbalanced
        y_pred = model.predict(X_test)
        y_prob = model.predict_proba(X_test)[:, 1]
    else:
        y_pred = preds_test
        y_prob = probs_test

    comparison_results.append({
        "name": name,
        "f1": float(f1_score(y_test, y_pred)),
        "auc": float(roc_auc_score(y_test, y_prob)),
        "recall": float(recall_score(y_test, y_pred))
    })

# 9. Partial Dependence (PDP)
# ---------------------------------------------------------
print("Calculating PDP...")
from sklearn.inspection import partial_dependence

pdp_data = {}
features_to_plot = ['Torque', 'Rot_Speed', 'Tool_Wear']
# Use the XGBoost model from pipeline
est = pipeline.named_steps['classifier']
# We need to pass scaled data if the model expects it, but sklearn PDP handles this if we pass the pipeline?
# Use the underlying estimator with transformed data for simplicity
X_train_scaled = pipeline.named_steps['scaler'].transform(X_train)
# Map columns back because transform returns numpy array
X_train_scaled_df = pd.DataFrame(X_train_scaled, columns=X.columns)

for feat in features_to_plot:
    if feat in X.columns:
        pdp_res = partial_dependence(est, X_train_scaled_df, [feat], kind='average')
        # Scikit-learn > 1.0 logic
        # pdp_res is a straight bunch or dictionary-like
        # 'average' is the y-axis (pdp values), 'grid_values' or 'values' is the x-axis
        
        # Check structure dynamically for robustness
        if isinstance(pdp_res, dict):
            y_vals = pdp_res['average'][0]
            x_vals = pdp_res['grid_values'][0] if 'grid_values' in pdp_res else pdp_res['values'][0]
        else:
            # Bunch object
            y_vals = pdp_res.average[0]
            x_vals = pdp_res.grid_values[0] if hasattr(pdp_res, 'grid_values') else pdp_res.values[0]

        pdp_data[feat] = {
            "x": x_vals.tolist(),
            "y": y_vals.tolist()
        }

# 10. Saving Everything
# ---------------------------------------------------------
print("Saving artifacts...")
joblib.dump(pipeline, 'model_ai4i.joblib')
joblib.dump(diag_model, 'diag_model.joblib')
joblib.dump(le, 'diag_label_encoder.joblib')

config = {
    'threshold': float(best_thresh),
    'features': X.columns.tolist(),
    'costs': {'FN': COST_FN, 'FP': COST_FP}
}
with open('model_config_ai4i.json', 'w') as f:
    json.dump(config, f)

full_results = {
    "eda": eda_stats,
    "performance": performance_metrics,
    "feature_importance": shap_sorted,
    "model_comparison": comparison_results,
    "pdp": pdp_data,
    "preprocessing": {
        "original_counts": {str(k): int(v) for k, v in original_counts.items()},
        "resampled_counts": {str(k): int(v) for k, v in resampled_counts.items()}
    }
}
with open('evaluation_results.json', 'w') as f:
    json.dump(full_results, f, indent=2)

print("Done. Results saved to evaluation_results.json")
