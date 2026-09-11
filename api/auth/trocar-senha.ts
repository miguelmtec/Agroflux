import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '@vercel/postgres';
import bcrypt from 'bcryptjs';
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

    const { senhaAtual, novaSenha } = req.body || {};
    if (!senhaAtual || !novaSenha) {
      res.status(400).json({ error: 'Informe a senha atual e a nova senha.' });
      return;
    }
    if (String(novaSenha).length < 6) {
      res.status(400).json({ error: 'A nova senha precisa ter pelo menos 6 caracteres.' });
      return;
    }

    const result = await sql`SELECT senha_hash, sessao_versao FROM usuarios_auth WHERE id = ${sessao.uid}`;
    if (result.rows.length === 0) {
      res.status(401).json({ error: 'Sessão inválida.' });
      return;
    }
    const row = result.rows[0];
    if ((row.sessao_versao || 1) !== sessao.sv) {
      res.status(401).json({ error: 'Sessão inválida ou expirada.' });
      return;
    }

    const senhaOk = await bcrypt.compare(String(senhaAtual), row.senha_hash);
    if (!senhaOk) {
      res.status(401).json({ error: 'Senha atual incorreta.' });
      return;
    }

    const novoHash = await bcrypt.hash(String(novaSenha), 10);
    // Troca a senha, tira a marca de "provisória" e invalida a sessão atual
    // (a pessoa loga de novo já com a senha nova, por segurança).
    await sql`
      UPDATE usuarios_auth
      SET senha_hash = ${novoHash}, senha_provisoria = false, sessao_versao = sessao_versao + 1
      WHERE id = ${sessao.uid}
    `;

    res.setHeader('Set-Cookie', 'session=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax; Secure');
    res.status(200).json({ success: true });
  } catch (err) {
    console.error('Erro em /api/auth/trocar-senha:', err);
    res.status(500).json({ error: 'Erro interno ao trocar a senha.' });
  }
}
