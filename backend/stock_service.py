import yfinance as yf
import pandas as pd
import numpy as np
import requests

session = requests.Session()
session.headers.update({
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'
})

def _fetch_stock_via_rest(symbol: str) -> dict | None:
    """Helper to fetch stock price and metadata via Yahoo's unrestricted chart and search REST endpoints."""
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'
    }
    symbol = symbol.upper()
    try:
        # 1. Fetch price and basic meta via chart endpoint
        chart_url = f"https://query1.finance.yahoo.com/v8/finance/chart/{symbol}?range=1d&interval=1m"
        r = requests.get(chart_url, headers=headers, timeout=5)
        if r.status_code != 200:
            print(f"REST chart query failed for {symbol}: status {r.status_code}")
            return None
        
        result = r.json().get('chart', {}).get('result', [{}])[0]
        meta = result.get('meta', {})
        
        price = meta.get('regularMarketPrice')
        prev_close = meta.get('chartPreviousClose') or meta.get('previousClose')
        
        # 2. Fetch sector, industry, and name via search endpoint
        search_url = f"https://query2.finance.yahoo.com/v1/finance/search?q={symbol}"
        r2 = requests.get(search_url, headers=headers, timeout=5)
        sector = None
        industry = None
        name = meta.get('longName') or meta.get('shortName') or symbol
        
        if r2.status_code == 200:
            quotes = r2.json().get('quotes', [])
            for q in quotes:
                if q.get('symbol') == symbol:
                    sector = q.get('sector')
                    industry = q.get('industry')
                    if q.get('longname') or q.get('shortname'):
                        name = q.get('longname') or q.get('shortname')
                    break
        
        return {
            "price": price,
            "prev_close": prev_close,
            "name": name,
            "sector": sector,
            "industry": industry,
            "meta": meta
        }
    except Exception as e:
        print(f"Error in REST fallback for {symbol}: {e}")
        return None

def search_stock(query: str) -> dict | None:
    """Search for a stock by ticker symbol and return basic info."""
    symbol = query.upper()
    
    # Try standard yfinance first
    try:
        ticker = yf.Ticker(symbol, session=session)
        info = ticker.info
        if not info:
            raise ValueError("Empty info from yfinance")
            
        price = info.get("regularMarketPrice") or info.get("currentPrice") or info.get("navPrice")
        if price is None:
            price = ticker.fast_info.last_price
            
        name = info.get("shortName") or info.get("longName") or info.get("name") or symbol
        change = info.get("regularMarketChangePercent")
        if change is None:
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
        print(f"yfinance failed for search_stock {query}: {e}. Trying REST fallback...")
        
        # Fallback to direct REST API
        rest_data = _fetch_stock_via_rest(symbol)
        if rest_data:
            price = rest_data["price"]
            prev_close = rest_data["prev_close"]
            change = 0.0
            if price and prev_close:
                change = ((price - prev_close) / prev_close) * 100
                
            return {
                "symbol": symbol,
                "name": rest_data["name"],
                "price": round(float(price), 2) if price else 0.0,
                "change": round(float(change), 2),
                "market_cap": rest_data["meta"].get("marketCap"),
                "sector": rest_data["sector"],
                "industry": rest_data["industry"],
            }
        return None

