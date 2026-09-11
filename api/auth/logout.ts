import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '@vercel/postgres';
import { jwtVerify } from 'jose';

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET não configurado nas Environment Variables.');
}
const secret = new TextEncoder().encode(process.env.JWT_SECRET);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const token = (req as any).cookies?.session;
    if (token) {
      try {
        const { payload } = await jwtVerify(token, secret);
        const uid = payload.uid as string;
        // Incrementa a versão de sessão: qualquer token antigo (inclusive esse)
        // deixa de ser aceito nas próximas verificações, mesmo antes de expirar.
        await sql`UPDATE usuarios_auth SET sessao_versao = sessao_versao + 1 WHERE id = ${uid}`;
      } catch {
        // token já inválido/expirado — nada a invalidar, segue o fluxo normal
      }
    }
  } catch (err) {
    console.error('Erro em /api/auth/logout:', err);
  }

  res.setHeader(
    'Set-Cookie',
    'session=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax; Secure'
  );
  res.status(200).json({ success: true });
}
