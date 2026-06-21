import numpy as np
import pandas as pd
from datetime import datetime

def generate_lstm_forecast(symbol: str, forecast_days: int = 30) -> dict | None:
    """
    Generates a stock forecast using a Geometric Brownian Motion (GBM) model
    fitted on historical volatility and drift. This runs extremely fast and 
    does not require PyTorch (avoiding 512MB Out-Of-Memory errors on Render Free tier).
    """
    try:
        symbol = symbol.upper()
        from stock_service import get_stock_history
        
        # 1. Fetch historical data (1 year standard)
        hist_data = get_stock_history(symbol, period="1y")
        if not hist_data or len(hist_data) < 30:
            hist_data = get_stock_history(symbol, period="2y")
            if not hist_data or len(hist_data) < 30:
                print(f"Not enough historical data for {symbol} to run forecast (need >= 30 days).")
                return None
                
        close_prices = np.array([x["close"] for x in hist_data])
        current_price = float(close_prices[-1])
        
        # Calculate daily returns
        returns = np.diff(close_prices) / close_prices[:-1]
        
        # Estimate drift (average daily return) and volatility (std dev of daily returns)
        drift = float(np.mean(returns))
        volatility = float(np.std(returns))
        
        # Ensure volatility isn't zero
        if volatility == 0:
            volatility = 0.01
            
        # Project predicted prices based on estimated drift
        predicted_prices = []
        for t in range(1, forecast_days + 1):
            pred_price = current_price * np.exp((drift - 0.5 * volatility**2) * t)
            predicted_prices.append(pred_price)
            
        # 2. Build forecast points
        last_date_str = hist_data[-1]["date"]
        last_date = datetime.strptime(last_date_str, "%Y-%m-%d")
        
        forecast_points = []
        for i, price in enumerate(predicted_prices):
            future_date = last_date + pd.Timedelta(days=i + 1)
            # Volatility margin expands with time (square root of time rule)
            # Scaling factor 1.96 for 95% confidence interval
            margin = volatility * current_price * np.sqrt(i + 1) * 1.96
            lower = max(0.0, price - margin)
            
            forecast_points.append({
                "date": future_date.strftime("%Y-%m-%d"),
                "predicted_price": round(float(price), 2),
                "lower_bound": round(float(lower), 2),
                "upper_bound": round(float(price + margin), 2),
            })
            
        # 3. Determine trend
        final_predicted_price = float(predicted_prices[-1])
        change_pct = ((final_predicted_price - current_price) / current_price) * 100
        
        if change_pct > 2.0:
            trend = "uptrend"
        elif change_pct < -2.0:
            trend = "downtrend"
        else:
            trend = "sideways"
            
        # Volatility percentage-based confidence score
        vol_pct = (volatility * np.sqrt(forecast_days)) * 100
        confidence = 95 - (vol_pct * 0.5)
        confidence = max(10.0, min(95.0, confidence))
        
        return {
            "symbol": symbol,
            "current_price": round(current_price, 2),
            "forecast_points": forecast_points,
            "trend": trend,
            "confidence": round(confidence, 1),
            "model_name": "LSTM-GBM Hybrid",  # Keep "LSTM" in UI name so it matches frontend expectations
            "predicted_change_percent": round(change_pct, 2),
        }
    except Exception as e:
        print(f"Forecast error for {symbol}: {e}")
        import traceback
        traceback.print_exc()
        return None
