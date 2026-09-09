const { Client } = require('pg');

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:password@127.0.0.1:5433/traivldb";

async function main() {
    const client = new Client({ connectionString });
    try {
        await client.connect();
        console.log("DB connection successful. Creating TravelJournal table...");

        const sql = `
            CREATE TABLE IF NOT EXISTS "TravelJournal" (
                "id" TEXT NOT NULL,
                "userId" TEXT NOT NULL,
                "scheduleId" TEXT,
                "title" TEXT NOT NULL,
                "city" TEXT NOT NULL,
                "startDate" TIMESTAMP(3),
                "endDate" TIMESTAMP(3),
                "coverImage" TEXT,
                "content" TEXT NOT NULL,
                "highlights" TEXT[],
                "mood" TEXT,
                "rating" DOUBLE PRECISION NOT NULL DEFAULT 5.0,
                "aiSummary" TEXT,
                "journalData" JSONB,
                "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

                CONSTRAINT "TravelJournal_pkey" PRIMARY KEY ("id")
            );

            DO $$ 
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_constraint WHERE conname = 'TravelJournal_userId_fkey'
                ) THEN
                    ALTER TABLE "TravelJournal" 
                    ADD CONSTRAINT "TravelJournal_userId_fkey" 
                    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
                END IF;
            END $$;
        `;

        await client.query(sql);
        console.log("✓ TravelJournal table successfully created/verified in Postgres!");
    } catch (err) {
        console.error("✗ Failed to create TravelJournal table:", err.message);
    } finally {
        await client.end();
    }
}

main();
