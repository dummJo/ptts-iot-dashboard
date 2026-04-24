import { AbbBridge } from '../src/services/bridge/abbBridge';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load local environment
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

async function sanityCheck() {
    console.log("--- PTTS INDUSTRIAL OS: CIAM SANITY CHECK ---");
    console.log(`Target User: ${process.env.ABB_USERNAME}`);
    
    try {
        console.log("1. Attempting Dynamic Handshake...");
        const token = await AbbBridge.getAccessToken();
        console.log("✅ Identity Verified. Token acquired.");

        console.log("\n2. Attempting Organizational Scope Discovery...");
        const response = await AbbBridge.post('/api/organization/Organization/Search', {
            take: 5,
            skip: 0
        });

        if (response.data && response.data.items) {
            console.log(`✅ Success! Found ${response.data.items.length} organizations.`);
            response.data.items.forEach((org: any) => {
                console.log(`   - [${org.id}] ${org.name}`);
            });
        } else {
            console.log("⚠️ Handshake succeeded but no organizations returned.");
        }

        console.log("\n--- SANITY CHECK PASSED ---");
    } catch (e: any) {
        console.error("\n❌ SANITY CHECK FAILED");
        console.error(`Error: ${e.message}`);
        if (e.response) {
            console.error(`Status: ${e.response.status}`);
            console.error(`Data: ${JSON.stringify(e.response.data)}`);
        }
    }
}

sanityCheck();
