import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '@vercel/postgres';
import bcrypt from 'bcryptjs';
import { criarCookieSessao } from '../_lib/session';

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
      SELECT ua.id, ua.senha_hash, ua.familia_id, f.nome_familia, f.dados
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

    const cookie = await criarCookieSessao(row.id as string, row.familia_id as string);
    res.setHeader('Set-Cookie', cookie);
    res.status(200).json({
      success: true,
      familiaId: row.familia_id,
      nomeFamilia: row.nome_familia,
      dados: row.dados,
    });
  } catch (err) {
    console.error('Erro em /api/auth/login:', err);
    res.status(500).json({ error: 'Erro interno ao entrar. Tente novamente.' });
  }
}
