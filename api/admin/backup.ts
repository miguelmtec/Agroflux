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

async function exigirMaster(req: VercelRequest): Promise<boolean> {
  const token = (req as any).cookies?.session;
  if (!token) return false;
  let uid: string;
  let sv: number;
  try {
    const { payload } = await jwtVerify(token, secret);
    uid = payload.uid as string;
    sv = (payload.sv as number) || 1;
  } catch {
    return false;
  }
  const r = await sql`SELECT email, sessao_versao FROM usuarios_auth WHERE id = ${uid}`;
  if (r.rows.length === 0) return false;
  if ((r.rows[0].sessao_versao || 1) !== sv) return false;
  return isMasterEmail(r.rows[0].email as string);
}

// GET  /api/admin/backup                 -> baixa um JSON com TODOS os clientes (backup completo)
// GET  /api/admin/backup?familiaId=xxx   -> baixa um JSON só daquele cliente
// GET  /api/admin/backup?familiaId=xxx&historico=1 -> lista os snapshots salvos daquele cliente
// POST /api/admin/backup  { familiaId }  -> salva um snapshot manual daquele cliente na tabela backups
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const master = await exigirMaster(req);
  if (!master) {
    res.status(403).json({ error: 'Acesso restrito.' });
    return;
  }

  if (req.method === 'GET') {
    try {
      const { familiaId, historico } = req.query as { familiaId?: string; historico?: string };

      if (familiaId && historico) {
        const r = await sql`
          SELECT id, tipo, criado_em
          FROM backups
          WHERE familia_id = ${familiaId}
          ORDER BY criado_em DESC
          LIMIT 60
        `;
        res.status(200).json({ snapshots: r.rows });
        return;
      }

      if (familiaId) {
        const r = await sql`SELECT nome_familia, dados FROM familias WHERE id = ${familiaId}`;
        if (r.rows.length === 0) {
          res.status(404).json({ error: 'Cliente não encontrado.' });
          return;
        }
        const nomeArquivo = `backup-${r.rows[0].nome_familia}-${new Date().toISOString().split('T')[0]}.json`;
        res.setHeader('Content-Disposition', `attachment; filename="${nomeArquivo}"`);
        res.status(200).json({
          nomeFamilia: r.rows[0].nome_familia,
          exportadoEm: new Date().toISOString(),
          dados: r.rows[0].dados,
        });
        return;
      }

      // Backup completo de todos os clientes
      const r = await sql`SELECT id, nome_familia, dados FROM familias ORDER BY nome_familia`;
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="backup-completo-${new Date().toISOString().split('T')[0]}.json"`
      );
      res.status(200).json({
        exportadoEm: new Date().toISOString(),
        familias: r.rows,
      });
    } catch (err) {
      console.error('Erro em /api/admin/backup GET:', err);
      res.status(500).json({ error: 'Erro ao gerar backup.' });
    }
    return;
  }

  if (req.method === 'POST') {
    try {
      const { familiaId, acao, backupId } = req.body || {};

      if (acao === 'restaurar') {
        if (!backupId) {
          res.status(400).json({ error: 'backupId é obrigatório.' });
          return;
        }
        const snapshot = await sql`SELECT familia_id, nome_familia, dados FROM backups WHERE id = ${backupId}`;
        if (snapshot.rows.length === 0) {
          res.status(404).json({ error: 'Snapshot não encontrado.' });
          return;
        }
        const { familia_id, nome_familia, dados } = snapshot.rows[0];

        // Antes de sobrescrever, guarda o estado ATUAL como um novo snapshot
        // (assim, restaurar também pode ser desfeito se for engano).
        const atual = await sql`SELECT dados FROM familias WHERE id = ${familia_id}`;
        if (atual.rows.length > 0) {
          await sql`
            INSERT INTO backups (familia_id, nome_familia, dados, tipo)
            VALUES (${familia_id}, ${nome_familia}, ${JSON.stringify(atual.rows[0].dados)}::jsonb, 'pre-restauracao')
          `;
        }

        await sql`UPDATE familias SET dados = ${JSON.stringify(dados)}::jsonb WHERE id = ${familia_id}`;
        res.status(200).json({ success: true });
        return;
      }

      if (!familiaId) {
        res.status(400).json({ error: 'familiaId é obrigatório.' });
        return;
      }
      const r = await sql`SELECT nome_familia, dados FROM familias WHERE id = ${familiaId}`;
      if (r.rows.length === 0) {
        res.status(404).json({ error: 'Cliente não encontrado.' });
        return;
      }
      await sql`
        INSERT INTO backups (familia_id, nome_familia, dados, tipo)
        VALUES (${familiaId}, ${r.rows[0].nome_familia}, ${JSON.stringify(r.rows[0].dados)}::jsonb, 'manual')
      `;
      res.status(200).json({ success: true });
    } catch (err) {
      console.error('Erro em /api/admin/backup POST:', err);
      res.status(500).json({ error: 'Erro ao salvar snapshot.' });
    }
    return;
  }

  res.status(405).json({ error: 'Método não permitido.' });
}
