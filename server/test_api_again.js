const jwt = require('jsonwebtoken');
require('dotenv').config();

async function run() {
  const token = jwt.sign(
    { userId: 'a483f375-ce05-49e4-b29c-85d090fc66e0', username: 'test_farmer_a', role: 'FARMER' },
    process.env.JWT_SECRET || 'dev_secret_key_change_in_production',
    { expiresIn: '1h' }
  );
  
  const res = await fetch('http://localhost:3000/api/animals?page=1&pageSize=100', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  const json = await res.json();
  console.log('API Status:', res.status);
  console.log('API Return Array isArray:', Array.isArray(json));
  console.log('API Return Count:', Array.isArray(json) ? json.length : json.data?.length);
  if (!Array.isArray(json) && json.error) console.log('Error:', json.error);
}
run().catch(console.error);
