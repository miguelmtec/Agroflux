import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '@vercel/postgres';
import bcrypt from 'bcryptjs';
import { criarCookieSessao } from '../_lib/session';
import { isMasterEmail } from '../_lib/admin';

const dadosIniciais = (nomeUsuario: string, email: string) => ({
  usuarios: [
    {
      id: `usr-${Date.now()}`,
      nome: nomeUsuario,
      emailGoogle: email,
      foto: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(nomeUsuario)}`,
      status: 'Ativo',
      perfil: 'ADMINISTRADOR',
      permissoes: {
        visualizarFinanceiro: true,
        lancarDespesas: true,
        lancarReceitas: true,
        editarLancamentos: true,
        excluirLancamentos: true,
        visualizarBancos: true,
        alterarBancos: true,
        visualizarCartoes: true,
        administrarUsuarios: true,
      },
      ultimoAcesso: 'Primeiro acesso',
      criadoEm: new Date().toISOString().split('T')[0],
      atualizadoEm: new Date().toISOString().split('T')[0],
    },
  ],
  integrantes: [],
  fazendas: [],
  contas: [],
  receitas: [],
  despesas: [],
  transferencias: [],
  recorrencias: [],
  comprasParceladas: [],
  cartoes: [],
  emprestimos: [],
  operacoes: [],
  auditorias: [],
  encerramentos: [],
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método não permitido.' });
    return;
  }

  try {
    const { email, senha, nomeUsuario, nomeFamilia } = req.body || {};
    if (!email || !senha || !nomeUsuario || !nomeFamilia) {
      res.status(400).json({ error: 'Preencha todos os campos.' });
      return;
    }
    if (String(senha).length < 6) {
      res.status(400).json({ error: 'A senha precisa ter pelo menos 6 caracteres.' });
      return;
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const master = isMasterEmail(cleanEmail);

    const existente = await sql`SELECT id FROM usuarios_auth WHERE email = ${cleanEmail}`;
    if (existente.rows.length > 0) {
      res.status(409).json({ error: 'Esse e-mail já está cadastrado. Tente entrar em vez de criar uma conta nova.' });
      return;
    }

    const dados = dadosIniciais(String(nomeUsuario).trim(), cleanEmail);

    // Conta master nasce ativa e sem limite prático; clientes novos nascem
    // "pendente" até você liberar manualmente pelo Painel Master.
    const familia = await sql`
      INSERT INTO familias (nome_familia, dados, status, limite_usuarios)
      VALUES (
        ${String(nomeFamilia).trim()},
        ${JSON.stringify(dados)}::jsonb,
        ${master ? 'ativo' : 'pendente'},
        ${master ? 999 : 1}
      )
      RETURNING id, nome_familia, status, acesso_ate, limite_usuarios, plano
    `;
    const familiaId = familia.rows[0].id as string;

    const senhaHash = await bcrypt.hash(String(senha), 10);
    const usuario = await sql`
      INSERT INTO usuarios_auth (email, senha_hash, nome, familia_id)
      VALUES (${cleanEmail}, ${senhaHash}, ${String(nomeUsuario).trim()}, ${familiaId})
      RETURNING id
    `;

    const cookie = await criarCookieSessao(usuario.rows[0].id as string, familiaId);
    res.setHeader('Set-Cookie', cookie);
    res.status(200).json({
      success: true,
      familiaId,
      nomeFamilia: familia.rows[0].nome_familia,
      dados,
      isMaster: master,
      acessoLiberado: master || familia.rows[0].status === 'ativo',
      statusAcesso: familia.rows[0].status,
      acessoAte: familia.rows[0].acesso_ate,
      limiteUsuarios: familia.rows[0].limite_usuarios,
    });
  } catch (err) {
    console.error('Erro em /api/auth/signup:', err);
    res.status(500).json({ error: 'Erro interno ao criar a conta. Tente novamente.' });
  }
}
