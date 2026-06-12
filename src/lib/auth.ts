/**
 * Autenticação local: e-mail + senha com scrypt (node:crypto) e sessão
 * persistida no banco com token aleatório em cookie httpOnly.
 * Substitui o Supabase Auth do protótipo original — zero serviços externos.
 */

import { cookies } from "next/headers";
import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { cache } from "react";
import { prisma } from "./prisma";

export const SESSION_COOKIE = "ttt_session";
const SESSION_DAYS = 30;

// ── Senhas ──────────────────────────────────────

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}

// ── Sessões ─────────────────────────────────────

export async function createSession(userId: string): Promise<void> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);

  await prisma.authSession.create({ data: { userId, token, expiresAt } });

  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    path: "/",
  });
}

export async function destroySession(): Promise<void> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (token) {
    await prisma.authSession.deleteMany({ where: { token } });
  }
  cookies().delete(SESSION_COOKIE);
}

export interface SessionUser {
  id: string;
  email: string;
  name: string | null;
  createdAt: Date;
}

/**
 * Usuário da sessão atual, ou null. Cacheado por request (React cache),
 * então pode ser chamado em layout + página sem query duplicada.
 */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.authSession.findUnique({
    where: { token },
    include: { user: true },
  });
  if (!session || session.expiresAt < new Date()) {
    if (session) await prisma.authSession.delete({ where: { id: session.id } });
    return null;
  }

  const { id, email, name, createdAt } = session.user;
  return { id, email, name, createdAt };
});
