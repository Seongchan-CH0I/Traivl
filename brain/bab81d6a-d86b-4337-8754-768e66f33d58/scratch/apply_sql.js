
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = "postgresql://postgres:password@127.0.0.1:5433/traivldb";

async function main() {
    const client = new Client({
        connectionString: connectionString,
    });

    try {
        await client.connect();
        console.log("Connected to database.");

        const sqlPath = path.join('c:', 'Traivl', 'Traivl', 'database', 'init.sql');
        let sql = fs.readFileSync(sqlPath, 'utf8');

        // Strip UTF-8 BOM if present
        if (sql.startsWith('\uFEFF')) {
            sql = sql.slice(1);
            console.log("Stripped BOM from init.sql");
        }

        console.log("Executing init.sql...");
        await client.query(sql);
        console.log("Database initialized successfully with 130 records.");

    } catch (err) {
        console.error("Error executing init.sql:", err);
    } finally {
        await client.end();
    }
}

main();
