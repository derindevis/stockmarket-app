from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, Depends, HTTPException, status, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import json
from typing import List

from database import get_db, create_tables
from models import User, WatchlistItem, Prediction, Alert, ComparisonHistory, Forecast
from schemas import (
    UserCreate, UserLogin, UserResponse, TokenResponse,
    WatchlistAdd, WatchlistResponse,
    AnalysisResponse, IndicatorValues, PredictionResponse,
    CompareRequest, CompareResponse,
    AlertCreate, AlertResponse,
    ForecastResponse, ForecastPoint,
    AdminStatsResponse, UserStatusUpdate
)
from auth import hash_password, verify_password, create_access_token, get_current_user, get_admin_user
from stock_service import search_stock, get_stock_details, get_stock_history, get_stock_price
from indicators import calculate_all_indicators
from recommendation import generate_recommendation, generate_explanation
from forecast_service import generate_lstm_forecast

app = FastAPI(title="AI Stock Analysis & Forecasting Platform API")

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    create_tables()

@app.get("/")
def read_root():
    return {
        "status": "online",
        "message": "Welcome to the AI Stock Analysis & Forecasting Platform API.",
        "docs_url": "/docs"
    }

# ══════════════════════════════════════════════════════════════
# AUTHENTICATION
# ══════════════════════════════════════════════════════════════

