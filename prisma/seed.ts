import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // Clear existing data
  await prisma.guest.deleteMany();
  await prisma.table.deleteMany();
  await prisma.fixture.deleteMany();
  await prisma.venue.deleteMany();

  // Create venue
  const venue = await prisma.venue.create({
    data: {
      name: "Majma Mall Wedding Venue",
      width: 1800,
      height: 700,
    },
  });

  // Create fixtures
  await prisma.fixture.createMany({
    data: [
      {
        name: "Pelamin",
        type: "STAGE",
        x: 20,
        y: 180,
        width: 100,
        height: 250,
        color: "#f5f5f5",
        venueId: venue.id,
      },
      {
        name: "Caterer Area",
        type: "CATERER",
        x: 1650,
        y: 80,
        width: 120,
        height: 480,
        color: "#e5e5e5",
        venueId: venue.id,
      },
      // L-shaped walkway - horizontal part (row 3, cols 1-9)
      {
        name: "Walkway",
        type: "WALKWAY",
        x: 150,
        y: 265,
        width: 1080,
        height: 70,
        color: "#22c55e",
        venueId: venue.id,
      },
      // L-shaped walkway - vertical part (col 9, rows 3-5)
      {
        name: "Walkway",
        type: "WALKWAY",
        x: 1185,
        y: 265,
        width: 45,
        height: 300,
        color: "#22c55e",
        venueId: venue.id,
      },
      {
        name: "Entrance Depan Majma Mall",
        type: "ENTRANCE",
        x: 600,
        y: 630,
        width: 400,
        height: 45,
        color: "#d4d4d4",
        venueId: venue.id,
      },
    ],
  });

  // Create tables - 49 total
  const tables = [];
  const startX = 160;
  const spacingX = 120;
  const tableSize = 60;

  // Y positions for each row (increased vertical spacing)
  const row1Y = 50;
  const row2Y = 160;
  const row3Y = 270;  // Same level as walkway, but only cols 10-12 have tables
  const row4Y = 380;
  const row5Y = 490;

  let tableNum = 1;

  // Row 1: 12 tables (cols 1-12)
  for (let col = 0; col < 12; col++) {
    tables.push({
      name: `Table ${tableNum++}`,
      x: startX + col * spacingX,
      y: row1Y,
      width: tableSize,
      height: tableSize,
      seats: 10,
      shape: "ROUND" as const,
      venueId: venue.id,
    });
  }

  // Row 2: 12 tables (cols 1-12)
  for (let col = 0; col < 12; col++) {
    tables.push({
      name: `Table ${tableNum++}`,
      x: startX + col * spacingX,
      y: row2Y,
      width: tableSize,
      height: tableSize,
      seats: 10,
      shape: "ROUND" as const,
      venueId: venue.id,
    });
  }

  // Row 3: Only 3 tables (cols 10-12), rest is walkway
  for (let col = 9; col < 12; col++) {
    tables.push({
      name: `Table ${tableNum++}`,
      x: startX + col * spacingX,
      y: row3Y,
      width: tableSize,
      height: tableSize,
      seats: 10,
      shape: "ROUND" as const,
      venueId: venue.id,
    });
  }

  // Row 4: 8 tables (cols 1-8) + 3 tables (cols 10-12) = 11 tables
  // Left side (cols 1-8)
  for (let col = 0; col < 8; col++) {
    tables.push({
      name: `Table ${tableNum++}`,
      x: startX + col * spacingX,
      y: row4Y,
      width: tableSize,
      height: tableSize,
      seats: 10,
      shape: "ROUND" as const,
      venueId: venue.id,
    });
  }
  // Right side (cols 10-12)
  for (let col = 9; col < 12; col++) {
    tables.push({
      name: `Table ${tableNum++}`,
      x: startX + col * spacingX,
      y: row4Y,
      width: tableSize,
      height: tableSize,
      seats: 10,
      shape: "ROUND" as const,
      venueId: venue.id,
    });
  }

  // Row 5: 8 tables (cols 1-8) + 3 tables (cols 10-12) = 11 tables
  // Left side (cols 1-8)
  for (let col = 0; col < 8; col++) {
    tables.push({
      name: `Table ${tableNum++}`,
      x: startX + col * spacingX,
      y: row5Y,
      width: tableSize,
      height: tableSize,
      seats: 10,
      shape: "ROUND" as const,
      venueId: venue.id,
    });
  }
  // Right side (cols 10-12)
  for (let col = 9; col < 12; col++) {
    tables.push({
      name: `Table ${tableNum++}`,
      x: startX + col * spacingX,
      y: row5Y,
      width: tableSize,
      height: tableSize,
      seats: 10,
      shape: "ROUND" as const,
      venueId: venue.id,
    });
  }

  await prisma.table.createMany({
    data: tables,
  });

  // Create sample guests
  const createdTables = await prisma.table.findMany({
    orderBy: { name: "asc" },
  });

  const sampleGuests = [
    "Ahmad bin Hassan",
    "Siti Aminah binti Abdullah",
    "Muhammad Farid",
    "Nurul Aisyah",
    "Mohd Rizal",
    "Fatimah Zahra",
    "Ismail bin Yusof",
    "Zainab binti Omar",
    "Hafiz Rahman",
    "Aida Syafiqah",
  ];

  if (createdTables.length > 0) {
    for (let i = 0; i < sampleGuests.length; i++) {
      await prisma.guest.create({
        data: {
          name: sampleGuests[i],
          tableId: createdTables[0].id,
          seatNumber: i + 1,
        },
      });
    }
  }

  console.log("Seed completed successfully!");
  console.log(`Created venue: ${venue.name}`);
  console.log(`Created ${tables.length} tables`);
  console.log(`Created ${sampleGuests.length} sample guests`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
