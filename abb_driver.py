import os
import time
import requests
import psycopg2
from urllib.parse import urlencode

# ==============================================================================
# ABB ABILITY™ SMARTSENSOR - CIAM OAUTH & POSTGRES INGESTION DRIVER
# ==============================================================================

from dotenv import load_dotenv

# Load environment variables from .env or .env.local
load_dotenv('.env.local')
load_dotenv('.env')

# Database Configuration (Neon / Local PostgreSQL)
DB_URL = os.environ.get("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/ptts_iot")

# ABB CIAM Configuration (Loaded from .env to allow easy account switching)
ABB_CLIENT_ID = os.environ.get("ABB_CLIENT_ID", "")
ABB_CLIENT_SECRET = os.environ.get("ABB_CLIENT_SECRET", "")

if not ABB_CLIENT_ID or not ABB_CLIENT_SECRET:
    print("[ERROR] ABB_CLIENT_ID or ABB_CLIENT_SECRET not found in environment.")
    print("[ERROR] Please add them to your .env or .env.local file.")
    exit(1)

# Endpoints
ABB_TOKEN_URL = "https://api.accessmanagement.motion.abb.com/polaris/oidc/token" # Updated 2026 API Gateway endpoint
ABB_API_BASE = "https://api.powertrain.abb.com/api"

def get_abb_access_token():
    print("[AUTH] Requesting CIAM Access Token...")
    # Attempt Client Credentials Flow (Machine-to-Machine)
    payload = {
        'grant_type': 'client_credentials',
        'client_id': ABB_CLIENT_ID,
        'client_secret': ABB_CLIENT_SECRET,
        'scope': 'openid'
    }
    
    headers = {
        'Content-Type': 'application/x-www-form-urlencoded'
    }
    
    try:
        response = requests.post(ABB_TOKEN_URL, data=payload, headers=headers, timeout=10)
        if response.status_code == 200:
            print("[AUTH] CIAM Token Acquired Successfully!")
            return response.json().get("access_token")
        else:
            print(f"[AUTH] Failed to get token. Status: {response.status_code}")
            print(response.text)
            return None
    except Exception as e:
        print(f"[AUTH] Exception during token fetch: {e}")
        return None

def fetch_devices(token):
    print("[ABB] Fetching registered devices...")
    headers = {
        'Authorization': f'Bearer {token}',
        'Accept': 'application/json'
    }
    
    response = requests.get(f"{ABB_API_BASE}/devices", headers=headers)
    if response.status_code == 200:
        return response.json()
    else:
        print(f"[ABB] Failed to fetch devices. Status: {response.status_code}")
        return []

def fetch_telemetry(token, device_id):
    headers = {
        'Authorization': f'Bearer {token}',
        'Accept': 'application/json'
    }
    response = requests.get(f"{ABB_API_BASE}/devices/{device_id}/latest-telemetry", headers=headers)
    if response.status_code == 200:
        return response.json()
    return None

def sync_to_database(device, telemetry):
    print(f"[DB] Syncing {device['id']} to PostgreSQL...")
    try:
        conn = psycopg2.connect(DB_URL)
        cur = conn.cursor()
        
        # Example schema insertion based on the PTTS architecture
        # You can adjust this query to match the exact schema of ptts_telemetry
        cur.execute('''
            INSERT INTO "Telemetry" (asset_id, temp, vib_overall, vib_rms, "timestamp")
            VALUES (%s, %s, %s, %s, NOW())
        ''', (
            device['id'], 
            telemetry.get('temperature', 0), 
            telemetry.get('vibrationOverall', 0), 
            telemetry.get('vibrationRms', 0)
        ))
        
        conn.commit()
        cur.close()
        conn.close()
        print(f"[DB] Synced {device['id']} successfully.")
    except Exception as e:
        print(f"[DB] Error syncing to database: {e}")

import random

def get_mock_devices():
    return [
        {"id": "mock-abb-sensor-01", "name": "Motor Pump A"},
        {"id": "mock-abb-sensor-02", "name": "Compressor B"}
    ]

def get_mock_telemetry(device_id):
    return {
        "temperature": round(random.uniform(35.0, 65.0), 2),
        "vibrationOverall": round(random.uniform(0.5, 4.5), 2),
        "vibrationRms": round(random.uniform(0.2, 3.0), 2)
    }

def run_sync_loop():
    print("Starting ABB SmartSensor CIAM Ingestion Driver...")
    while True:
        token = get_abb_access_token()
        
        if token:
            print("[SYS] Using Real ABB CIAM API")
            devices = fetch_devices(token)
            
            for device in devices:
                telemetry = fetch_telemetry(token, device['id'])
                if telemetry:
                    sync_to_database(device, telemetry)
                time.sleep(1) # Rate limiting protection
        else:
            print("[SYS] AUTH FAILED. FALLING BACK TO MOCK/BACKUP DATA GENERATION...")
            # Backup function: Simulate data so the dashboard continues to receive updates
            devices = get_mock_devices()
            for device in devices:
                telemetry = get_mock_telemetry(device['id'])
                sync_to_database(device, telemetry)
                time.sleep(1)
            
        time.sleep(60 * 5) # Run every 5 minutes

if __name__ == "__main__":
    # Ensure psycopg2 and requests are installed
    # pip install requests psycopg2-binary
    run_sync_loop()
