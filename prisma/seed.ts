import { PrismaClient, Role, Zone } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const ZONES: Zone[] = ["NORTE", "SUR", "ORIENTE", "OCCIDENTE"];

const zoneSlug: Record<Zone, string> = {
  NORTE: "norte",
  SUR: "sur",
  ORIENTE: "oriente",
  OCCIDENTE: "occidente",
};

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
  const password = process.env.MILA_DEMO_PASSWORD?.trim();
  if (!password) {
    console.log("Seed omitido: define MILA_DEMO_PASSWORD para cargar el catálogo.");
    return;
  }

  await upsertUser({
    email: "admin@mila.app",
    name: "Ana Admin",
    role: "ADMIN",
    password,
  });

  // 4 especialistas (1 por zona) — escalan cuando el técnico no puede resolver
  const especialistas = [
    { zone: "NORTE" as Zone, name: "Elena Especialista Norte", email: "especialista.norte@mila.app" },
    { zone: "SUR" as Zone, name: "Sergio Especialista Sur", email: "especialista.sur@mila.app" },
    { zone: "ORIENTE" as Zone, name: "Olivia Especialista Oriente", email: "especialista.oriente@mila.app" },
    { zone: "OCCIDENTE" as Zone, name: "Óscar Especialista Occidente", email: "especialista.occidente@mila.app" },
  ];

  for (const e of especialistas) {
    await upsertUser({
      email: e.email,
      name: e.name,
      role: "COORDINADOR",
      password,
      zone: e.zone,
    });
  }

  // 8 técnicos (2 por zona)
  const tecnicos: Array<{
    email: string;
    name: string;
    zone: Zone;
    skills: string[];
  }> = [
    { email: "tecnico.norte1@mila.app", name: "Tomás Técnico Norte 1", zone: "NORTE", skills: ["redes", "wifi", "general"] },
    { email: "tecnico.norte2@mila.app", name: "Nadia Técnico Norte 2", zone: "NORTE", skills: ["impresoras", "pos", "general"] },
    { email: "tecnico.sur1@mila.app", name: "Sofía Técnico Sur 1", zone: "SUR", skills: ["hardware", "pos", "general"] },
    { email: "tecnico.sur2@mila.app", name: "Samuel Técnico Sur 2", zone: "SUR", skills: ["redes", "cctv", "general"] },
    { email: "tecnico.oriente1@mila.app", name: "Omar Técnico Oriente 1", zone: "ORIENTE", skills: ["software", "office", "general"] },
    { email: "tecnico.oriente2@mila.app", name: "Irene Técnico Oriente 2", zone: "ORIENTE", skills: ["impresoras", "redes", "general"] },
    { email: "tecnico.occidente1@mila.app", name: "Óscar Técnico Occidente 1", zone: "OCCIDENTE", skills: ["hardware", "redes", "general"] },
    { email: "tecnico.occidente2@mila.app", name: "Úrsula Técnico Occidente 2", zone: "OCCIDENTE", skills: ["pos", "software", "general"] },
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
        zones: [t.zone],
        skills: t.skills,
        capacityPerDay: 5,
        available: true,
      },
      create: {
        userId: user.id,
        zones: [t.zone],
        skills: t.skills,
        capacityPerDay: 5,
        available: true,
      },
    });
  }

  // 10 clientes por zona (40 total)
  let clientCount = 0;
  for (const zone of ZONES) {
    const slug = zoneSlug[zone];
    for (let i = 1; i <= 10; i++) {
      const n = String(i).padStart(2, "0");
      await upsertUser({
        email: `cliente.${slug}.${n}@mila.app`,
        name: `Cliente ${zone} ${n}`,
        role: "CLIENTE",
        password,
        zone,
        phone: `300${ZONES.indexOf(zone)}${String(1000000 + i).slice(1)}`.slice(0, 10),
      });
      clientCount += 1;
    }
  }

  console.log("Seed MILA OK");
  console.log({
    admin: "admin@mila.app",
    especialistas: especialistas.length,
    tecnicos: tecnicos.length,
    clientes: clientCount,
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
