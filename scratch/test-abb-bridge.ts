import { AbbBridge } from '../src/services/bridge/abbBridge';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

async function test() {
  try {
    console.log('Testing ABB Bridge (TS)...');
    console.log('Username:', process.env.ABB_USERNAME);
    console.log('Client ID:', process.env.ABB_CLIENT_ID);
    
    // 1. Test Login
    const token = await AbbBridge.getAccessToken();
    console.log('Token obtained successfully.');
    
    // 2. Test Org Search
    const response = await AbbBridge.post('/api/organization/Organization/Search', {
      take: 100,
      skip: 0
    });
    
    console.log('Organizations found:', response.data.items?.length || 0);
    if (response.data.items) {
      response.data.items.forEach((org: any) => {
        console.log(` - ${org.name} (ID: ${org.id || org.organizationId})`);
      });
    }
    
  } catch (err: any) {
    console.error('Test Failed:');
    if (err.response) {
      console.error('Status:', err.response.status);
      console.error('Data:', JSON.stringify(err.response.data, null, 2));
    } else {
      console.error(err.message);
    }
  }
}

test();
