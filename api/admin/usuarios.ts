import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '@vercel/postgres';
import { jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

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

function gerarSenhaProvisoria(): string {
  const alfabeto = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let senha = '';
  const bytes = crypto.randomBytes(10);
  for (let i = 0; i < 10; i++) senha += alfabeto[bytes[i] % alfabeto.length];
  return senha;
}

// GET  /api/admin/usuarios?familiaId=xxx        -> lista os usuários daquela família
// POST /api/admin/usuarios  { acao: 'resetar-senha' | 'excluir', usuarioAuthId, familiaId }
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const master = await exigirMaster(req);
  if (!master) {
    res.status(403).json({ error: 'Acesso restrito.' });
    return;
  }

  if (req.method === 'GET') {
    try {
      const { familiaId } = req.query as { familiaId?: string };
      if (!familiaId) {
        res.status(400).json({ error: 'familiaId é obrigatório.' });
        return;
      }
      const result = await sql`
        SELECT id, email, nome, senha_provisoria, criado_em
        FROM usuarios_auth
        WHERE familia_id = ${familiaId}
        ORDER BY criado_em ASC
      `;
      res.status(200).json({ usuarios: result.rows });
    } catch (err) {
      console.error('Erro em /api/admin/usuarios GET:', err);
      res.status(500).json({ error: 'Erro ao carregar usuários.' });
    }
    return;
  }

  if (req.method === 'POST') {
    try {
      const { acao, usuarioAuthId, familiaId } = req.body || {};
      if (!acao || !usuarioAuthId || !familiaId) {
        res.status(400).json({ error: 'Dados incompletos.' });
        return;
      }

      const usuarioResult = await sql`
        SELECT email FROM usuarios_auth WHERE id = ${usuarioAuthId} AND familia_id = ${familiaId}
      `;
      if (usuarioResult.rows.length === 0) {
        res.status(404).json({ error: 'Usuário não encontrado nessa família.' });
        return;
      }
      const emailAlvo = usuarioResult.rows[0].email as string;

      if (acao === 'resetar-senha') {
        const novaSenha = gerarSenhaProvisoria();
        const novoHash = await bcrypt.hash(novaSenha, 10);
        await sql`
          UPDATE usuarios_auth
          SET senha_hash = ${novoHash}, senha_provisoria = true, sessao_versao = sessao_versao + 1,
              tentativas_falhas = 0, bloqueado_ate = NULL
          WHERE id = ${usuarioAuthId}
        `;
        res.status(200).json({ success: true, senhaTemporaria: novaSenha });
        return;
      }

      if (acao === 'excluir') {
        const familiaResult = await sql`SELECT dados FROM familias WHERE id = ${familiaId}`;
        if (familiaResult.rows.length === 0) {
          res.status(404).json({ error: 'Família não encontrada.' });
          return;
        }
        const dadosAtuais = familiaResult.rows[0].dados as any;
        const usuariosAtuais: any[] = Array.isArray(dadosAtuais?.usuarios) ? dadosAtuais.usuarios : [];
        const totalNaFamilia = await sql`SELECT COUNT(*) AS total FROM usuarios_auth WHERE familia_id = ${familiaId}`;
        if (Number(totalNaFamilia.rows[0].total) <= 1) {
          res.status(400).json({ error: 'Não é possível excluir o único usuário da família.' });
          return;
        }

        await sql`DELETE FROM usuarios_auth WHERE id = ${usuarioAuthId}`;
        const novosDados = {
          ...dadosAtuais,
          usuarios: usuariosAtuais.filter((u) => String(u.emailGoogle).toLowerCase() !== emailAlvo.toLowerCase()),
        };
        await sql`UPDATE familias SET dados = ${JSON.stringify(novosDados)}::jsonb WHERE id = ${familiaId}`;
        res.status(200).json({ success: true });
        return;
      }

      res.status(400).json({ error: 'Ação inválida.' });
    } catch (err) {
      console.error('Erro em /api/admin/usuarios POST:', err);
      res.status(500).json({ error: 'Erro ao executar a ação.' });
    }
    return;
  }

  res.status(405).json({ error: 'Método não permitido.' });
}
