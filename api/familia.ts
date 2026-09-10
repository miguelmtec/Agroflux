import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '@vercel/postgres';
import { jwtVerify } from 'jose';

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

async function obterSessao(req: VercelRequest): Promise<{ uid: string; familiaId: string } | null> {
  const token = (req as any).cookies?.session;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    return { uid: payload.uid as string, familiaId: payload.familiaId as string };
  } catch {
    return null;
  }
}

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

      const infoResult = await sql`
        SELECT ua.email, f.status, f.acesso_ate, f.limite_usuarios
        FROM usuarios_auth ua
        JOIN familias f ON f.id = ua.familia_id
        WHERE ua.id = ${sessao.uid}
      `;
      if (infoResult.rows.length === 0) {
        res.status(401).json({ error: 'Sessão inválida.' });
        return;
      }
      const info = infoResult.rows[0];
      const master = isMasterEmail(info.email as string);
      const hoje = new Date().toISOString().split('T')[0];
      const expirou = !master && info.acesso_ate && String(info.acesso_ate).split('T')[0] < hoje;
      const acessoLiberado = master || (info.status === 'ativo' && !expirou);

      if (!acessoLiberado) {
        res.status(403).json({ error: 'Seu acesso não está liberado no momento.' });
        return;
      }

      const totalUsuarios = Array.isArray(dados?.usuarios) ? dados.usuarios.length : 0;
      if (!master && totalUsuarios > info.limite_usuarios) {
        res.status(403).json({
          error: `Seu plano permite até ${info.limite_usuarios} usuário(s). Fale com o suporte para aumentar o limite.`,
        });
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
