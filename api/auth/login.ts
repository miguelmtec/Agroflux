import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '@vercel/postgres';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET não configurado nas Environment Variables.');
}
const secret = new TextEncoder().encode(process.env.JWT_SECRET);
const MASTER_EMAILS = (process.env.MASTER_EMAILS || 'miguel@mtec.tec.br')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

const MAX_TENTATIVAS = 5;
const BLOQUEIO_MINUTOS = 15;

function isMasterEmail(email: string): boolean {
  return MASTER_EMAILS.includes(String(email || '').trim().toLowerCase());
}

async function criarCookieSessao(uid: string, familiaId: string, sessaoVersao: number): Promise<string> {
  const token = await new SignJWT({ uid, familiaId, sv: sessaoVersao })
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
      SELECT ua.id, ua.senha_hash, ua.familia_id, ua.tentativas_falhas, ua.bloqueado_ate, ua.sessao_versao,
             f.nome_familia, f.dados, f.status, f.acesso_ate, f.limite_usuarios
      FROM usuarios_auth ua
      JOIN familias f ON f.id = ua.familia_id
      WHERE ua.email = ${cleanEmail}
    `;

    // Mensagem genérica em qualquer caso de falha, pra não revelar se o e-mail existe ou não.
    if (result.rows.length === 0) {
      res.status(401).json({ error: 'E-mail ou senha incorretos.' });
      return;
    }

    const row = result.rows[0];

    // Bloqueio temporário por excesso de tentativas erradas
    if (row.bloqueado_ate && new Date(row.bloqueado_ate) > new Date()) {
      const minutosRestantes = Math.ceil((new Date(row.bloqueado_ate).getTime() - Date.now()) / 60000);
      res.status(429).json({
        error: `Muitas tentativas erradas. Tente novamente em ${minutosRestantes} minuto(s).`,
      });
      return;
    }

    const senhaOk = await bcrypt.compare(String(senha), row.senha_hash);
    if (!senhaOk) {
      const novasTentativas = (row.tentativas_falhas || 0) + 1;
      const bloquear = novasTentativas >= MAX_TENTATIVAS;
      await sql`
        UPDATE usuarios_auth
        SET tentativas_falhas = ${novasTentativas},
            bloqueado_ate = ${bloquear ? new Date(Date.now() + BLOQUEIO_MINUTOS * 60000).toISOString() : null}
        WHERE id = ${row.id}
      `;
      res.status(401).json({ error: 'E-mail ou senha incorretos.' });
      return;
    }

    // Login certo: zera o contador de tentativas
    await sql`UPDATE usuarios_auth SET tentativas_falhas = 0, bloqueado_ate = NULL WHERE id = ${row.id}`;

    const master = isMasterEmail(cleanEmail);
    const hoje = new Date().toISOString().split('T')[0];
    const expirou = !master && row.acesso_ate && String(row.acesso_ate).split('T')[0] < hoje;
    const acessoLiberado = master || (row.status === 'ativo' && !expirou);

    const cookie = await criarCookieSessao(row.id as string, row.familia_id as string, row.sessao_versao || 1);
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
