import urllib.request
import urllib.parse
import json
import base64

# Extracting credentials from the URL provided
client_id = "jVGkP2KmBsLq5Qp5JXnY7IzUOPga"
client_secret = "S6Kr4pBm7fUn3Zu3xfLypI0RFctlhMAoVA2YBk6LsMQa"

# Potential token endpoints for ABB CIAM
endpoints = [
    "https://accessmanagement.motion.abb.com/polaris/oauth2/token",
    "https://accessmanagement.motion.abb.com/polaris/token",
    "https://api.powertrain.abb.com/devhubauth/ciam/token"
]

data = urllib.parse.urlencode({
    'grant_type': 'client_credentials',
    'client_id': client_id,
    'client_secret': client_secret,
    'scope': 'openid'
}).encode('ascii')

for endpoint in endpoints:
    print(f"Trying {endpoint}...")
    req = urllib.request.Request(endpoint, data=data)
    req.add_header('Content-Type', 'application/x-www-form-urlencoded')
    
    try:
        with urllib.request.urlopen(req) as response:
            result = json.loads(response.read().decode())
            print(f"SUCCESS on {endpoint}!")
            print(result)
            break
    except urllib.error.HTTPError as e:
        print(f"Failed: {e.code} {e.reason}")
        print(e.read().decode('utf-8'))
    except Exception as e:
        print(f"Error: {e}")
