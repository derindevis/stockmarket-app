from dotenv import load_dotenv
from fastapi import FastAPI, Depends, HTTPException, status, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import json
from typing import List

from database import get_db, create_tables
from models import User, WatchlistItem, Prediction, Alert, ComparsionHistory, Forecast
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
from Forecast_service import generate_lstm_forecast

load_dotenv()

app = FastAPI(title="AI Stock Analysis & Forecasting Platform API")
