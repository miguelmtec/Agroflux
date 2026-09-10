import { SignJWT, jwtVerify } from 'jose';
import type { VercelRequest } from '@vercel/node';

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'troque-esta-chave-antes-de-ir-para-producao'
);

const THIRTY_DAYS = 60 * 60 * 24 * 30;

export async function criarCookieSessao(uid: string, familiaId: string): Promise<string> {
  const token = await new SignJWT({ uid, familiaId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(secret);
  return `session=${token}; HttpOnly; Path=/; Max-Age=${THIRTY_DAYS}; SameSite=Lax; Secure`;
}

export const cookieLogout = 'session=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax; Secure';

export async function obterSessao(
  req: VercelRequest
): Promise<{ uid: string; familiaId: string } | null> {
  const token = (req as any).cookies?.session;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    return { uid: payload.uid as string, familiaId: payload.familiaId as string };
  } catch {
    return null;
  }
}
