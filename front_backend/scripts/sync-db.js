
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// .env에서 DATABASE_URL을 가져오거나 직접 입력 (현재는 직접 입력)
const connectionString = "postgresql://postgres:password@127.0.0.1:5433/traivldb";

async function main() {
    const client = new Client({
        connectionString: connectionString,
    });

    try {
        await client.connect();
        console.log("\x1b[32m%s\x1b[0m", "✓ DB 연결 성공!");

        // 프로젝트 루트의 database/init.sql 경로 찾기
        const sqlPath = path.join(__dirname, '..', '..', 'database', 'init.sql');
        let sql = fs.readFileSync(sqlPath, 'utf8');

        // BOM 제거
        if (sql.startsWith('\uFEFF')) {
            sql = sql.slice(1);
        }

        console.log("매핑 중인 init.sql 데이터를 DB에 반영합니다...");
        await client.query(sql);
        console.log("\x1b[36m%s\x1b[0m", "✓ init.sql 데이터가 성공적으로 동기화되었습니다! (User 테이블 복구 완료)");
        console.log("이제 브라우저를 새로고침(F5)하여 변경된 이미지와 정상 작동을 확인하세요.");

    } catch (err) {
        console.error("\x1b[31m%s\x1b[0m", "✗ 동기화 실패:", err.message);
    } finally {
        await client.end();
    }
}

main();
