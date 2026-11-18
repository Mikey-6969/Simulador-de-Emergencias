import { ensureCatalogSeed } from "../src/lib/seed-catalog";

async function main() {
  if (!process.env.MILA_DEMO_PASSWORD?.trim()) {
    console.log("Seed omitido: define MILA_DEMO_PASSWORD para cargar el catálogo.");
    return;
  }
  await ensureCatalogSeed();
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
