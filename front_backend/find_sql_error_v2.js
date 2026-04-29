
const fs = require('fs');
const path = require('path');

const sqlPath = path.join(__dirname, '..', 'database', 'init.sql');
const content = fs.readFileSync(sqlPath, 'utf8');
const lines = content.split('\n');

let currentTable = '';

lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('INSERT INTO "Destination"')) {
        currentTable = 'Destination';
    } else if (trimmed.startsWith('INSERT INTO "Place"')) {
        currentTable = 'Place';
    }

    if (trimmed.startsWith('(') && (trimmed.endsWith('),') || trimmed.endsWith(');'))) {
        const rowContent = trimmed.substring(trimmed.indexOf('(') + 1, trimmed.lastIndexOf(')'));
        
        let valueCount = 0;
        let inString = false;
        let bracketLevel = 0;
        let buffer = '';

        for(let i = 0; i < rowContent.length; i++) {
            const char = rowContent[i];
            if (char === "'") inString = !inString;
            if (!inString) {
                if (char === '[') bracketLevel++;
                if (char === ']') bracketLevel--;
            }
            
            if (char === ',' && !inString && bracketLevel === 0) {
                valueCount++;
            }
        }
        valueCount++; // last value

        if (currentTable === 'Destination' && valueCount !== 12) {
            console.log(`❌ ERROR at Line ${index + 1}: [Destination] Expected 12, but found ${valueCount}`);
            console.log(`   Line: ${trimmed}`);
        }
        if (currentTable === 'Place' && valueCount !== 14) {
            console.log(`❌ ERROR at Line ${index + 1}: [Place] Expected 14, but found ${valueCount}`);
            console.log(`   Line: ${trimmed}`);
        }
    }
});
