import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '@vercel/postgres';
import { obterSessao } from './_lib/session';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const sessao = await obterSessao(req);
  if (!sessao) {
    res.status(401).json({ error: 'Sessão inválida ou expirada.' });
    return;
  }

  if (req.method === 'PUT') {
    try {
      const { dados } = req.body || {};
      if (!dados) {
        res.status(400).json({ error: 'Nenhum dado enviado.' });
        return;
      }
      await sql`
        UPDATE familias
        SET dados = ${JSON.stringify(dados)}::jsonb
        WHERE id = ${sessao.familiaId}
      `;
      res.status(200).json({ success: true });
    } catch (err) {
      console.error('Erro ao salvar família:', err);
      res.status(500).json({ error: 'Erro ao salvar os dados.' });
    }
    return;
  }

  res.status(405).json({ error: 'Método não permitido.' });
}
