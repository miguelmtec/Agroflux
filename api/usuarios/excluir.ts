import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '@vercel/postgres';
import { jwtVerify } from 'jose';

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET não configurado nas Environment Variables.');
}
const secret = new TextEncoder().encode(process.env.JWT_SECRET);

async function obterSessao(req: VercelRequest): Promise<{ uid: string; sv: number } | null> {
  const token = (req as any).cookies?.session;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    return { uid: payload.uid as string, sv: (payload.sv as number) || 1 };
  } catch {
    return null;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método não permitido.' });
    return;
  }

  try {
    const sessao = await obterSessao(req);
    if (!sessao) {
      res.status(401).json({ error: 'Sessão inválida ou expirada.' });
      return;
    }

    const { usuarioId } = req.body || {};
    if (!usuarioId) {
      res.status(400).json({ error: 'usuarioId é obrigatório.' });
      return;
    }

    const infoResult = await sql`
      SELECT ua.email, ua.sessao_versao, f.id AS familia_id, f.dados AS dados_atuais
      FROM usuarios_auth ua
      JOIN familias f ON f.id = ua.familia_id
      WHERE ua.id = ${sessao.uid}
    `;
    if (infoResult.rows.length === 0) {
      res.status(401).json({ error: 'Sessão inválida.' });
      return;
    }
    const info = infoResult.rows[0];
    if ((info.sessao_versao || 1) !== sessao.sv) {
      res.status(401).json({ error: 'Sessão inválida ou expirada.' });
      return;
    }

    const dadosAtuais = info.dados_atuais as any;
    const usuariosAtuais: any[] = Array.isArray(dadosAtuais?.usuarios) ? dadosAtuais.usuarios : [];
    const meuRegistro = usuariosAtuais.find(
      (u) => String(u.emailGoogle || '').toLowerCase() === String(info.email).toLowerCase()
    );
    if (meuRegistro?.perfil !== 'ADMINISTRADOR') {
      res.status(403).json({ error: 'Só um administrador da família pode excluir usuários.' });
      return;
    }

    const alvo = usuariosAtuais.find((u) => u.id === usuarioId);
    if (!alvo) {
      res.status(404).json({ error: 'Usuário não encontrado.' });
      return;
    }
    if (String(alvo.emailGoogle).toLowerCase() === String(info.email).toLowerCase()) {
      res.status(400).json({ error: 'Você não pode excluir a si mesmo.' });
      return;
    }
    const totalAdmins = usuariosAtuais.filter((u) => u.perfil === 'ADMINISTRADOR').length;
    if (alvo.perfil === 'ADMINISTRADOR' && totalAdmins <= 1) {
      res.status(400).json({ error: 'Não é possível excluir o único administrador da família.' });
      return;
    }

    await sql`DELETE FROM usuarios_auth WHERE email = ${alvo.emailGoogle} AND familia_id = ${info.familia_id}`;

    const novosDados = { ...dadosAtuais, usuarios: usuariosAtuais.filter((u) => u.id !== usuarioId) };
    await sql`UPDATE familias SET dados = ${JSON.stringify(novosDados)}::jsonb WHERE id = ${info.familia_id}`;

    res.status(200).json({ success: true });
  } catch (err) {
    console.error('Erro em /api/usuarios/excluir:', err);
    res.status(500).json({ error: 'Erro interno ao excluir usuário.' });
  }
}
