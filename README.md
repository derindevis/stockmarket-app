# 📈 AI-Powered Stock Analysis & Forecasting Platform

A comprehensive stock analysis, forecasting, and tracking platform built as a college project. The platform features dynamic technical indicator calculations, automated BUY/HOLD/SELL recommendation generation, an LSTM neural network model for 30-day stock price predictions, and an administrative control panel.

---

## 🏗️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React 19, Vite, Tailwind CSS v4, Recharts, Framer Motion, Axios, React Router DOM |
| **Backend** | FastAPI, SQLAlchemy, Pydantic v2, Passlib (with bcrypt for hashing), JWT Auth |
| **Database** | SQLite (`stockdata.db` automatically generated on backend startup) |
| **Forecasting & ML** | PyTorch (LSTM Neural Network), Scikit-Learn |
| **Data Engine** | Yahoo Finance (`yfinance` with `curl_cffi` browser emulation to prevent 429s) |

---

## ✨ Features

- **🔐 User & Admin Auth**: Secure registration and login using JWT tokens with role-based access controls. The very first user to register on the platform is automatically designated an **Admin**.
- **🔍 Stock Search & Detail**: Look up any stock by its ticker (e.g., `AAPL`, `MSFT`, `TSLA`, or Indian tickers like `RELIANCE.NS`). View real-time prices, standard details (P/E, Market Cap, Day High/Low), and interactive charts.
- **📊 Technical Analysis Engine**: Automatically calculates indicators (RSI, MACD, SMA-20, SMA-50, EMA-12, EMA-26, Beta, Volatility, Sharpe Ratio) using Pandas/Numpy and scores them to produce a clear **BUY**, **HOLD**, or **SELL** recommendation with an AI explanation.
- **🔮 LSTM Forecasting**: Trains a custom 2-layer LSTM model dynamically using the past year of historical closing prices to forecast the next 30 days of trading, displaying predicted prices along with upper and lower confidence intervals.
- **⭐ Watchlists**: Save stocks to your watchlist to track their current prices and navigate quickly to analysis.
- **🔔 Price & Indicator Alerts**: Set alerts for specific stocks (e.g., RSI threshold crossover, signal change, or volatility spikes) and see them trigger in real time.
- **⚖️ Stock Comparison**: Compare 2 to 4 stocks side-by-side with metric comparison tables highlighting the best/worst performers.
- **🛡️ Admin Dashboard**: Exclusive access for admins to view platform metrics, track top searched stocks, list all users, change active/inactive account status, and view platform-wide predictions/alerts.

---

## 📂 Project Structure

```text
stock-app-simple/
├── backend/
│   ├── main.py              # FastAPI application (main entry point)
│   ├── auth.py              # JWT authentication & password hashing
│   ├── database.py          # SQLAlchemy SQLite connection & tables generator
│   ├── models.py            # SQLAlchemy database models
│   ├── schemas.py           # Pydantic v2 validation models
│   ├── stock_service.py     # Yahoo Finance data API wrapper
│   ├── indicators.py        # Custom math calculations (RSI, MACD, Sharpe, Beta, Volatility)
│   ├── recommendation.py    # Scoring engine & natural language explanation generator
│   ├── forecast_service.py  # PyTorch LSTM forecasting pipeline
│   ├── requirements.txt     # Python backend dependencies
│   └── venv/                # Isolated virtual environment (ignored from VCS)
│
├── frontend/
│   ├── index.html           # HTML container (uses Google Fonts Inter)
│   ├── package.json         # NPM dependencies & scripts
│   ├── postcss.config.js    # PostCSS configs
│   ├── vite.config.js       # Vite React server configuration
│   └── src/
│       ├── api.js           # Axios base client with authorization headers
│       ├── AuthContext.jsx  # Auth provider (manages login state and user details)
│       ├── index.css        # Core Tailwind imports & custom dark color tokens
│       ├── main.jsx         # React application bootstrap
│       ├── App.jsx          # React Router & Sidebar navigation layout
│       ├── components/      # Sidebar, ProtectedRoute, AdminRoute, StockChart, IndicatorCharts
│       └── pages/           # Landing, Login, Register, Dashboard, StockAnalysis, Compare, Watchlist, Alerts, Forecast, Admin pages
```

---

## 🚀 Getting Started (Windows)

### 1. Run the Backend (FastAPI)

1. Open PowerShell/Terminal in the `backend` directory:
   ```powershell
   cd C:\Users\derin\OneDrive\Desktop\new\stock-app-simple\backend
   ```
2. Create and activate the Python virtual environment:
   ```powershell
   python -m venv venv
   .\venv\Scripts\Activate.ps1
   ```
3. Install the required dependencies:
   ```powershell
   pip install -r requirements.txt
   ```
4. Start the development server:
   ```powershell
   uvicorn main:app --reload --port 8000
   ```
   *The backend documentation will be accessible at `http://localhost:8000/docs`.*

### 2. Run the Frontend (React + Vite)

1. Open a new PowerShell/Terminal in the `frontend` directory:
   ```powershell
   cd C:\Users\derin\OneDrive\Desktop\new\stock-app-simple\frontend
   ```
2. Install the node packages:
   ```powershell
   npm install
   ```
3. Start the Vite server:
   ```powershell
   npm run dev
   ```
   *The frontend dashboard will be running at `http://localhost:5173`.*

---

## 📝 Demo Credentials & Role Assignment

- **Admin Account**: Register a brand new account through the `/register` page. The very first user registered is automatically assigned the `admin` role and can access the Admin pages (accessible via the sidebar or `http://localhost:5173/admin/dashboard`).
- **Standard Users**: Any subsequent users registered will be assigned the standard `user` role.
