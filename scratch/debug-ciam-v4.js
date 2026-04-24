const axios = require('axios');

async function debugAuth() {
    const user = "adam@ptts.co.id";
    const password = "Adam00703$$$$";
    
    // This is the known working backend client ID from the integration guide
    const client_id = "88691515-d913-43c3-b78b-333e6181b53e"; 
    const url = "https://api.accessmanagement.motion.abb.com/polaris/oidc/token";

    console.log("--- CIAM AUTH DEBUGGER v4 (Guide ID) ---");

    try {
        const res = await axios.post(url, 
            new URLSearchParams({
                grant_type: 'password',
                username: user,
                password: password,
                client_id: client_id,
                scope: 'openid profile'
            }).toString(),
            { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 10000 }
        );
        console.log(`✅ SUCCESS! Token obtained!`);
    } catch (e) {
        console.log(`❌ FAIL: ${e.response?.status} - ${JSON.stringify(e.response?.data || e.message)}`);
    }
}

debugAuth();
