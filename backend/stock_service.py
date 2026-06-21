import yfinance as yf
import pandas as pd
import numpy as np
import requests

session = requests.Session()
session.headers.update({
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'
})

def search_stock(query: str) -> dict | None:
    """Search for a stock by ticker symbol and return basic info."""
    try:
        symbol = query.upper()
        ticker = yf.Ticker(symbol, session=session)
        info = ticker.info

        # Fallback fields for price
        price = info.get("regularMarketPrice") or info.get("currentPrice") or info.get("navPrice")
        if price is None:
            # Try to get price from fast_info if info fails
            try:
                price = ticker.fast_info.last_price
            except Exception:
                # Try getting last history close
                hist = ticker.history(period="1d")
                if not hist.empty:
                    price = float(hist["Close"].iloc[-1])
                else:
                    return None

        # Return search result representation
        name = info.get("shortName") or info.get("longName") or info.get("name") or symbol
        change = info.get("regularMarketChangePercent")
        if change is None:
            # calculate change if possible
            prev_close = info.get("previousClose") or info.get("regularMarketPreviousClose")
            if prev_close and price:
                change = ((price - prev_close) / prev_close) * 100
            else:
                change = 0.0

        return {
            "symbol": symbol,
            "name": name,
            "price": round(float(price), 2),
            "change": round(float(change), 2) if change else 0.0,
            "market_cap": info.get("marketCap"),
            "sector": info.get("sector"),
            "industry": info.get("industry"),
        }
    except Exception as e:
        print(f"Error searching stock {query}: {e}")
        return None

def get_stock_details(symbol: str) -> dict | None:
    """Get comprehensive details for a stock."""
    try:
        symbol = symbol.upper()
        ticker = yf.Ticker(symbol, session=session)
        info = ticker.info

        price = info.get("regularMarketPrice") or info.get("currentPrice") or info.get("navPrice")
        if price is None:
            try:
                price = ticker.fast_info.last_price
            except Exception:
                hist = ticker.history(period="1d")
                if not hist.empty:
                    price = float(hist["Close"].iloc[-1])
                else:
                    return None

        prev_close = info.get("previousClose") or info.get("regularMarketPreviousClose")
        change = info.get("regularMarketChange")
        change_percent = info.get("regularMarketChangePercent")

        if change is None and prev_close and price:
            change = price - prev_close
        if change_percent is None and prev_close and price:
            change_percent = ((price - prev_close) / prev_close) * 100

        return {
            "symbol": symbol,
            "name": info.get("shortName") or info.get("longName") or info.get("name") or symbol,
            "price": round(float(price), 2),
            "change": round(float(change), 2) if change else 0.0,
            "change_percent": round(float(change_percent), 2) if change_percent else 0.0,
            "market_cap": info.get("marketCap"),
            "pe_ratio": info.get("trailingPE") or info.get("forwardPE"),
            "volume": info.get("volume") or info.get("regularMarketVolume"),
            "day_high": info.get("dayHigh") or info.get("regularMarketDayHigh"),
            "day_low": info.get("dayLow") or info.get("regularMarketDayLow"),
            "fifty_two_week_high": info.get("fiftyTwoWeekHigh"),
            "fifty_two_week_low": info.get("fiftyTwoWeekLow"),
            "open_price": info.get("open") or info.get("regularMarketOpen"),
            "previous_close": prev_close,
            "sector": info.get("sector"),
            "industry": info.get("industry"),
            "description": info.get("longBusinessSummary") or info.get("description") or "",
        }
    except Exception as e:
        print(f"Error getting stock details for {symbol}: {e}")
        return None

def get_stock_history(symbol: str, period: str = "1mo") -> list[dict]:
    """Get historical price data for a stock."""
    try:
        symbol = symbol.upper()
        ticker = yf.Ticker(symbol, session=session)
        hist = ticker.history(period=period)

        if hist.empty:
            return []

        data = []
        for index, row in hist.iterrows():
            data.append({
                "date": index.strftime("%Y-%m-%d"),
                "open": round(float(row["Open"]), 2),
                "high": round(float(row["High"]), 2),
                "low": round(float(row["Low"]), 2),
                "close": round(float(row["Close"]), 2),
                "volume": int(row["Volume"]) if not pd.isna(row["Volume"]) else 0,
            })
        return data
    except Exception as e:
        print(f"Error getting stock history for {symbol} ({period}): {e}")
        return []

def get_stock_price(symbol: str) -> float | None:
    """Quickly fetch just the current price of a stock."""
    try:
        symbol = symbol.upper()
        ticker = yf.Ticker(symbol, session=session)
        try:
            return round(float(ticker.fast_info.last_price), 2)
        except Exception:
            info = ticker.info
            price = info.get("regularMarketPrice") or info.get("currentPrice") or info.get("navPrice")
            if price:
                return round(float(price), 2)
            hist = ticker.history(period="1d")
            if not hist.empty:
                return round(float(hist["Close"].iloc[-1]), 2)
            return None
    except Exception as e:
        print(f"Error getting stock price for {symbol}: {e}")
        return None
