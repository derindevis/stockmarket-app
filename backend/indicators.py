import pandas as pd
import numpy as np
import yfinance as yf
import requests
from typing import Optional

session = requests.Session()
session.headers.update({
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'
})

def calculate_rsi(prices: pd.Series, period: int = 14) -> float:
    """Calculate the Relative Strength Index (RSI)."""
    try:
        if len(prices) < period + 1:
            return 50.0  # Neutral default
        
        delta = prices.diff()
        gain = delta.clip(lower=0)
        loss = -delta.clip(upper=0)
        
        # Wilder's smoothing technique
        avg_gain = gain.ewm(com=period - 1, adjust=False).mean()
        avg_loss = loss.ewm(com=period - 1, adjust=False).mean()
        
        # Avoid division by zero
        rs = avg_gain / avg_loss.replace(0, 1e-10)
        rsi = 100 - (100 / (1 + rs))
        
        val = rsi.iloc[-1]
        return float(val) if not pd.isna(val) else 50.0
    except Exception as e:
        print(f"RSI error: {e}")
        return 50.0

def calculate_macd(prices: pd.Series) -> dict:
    """Calculate MACD Line, Signal Line, and MACD Histogram."""
    default = {"macd": 0.0, "signal": 0.0, "histogram": 0.0}
    try:
        if len(prices) < 26:
            return default
            
        ema_12 = prices.ewm(span=12, adjust=False).mean()
        ema_26 = prices.ewm(span=26, adjust=False).mean()
        
        macd_line = ema_12 - ema_26
        signal_line = macd_line.ewm(span=9, adjust=False).mean()
        histogram = macd_line - signal_line
        
        m = macd_line.iloc[-1]
        s = signal_line.iloc[-1]
        h = histogram.iloc[-1]
        
        return {
            "macd": float(m) if not pd.isna(m) else 0.0,
            "signal": float(s) if not pd.isna(s) else 0.0,
            "histogram": float(h) if not pd.isna(h) else 0.0
        }
    except Exception as e:
        print(f"MACD error: {e}")
        return default

def calculate_moving_averages(prices: pd.Series) -> dict:
    """Calculate SMA 20, SMA 50, EMA 12, EMA 26."""
    default = {"sma_20": 0.0, "sma_50": 0.0, "ema_12": 0.0, "ema_26": 0.0}
    try:
        p_len = len(prices)
        sma_20 = prices.rolling(window=min(20, p_len)).mean().iloc[-1]
        sma_50 = prices.rolling(window=min(50, p_len)).mean().iloc[-1]
        ema_12 = prices.ewm(span=12, adjust=False).mean().iloc[-1]
        ema_26 = prices.ewm(span=26, adjust=False).mean().iloc[-1]
        
        return {
            "sma_20": float(sma_20) if not pd.isna(sma_20) else 0.0,
            "sma_50": float(sma_50) if not pd.isna(sma_50) else 0.0,
            "ema_12": float(ema_12) if not pd.isna(ema_12) else 0.0,
            "ema_26": float(ema_26) if not pd.isna(ema_26) else 0.0
        }
    except Exception as e:
        print(f"Moving Averages error: {e}")
        return default

def calculate_beta(stock_prices: pd.Series, market_prices: pd.Series) -> float:
    """Calculate stock Beta relative to a benchmark (market_prices)."""
    try:
        stock_returns = stock_prices.pct_change().dropna()
        market_returns = market_prices.pct_change().dropna()
        
        # Align returns by date
        df = pd.concat([stock_returns, market_returns], axis=1).dropna()
        if len(df) < 10:
            return 1.0
            
        covariance = df.iloc[:, 0].cov(df.iloc[:, 1])
        variance = df.iloc[:, 1].var()
        
        beta = covariance / variance if variance > 0 else 1.0
        return float(beta) if not pd.isna(beta) else 1.0
    except Exception as e:
        print(f"Beta calculation error: {e}")
        return 1.0

def calculate_volatility(prices: pd.Series, period: int = 252) -> float:
    """Calculate annualized volatility in percent."""
    try:
        if len(prices) < 5:
            return 0.0
        returns = prices.pct_change().dropna()
        vol = returns.std() * np.sqrt(period) * 100
        return float(vol) if not pd.isna(vol) else 0.0
    except Exception as e:
        print(f"Volatility error: {e}")
        return 0.0

def calculate_sharpe_ratio(prices: pd.Series, risk_free_rate: float = 0.05) -> float:
    """Calculate annual Sharpe Ratio."""
    try:
        if len(prices) < 10:
            return 0.0
        returns = prices.pct_change().dropna()
        avg_return = returns.mean() * 252
        std_return = returns.std() * np.sqrt(252)
        
        sharpe = (avg_return - risk_free_rate) / std_return if std_return > 0 else 0.0
        return float(sharpe) if not pd.isna(sharpe) else 0.0
    except Exception as e:
        print(f"Sharpe error: {e}")
        return 0.0

def calculate_all_indicators(symbol: str) -> Optional[dict]:
    """Fetch 1 year of daily history and calculate all indicators."""
    try:
        symbol = symbol.upper()
        ticker = yf.Ticker(symbol, session=session)
        # Fetch 1 year of historical data
        hist = ticker.history(period="1y")
        if hist.empty or len(hist) < 30:
            return None
            
        close_prices = hist["Close"]
        
        # Fetch SPY benchmark for Beta calculation
        spy_ticker = yf.Ticker("SPY", session=session)
        spy_hist = spy_ticker.history(period="1y")
        if not spy_hist.empty:
            spy_close_prices = spy_hist["Close"]
        else:
            spy_close_prices = close_prices  # Fallback to self (Beta=1)
            
        # Calculate individual indicators
        rsi_val = calculate_rsi(close_prices)
        macd_dict = calculate_macd(close_prices)
        ma_dict = calculate_moving_averages(close_prices)
        beta_val = calculate_beta(close_prices, spy_close_prices)
        vol_val = calculate_volatility(close_prices)
        sharpe_val = calculate_sharpe_ratio(close_prices)
        
        # P/E ratio from info
        info = ticker.info
        pe_ratio = info.get("trailingPE") or info.get("forwardPE")
        
        return {
            "rsi": rsi_val,
            "macd": macd_dict["macd"],
            "macd_signal": macd_dict["signal"],
            "macd_histogram": macd_dict["histogram"],
            "sma_20": ma_dict["sma_20"],
            "sma_50": ma_dict["sma_50"],
            "ema_12": ma_dict["ema_12"],
            "ema_26": ma_dict["ema_26"],
            "beta": beta_val,
            "pe_ratio": float(pe_ratio) if pe_ratio else None,
            "sharpe_ratio": sharpe_val,
            "volatility": vol_val,
            "current_price": float(close_prices.iloc[-1])
        }
    except Exception as e:
        print(f"Error calculating indicators for {symbol}: {e}")
        return None
