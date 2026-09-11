import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '@vercel/postgres';
import { jwtVerify } from 'jose';

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET não configurado nas Environment Variables.');
}
const secret = new TextEncoder().encode(process.env.JWT_SECRET);
const MASTER_EMAILS = (process.env.MASTER_EMAILS || 'miguel@mtec.tec.br')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

function isMasterEmail(email: string): boolean {
  return MASTER_EMAILS.includes(String(email || '').trim().toLowerCase());
}

async function obterSessao(req: VercelRequest): Promise<{ uid: string; familiaId: string; sv: number } | null> {
  const token = (req as any).cookies?.session;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    return { uid: payload.uid as string, familiaId: payload.familiaId as string, sv: (payload.sv as number) || 1 };
  } catch {
    return null;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const sessao = await obterSessao(req);
    if (!sessao) {
      res.status(401).json({ authenticated: false });
      return;
    }

    const result = await sql`
      SELECT ua.email, ua.sessao_versao, f.nome_familia, f.dados, f.status, f.acesso_ate, f.limite_usuarios
      FROM usuarios_auth ua
      JOIN familias f ON f.id = ua.familia_id
      WHERE ua.id = ${sessao.uid}
    `;

    if (result.rows.length === 0) {
      res.status(401).json({ authenticated: false });
      return;
    }

    const row = result.rows[0];

    // Se a sessão foi revogada (logout, ou versão incrementada por outro motivo), recusa.
    if ((row.sessao_versao || 1) !== sessao.sv) {
      res.status(401).json({ authenticated: false });
      return;
    }

    const master = isMasterEmail(row.email as string);
    const hoje = new Date().toISOString().split('T')[0];
    const expirou = !master && row.acesso_ate && String(row.acesso_ate).split('T')[0] < hoje;
    const acessoLiberado = master || (row.status === 'ativo' && !expirou);

    res.status(200).json({
      authenticated: true,
      familiaId: sessao.familiaId,
      email: row.email,
      nomeFamilia: row.nome_familia,
      dados: row.dados,
      isMaster: master,
      acessoLiberado,
      statusAcesso: expirou ? 'expirado' : row.status,
      acessoAte: row.acesso_ate,
      limiteUsuarios: row.limite_usuarios,
    });
  } catch (err) {
    console.error('Erro em /api/auth/me:', err);
    res.status(500).json({ authenticated: false });
  }
}
