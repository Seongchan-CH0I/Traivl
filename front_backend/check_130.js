const { Client } = require('pg');
async function main() {
  const client = new Client({ connectionString: "postgresql://postgres:password@127.0.0.1:5433/traivldb" });
  await client.connect();
  const count = await client.query('SELECT count(*) FROM "Place"');
  console.log('Total Count:', count.rows[0].count);
  const berlin = await client.query('SELECT * FROM "Place" WHERE name = $1', ['커리36']);
  console.log('Berlin Curry 36:', berlin.rows.length > 0 ? '✅ FOUND' : '❌ NOT FOUND');
  await client.end();
}
main();
