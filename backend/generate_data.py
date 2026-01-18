import pandas as pd
import numpy as np
from datetime import datetime, timedelta

def generate_shipping_data():
    # 1. Setup Dates (Last 2 years)
    start_date = datetime(2024, 1, 1)
    end_date = datetime(2026, 2, 1)
    date_range = pd.date_range(start=start_date, end=end_date, freq='D')
    
    # 2. Define Routes
    routes = ["SHANGHAI_TO_LA", "MUMBAI_TO_DUBAI", "ROTTERDAM_TO_NY"]
    
    all_data = []

    for route in routes:
        # Base volume depends on the route size
        if route == "SHANGHAI_TO_LA":
            base_volume = 8000
        elif route == "MUMBAI_TO_DUBAI":
            base_volume = 3000
        else:
            base_volume = 5000
            
        for single_date in date_range:
            # 3. Add "Seasonality" (The Math)
            # Use a Sine wave to mimic Christmas peak (late year) and Feb slump
            time_offset = single_date.timetuple().tm_yday
            seasonality = np.sin(2 * np.pi * (time_offset - 100) / 365) * (base_volume * 0.2)
            
            # 4. Add "Noise" (Random daily fluctuation)
            noise = np.random.randint(-500, 500)
            
            # 5. Add "Trend" (Market growth over 2 years)
            growth_factor = 1.05 if single_date.year > 2024 else 1.0
            
            final_volume = int((base_volume + seasonality + noise) * growth_factor)
            
            # Ensure we don't have negative containers
            final_volume = max(0, final_volume)

            all_data.append({
                "date": single_date.strftime("%Y-%m-%d"),
                "route_id": route,
                "teu_volume": final_volume,
                "fuel_price_index": round(np.random.uniform(90, 110), 2)
            })

    # Save to CSV
    df = pd.DataFrame(all_data)
    df.to_csv("shipping_data.csv", index=False)
    print(f"✅ Generated {len(df)} rows of data in 'shipping_data.csv'")

if __name__ == "__main__":
    generate_shipping_data()
