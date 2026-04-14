const { Client } = require('pg');
const client = new Client({
  connectionString: "postgresql://neondb_owner:npg_5UDyV9sWezbg@ep-silent-lab-a19svv7x.ap-southeast-1.aws.neon.tech/neondb?sslmode=require",
});

async function test() {
  try {
    console.log('Connecting to Neon...');
    await client.connect();
    console.log('✅ Connected successfully!');
    const res = await client.query('SELECT NOW()');
    console.log('Server time:', res.rows[0]);
    await client.end();
  } catch (err) {
    console.error('❌ Connection failed:', err);
  }
}

test();
