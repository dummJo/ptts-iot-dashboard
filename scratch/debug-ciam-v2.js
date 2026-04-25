const axios = require('axios');

async function debugAuth() {
    const usernames = ["adam@ptts.co.id", "DEFAULT/adam@ptts.co.id"];
    const password = "Adam00703$$$$";
    
    const clientIds = [
        "k2spGAvfEich60kU63_lz7Ogrwsa",
        "iB3nB9Vvn5t55Vff_123xATBEf4a"
    ];

    const endpoints = [
        "https://api.accessmanagement.motion.abb.com/polaris/oidc/token",
        "https://polaris.iam.motion.abb.com/oauth2/token"
    ];

    console.log("--- CIAM AUTH DEBUGGER v2 (Prefix Test) ---");

    for (const url of endpoints) {
        for (const user of usernames) {
            for (const id of clientIds) {
                try {
                    console.log(`Testing User: ${user} | ID: ${id} | URL: ${url}`);
                    const res = await axios.post(url, 
                        new URLSearchParams({
                            grant_type: 'password',
                            username: user,
                            password: password,
                            client_id: id,
                            scope: 'openid profile email'
                        }).toString(),
                        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 5000 }
                    );
                    console.log(`✅ SUCCESS! Token obtained for ${user} with ID: ${id}`);
                    return;
                } catch (e) {
                    console.log(`❌ FAIL: ${e.response?.status} - ${JSON.stringify(e.response?.data || e.message)}`);
                }
            }
        }
    }
}

debugAuth();
