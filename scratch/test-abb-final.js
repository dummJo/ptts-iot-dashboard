const axios = require('axios');
require('dotenv').config({ path: '.env.local' });

async function test() {
  const username = process.env.ABB_USERNAME || 'adam@ptts.co.id';
  const password = process.env.ABB_PASSWORD || 'Adam00703$$$$';
  const client_id = process.env.ABB_CLIENT_ID || '88691515-d913-43c3-b78b-333e6181b53e';

  console.log('Testing ABB Login for:', username);

  try {
    const response = await axios.post(
      'https://accessmanagement.motion.abb.com/polaris/token',
      new URLSearchParams({
        grant_type: 'password',
        username,
        password,
        client_id,
        scope: 'openid'
      }).toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    const token = response.data.access_token;
    console.log('SUCCESS: Token obtained.');

    // Now test Org Search
    console.log('Searching for Organizations...');
    const orgResponse = await axios.post(
      'https://api.powertrain.abb.com/api/organization/Organization/Search',
      { take: 100, skip: 0 },
      { headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } }
    );

    console.log('Organizations found:', orgResponse.data.items?.length || 0);
    orgResponse.data.items?.forEach(org => {
      console.log(` - ${org.name} (ID: ${org.id || org.organizationId})`);
    });

  } catch (err) {
    console.error('FAILED:');
    if (err.response) {
      console.error('Status:', err.response.status);
      console.error('Data:', JSON.stringify(err.response.data, null, 2));
    } else {
      console.error(err.message);
    }
  }
}

test();
