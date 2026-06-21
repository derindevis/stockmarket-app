import os
import logging
from typing import Dict, Any

# Configure logging
logger = logging.getLogger(__name__)

# Initialize Gemini Client lazily or at module import
client = None

def get_gemini_client():
    global client
    if client is None:
        gemini_key = os.getenv("GEMINI_API_KEY")
        if gemini_key and gemini_key != "YOUR_GEMINI_API_KEY_HERE" and gemini_key.strip() != "":
            try:
                from google import genai
                client = genai.Client()
                logger.info("Successfully initialized Gemini Client.")
            except Exception as e:
                logger.error(f"Failed to initialize Gemini Client: {e}")
    return client

def generate_recommendation(indicators: dict) -> dict:
    """
    Generates a BUY/HOLD/SELL recommendation signal and confidence score.
    Score ranges from -8 to +8.
    - score >= 3: BUY
    - score <= -3: SELL
    - else: HOLD
    """
    score = 0
    
    # 1. RSI Scoring (Oversold is Bullish (+2), Overbought is Bearish (-2))
    rsi = indicators.get("rsi", 50.0)
    if rsi < 30:
        score += 2
    elif rsi < 40:
        score += 1
    elif rsi > 70:
        score -= 2
    elif rsi > 60:
        score -= 1
        
    # 2. MACD Scoring (Crossovers and Momentum)
    macd = indicators.get("macd", 0.0)
    signal_line = indicators.get("macd_signal", 0.0)
    hist = indicators.get("macd_histogram", 0.0)
    
    if hist > 0:
        if macd > signal_line:
            score += 2  # Bullish crossover and positive momentum
        else:
            score += 1  # Positive momentum
    else:
        if macd < signal_line:
            score -= 2  # Bearish crossover and negative momentum
        else:
            score -= 1  # Negative momentum
            
    # 3. Moving Average Scoring
    current_price = indicators.get("current_price")
    sma_20 = indicators.get("sma_20", 0.0)
    sma_50 = indicators.get("sma_50", 0.0)
    
    if current_price:
        if current_price > sma_50 and current_price > sma_20:
            score += 2  # Strong uptrend
        elif current_price > sma_50:
            score += 1  # General uptrend
        elif current_price < sma_50 and current_price < sma_20:
            score -= 2  # Strong downtrend
        elif current_price < sma_50:
            score -= 1  # General downtrend
            
    # 4. Volatility Scoring (Low volatility is stable (+1), High is risky (-1))
    vol = indicators.get("volatility", 0.0)
    if vol > 0:
        if vol < 20:
            score += 1
        elif vol > 40:
            score -= 1
            
    # 5. Sharpe Ratio Scoring (Good risk-adjusted return (+1), Poor return (-1))
    sharpe = indicators.get("sharpe_ratio", 0.0)
    if sharpe > 1.0:
        score += 1
    elif sharpe < 0.0:
        score -= 1
        
    # Determine signal based on total score
    if score >= 3:
        signal = "BUY"
    elif score <= -3:
        signal = "SELL"
    else:
        signal = "HOLD"
        
    # Compute confidence as a percentage (max score is 8, so map score magnitude to 0-100%)
    abs_score = abs(score)
    confidence = 40.0 + (abs_score / 8.0) * 55.0
    confidence = min(100.0, max(0.0, confidence))
    
    return {
        "signal": signal,
        "confidence": round(confidence, 1),
        "score": score
    }

