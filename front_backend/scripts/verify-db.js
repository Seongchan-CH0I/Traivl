/**
 * 배포된 DB가 앱이 기대하는 상태인지 검증한다.
 * init.sql 적용 → prisma db push → (선택) 벡터 적재 이후에 실행할 것.
 *
 * 사용법:
 *   DIRECT_DATABASE_URL="postgresql://...:5432/postgres" node scripts/verify-db.js
 */
const { Client } = require('pg');

const connectionString =
    process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL;

if (!connectionString) {
    console.error('❌ DIRECT_DATABASE_URL(또는 DATABASE_URL) 환경변수가 필요합니다.');
    process.exit(1);
}

// 앱이 실제로 읽고 쓰는 테이블 목록
const REQUIRED_TABLES = [
    'User',
    'Destination',
    'Place',
    'Schedule',
    'UserDnaStat',
    'AiUsageLog',
];

// 챗봇 RAG / 일정 추천용 벡터 테이블 (ingestion_pipeline.py 실행 후 채워짐)
const VECTOR_TABLES = ['langchain_pg_collection', 'langchain_pg_embedding'];

async function main() {
    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false },
    });
    await client.connect();

    let failed = false;

    // 1. pgvector 확장
    const ext = await client.query(
        `SELECT extversion FROM pg_extension WHERE extname = 'vector'`
    );
    if (ext.rowCount > 0) {
        console.log(`✅ pgvector 확장 설치됨 (v${ext.rows[0].extversion})`);
    } else {
        console.log('❌ pgvector 확장 없음 → CREATE EXTENSION vector; 실행 필요');
        failed = true;
    }

    // 2. 필수 테이블 존재 여부
    const { rows: present } = await client.query(
        `SELECT tablename FROM pg_tables WHERE schemaname = 'public'`
    );
    const names = new Set(present.map((r) => r.tablename));

    console.log('\n[필수 테이블]');
    for (const t of REQUIRED_TABLES) {
        if (names.has(t)) {
            const { rows } = await client.query(
                `SELECT count(*)::int AS n FROM "${t}"`
            );
            console.log(`  ✅ ${t.padEnd(24)} ${rows[0].n}건`);
        } else {
            console.log(`  ❌ ${t.padEnd(24)} 없음 → prisma db push 필요`);
            failed = true;
        }
    }

    console.log('\n[벡터 테이블 — AI 기능용]');
    for (const t of VECTOR_TABLES) {
        if (names.has(t)) {
            const { rows } = await client.query(
                `SELECT count(*)::int AS n FROM "${t}"`
            );
            const n = rows[0].n;
            const mark = n > 0 ? '✅' : '⚠️ ';
            console.log(
                `  ${mark} ${t.padEnd(24)} ${n}건${n === 0 ? '  (ingestion_pipeline.py 미실행)' : ''}`
            );
        } else {
            console.log(`  ⚠️  ${t.padEnd(24)} 없음  (AI 기능 사용 시 필요)`);
        }
    }

    // 3. 데이터 정합성 — 앱 첫 화면이 의존하는 값
    if (names.has('Destination') && names.has('Place')) {
        const { rows } = await client.query(`
            SELECT d.id, d.name, count(p.id)::int AS places
            FROM "Destination" d
            LEFT JOIN "Place" p ON p."destinationId" = d.id
            GROUP BY d.id, d.name
            ORDER BY places DESC
        `);
        console.log('\n[도시별 장소 수]');
        for (const r of rows) {
            const mark = r.places > 0 ? '  ' : '⚠️';
            console.log(`  ${mark} ${r.id.padEnd(14)} ${r.name.padEnd(20)} ${r.places}건`);
        }
        const empty = rows.filter((r) => r.places === 0);
        if (empty.length > 0) {
            console.log(`  ⚠️  장소가 0건인 도시 ${empty.length}개 — 화면이 비어 보일 수 있음`);
        }
    }

    await client.end();

    console.log(
        failed
          ? '\n❌ 검증 실패 — 위 항목을 먼저 처리하세요.'
          : '\n✅ 검증 통과 — 앱이 기대하는 스키마가 모두 준비되었습니다.'
    );
    process.exitCode = failed ? 1 : 0;
}

main().catch((err) => {
    console.error('❌ 연결 또는 조회 실패:', err.message);
    process.exit(1);
});
