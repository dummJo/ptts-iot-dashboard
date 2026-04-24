const axios = require('axios');

async function debugAuth() {
    const user = "adam@ptts.co.id";
    const password = "Adam00703$$$$";
    const client_id = "k2spGAvfEich60kU63_lz7Ogrwsa";
    const url = "https://api.accessmanagement.motion.abb.com/polaris/oidc/token";

    console.log("--- CIAM AUTH DEBUGGER v3 (Official Endpoint) ---");

    try {
        console.log(`Testing with official parameters...`);
        const res = await axios.post(url, 
            new URLSearchParams({
                grant_type: 'password',
                username: user,
                password: password,
                client_id: client_id,
                scope: 'openid profile'
            }).toString(),
            { 
                headers: { 
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Origin': 'https://powertrain.abb.com'
                }, 
                timeout: 10000 
            }
        );
        console.log(`✅ SUCCESS! Token obtained!`);
    } catch (e) {
        console.log(`❌ FAIL: ${e.response?.status} - ${JSON.stringify(e.response?.data || e.message)}`);
    }
}

debugAuth();
