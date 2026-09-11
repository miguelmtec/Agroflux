import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '@vercel/postgres';
import bcrypt from 'bcryptjs';
import { jwtVerify } from 'jose';
import crypto from 'crypto';

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

// Gera uma senha provisória fácil de digitar/ditar por telefone
// (sem caracteres ambíguos como 0/O, 1/l/I).
function gerarSenhaProvisoria(): string {
  const alfabeto = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let senha = '';
  const bytes = crypto.randomBytes(10);
  for (let i = 0; i < 10; i++) {
    senha += alfabeto[bytes[i] % alfabeto.length];
  }
  return senha;
}

const PERMISSOES_POR_PERFIL = (perfil: string) => ({
  visualizarFinanceiro: true,
  lancarDespesas: perfil !== 'VISUALIZACAO',
  lancarReceitas: perfil !== 'VISUALIZACAO',
  editarLancamentos: perfil !== 'VISUALIZACAO',
  excluirLancamentos: perfil === 'ADMINISTRADOR',
  visualizarBancos: true,
  alterarBancos: perfil === 'ADMINISTRADOR',
  visualizarCartoes: true,
  administrarUsuarios: perfil === 'ADMINISTRADOR',
});

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

    const { nome, email, perfil, integranteId } = req.body || {};
    if (!nome || !email || !perfil) {
      res.status(400).json({ error: 'Preencha nome, e-mail e perfil.' });
      return;
    }
    if (!['ADMINISTRADOR', 'OPERADOR', 'VISUALIZACAO'].includes(perfil)) {
      res.status(400).json({ error: 'Perfil inválido.' });
      return;
    }
    const cleanEmail = String(email).trim().toLowerCase();

    // Confirma quem está pedindo, e que é administrador da própria família
    const infoResult = await sql`
      SELECT ua.email, ua.sessao_versao, f.id AS familia_id, f.dados AS dados_atuais,
             f.status, f.acesso_ate, f.limite_usuarios
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

    const hoje = new Date().toISOString().split('T')[0];
    const expirou = info.acesso_ate && String(info.acesso_ate).split('T')[0] < hoje;
    if (info.status !== 'ativo' || expirou) {
      res.status(403).json({ error: 'O acesso da família não está liberado no momento.' });
      return;
    }

    const dadosAtuais = info.dados_atuais as any;
    const usuariosAtuais: any[] = Array.isArray(dadosAtuais?.usuarios) ? dadosAtuais.usuarios : [];
    const meuRegistro = usuariosAtuais.find(
      (u) => String(u.emailGoogle || '').toLowerCase() === String(info.email).toLowerCase()
    );
    if (meuRegistro?.perfil !== 'ADMINISTRADOR') {
      res.status(403).json({ error: 'Só um administrador da família pode convidar novos usuários.' });
      return;
    }

    // Limite de usuários definido pelo plano (Painel Master)
    const contagemAtual = await sql`SELECT COUNT(*) AS total FROM usuarios_auth WHERE familia_id = ${info.familia_id}`;
    const totalAtual = Number(contagemAtual.rows[0].total);
    if (totalAtual >= info.limite_usuarios) {
      res.status(403).json({
        error: `Seu plano permite até ${info.limite_usuarios} usuário(s). Fale com o suporte para aumentar o limite.`,
      });
      return;
    }

    const existente = await sql`SELECT id FROM usuarios_auth WHERE email = ${cleanEmail}`;
    if (existente.rows.length > 0) {
      res.status(409).json({ error: 'Já existe uma conta com esse e-mail.' });
      return;
    }

    const senhaProvisoria = gerarSenhaProvisoria();
    const senhaHash = await bcrypt.hash(senhaProvisoria, 10);

    const novoUsuarioAuth = await sql`
      INSERT INTO usuarios_auth (email, senha_hash, nome, familia_id, senha_provisoria)
      VALUES (${cleanEmail}, ${senhaHash}, ${String(nome).trim()}, ${info.familia_id}, true)
      RETURNING id
    `;

    const novoUsuarioAutorizado = {
      id: `usr-${Date.now()}`,
      nome: String(nome).trim(),
      emailGoogle: cleanEmail,
      foto: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(String(nome).trim())}`,
      status: 'Ativo',
      perfil,
      integranteId: integranteId || undefined,
      permissoes: PERMISSOES_POR_PERFIL(perfil),
      dataAutorizacao: hoje,
      ultimoAcesso: 'Ainda não acessou',
      criadoEm: hoje,
      atualizadoEm: hoje,
    };

    const novosDados = { ...dadosAtuais, usuarios: [...usuariosAtuais, novoUsuarioAutorizado] };
    await sql`UPDATE familias SET dados = ${JSON.stringify(novosDados)}::jsonb WHERE id = ${info.familia_id}`;

    res.status(200).json({
      success: true,
      usuario: novoUsuarioAutorizado,
      senhaTemporaria: senhaProvisoria,
    });
  } catch (err) {
    console.error('Erro em /api/usuarios/convidar:', err);
    res.status(500).json({ error: 'Erro interno ao convidar usuário.' });
  }
}