def generate_explanation(indicators: dict, signal: str, confidence: float, symbol: str = "the stock") -> str:
    """
    Generates an explanation summarizing why the recommendation was given.
    Uses Google Gemini if available, otherwise falls back to template-based explanation.
    """
    g_client = get_gemini_client()
    if g_client is not None:
        try:
            from google.genai import types
            
            rsi = indicators.get("rsi", "N/A")
            macd = indicators.get("macd", "N/A")
            macd_signal = indicators.get("macd_signal", "N/A")
            macd_hist = indicators.get("macd_histogram", "N/A")
            price = indicators.get("current_price", "N/A")
            sma20 = indicators.get("sma_20", "N/A")
            sma50 = indicators.get("sma_50", "N/A")
            ema12 = indicators.get("ema_12", "N/A")
            ema26 = indicators.get("ema_26", "N/A")
            beta = indicators.get("beta", "N/A")
            pe_ratio = indicators.get("pe_ratio", "N/A")
            sharpe = indicators.get("sharpe_ratio", "N/A")
            vol = indicators.get("volatility", "N/A")
            
            prompt = f"""You are a professional stock market analyst. 
Analyze the technical indicators below and write a concise, punchy 3-4 sentence stock analysis explaining why a technical signal of "{signal}" with {confidence:.1f}% confidence has been generated.

Stock Symbol: {symbol.upper()}
Current Price: ${price}

Calculated Technical Indicators:
- RSI (14): {rsi}
- MACD Line: {macd}
- MACD Signal Line: {macd_signal}
- MACD Histogram: {macd_hist}
- Simple Moving Average (20-day): ${sma20}
- Simple Moving Average (50-day): ${sma50}
- Exponential Moving Average (12-day): ${ema12}
- Exponential Moving Average (26-day): ${ema26}
- Beta: {beta}
- P/E Ratio: {pe_ratio}
- Sharpe Ratio: {sharpe}
- Annualized Volatility: {vol}%

Requirements:
- Keep the response strictly under 100 words.
- Focus only on the 2-3 most important indicators driving the "{signal}" decision.
- Avoid generic preambles or wrap-ups. Be direct and clear.
- Do not use markdown titles, bullet points, or lists."""

            response = g_client.models.generate_content(
                model="gemini-3.1-flash-lite",
                contents=prompt,
                config=types.GenerateContentConfig(
                    temperature=0.3,
                    max_output_tokens=256
                )
            )
            if response.text:
                return response.text.strip() + "\n\n*(Analysis generated dynamically by Google Gemini AI)*"
        except Exception as e:
            logger.error(f"Gemini API generation failed: {e}. Falling back to template-based explanation.")

    # Fallback to template-based logic
    rsi = indicators.get("rsi", 50.0)
    macd_hist = indicators.get("macd_histogram", 0.0)
    price = indicators.get("current_price", 0.0)
    sma20 = indicators.get("sma_20", 0.0)
    sma50 = indicators.get("sma_50", 0.0)
    vol = indicators.get("volatility", 0.0)
    sharpe = indicators.get("sharpe_ratio", 0.0)
    
    sentences = []
    
    # RSI Description
    if rsi < 30:
        sentences.append(f"RSI is oversold at {rsi:.1f}, indicating a strong technical buying opportunity.")
    elif rsi < 40:
        sentences.append(f"RSI is leaning towards oversold at {rsi:.1f}, indicating mild bullish sentiment.")
    elif rsi > 70:
        sentences.append(f"RSI is overbought at {rsi:.1f}, suggesting the stock is currently overvalued and due for a correction.")
    elif rsi > 60:
        sentences.append(f"RSI is showing overbought pressure at {rsi:.1f}, showing bearish divergence.")
    else:
        sentences.append(f"RSI is in a neutral range at {rsi:.1f}, indicating balanced buying and selling pressure.")
        
    # MACD Description
    if macd_hist > 0:
        sentences.append(f"MACD exhibits positive momentum (histogram: {macd_hist:.3f}), implying upward pressure on the price.")
    else:
        sentences.append(f"MACD shows a bearish configuration (histogram: {macd_hist:.3f}), indicating negative momentum.")
        
    # Moving Average Description
    if price > 0:
        if price > sma50 and price > sma20:
            sentences.append(f"The stock is trading above both its 20-day (${sma20:.2f}) and 50-day (${sma50:.2f}) moving averages, which represents a strong bullish uptrend.")
        elif price > sma50:
            sentences.append(f"The stock is trading above its 50-day moving average (${sma50:.2f}), showing general upward momentum.")
        elif price < sma50 and price < sma20:
            sentences.append(f"The stock is trading below both its 20-day (${sma20:.2f}) and 50-day (${sma50:.2f}) moving averages, indicating a strong bearish downtrend.")
        else:
            sentences.append(f"The stock is trading below its 50-day moving average (${sma50:.2f}), suggesting downward trend resistance.")
            
    # Volatility Description
    if vol > 0:
        if vol < 20:
            sentences.append(f"Annualized volatility is low at {vol:.1f}%, indicating stable price action.")
        elif vol > 40:
            sentences.append(f"Annualized volatility is high at {vol:.1f}%, highlighting increased risk and price fluctuations.")
        else:
            sentences.append(f"Annualized volatility is moderate at {vol:.1f}%.")
            
    # Sharpe Ratio Description
    if sharpe != 0.0:
        if sharpe > 1.0:
            sentences.append(f"The Sharpe Ratio of {sharpe:.2f} is favorable, representing good risk-adjusted returns.")
        elif sharpe < 0:
            sentences.append(f"The Sharpe Ratio of {sharpe:.2f} is negative, suggesting poor historical returns relative to risk.")
        else:
            sentences.append(f"The Sharpe Ratio of {sharpe:.2f} indicates moderate risk-adjusted returns.")
            
    # Conclusion
    sentences.append(f"Overall, our technical indicator analysis yields a {signal} recommendation with {confidence:.1f}% confidence for {symbol.upper()}.")
    
    return " ".join(sentences) + "\n\n*(Analysis generated by local fallback engine)*"
