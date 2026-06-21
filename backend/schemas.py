from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import datetime

# ── Auth Schemas ────────────────────────────────────────────────
class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=6)

class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    id: int
    username: str
    email: EmailStr
    role: str
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

# ── Stock Schemas ───────────────────────────────────────────────
class StockSearchResult(BaseModel):
    symbol: str
    name: Optional[str] = None
    price: Optional[float] = None
    change: Optional[float] = None
    market_cap: Optional[float] = None
    sector: Optional[str] = None
    industry: Optional[str] = None

class StockDetail(BaseModel):
    symbol: str
    name: Optional[str] = None
    price: Optional[float] = None
    change: Optional[float] = None
    change_percent: Optional[float] = None
    market_cap: Optional[float] = None
    pe_ratio: Optional[float] = None
    volume: Optional[int] = None
    day_high: Optional[float] = None
    day_low: Optional[float] = None
    fifty_two_week_high: Optional[float] = None
    fifty_two_week_low: Optional[float] = None
    open_price: Optional[float] = None
    previous_close: Optional[float] = None
    sector: Optional[str] = None
    industry: Optional[str] = None
    description: Optional[str] = None

# ── Analysis & Indicator Schemas ────────────────────────────────
class IndicatorValues(BaseModel):
    rsi: Optional[float] = None
    macd: Optional[float] = None
    macd_signal: Optional[float] = None
    macd_histogram: Optional[float] = None
    sma_20: Optional[float] = None
    sma_50: Optional[float] = None
    ema_12: Optional[float] = None
    ema_26: Optional[float] = None
    beta: Optional[float] = None
    pe_ratio: Optional[float] = None
    sharpe_ratio: Optional[float] = None
    volatility: Optional[float] = None

class AnalysisResponse(BaseModel):
    symbol: str
    signal: str  # "BUY", "HOLD", "SELL"
    confidence: float
    ai_explanation: str
    indicators: IndicatorValues

    model_config = ConfigDict(from_attributes=True)

# ── Watchlist Schemas ───────────────────────────────────────────
class WatchlistAdd(BaseModel):
    symbol: str

class WatchlistResponse(BaseModel):
    id: int
    symbol: str
    created_at: datetime
    current_price: Optional[float] = None
    name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

# ── Prediction/History Schemas ──────────────────────────────────
class PredictionResponse(BaseModel):
    id: int
    symbol: str
    rsi: Optional[float] = None
    macd: Optional[float] = None
    moving_average: Optional[float] = None
    beta: Optional[float] = None
    pe_ratio: Optional[float] = None
    sharpe_ratio: Optional[float] = None
    volatility: Optional[float] = None
    signal: str
    confidence: float
    ai_explanation: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# ── Comparison Schemas ──────────────────────────────────────────
class CompareRequest(BaseModel):
    symbols: List[str]

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "symbols": ["AAPL", "MSFT", "GOOGL"]
            }
        }
    )

class CompareResponse(BaseModel):
    stocks: List[Dict[str, Any]]

# ── Alert Schemas ───────────────────────────────────────────────
class AlertCreate(BaseModel):
    symbol: str
    alert_type: str  # "rsi_threshold", "signal_change", "volatility_spike"
    threshold: float

class AlertResponse(BaseModel):
    id: int
    symbol: str
    alert_type: str
    threshold: float
    is_triggered: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# ── Forecast Schemas ────────────────────────────────────────────
class ForecastPoint(BaseModel):
    date: str
    predicted_price: float
    lower_bound: float
    upper_bound: float

class ForecastResponse(BaseModel):
    symbol: str
    current_price: float
    forecast_points: List[ForecastPoint]
    trend: str
    confidence: float
    model_name: str = "LSTM"
    predicted_change_percent: float

    model_config = ConfigDict(from_attributes=True, protected_namespaces=())

# ── Admin Schemas ───────────────────────────────────────────────
class AdminStatsResponse(BaseModel):
    total_users: int
    total_analyses: int
    total_alerts: int
    active_users: int
    top_stocks: List[Dict[str, Any]]

class UserStatusUpdate(BaseModel):
    is_active: bool
