from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean, Text, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), unique=True, index=True, nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), default="user")  # "user" or "admin"
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    watchlist_items = relationship("WatchlistItem", back_populates="user", cascade="all, delete-orphan")
    predictions = relationship("Prediction", back_populates="user", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="user", cascade="all, delete-orphan")
    comparisons = relationship("ComparisonHistory", back_populates="user", cascade="all, delete-orphan")

class WatchlistItem(Base):
    __tablename__ = "watchlist_items"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    symbol = Column(String(20), index=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="watchlist_items")

    __table_args__ = (UniqueConstraint("user_id", "symbol", name="uq_user_watchlist_symbol"),)

class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    symbol = Column(String(20), nullable=False)
    rsi = Column(Float, nullable=True)
    macd = Column(Float, nullable=True)
    moving_average = Column(Float, nullable=True)
    beta = Column(Float, nullable=True)
    pe_ratio = Column(Float, nullable=True)
    sharpe_ratio = Column(Float, nullable=True)
    volatility = Column(Float, nullable=True)
    signal = Column(String(10), nullable=False)  # "BUY", "HOLD", "SELL"
    confidence = Column(Float, nullable=False)   # 0 to 100
    ai_explanation = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="predictions")

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    symbol = Column(String(20), nullable=False)
    alert_type = Column(String(50), nullable=False)  # "rsi_threshold", "signal_change", "volatility_spike"
    threshold = Column(Float, nullable=False)
    is_triggered = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="alerts")

class ComparisonHistory(Base):
    __tablename__ = "comparison_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    symbols = Column(Text, nullable=False)  # JSON-serialized array of symbols
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="comparisons")

class Forecast(Base):
    __tablename__ = "forecasts"

    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String(20), index=True, nullable=False)
    predicted_price = Column(Float, nullable=False)
    trend = Column(String(20), nullable=False)  # "uptrend", "downtrend", "sideways"
    confidence = Column(Float, nullable=False)
    model_name = Column(String(50), default="LSTM")
    forecast_date = Column(String(20), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
