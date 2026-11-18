import { PrismaClient, Role, Zone } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function upsertUser(data: {
  email: string;
  name: string;
  role: Role;
  password: string;
  zone?: Zone;
  phone?: string;
}) {
  const passwordHash = await bcrypt.hash(data.password, 10);
  return prisma.user.upsert({
    where: { email: data.email },
    update: {
      name: data.name,
      role: data.role,
      passwordHash,
      zone: data.zone,
      phone: data.phone,
      active: true,
    },
    create: {
      email: data.email,
      name: data.name,
      role: data.role,
      passwordHash,
      zone: data.zone,
      phone: data.phone,
    },
  });
}

async function main() {
  if (process.env.MILA_SEED_DEMO !== "1") {
    console.log("Seed omitido: define MILA_SEED_DEMO=1 para cargar cuentas de desarrollo.");
    return;
  }

  const password = process.env.MILA_DEMO_PASSWORD?.trim();
  if (!password) {
    throw new Error("MILA_DEMO_PASSWORD is required when MILA_SEED_DEMO=1");
  }

  const admin = await upsertUser({
    email: "admin@mila.app",
    name: "Ana Admin",
    role: "ADMIN",
    password,
  });

  const coordinator = await upsertUser({
    email: "coord@mila.app",
    name: "Carlos Coordinador",
    role: "COORDINADOR",
    password,
  });

  const cliente = await upsertUser({
    email: "cliente@mila.app",
    name: "Clara Cliente",
    role: "CLIENTE",
    password,
    zone: "NORTE",
    phone: "3001112233",
  });

  const tecnicos = [
    {
      email: "tecnico.norte@mila.app",
      name: "Tomás Norte",
      zone: "NORTE" as Zone,
      zones: ["NORTE"],
      skills: ["redes", "impresoras", "general"],
    },
    {
      email: "tecnico.sur@mila.app",
      name: "Sofía Sur",
      zone: "SUR" as Zone,
      zones: ["SUR", "OCCIDENTE"],
      skills: ["hardware", "pos", "general"],
    },
    {
      email: "tecnico.oriente@mila.app",
      name: "Omar Oriente",
      zone: "ORIENTE" as Zone,
      zones: ["ORIENTE", "NORTE"],
      skills: ["software", "office", "general"],
    },
  ];

  for (const t of tecnicos) {
    const user = await upsertUser({
      email: t.email,
      name: t.name,
      role: "TECNICO",
      password,
      zone: t.zone,
    });
    await prisma.technicianProfile.upsert({
      where: { userId: user.id },
      update: {
        zones: t.zones,
        skills: t.skills,
        capacityPerDay: 4,
        available: true,
      },
      create: {
        userId: user.id,
        zones: t.zones,
        skills: t.skills,
        capacityPerDay: 4,
        available: true,
      },
    });
  }

  console.log("Seed MILA OK");
  console.log({
    admin: admin.email,
    coordinator: coordinator.email,
    cliente: cliente.email,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
