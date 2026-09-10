import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '@vercel/postgres';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'troque-esta-chave-antes-de-ir-para-producao'
);
const MASTER_EMAILS = (process.env.MASTER_EMAILS || 'miguel@mtec.tec.br')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

function isMasterEmail(email: string): boolean {
  return MASTER_EMAILS.includes(String(email || '').trim().toLowerCase());
}

async function criarCookieSessao(uid: string, familiaId: string): Promise<string> {
  const token = await new SignJWT({ uid, familiaId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(secret);
  return `session=${token}; HttpOnly; Path=/; Max-Age=${60 * 60 * 24 * 30}; SameSite=Lax; Secure`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método não permitido.' });
    return;
  }

  try {
    const { email, senha } = req.body || {};
    if (!email || !senha) {
      res.status(400).json({ error: 'Informe e-mail e senha.' });
      return;
    }
    const cleanEmail = String(email).trim().toLowerCase();

    const result = await sql`
      SELECT ua.id, ua.senha_hash, ua.familia_id, f.nome_familia, f.dados,
             f.status, f.acesso_ate, f.limite_usuarios
      FROM usuarios_auth ua
      JOIN familias f ON f.id = ua.familia_id
      WHERE ua.email = ${cleanEmail}
    `;

    if (result.rows.length === 0) {
      res.status(401).json({ error: 'E-mail ou senha incorretos.' });
      return;
    }

    const row = result.rows[0];
    const senhaOk = await bcrypt.compare(String(senha), row.senha_hash);
    if (!senhaOk) {
      res.status(401).json({ error: 'E-mail ou senha incorretos.' });
      return;
    }

    const master = isMasterEmail(cleanEmail);
    const hoje = new Date().toISOString().split('T')[0];
    const expirou = !master && row.acesso_ate && String(row.acesso_ate).split('T')[0] < hoje;
    const acessoLiberado = master || (row.status === 'ativo' && !expirou);

    const cookie = await criarCookieSessao(row.id as string, row.familia_id as string);
    res.setHeader('Set-Cookie', cookie);
    res.status(200).json({
      success: true,
      familiaId: row.familia_id,
      nomeFamilia: row.nome_familia,
      dados: row.dados,
      isMaster: master,
      acessoLiberado,
      statusAcesso: expirou ? 'expirado' : row.status,
      acessoAte: row.acesso_ate,
      limiteUsuarios: row.limite_usuarios,
    });
  } catch (err) {
    console.error('Erro em /api/auth/login:', err);
    res.status(500).json({ error: 'Erro interno ao entrar. Tente novamente.' });
  }
}
