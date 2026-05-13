const { Client } = require('pg');

async function main() {
  const client = new Client({
    connectionString: "postgresql://postgres:password@127.0.0.1:5433/traivldb"
  });
  await client.connect();

  console.log('--- Checking for Restored Master Data ---');
  
  // 1. 제주 연돈 확인
  const yeondon = await client.query('SELECT * FROM "Place" WHERE name = $1 LIMIT 1', ['연돈']);
  console.log('Jeju Yeondon:', yeondon.rows.length > 0 ? '✅ FOUND' : '❌ NOT FOUND');

  // 2. 부산 자갈치 시장 확인
  const jagalchi = await client.query('SELECT * FROM "Place" WHERE name = $1 LIMIT 1', ['자갈치 시장']);
  console.log('Busan Jagalchi:', jagalchi.rows.length > 0 ? '✅ FOUND' : '❌ NOT FOUND');

  // 3. 전체 장소 개수 확인 (130개여야 함)
  const count = await client.query('SELECT count(*) FROM "Place"');
  console.log('Total Places Count:', count.rows[0].count);

  await client.end();
}

main().catch(err => {
  console.error('❌ Connection Failed:', err.message);
  process.exit(1);
});
