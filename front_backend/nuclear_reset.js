const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function main() {
  const client = new Client({
    connectionString: "postgresql://postgres:password@127.0.0.1:5432/traivldb"
  });
  await client.connect();

  console.log('--- Dropping existing tables ---');
  await client.query('DROP TABLE IF EXISTS "Place" CASCADE');
  await client.query('DROP TABLE IF EXISTS "Destination" CASCADE');
  await client.query('DROP TABLE IF EXISTS "User" CASCADE');
  await client.query('DROP TABLE IF EXISTS "_prisma_migrations" CASCADE');

  console.log('--- Table "Place" and others dropped. ---');
  
  await client.end();
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
