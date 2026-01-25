import pandas as pd

try:
    df = pd.read_csv('predictive_maintenance_dataset.csv')
    
    with open('samples.txt', 'w') as f:
        # Get Safe Samples
        safe = df[df['failure'] == 0].sample(2, random_state=42)
        f.write("--- SCENARIO 1: NORMAL OPERATION (SAFE) ---\n")
        f.write(", ".join(map(str, safe.iloc[0][['metric1','metric2','metric3','metric4','metric5','metric6','metric7','metric8','metric9']].values)) + "\n\n")
        
        # Get Failure Samples
        fail = df[df['failure'] == 1].sample(2, random_state=42) # Changed seed to get variety if needed, but keeping 42 for consistency
        f.write("--- SCENARIO 2: POTENTIAL FAILURE (WARNING/CRITICAL) ---\n")
        f.write(", ".join(map(str, fail.iloc[0][['metric1','metric2','metric3','metric4','metric5','metric6','metric7','metric8','metric9']].values)) + "\n\n")

        f.write("--- SCENARIO 3: HIGH RISK FAILURE (CRITICAL) ---\n")
        f.write(", ".join(map(str, fail.iloc[1][['metric1','metric2','metric3','metric4','metric5','metric6','metric7','metric8','metric9']].values)) + "\n")

    print("Done writing samples.txt")

except Exception as e:
    print(f"Error: {e}")
