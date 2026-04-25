const { AbbBridge } = require('../src/services/bridge/abbBridge');
const axios = require('axios');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') });

// Manually mock the necessary parts since we are in JS
async function sanityCheck() {
    console.log("--- PTTS INDUSTRIAL OS: CIAM SANITY CHECK (JS) ---");
    const user = process.env.ABB_USERNAME;
    const pass = process.env.ABB_PASSWORD;

    if (!user || !pass) {
        console.error("❌ Credentials missing in .env.local");
        return;
    }

    try {
        console.log("1. Initiating Dynamic Discovery...");
        // We'll call the logic directly to avoid TS import issues in plain Node
        const { getDynamicBearerToken } = require('../src/services/identityService');
        const token = await getDynamicBearerToken();
        console.log("✅ Identity Verified. Bearer Token acquired.");

        console.log("\n2. Pulling Organizational Scope...");
        const res = await axios.post('https://api.powertrain.abb.com/api/organization/Organization/Search', 
            { take: 5, skip: 0 },
            { headers: { 'Authorization': `Bearer ${token}` } }
        );

        if (res.data && res.data.items) {
            console.log(`✅ Success! Found ${res.data.items.length} real organizations.`);
            res.data.items.forEach(org => console.log(`   - [${org.id}] ${org.name}`));
        }

    } catch (e) {
        console.error(`❌ FAILED: ${e.message}`);
        if (e.response) console.error(`Data: ${JSON.stringify(e.response.data)}`);
    }
}

sanityCheck();