@app.post("/api/auth/register", response_model=TokenResponse)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    # Check if username or email exists
    if db.query(User).filter(User.username == user_data.username).first():
        raise HTTPException(status_code=400, detail="Username already taken")
    if db.query(User).filter(User.email == user_data.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
        
    # Check if first user is admin, otherwise user
    is_first_user = db.query(User).count() == 0
    role = "admin" if is_first_user else "user"
    
    new_user = User(
        username=user_data.username,
        email=user_data.email,
        password_hash=hash_password(user_data.password),
        role=role,
        is_active=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    token = create_access_token(data={"sub": new_user.username, "role": new_user.role})
    return TokenResponse(access_token=token)

@app.post("/api/auth/login", response_model=TokenResponse)
def login(user_data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == user_data.username).first()
    if not user or not verify_password(user_data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is deactivated")
        
    token = create_access_token(data={"sub": user.username, "role": user.role})
    return TokenResponse(access_token=token)

@app.post("/api/auth/admin/login", response_model=TokenResponse)
def admin_login(user_data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == user_data.username).first()
    if not user or not verify_password(user_data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Access denied: Admin role required")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is deactivated")
        
    token = create_access_token(data={"sub": user.username, "role": user.role})
    return TokenResponse(access_token=token)

@app.get("/api/auth/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

# ══════════════════════════════════════════════════════════════
# STOCKS
# ══════════════════════════════════════════════════════════════

@app.get("/api/stocks/search")
def search(q: str = Query(..., min_length=1)):
    result = search_stock(q)
    if result is None:
        raise HTTPException(status_code=404, detail=f"Stock '{q}' not found")
    return result

@app.get("/api/stocks/{symbol}")
def stock_details(symbol: str):
    result = get_stock_details(symbol)
    if result is None:
        raise HTTPException(status_code=404, detail=f"Stock details not found for '{symbol}'")
    return result

@app.get("/api/stocks/{symbol}/history")
def stock_history(symbol: str, period: str = "1mo"):
    valid_periods = ["1d", "5d", "1mo", "3mo", "6mo", "1y", "5y"]
    if period not in valid_periods:
        raise HTTPException(status_code=400, detail=f"Invalid period. Select from: {valid_periods}")
        
    data = get_stock_history(symbol, period)
    if not data:
        raise HTTPException(status_code=404, detail=f"No price history found for '{symbol}'")
    return data

@app.get("/api/stocks/{symbol}/chart")
def stock_chart_alias(symbol: str, period: str = "1mo"):
    return stock_history(symbol, period)

@app.get("/api/stocks/{symbol}/analysis", response_model=AnalysisResponse)
def analyze_stock(symbol: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    symbol = symbol.upper()
    # 1. Calculate technical indicators
    indicators_data = calculate_all_indicators(symbol)
    if not indicators_data:
        raise HTTPException(status_code=404, detail=f"Insufficient market data to analyze '{symbol}'")
        
    # 2. Generate recommendations and signals
    recommend_data = generate_recommendation(indicators_data)
    ai_explanation = generate_explanation(indicators_data, recommend_data["signal"], recommend_data["confidence"], symbol)
    
    # 3. Create a Prediction record (Analysis History)
    pred_record = Prediction(
        user_id=current_user.id,
        symbol=symbol,
        rsi=indicators_data["rsi"],
        macd=indicators_data["macd"],
        moving_average=indicators_data["sma_20"], # Use SMA 20 as primary MA
        beta=indicators_data["beta"],
        pe_ratio=indicators_data["pe_ratio"],
        sharpe_ratio=indicators_data["sharpe_ratio"],
        volatility=indicators_data["volatility"],
        signal=recommend_data["signal"],
        confidence=recommend_data["confidence"],
        ai_explanation=ai_explanation
    )
    db.add(pred_record)
    
    # 4. Check user alerts
    check_alerts_for_stock(current_user.id, symbol, indicators_data, db)
    
    db.commit()
    
    return AnalysisResponse(
        symbol=symbol,
        signal=recommend_data["signal"],
        confidence=recommend_data["confidence"],
        ai_explanation=ai_explanation,
        indicators=IndicatorValues(**indicators_data)
    )

# Helper function to check and trigger user alerts
def check_alerts_for_stock(user_id: int, symbol: str, indicators: dict, db: Session):
    alerts = db.query(Alert).filter(Alert.user_id == user_id, Alert.symbol == symbol, Alert.is_triggered == False).all()
    for alert in alerts:
        triggered = False
        if alert.alert_type == "rsi_threshold":
            # If threshold is e.g. 30 (oversold) check if RSI went below it, or if it is 70 (overbought) check if RSI went above it.
            # Generally, we can trigger if it matches threshold crossings or generic direction
            rsi_val = indicators.get("rsi", 50.0)
            if alert.threshold >= 50.0 and rsi_val >= alert.threshold:
                triggered = True
            elif alert.threshold < 50.0 and rsi_val <= alert.threshold:
                triggered = True
        elif alert.alert_type == "volatility_spike":
            vol_val = indicators.get("volatility", 0.0)
            if vol_val >= alert.threshold:
                triggered = True
        elif alert.alert_type == "signal_change":
            # Signal change is a bit different; we can compare against the recommendation
            # For simplicity, we can just trigger if confidence is high or signal matches threshold scoring
            triggered = True # Trigger on analysis request to notify user
            
        if triggered:
            alert.is_triggered = True

# ══════════════════════════════════════════════════════════════
# WATCHLIST
# ══════════════════════════════════════════════════════════════

@app.get("/api/watchlist", response_model=List[WatchlistResponse])
def get_watchlist(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    items = db.query(WatchlistItem).filter(WatchlistItem.user_id == current_user.id).all()
    result = []
    for item in items:
        price = get_stock_price(item.symbol)
        details = get_stock_details(item.symbol)
        result.append(WatchlistResponse(
            id=item.id,
            symbol=item.symbol,
            created_at=item.created_at,
            current_price=price,
            name=details["name"] if details else item.symbol
        ))
    return result

@app.post("/api/watchlist", status_code=201)
def add_to_watchlist(data: WatchlistAdd, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    symbol = data.symbol.upper()
    
    # Check if stock exists
    stock = search_stock(symbol)
    if stock is None:
        raise HTTPException(status_code=404, detail=f"Stock symbol '{symbol}' not found")
        
    # Check if already in watchlist
    existing = db.query(WatchlistItem).filter(WatchlistItem.user_id == current_user.id, WatchlistItem.symbol == symbol).first()
    if existing:
        raise HTTPException(status_code=400, detail="Stock is already in your watchlist")
        
    item = WatchlistItem(user_id=current_user.id, symbol=symbol)
    db.add(item)
    db.commit()
    db.refresh(item)
    return {"message": "Added to watchlist successfully", "symbol": symbol, "id": item.id}

@app.delete("/api/watchlist/{symbol}")
def remove_from_watchlist(symbol: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    symbol = symbol.upper()
    item = db.query(WatchlistItem).filter(WatchlistItem.user_id == current_user.id, WatchlistItem.symbol == symbol).first()
    if not item:
        raise HTTPException(status_code=404, detail="Stock not found in watchlist")
        
    db.delete(item)
    db.commit()
    return {"message": "Removed from watchlist successfully", "symbol": symbol}

# ══════════════════════════════════════════════════════════════
# HISTORY
# ══════════════════════════════════════════════════════════════

@app.get("/api/history", response_model=List[PredictionResponse])
def get_history(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    history = db.query(Prediction).filter(Prediction.user_id == current_user.id).order_by(Prediction.created_at.desc()).all()
    return history

@app.delete("/api/history")
def clear_history(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db.query(Prediction).filter(Prediction.user_id == current_user.id).delete()
    db.commit()
    return {"message": "Analysis history cleared successfully"}

# ══════════════════════════════════════════════════════════════
# COMPARISON
# ══════════════════════════════════════════════════════════════

@app.post("/api/compare", response_model=CompareResponse)
def compare_stocks(data: CompareRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if len(data.symbols) < 2 or len(data.symbols) > 4:
        raise HTTPException(status_code=400, detail="Compare request must contain between 2 and 4 stock symbols")
        
    compare_results = []
    clean_symbols = []
    
    for sym in data.symbols:
        sym = sym.upper().strip()
        details = get_stock_details(sym)
        if not details:
            continue
            
        indicators = calculate_all_indicators(sym)
        if not indicators:
            continue
            
        recommend = generate_recommendation(indicators)
        
        # Merge basic details, indicators, and recommendation
        stock_data = {
            **details,
            "rsi": indicators["rsi"],
            "macd": indicators["macd"],
            "beta": indicators["beta"],
            "volatility": indicators["volatility"],
            "sharpe_ratio": indicators["sharpe_ratio"],
            "signal": recommend["signal"],
            "confidence": recommend["confidence"]
        }
        compare_results.append(stock_data)
        clean_symbols.append(sym)
        
    if not compare_results:
        raise HTTPException(status_code=400, detail="None of the symbols provided could be analyzed")
        
    # Save comparison history
    comp_record = ComparisonHistory(
        user_id=current_user.id,
        symbols=json.dumps(clean_symbols)
    )
    db.add(comp_record)
    db.commit()
    
    return CompareResponse(stocks=compare_results)

# ══════════════════════════════════════════════════════════════
# ALERTS
# ══════════════════════════════════════════════════════════════

@app.get("/api/alerts", response_model=List[AlertResponse])
def get_alerts(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    alerts = db.query(Alert).filter(Alert.user_id == current_user.id).order_by(Alert.created_at.desc()).all()
    return alerts

@app.post("/api/alerts", response_model=AlertResponse)
def create_alert(data: AlertCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    symbol = data.symbol.upper()
    # Check if stock exists
    stock = search_stock(symbol)
    if not stock:
        raise HTTPException(status_code=404, detail=f"Stock '{symbol}' not found")
        
    valid_types = ["rsi_threshold", "signal_change", "volatility_spike"]
    if data.alert_type not in valid_types:
        raise HTTPException(status_code=400, detail=f"Invalid alert type. Choose from: {valid_types}")
        
    new_alert = Alert(
        user_id=current_user.id,
        symbol=symbol,
        alert_type=data.alert_type,
        threshold=data.threshold,
        is_triggered=False
    )
    db.add(new_alert)
    db.commit()
    db.refresh(new_alert)
    return new_alert

@app.delete("/api/alerts/{alert_id}")
def delete_alert(alert_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    alert = db.query(Alert).filter(Alert.id == alert_id, Alert.user_id == current_user.id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    db.delete(alert)
    db.commit()
    return {"message": "Alert deleted successfully"}

# ══════════════════════════════════════════════════════════════
# LSTM FORECASTING
# ══════════════════════════════════════════════════════════════

@app.get("/api/forecast/{symbol}", response_model=ForecastResponse)
def get_forecast(symbol: str, days: int = 30, db: Session = Depends(get_db)):
    symbol = symbol.upper()
    if days < 7 or days > 90:
        raise HTTPException(status_code=400, detail="Forecast days must be between 7 and 90")
        
    # Generate the LSTM forecast
    result = generate_lstm_forecast(symbol, forecast_days=days)
    if result is None:
        raise HTTPException(status_code=404, detail=f"Unable to generate LSTM forecast for '{symbol}'")
        
    # Cache/Save forecast points in the Forecasts table
    # Clear old forecasts for this symbol first
    db.query(Forecast).filter(Forecast.symbol == symbol).delete()
    
    # Save new forecast summary (we save final point or average prediction)
    for pt in result["forecast_points"]:
        db_f = Forecast(
            symbol=symbol,
            predicted_price=pt["predicted_price"],
            trend=result["trend"],
            confidence=result["confidence"],
            forecast_date=pt["date"],
            model_name="LSTM"
        )
        db.add(db_f)
    db.commit()
    
    # Convert dict keys to match ForecastResponse Pydantic model
    pts = [ForecastPoint(**pt) for pt in result["forecast_points"]]
    return ForecastResponse(
        symbol=result["symbol"],
        current_price=result["current_price"],
        forecast_points=pts,
        trend=result["trend"],
        confidence=result["confidence"],
        model_name="LSTM",
        predicted_change_percent=result["predicted_change_percent"]
    )

@app.get("/api/forecast/{symbol}/trend")
def get_forecast_trend(symbol: str, db: Session = Depends(get_db)):
    symbol = symbol.upper()
    # Check if we have cached forecast
    latest = db.query(Forecast).filter(Forecast.symbol == symbol).order_by(Forecast.created_at.desc()).first()
    if latest:
        return {"symbol": symbol, "trend": latest.trend, "confidence": latest.confidence, "model": latest.model_name}
        
    # If not cached, generate a 30-day forecast to find trend
    result = generate_lstm_forecast(symbol, forecast_days=30)
    if result is None:
        raise HTTPException(status_code=404, detail=f"No forecast trend available for '{symbol}'")
    return {"symbol": symbol, "trend": result["trend"], "confidence": result["confidence"], "model": "LSTM"}

# ══════════════════════════════════════════════════════════════
# ADMIN SECTION (Requires Admin user authentication)
# ══════════════════════════════════════════════════════════════

@app.get("/api/admin/stats", response_model=AdminStatsResponse)
def get_admin_stats(admin: User = Depends(get_admin_user), db: Session = Depends(get_db)):
    total_users = db.query(User).count()
    total_analyses = db.query(Prediction).count()
    total_alerts = db.query(Alert).count()
    active_users = db.query(User).filter(User.is_active == True).count()
    
    # Group predictions by symbol to find top searched stocks
    from sqlalchemy import func
    top_stocks_query = (
        db.query(Prediction.symbol, func.count(Prediction.symbol).label("search_count"))
        .group_by(Prediction.symbol)
        .order_by(func.count(Prediction.symbol).desc())
        .limit(10)
        .all()
    )
    
    top_stocks = [{"symbol": item[0], "count": item[1]} for item in top_stocks_query]
    
    return AdminStatsResponse(
        total_users=total_users,
        total_analyses=total_analyses,
        total_alerts=total_alerts,
        active_users=active_users,
        top_stocks=top_stocks
    )

@app.get("/api/admin/users", response_model=List[UserResponse])
def get_admin_users(admin: User = Depends(get_admin_user), db: Session = Depends(get_db)):
    users = db.query(User).order_by(User.created_at.desc()).all()
    return users

@app.put("/api/admin/users/{user_id}/status")
def update_user_status(user_id: int, status_data: UserStatusUpdate, admin: User = Depends(get_admin_user), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == admin.id:
        raise HTTPException(status_code=400, detail="Admin cannot deactivate their own account")
        
    user.is_active = status_data.is_active
    db.commit()
    return {"message": f"User status updated successfully", "is_active": user.is_active}

@app.get("/api/admin/analyses")
def get_admin_analyses(admin: User = Depends(get_admin_user), db: Session = Depends(get_db)):
    # Fetch analyses with user details
    analyses = db.query(Prediction).order_by(Prediction.created_at.desc()).limit(100).all()
    result = []
    for item in analyses:
        user = db.query(User).filter(User.id == item.user_id).first()
        result.append({
            "id": item.id,
            "username": user.username if user else "Unknown",
            "symbol": item.symbol,
            "rsi": item.rsi,
            "macd": item.macd,
            "moving_average": item.moving_average,
            "beta": item.beta,
            "pe_ratio": item.pe_ratio,
            "sharpe_ratio": item.sharpe_ratio,
            "volatility": item.volatility,
            "signal": item.signal,
            "confidence": item.confidence,
            "created_at": item.created_at.isoformat()
        })
    return result

@app.get("/api/admin/alerts")
def get_admin_alerts(admin: User = Depends(get_admin_user), db: Session = Depends(get_db)):
    alerts = db.query(Alert).order_by(Alert.created_at.desc()).all()
    result = []
    for item in alerts:
        user = db.query(User).filter(User.id == item.user_id).first()
        result.append({
            "id": item.id,
            "username": user.username if user else "Unknown",
            "symbol": item.symbol,
            "alert_type": item.alert_type,
            "threshold": item.threshold,
            "is_triggered": item.is_triggered,
            "created_at": item.created_at.isoformat()
        })
    return result

@app.delete("/api/admin/alerts/{alert_id}")
def admin_delete_alert(alert_id: int, admin: User = Depends(get_admin_user), db: Session = Depends(get_db)):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    db.delete(alert)
    db.commit()
    return {"message": "Alert deleted by admin successfully"}
