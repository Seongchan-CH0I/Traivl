
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const counts = await prisma.place.groupBy({
        by: ['destinationId'],
        _count: {
            id: true
        }
    });
    console.log(JSON.stringify(counts, null, 2));
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
