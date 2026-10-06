const { Client } = require('pg');

async function main() {
  const client = new Client({
    connectionString: "postgresql://postgres:password@127.0.0.1:5433/traivldb"
  });
  await client.connect();
  console.log('✅ Connected to Database!');

  const updates = [
    { name: '설악산', url: '/images/places/seoraksan.jpg' },
    { name: '루브르 박물관', url: '/images/places/louvre.webp' },
    { name: '키시모토', url: '/images/places/kishimoto.jpg' }
  ];

  for (const item of updates) {
    const res = await client.query(
      'UPDATE "Place" SET "imageUrl" = $1 WHERE name = $2 RETURNING id, name, "imageUrl"',
      [item.url, item.name]
    );
    if (res.rows.length > 0) {
      console.log(`성공: [${item.name}] -> ${res.rows[0].imageUrl}`);
    } else {
      console.log(`주의: [${item.name}] 행을 찾지 못했습니다.`);
    }
  }

  await client.end();
  console.log('🎉 모든 업데이트 완료!');
}

main().catch(err => {
  console.error('❌ 에러 발생:', err.message);
});
