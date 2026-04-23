const { AbbBridge } = require('../src/services/bridge/abbBridge');
require('dotenv').config({ path: '.env.local' });

async function test() {
  try {
    console.log('Testing ABB Bridge...');
    console.log('Username:', process.env.ABB_USERNAME);
    
    // 1. Test Login
    const token = await AbbBridge.getAccessToken();
    console.log('Token obtained:', token.substring(0, 20) + '...');
    
    // 2. Test Org Search
    const response = await AbbBridge.post('/api/organization/Organization/Search', {
      take: 100,
      skip: 0
    });
    
    console.log('Organizations found:', response.data.items?.length || 0);
    console.log('Items:', JSON.stringify(response.data.items, null, 2));
    
  } catch (err) {
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
