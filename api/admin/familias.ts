import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '@vercel/postgres';
import { exigirMaster } from '../_lib/admin';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const master = await exigirMaster(req);
  if (!master) {
    res.status(403).json({ error: 'Acesso restrito.' });
    return;
  }

  if (req.method === 'GET') {
    try {
      const result = await sql`
        SELECT
          f.id,
          f.nome_familia,
          f.status,
          f.acesso_ate,
          f.limite_usuarios,
          f.plano,
          f.observacoes,
          f.criado_em,
          COUNT(ua.id) AS total_usuarios,
          MIN(ua.email) AS email_admin
        FROM familias f
        LEFT JOIN usuarios_auth ua ON ua.familia_id = f.id
        GROUP BY f.id
        ORDER BY f.criado_em DESC
      `;
      res.status(200).json({ familias: result.rows });
    } catch (err) {
      console.error('Erro em /api/admin/familias GET:', err);
      res.status(500).json({ error: 'Erro ao carregar clientes.' });
    }
    return;
  }

  if (req.method === 'PUT') {
    try {
      const { familiaId, status, acessoAte, limiteUsuarios, plano, observacoes } = req.body || {};
      if (!familiaId) {
        res.status(400).json({ error: 'familiaId é obrigatório.' });
        return;
      }
      await sql`
        UPDATE familias
        SET
          status = COALESCE(${status}, status),
          acesso_ate = ${acessoAte || null},
          limite_usuarios = COALESCE(${limiteUsuarios}, limite_usuarios),
          plano = COALESCE(${plano}, plano),
          observacoes = ${observacoes ?? null}
        WHERE id = ${familiaId}
      `;
      res.status(200).json({ success: true });
    } catch (err) {
      console.error('Erro em /api/admin/familias PUT:', err);
      res.status(500).json({ error: 'Erro ao salvar as alterações.' });
    }
    return;
  }

  res.status(405).json({ error: 'Método não permitido.' });
}
