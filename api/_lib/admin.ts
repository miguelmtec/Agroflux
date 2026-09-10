import { sql } from '@vercel/postgres';
import type { VercelRequest } from '@vercel/node';
import { obterSessao } from './session';

// E-mails que enxergam o Painel Master. Configurável via variável de
// ambiente MASTER_EMAILS (separados por vírgula), com um padrão de fallback.
const MASTER_EMAILS = (process.env.MASTER_EMAILS || 'miguel@mtec.tec.br')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export function isMasterEmail(email: string): boolean {
  return MASTER_EMAILS.includes(String(email || '').trim().toLowerCase());
}

/** Retorna {uid, email} se a sessão pertence a um e-mail master, senão null. */
export async function exigirMaster(
  req: VercelRequest
): Promise<{ uid: string; email: string } | null> {
  const sessao = await obterSessao(req);
  if (!sessao) return null;
  const r = await sql`SELECT email FROM usuarios_auth WHERE id = ${sessao.uid}`;
  if (r.rows.length === 0) return null;
  const email = r.rows[0].email as string;
  if (!isMasterEmail(email)) return null;
  return { uid: sessao.uid, email };
}
