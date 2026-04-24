const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

async function proveMethodWorks() {
    const username = "DEFAULT/adam@ptts.co.id";
    const password = process.env.ABB_PASSWORD;
    
    const clientPool = [
        'k2spGAvfEich60kU63_lz7Ogrwsa',
        'iB3nB9Vvn5t55Vff_123xATBEf4a'
    ];

    const endpoints = [
        'https://polaris.iam.motion.abb.com/oauth2/token'
    ];

    for (const url of endpoints) {
        for (const client_id of clientPool) {
            try {
                const res = await axios.post(url, 
                    new URLSearchParams({
                        grant_type: 'password',
                        username,
                        password,
                        client_id,
                        scope: 'openid profile email'
                    }).toString(),
                    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 10000 }
                );
                if (res.data.access_token) {
                    console.log(`✅ SUCCESS with ID ${client_id}`);
                    return;
                }
            } catch (e) {
                console.log(`❌ FAIL ${client_id} (with DEFAULT/): ${JSON.stringify(e.response?.data || e.message)}`);
            }
        }
    }
}

proveMethodWorks();
