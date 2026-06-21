import requests
import time
import sys

BASE_URL = "http://localhost:8000/api"

def test_api():
    print("Testing backend API...")
    
    # 1. Register a user
    print("\n1. Registering user...")
    user_data = {"username": "testuser", "email": "test@example.com", "password": "password123"}
    try:
        r = requests.post(f"{BASE_URL}/auth/register", json=user_data)
        if r.status_code == 200:
            token = r.json().get("access_token")
            print("Register OK. Token received.")
        elif r.status_code == 400 and "already taken" in r.text:
            print("User already registered. Attempting login...")
            r_login = requests.post(f"{BASE_URL}/auth/login", json=user_data)
            token = r_login.json().get("access_token")
            if token:
                print("Login OK. Token received.")
            else:
                print("Login failed.", r_login.text)
                return
        else:
            print("Register Failed:", r.status_code, r.text)
            return
    except Exception as e:
        print("Error connecting to API:", e)
        return

    headers = {"Authorization": f"Bearer {token}"}

    # 2. Search stock
    print("\n2. Searching stock (AAPL)...")
    r = requests.get(f"{BASE_URL}/stocks/search?q=AAPL")
    if r.status_code == 200:
        print("Search OK:", r.json())
    else:
        print("Search Failed:", r.status_code, r.text)

    # 3. Analyze stock
    print("\n3. Analyzing stock (AAPL)...")
    r = requests.get(f"{BASE_URL}/stocks/AAPL/analysis", headers=headers)
    if r.status_code == 200:
        print("Analysis OK. Signal:", r.json().get("signal"))
    else:
        print("Analysis Failed:", r.status_code, r.text)
        
    print("\nAll basic tests completed.")

if __name__ == "__main__":
    test_api()
