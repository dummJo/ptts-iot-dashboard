const axios = require('axios');

async function debugAuth() {
    const username = "adam@ptts.co.id";
    const password = "Adam00703$$$$";
    
    const clientIds = [
        "k2spGAvfEich60kU63_lz7Ogrwsa",
        "88691515-d913-43c3-b78b-333e6181b53e",
        "iB3nB9Vvn5t55Vff_123xATBEf4a",
        "0oa17865c3y6ZkL3z5d7" // Common Okta/OIDC pattern for some ABB services
    ];

    const endpoints = [
        "https://polaris.iam.motion.abb.com/oauth2/token",
        "https://accessmanagement.motion.abb.com/polaris/token",
        "https://api.accessmanagement.motion.abb.com/polaris/token"
    ];

    console.log("--- CIAM AUTH DEBUGGER ---");

    for (const url of endpoints) {
        for (const id of clientIds) {
            try {
                console.log(`Testing ID: ${id} at ${url}`);
                const res = await axios.post(url, 
                    new URLSearchParams({
                        grant_type: 'password',
                        username,
                        password,
                        client_id: id,
                        scope: 'openid profile email'
                    }).toString(),
                    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 5000 }
                );
                console.log(`✅ SUCCESS! Token obtained with ID: ${id}`);
                return;
            } catch (e) {
                console.log(`❌ FAIL: ${e.response?.status} - ${JSON.stringify(e.response?.data || e.message)}`);
            }
        }
    }
}

debugAuth();
