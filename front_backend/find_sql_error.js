
const fs = require('fs');
const path = require('path');

const sqlPath = path.join(__dirname, '..', 'database', 'init.sql');
const content = fs.readFileSync(sqlPath, 'utf8');
const lines = content.split('\n');

let currentTable = '';

console.log("Checking init.sql for column count mismatches...");

lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('INSERT INTO "Destination"')) {
        currentTable = 'Destination';
    } else if (trimmed.startsWith('INSERT INTO "Place"')) {
        currentTable = 'Place';
    }

    if (trimmed.startsWith('(') && (trimmed.endsWith('),') || trimmed.endsWith(');'))) {
        // 간단하게 콤마 개수로 파악 (따옴표 안의 콤마 제외 로직은 생략하고 대략적 파악)
        const parts = trimmed.match(/('.*?'|[^,]+)/g);
        const count = parts ? parts.length : 0;

        if (currentTable === 'Destination' && count !== 12) {
            console.log(`[!] Error at Line ${index + 1} (Destination): Expected 12, found ${count}`);
            console.log(`    Line: ${trimmed.substring(0, 50)}...`);
        }
        if (currentTable === 'Place' && count !== 14) {
            // 좀 더 정교한 쉼표 카운팅 (괄호 안의 내용만 추출)
            const rowContent = trimmed.substring(trimmed.indexOf('(') + 1, trimmed.lastIndexOf(')'));
            
            // 단순 쉼표 카운트 (문자열 내 쉼표 무시를 위해 간단한 상태 머신)
            let commaCount = 0;
            let inString = false;
            for(let char of rowContent) {
                if (char === "'") inString = !inString;
                if (char === ',' && !inString) commaCount++;
            }
            const actualValues = commaCount + 1;

            if (actualValues !== 14) {
                console.log(`[!] Error at Line ${index + 1} (Place): Expected 14, found ${actualValues}`);
                console.log(`    Line: ${trimmed.substring(0, 80)}...`);
            }
        }
    }
});
