const { Client } = require('pg');

async function main() {
  const client = new Client({
    connectionString: "postgresql://postgres:password@127.0.0.1:5432/traivldb"
  });
  await client.connect();

  console.log('--- Row Structure for Place ---');
  const res = await client.query('SELECT * FROM "Place" WHERE name = $1 LIMIT 1', ['마키시 공설시장']);
  if (res.rows.length === 0) {
    console.log('No row found with name 마키시 공설시장');
  } else {
    for (const key in res.rows[0]) {
      console.log(`${key}: ${JSON.stringify(res.rows[0][key])}`);
    }
  }

  await client.end();
}

main().catch(err => console.error(err));
