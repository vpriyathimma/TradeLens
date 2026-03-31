"""
Demo script to show LSTM training process with verbose logs
Run this to generate training logs for screenshot
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from routes.prediction_analysis import train_or_load_model
from datetime import datetime, timedelta
import os

# Force retrain by removing existing model
symbol = 'RELIANCE.NS'  # Using Reliance as it's a major Nifty 50 stock
model_dir = "models/"
model_path = os.path.join(model_dir, f"{symbol}_model.h5")
scaler_path = os.path.join(model_dir, f"{symbol}_scaler.pkl")

# Remove existing models to force fresh training
if os.path.exists(model_path):
    os.remove(model_path)
    print(f"🗑️  Removed existing model: {model_path}")
if os.path.exists(scaler_path):
    os.remove(scaler_path)
    print(f"🗑️  Removed existing scaler: {scaler_path}")

print("\n" + "="*70)
print("🚀 STARTING LSTM MODEL TRAINING FOR NIFTY BEES")
print("="*70 + "\n")

# Train the model (this will show epoch-by-epoch progress)
start_date = datetime(2023, 1, 1)
end_date = datetime.now()

print(f"📊 Training Period: {start_date.date()} to {end_date.date()}")
print(f"🧠 Architecture: LSTM(50) → Dropout(0.2) → LSTM(50) → Dense(25) → Dense(1)")
print(f"⚙️  Optimizer: Adam | Loss Function: MSE")
print("\n" + "-"*70 + "\n")

model, scaler = train_or_load_model(symbol, start_date, end_date)

print("\n" + "="*70)
print("✅ TRAINING COMPLETE!")
print("="*70)
