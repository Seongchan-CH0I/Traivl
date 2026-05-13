
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const sqlPath = path.join(__dirname, '..', '..', 'database', 'init.sql');
const syncScript = path.join(__dirname, 'sync-db.js');

console.log("\x1b[35m%s\x1b[0m", "👀 init.sql 감시를 시작합니다...");
console.log(`대상: ${sqlPath}`);

let timeout;
fs.watch(sqlPath, (event) => {
    if (event === 'change') {
        // 디바운싱: 저장 시 여러 번 발생하는 이벤트 방지
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            console.log("\x1b[33m%s\x1b[0m", "📝 init.sql 변경 감지! 동기화 중...");
            exec(`node "${syncScript}"`, (err, stdout, stderr) => {
                if (err) {
                    console.error(err);
                    return;
                }
                console.log(stdout);
            });
        }, 500);
    }
});
