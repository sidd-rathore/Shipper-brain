from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
from prophet import Prophet
from datetime import datetime, timedelta
import os
from generate_data import generate_shipping_data



app = FastAPI()

# --- CORS (Security Fix for Frontend) ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- DATA LOADING ---
df = None

if not os.path.exists("shipping_data.csv"):
    print("⚠️ CSV not found. Generating data now...")
    generate_shipping_data()

try:
    print("🔄 Loading data...")
    df = pd.read_csv("shipping_data.csv")
    df['date'] = pd.to_datetime(df['date'])
    print("✅ Data Loaded Successfully!")
except Exception as e:
    print(f"❌ CRITICAL ERROR: {e}")
    df = pd.DataFrame(columns=['date', 'route_id', 'teu_volume'])

# --- ENDPOINTS ---

@app.get("/")
def home():
    return {"status": "Online", "model": "Facebook Prophet (v1.1)"}

@app.get("/predict/{route_id}")
def predict_demand(route_id: str, days_ahead: int = 30):
    if df is None or df.empty:
         raise HTTPException(status_code=500, detail="No data available")

    route_data = df[df['route_id'] == route_id.upper()].copy()
    if route_data.empty:
        raise HTTPException(status_code=404, detail=f"Route '{route_id}' not found")

    # 1. Prepare & Train Model
    train_df = route_data[['date', 'teu_volume']].rename(columns={'date': 'ds', 'teu_volume': 'y'})
    m = Prophet(yearly_seasonality=True, daily_seasonality=False)
    m.add_country_holidays(country_name='US')
    m.fit(train_df)

    # 2. Predict Future
    future = m.make_future_dataframe(periods=days_ahead)
    forecast = m.predict(future)
    
    # 3. Get the "Future" slice
    future_forecast = forecast.tail(days_ahead)

    # 4. MATCH WITH LAST YEAR (The New Feature)
    results = []
    for _, row in future_forecast.iterrows():
        # Calculate the date exactly one year ago
        date_last_year = row['ds'] - timedelta(days=365)
        
        # Find the actual volume from last year (if it exists)
        # We look into our original 'df' to find the real historical data
        past_record = route_data[route_data['date'] == date_last_year]
        
        last_year_val = None
        if not past_record.empty:
            last_year_val = int(past_record.iloc[0]['teu_volume'])

        results.append({
            "date": row['ds'].strftime("%Y-%m-%d"),
            "predicted_teu": int(row['yhat']),
            "upper_bound": int(row['yhat_upper']),
            "last_year_teu": last_year_val  # <--- Sending this to Frontend
        })
        
    return {
        "route": route_id,
        "model_used": "Facebook Prophet",
        "forecast": results
    }
