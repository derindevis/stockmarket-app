import torch
import torch.nn as nn
import numpy as np
import pandas as pd
import yfinance as yf
import requests
from sklearn.preprocessing import MinMaxScaler

session = requests.Session()
session.headers.update({
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'
})
from datetime import datetime, timedelta

class StockLSTM(nn.Module):
    def __init__(self, input_size=1, hidden_size=64, num_layers=2, output_size=1):
        super(StockLSTM, self).__init__()
        self.hidden_size = hidden_size
        self.num_layers = num_layers
        self.lstm = nn.LSTM(input_size, hidden_size, num_layers, batch_first=True, dropout=0.2)
        self.fc = nn.Linear(hidden_size, output_size)

    def forward(self, x):
        h0 = torch.zeros(self.num_layers, x.size(0), self.hidden_size).to(x.device)
        c0 = torch.zeros(self.num_layers, x.size(0), self.hidden_size).to(x.device)
        out, _ = self.lstm(x, (h0, c0))
        # Take the output of the last time step
        out = self.fc(out[:, -1, :])
        return out

def create_sequences(data, seq_length=60):
    xs, ys = [], []
    for i in range(len(data) - seq_length):
        xs.append(data[i:(i + seq_length)])
        ys.append(data[i + seq_length])
    return np.array(xs), np.array(ys)

def generate_lstm_forecast(symbol: str, forecast_days: int = 30) -> dict | None:
    try:
        symbol = symbol.upper()
        ticker = yf.Ticker(symbol, session=session)
        
        # 1. Fetch historical data (1 year is standard, let's fetch 1y)
        hist = ticker.history(period="1y")
        if hist.empty or len(hist) < 80:
            # Fallback to a longer period if 1y is short or missing
            hist = ticker.history(period="2y")
            if hist.empty or len(hist) < 80:
                print(f"Not enough historical data for {symbol} to run LSTM (need >= 80 days).")
                return None

        close_prices = hist["Close"].values.reshape(-1, 1)
        current_price = float(close_prices[-1][0])

        # 2. Normalize data
        scaler = MinMaxScaler(feature_range=(0, 1))
        scaled_data = scaler.fit_transform(close_prices)

        # 3. Create sequences
        seq_length = min(60, len(scaled_data) - 10)
        X, y = create_sequences(scaled_data, seq_length)
        
        if len(X) < 10:
            print(f"Too few sequences generated for {symbol}.")
            return None

        # 4. Convert to tensors
        device = torch.device("cpu") # Force CPU to avoid CUDA initialization overhead during HTTP request
        X_train = torch.FloatTensor(X).to(device)
        y_train = torch.FloatTensor(y).to(device)

        # 5. Initialize model
        model = StockLSTM(input_size=1, hidden_size=64, num_layers=2).to(device)
        criterion = nn.MSELoss()
        optimizer = torch.optim.Adam(model.parameters(), lr=0.001)

        # 6. Train model (50 epochs)
        model.train()
        epochs = 50
        for epoch in range(epochs):
            outputs = model(X_train)
            loss = criterion(outputs, y_train)
            
            optimizer.zero_grad()
            loss.backward()
            optimizer.step()

        # 7. Generate predictions day-by-day
        model.eval()
        last_sequence = scaled_data[-seq_length:].reshape(1, seq_length, 1)
        predictions = []

        with torch.no_grad():
            current_seq = torch.FloatTensor(last_sequence).to(device)
            for _ in range(forecast_days):
                pred = model(current_seq)
                pred_val = pred.item()
                predictions.append(pred_val)
                
                # Shift sequence: remove the first element, append the new prediction at the end
                new_seq = current_seq.numpy()
                new_seq = np.append(new_seq[:, 1:, :], [[[pred_val]]], axis=1)
                current_seq = torch.FloatTensor(new_seq).to(device)

        # 8. Inverse transform predictions
        predictions_array = np.array(predictions).reshape(-1, 1)
        predicted_prices = scaler.inverse_transform(predictions_array).flatten()

        # 9. Calculate confidence bands (using training residuals)
        with torch.no_grad():
            train_preds = model(X_train).cpu().numpy()
        train_preds_inv = scaler.inverse_transform(train_preds)
        y_train_inv = scaler.inverse_transform(y_train.cpu().numpy())
        
        residuals = y_train_inv - train_preds_inv
        std_residual = float(np.std(residuals))

        # 10. Build forecast points
        last_date = hist.index[-1]
        forecast_points = []
        for i, price in enumerate(predicted_prices):
            future_date = last_date + pd.Timedelta(days=i + 1)
            # Volatility margin expands with time (square root of time rule)
            margin = std_residual * np.sqrt(i + 1) * 1.96
            # Ensure lower bound doesn't go below zero
            lower = max(0.0, price - margin)
            
            forecast_points.append({
                "date": future_date.strftime("%Y-%m-%d"),
                "predicted_price": round(float(price), 2),
                "lower_bound": round(float(lower), 2),
                "upper_bound": round(float(price + margin), 2),
            })

        # 11. Determine trend
        final_predicted_price = float(predicted_prices[-1])
        change_pct = ((final_predicted_price - current_price) / current_price) * 100
        
        if change_pct > 2.0:
            trend = "uptrend"
        elif change_pct < -2.0:
            trend = "downtrend"
        else:
            trend = "sideways"

        # Volatility percentage-based confidence score
        vol_pct = (std_residual / current_price) * 100
        confidence = 100 - (vol_pct * 5.0)
        confidence = max(10.0, min(95.0, confidence))  # Bound between 10% and 95%

        return {
            "symbol": symbol,
            "current_price": round(current_price, 2),
            "forecast_points": forecast_points,
            "trend": trend,
            "confidence": round(confidence, 1),
            "model_name": "LSTM",
            "predicted_change_percent": round(change_pct, 2),
        }
    except Exception as e:
        print(f"LSTM forecast error for {symbol}: {e}")
        import traceback
        traceback.print_exc()
        return None
