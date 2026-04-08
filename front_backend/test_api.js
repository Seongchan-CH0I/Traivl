const fetch = require('node-fetch');

async function main() {
  const url = 'http://localhost:3000/api/places?limit=12';
  const response = await fetch(url);
  const json = await response.json();
  
  if (json.success) {
    const makishi = json.data.find(p => p.name === '마키시 공설시장');
    console.log('--- Makishi Data ---');
    console.log(JSON.stringify(makishi, null, 2));
  } else {
    console.error('API Error:', json.error);
  }
}

main().catch(err => console.error(err));
