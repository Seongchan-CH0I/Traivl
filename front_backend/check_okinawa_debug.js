
const { Client } = require('pg');
const connectionString = "postgresql://postgres:password@127.0.0.1:5433/traivldb";

async function checkOkinawa() {
    const client = new Client({ connectionString });
    try {
        await client.connect();
        console.log("DB Connected.");

        console.log("\n--- [Destination] Okinawa Info ---");
        const destRes = await client.query('SELECT id, name, "imageUrl" FROM "Destination" WHERE id = \'JP_OKINAWA\'');
        console.table(destRes.rows);

        console.log("\n--- [Place] Okinawa Places ---");
        const placeRes = await client.query('SELECT name, "imageUrl" FROM "Place" WHERE "destinationId" = \'JP_OKINAWA\' LIMIT 5');
        console.table(placeRes.rows);

    } catch (err) {
        console.error("Error:", err.message);
    } finally {
        await client.end();
    }
}

checkOkinawa();
