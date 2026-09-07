/**
 * database/init.sql 을 대상 DB에 적용한다.
 * psql 없이 pg 드라이버만으로 실행하기 위한 스크립트.
 *
 * 사용법:
 *   DIRECT_DATABASE_URL="postgresql://postgres:...@db.xxx.supabase.co:5432/postgres" \
 *     node scripts/apply-init-sql.js
 *
 * 주의: DDL이 포함되므로 반드시 pooler(6543)가 아닌 직접 연결(5432)을 사용할 것.
 *      init.sql 은 User/Destination/Place 를 DROP ... CASCADE 후 재생성한다.
 */
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const connectionString =
    process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL;

if (!connectionString) {
    console.error('❌ DIRECT_DATABASE_URL(또는 DATABASE_URL) 환경변수가 필요합니다.');
    process.exit(1);
}

if (connectionString.includes(':6543')) {
    console.error(
        '❌ pooler(6543) 주소로는 DDL이 실패합니다. 직접 연결(5432) 주소를 사용하세요.'
    );
    process.exit(1);
}

const sqlPath = path.join(__dirname, '..', '..', 'database', 'init.sql');

async function main() {
    const sql = fs.readFileSync(sqlPath, 'utf8');
    console.log(`📄 ${sqlPath}`);
    console.log(`   ${(sql.length / 1024).toFixed(1)}KB 로드 완료`);

    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false },
        statement_timeout: 120_000,
    });

    await client.connect();
    console.log('🔌 DB 연결 성공');

    try {
        // init.sql 전체를 하나의 트랜잭션으로 실행 — 중간에 깨지면 전부 롤백된다.
        await client.query('BEGIN');
        await client.query(sql);
        await client.query('COMMIT');
        console.log('✅ init.sql 적용 완료');

        const { rows } = await client.query(`
            SELECT
              (SELECT count(*) FROM "User")        AS users,
              (SELECT count(*) FROM "Destination") AS destinations,
              (SELECT count(*) FROM "Place")       AS places
        `);
        console.log('📊 적재 결과:', rows[0]);
    } catch (err) {
        await client.query('ROLLBACK').catch(() => {});
        console.error('❌ 실패 (전체 롤백됨):', err.message);
        process.exitCode = 1;
    } finally {
        await client.end();
    }
}

main().catch((err) => {
    console.error('❌ 예상치 못한 오류:', err);
    process.exit(1);
});
