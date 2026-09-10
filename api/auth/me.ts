import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '@vercel/postgres';
import { obterSessao } from '../_lib/session';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const sessao = await obterSessao(req);
    if (!sessao) {
      res.status(401).json({ authenticated: false });
      return;
    }

    const result = await sql`
      SELECT ua.email, f.nome_familia, f.dados
      FROM usuarios_auth ua
      JOIN familias f ON f.id = ua.familia_id
      WHERE ua.id = ${sessao.uid}
    `;

    if (result.rows.length === 0) {
      res.status(401).json({ authenticated: false });
      return;
    }

    const row = result.rows[0];
    res.status(200).json({
      authenticated: true,
      familiaId: sessao.familiaId,
      email: row.email,
      nomeFamilia: row.nome_familia,
      dados: row.dados,
    });
  } catch (err) {
    console.error('Erro em /api/auth/me:', err);
    res.status(500).json({ authenticated: false });
  }
}
