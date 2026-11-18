import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import { prisma } from "./db";

const COOKIE = "mila_session";

function secret() {
  const value = process.env.AUTH_SECRET?.trim();
  if (!value) {
    throw new Error("AUTH_SECRET is required");
  }
  return new TextEncoder().encode(value);
}

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
  zone?: string | null;
};

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createSession(user: SessionUser) {
  const token = await new SignJWT({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    zone: user.zone ?? null,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret());

  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function destroySession() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export async function getSession(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return {
      id: String(payload.id),
      email: String(payload.email),
      name: String(payload.name),
      role: payload.role as Role,
      zone: (payload.zone as string | null) ?? null,
    };
  } catch {
    return null;
  }
}

export async function requireUser(roles?: Role[]) {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHORIZED");
  if (roles && !roles.includes(session.role)) throw new Error("FORBIDDEN");
  return session;
}

export async function loginWithCredentials(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user || !user.active) return null;
  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) return null;
  const session: SessionUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    zone: user.zone,
  };
  await createSession(session);
  return session;
}

export function homeForRole(role: Role) {
  if (role === "CLIENTE") return "/cliente";
  return "/especialista";
}
