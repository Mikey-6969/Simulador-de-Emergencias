import { seedDemoCatalog } from "../src/lib/seed-catalog";

async function main() {
  await seedDemoCatalog();
  console.log("Seed MILA OK");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .then(async () => {
    const { prisma } = await import("../src/lib/db");
    await prisma.$disconnect();
  });