def get_stock_details(symbol: str) -> dict | None:
    """Get comprehensive details for a stock."""
    symbol = symbol.upper()
    
    # Try standard yfinance first
    try:
        ticker = yf.Ticker(symbol, session=session)
        info = ticker.info
        if not info:
            raise ValueError("Empty info from yfinance")
            
        price = info.get("regularMarketPrice") or info.get("currentPrice") or info.get("navPrice")
        if price is None:
            price = ticker.fast_info.last_price
            
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
        print(f"yfinance failed for get_stock_details {symbol}: {e}. Trying REST fallback...")
        
        # Fallback to direct REST API
        rest_data = _fetch_stock_via_rest(symbol)
        if rest_data:
            meta = rest_data["meta"]
            price = rest_data["price"]
            prev_close = rest_data["prev_close"]
            
            change = 0.0
            change_percent = 0.0
            if price and prev_close:
                change = price - prev_close
                change_percent = ((price - prev_close) / prev_close) * 100
                
            return {
                "symbol": symbol,
                "name": rest_data["name"],
                "price": round(float(price), 2) if price else 0.0,
                "change": round(float(change), 2),
                "change_percent": round(float(change_percent), 2),
                "market_cap": meta.get("marketCap"),
                "pe_ratio": meta.get("trailingPE") or meta.get("forwardPE"),
                "volume": meta.get("regularMarketVolume"),
                "day_high": meta.get("regularMarketDayHigh"),
                "day_low": meta.get("regularMarketDayLow"),
                "fifty_two_week_high": meta.get("fiftyTwoWeekHigh"),
                "fifty_two_week_low": meta.get("fiftyTwoWeekLow"),
                "open_price": prev_close,
                "previous_close": prev_close,
                "sector": rest_data["sector"],
                "industry": rest_data["industry"],
                "description": "",
            }
        return None

def get_stock_history(symbol: str, period: str = "1mo") -> list[dict]:
    """Get historical price data for a stock."""
    symbol = symbol.upper()
    
    # Try standard yfinance first
    try:
        ticker = yf.Ticker(symbol, session=session)
        hist = ticker.history(period=period)
        
        if hist.empty:
            raise ValueError("Empty history from yfinance")
            
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
        print(f"yfinance failed for get_stock_history {symbol}: {e}. Trying REST fallback...")
        
        # Fallback to direct REST API
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'
        }
        try:
            url = f"https://query1.finance.yahoo.com/v8/finance/chart/{symbol}?range={period}&interval=1d"
            r = requests.get(url, headers=headers, timeout=5)
            if r.status_code != 200:
                print(f"REST history failed for {symbol}: status {r.status_code}")
                return []
                
            result = r.json().get('chart', {}).get('result', [{}])[0]
            timestamps = result.get('timestamp', [])
            indicators = result.get('indicators', {})
            quote = indicators.get('quote', [{}])[0]
            
            opens = quote.get('open', [])
            highs = quote.get('high', [])
            lows = quote.get('low', [])
            closes = quote.get('close', [])
            volumes = quote.get('volume', [])
            
            data = []
            from datetime import datetime
            for i, ts in enumerate(timestamps):
                if i < len(opens) and i < len(closes):
                    open_val = opens[i]
                    high_val = highs[i]
                    low_val = lows[i]
                    close_val = closes[i]
                    volume_val = volumes[i] if i < len(volumes) else 0
                    
                    if open_val is None or close_val is None:
                        continue
                        
                    dt = datetime.fromtimestamp(ts)
                    data.append({
                        "date": dt.strftime("%Y-%m-%d"),
                        "open": round(float(open_val), 2),
                        "high": round(float(high_val or open_val), 2),
                        "low": round(float(low_val or open_val), 2),
                        "close": round(float(close_val), 2),
                        "volume": int(volume_val) if volume_val else 0,
                    })
            return data
        except Exception as ex:
            print(f"Error in REST history fallback for {symbol}: {ex}")
            return []

def get_stock_price(symbol: str) -> float | None:
    """Quickly fetch just the current price of a stock."""
    symbol = symbol.upper()
    try:
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
            raise ValueError("No price found in yfinance")
    except Exception as e:
        print(f"yfinance failed for get_stock_price {symbol}: {e}. Trying REST fallback...")
        
        # Fallback to direct REST API
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'
        }
        try:
            url = f"https://query1.finance.yahoo.com/v8/finance/chart/{symbol}?range=1d&interval=1m"
            r = requests.get(url, headers=headers, timeout=5)
            if r.status_code == 200:
                result = r.json().get('chart', {}).get('result', [{}])[0]
                meta = result.get('meta', {})
                price = meta.get('regularMarketPrice')
                if price:
                    return round(float(price), 2)
        except Exception as ex:
            print(f"Error in REST price fallback for {symbol}: {ex}")
        return None
