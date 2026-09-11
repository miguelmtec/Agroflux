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

      // Busca o estado ATUAL da família a partir do uid da sessão (nunca do
      // familiaId que veio dentro do próprio token, para não depender de um
      // valor que poderia ficar desatualizado se o usuário for reatribuído).
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

      // ---- Autorização por papel (a parte que faltava) ----
      // Só um ADMINISTRADOR da própria família pode alterar a lista de
      // usuários (promover, aprovar, remover, mudar permissões). Qualquer
      // outra pessoa que tente mandar essa lista alterada é recusada aqui,
      // mesmo que a chamada não passe pela tela (ex: direto via API).
      if (!master) {
        const dadosAtuais = info.dados_atuais as any;
        const usuariosAtuais = Array.isArray(dadosAtuais?.usuarios) ? dadosAtuais.usuarios : [];
        const meuRegistro = usuariosAtuais.find(
          (u: any) => String(u.emailGoogle || '').toLowerCase() === String(info.email).toLowerCase()
        );
        const souAdministrador = meuRegistro?.perfil === 'ADMINISTRADOR';

        if (!souAdministrador) {
          const usuariosEnviados = Array.isArray(dados.usuarios) ? dados.usuarios : [];
          const mudouUsuarios = JSON.stringify(usuariosAtuais) !== JSON.stringify(usuariosEnviados);
          if (mudouUsuarios) {
            res.status(403).json({
              error: 'Só um administrador da família pode alterar usuários, permissões ou aprovações.',
            });
            return;
          }
        }
      }

      await sql`
        UPDATE familias
        SET dados = ${JSON.stringify(dados)}::jsonb
        WHERE id = ${info.familia_id}
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
