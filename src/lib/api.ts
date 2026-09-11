// Cliente simples para as funções serverless em /api (rodam na própria Vercel,
// ao lado do site). O navegador nunca fala direto com o banco Postgres —
// só essas funções (que rodam no servidor) têm a senha do banco.

async function request<T = any>(path: string, options: RequestInit = {}): Promise<{ ok: boolean; status: number; data: T }> {
  const res = await fetch(`/api${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  let data: any = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  return { ok: res.ok, status: res.status, data };
}

export const api = {
  signUp: (body: { email: string; senha: string; nomeUsuario: string; nomeFamilia: string }) =>
    request('/auth/signup', { method: 'POST', body: JSON.stringify(body) }),

  login: (body: { email: string; senha: string }) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),

  logout: () => request('/auth/logout', { method: 'POST' }),

  me: () => request('/auth/me', { method: 'GET' }),

  salvarFamilia: (dados: unknown) =>
    request('/familia', { method: 'PUT', body: JSON.stringify({ dados }) }),

  adminListarFamilias: () => request('/admin/familias', { method: 'GET' }),

  adminAtualizarFamilia: (body: {
    familiaId: string;
    status?: string;
    acessoAte?: string | null;
    limiteUsuarios?: number;
    plano?: string;
    observacoes?: string;
  }) => request('/admin/familias', { method: 'PUT', body: JSON.stringify(body) }),

  adminBackupManual: (familiaId: string) =>
    request('/admin/backup', { method: 'POST', body: JSON.stringify({ familiaId }) }),

  adminHistoricoBackups: (familiaId: string) =>
    request(`/admin/backup?familiaId=${familiaId}&historico=1`, { method: 'GET' }),

  adminRestaurarBackup: (backupId: string) =>
    request('/admin/backup', { method: 'POST', body: JSON.stringify({ acao: 'restaurar', backupId }) }),

  convidarUsuario: (body: { nome: string; email: string; perfil: string; integranteId?: string }) =>
    request('/usuarios/convidar', { method: 'POST', body: JSON.stringify(body) }),

  trocarSenha: (body: { senhaAtual: string; novaSenha: string }) =>
    request('/auth/trocar-senha', { method: 'POST', body: JSON.stringify(body) }),

  excluirUsuario: (usuarioId: string) =>
    request('/usuarios/excluir', { method: 'POST', body: JSON.stringify({ usuarioId }) }),

  adminListarUsuarios: (familiaId: string) =>
    request(`/admin/usuarios?familiaId=${familiaId}`, { method: 'GET' }),

  adminResetarSenha: (familiaId: string, usuarioAuthId: string) =>
    request('/admin/usuarios', {
      method: 'POST',
      body: JSON.stringify({ acao: 'resetar-senha', familiaId, usuarioAuthId }),
    }),

  adminExcluirUsuario: (familiaId: string, usuarioAuthId: string) =>
    request('/admin/usuarios', {
      method: 'POST',
      body: JSON.stringify({ acao: 'excluir', familiaId, usuarioAuthId }),
    }),
};
