const axios = require('axios');
require('dotenv').config({ path: '.env.local' });

async function testCabot() {
  const username = process.env.ABB_USERNAME;
  const password = process.env.ABB_PASSWORD;
  const client_id = process.env.ABB_CLIENT_ID || '88691515-d913-43c3-b78b-333e6181b53e';

  console.log('Testing ABB Login...');

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

    // Search Assets in Cabot (340494)
    console.log('Searching for Assets in Cabot (340494)...');
    const assetResponse = await axios.post(
      'https://api.powertrain.abb.com/api/asset/Asset/Search',
      { organizationIds: ["340494"], take: 10, skip: 0 },
      { headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } }
    );

    const assets = assetResponse.data.items || [];
    console.log(`Found ${assets.length} assets.`);

    if (assets.length > 0) {
      const firstAsset = assets[0];
      console.log('Sample Asset:', JSON.stringify(firstAsset, null, 2));

      // Try LastKnown
      console.log(`Fetching LastKnown for Asset ${firstAsset.id}...`);
      try {
        const lastKnownRes = await axios.get(
          `https://api.powertrain.abb.com/api/timeseries/Timeseries/LastKnown/${firstAsset.id}`,
          { headers: { 'Authorization': `Bearer ${token}` } }
        );
        console.log('LastKnown Response:', JSON.stringify(lastKnownRes.data, null, 2));
      } catch (lkErr) {
        console.error('LastKnown failed:', lkErr.response?.data || lkErr.message);
      }
    }

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

testCabot();
