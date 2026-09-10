import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '@vercel/postgres';
import { obterSessao } from '../_lib/session';
import { isMasterEmail } from '../_lib/admin';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const sessao = await obterSessao(req);
    if (!sessao) {
      res.status(401).json({ authenticated: false });
      return;
    }

    const result = await sql`
      SELECT ua.email, f.nome_familia, f.dados, f.status, f.acesso_ate, f.limite_usuarios
      FROM usuarios_auth ua
      JOIN familias f ON f.id = ua.familia_id
      WHERE ua.id = ${sessao.uid}
    `;

    if (result.rows.length === 0) {
      res.status(401).json({ authenticated: false });
      return;
    }

    const row = result.rows[0];
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
