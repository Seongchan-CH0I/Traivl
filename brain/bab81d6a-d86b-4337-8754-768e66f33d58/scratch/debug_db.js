
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("--- Destinations ---");
    const destinations = await prisma.destination.findMany({
        select: { id: true, name: true }
    });
    console.log(JSON.stringify(destinations, null, 2));

    console.log("\n--- Place Counts per Destination ---");
    const placeCounts = await prisma.place.groupBy({
        by: ['destinationId'],
        _count: { id: true }
    });
    console.log(JSON.stringify(placeCounts, null, 2));

    console.log("\n--- Sample Places for JP_KYOTO ---");
    const kyotoPlaces = await prisma.place.findMany({
        where: { destinationId: 'JP_KYOTO' },
        take: 5
    });
    console.log(JSON.stringify(kyotoPlaces, null, 2));
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
