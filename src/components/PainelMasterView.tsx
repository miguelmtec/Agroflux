import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { ShieldCheck, RefreshCw, Users, Save, Download, DatabaseBackup } from 'lucide-react';

interface FamiliaAdmin {
  id: string;
  nome_familia: string;
  status: string;
  acesso_ate: string | null;
  limite_usuarios: number;
  plano: string;
  observacoes: string | null;
  criado_em: string;
  total_usuarios: number;
  email_admin: string | null;
}

const statusStyle: Record<string, string> = {
  ativo: 'bg-emerald-100 text-emerald-800',
  pendente: 'bg-amber-100 text-amber-800',
  bloqueado: 'bg-rose-100 text-rose-800',
};

export const PainelMasterView: React.FC = () => {
  const [familias, setFamilias] = useState<FamiliaAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [salvandoId, setSalvandoId] = useState<string | null>(null);
  const [backupId, setBackupId] = useState<string | null>(null);
  const [modalUsuariosFamilia, setModalUsuariosFamilia] = useState<FamiliaAdmin | null>(null);
  const [modalBackupsFamilia, setModalBackupsFamilia] = useState<FamiliaAdmin | null>(null);
  const [rascunhos, setRascunhos] = useState<Record<string, Partial<FamiliaAdmin>>>({});

  const carregar = async () => {
    setLoading(true);
    const resp = await api.adminListarFamilias();
    if (resp.ok) {
      setFamilias(resp.data.familias || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    carregar();
  }, []);

  const atualizarRascunho = (id: string, campo: keyof FamiliaAdmin, valor: any) => {
    setRascunhos((prev) => ({ ...prev, [id]: { ...prev[id], [campo]: valor } }));
  };

  const valorAtual = (f: FamiliaAdmin, campo: keyof FamiliaAdmin) =>
    rascunhos[f.id]?.[campo] !== undefined ? rascunhos[f.id][campo] : f[campo];

  const salvar = async (f: FamiliaAdmin) => {
    setSalvandoId(f.id);
    const rascunho = rascunhos[f.id] || {};
    const resp = await api.adminAtualizarFamilia({
      familiaId: f.id,
      status: (rascunho.status as string) ?? f.status,
      acessoAte: (rascunho.acesso_ate as string | null) ?? f.acesso_ate,
      limiteUsuarios: Number((rascunho.limite_usuarios as number) ?? f.limite_usuarios),
      plano: (rascunho.plano as string) ?? f.plano,
      observacoes: (rascunho.observacoes as string) ?? f.observacoes ?? '',
    });
    setSalvandoId(null);
    if (resp.ok) {
      await carregar();
      setRascunhos((prev) => {
        const novo = { ...prev };
        delete novo[f.id];
        return novo;
      });
    } else {
      alert(resp.data?.error || 'Erro ao salvar.');
    }
  };

  const salvarSnapshot = async (familiaId: string) => {
    setBackupId(familiaId);
    const resp = await api.adminBackupManual(familiaId);
    setBackupId(null);
    if (resp.ok) {
      alert('Snapshot salvo com sucesso.');
    } else {
      alert(resp.data?.error || 'Erro ao salvar snapshot.');
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-stone-900 text-emerald-400 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-extrabold text-stone-900 tracking-tight">Painel Master</h1>
            <p className="text-xs text-stone-500">Clientes cadastrados e liberação de acesso</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/api/admin/backup"
            className="flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900 bg-white border border-stone-200 rounded-lg px-3 py-1.5"
          >
            <Download className="w-3.5 h-3.5" /> Backup de todos
          </a>
          <button
            onClick={carregar}
            className="flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900 bg-white border border-stone-200 rounded-lg px-3 py-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Atualizar
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-xs text-stone-500">Carregando...</p>
      ) : familias.length === 0 ? (
        <p className="text-xs text-stone-500">Nenhum cliente cadastrado ainda.</p>
      ) : (
        <div className="space-y-3">
          {familias.map((f) => {
            const sujo = Boolean(rascunhos[f.id]);
            return (
              <div key={f.id} className="bg-white border border-stone-200 rounded-2xl p-4">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div>
                    <p className="font-bold text-sm text-stone-900">{f.nome_familia}</p>
                    <p className="text-[11px] text-stone-500">
                      {f.email_admin} · cadastrado em {new Date(f.criado_em).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <span className={`text-[11px] font-bold px-2 py-1 rounded-full ${statusStyle[String(valorAtual(f, 'status'))] || 'bg-stone-100 text-stone-700'}`}>
                    {String(valorAtual(f, 'status')).toUpperCase()}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 mb-3">
                  <a
                    href={`/api/admin/backup?familiaId=${f.id}`}
                    className="flex items-center gap-1.5 text-[11px] font-semibold text-stone-600 hover:text-stone-900 bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1"
                  >
                    <Download className="w-3 h-3" /> Baixar backup
                  </a>
                  <button
                    onClick={() => salvarSnapshot(f.id)}
                    disabled={backupId === f.id}
                    className="flex items-center gap-1.5 text-[11px] font-semibold text-stone-600 hover:text-stone-900 bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1 disabled:opacity-50"
                  >
                    <DatabaseBackup className="w-3 h-3" />
                    {backupId === f.id ? 'Salvando...' : 'Salvar snapshot agora'}
                  </button>
                  <button
                    onClick={() => setModalUsuariosFamilia(f)}
                    className="flex items-center gap-1.5 text-[11px] font-semibold text-stone-600 hover:text-stone-900 bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1"
                  >
                    <Users className="w-3 h-3" /> Usuários ({f.total_usuarios})
                  </button>
                  <button
                    onClick={() => setModalBackupsFamilia(f)}
                    className="flex items-center gap-1.5 text-[11px] font-semibold text-stone-600 hover:text-stone-900 bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1"
                  >
                    <DatabaseBackup className="w-3 h-3" /> Ver backups
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                  <div>
                    <label className="block font-semibold text-stone-600 mb-1">Status</label>
                    <select
                      value={String(valorAtual(f, 'status'))}
                      onChange={(e) => atualizarRascunho(f.id, 'status', e.target.value)}
                      className="w-full px-2 py-1.5 border border-stone-200 rounded-lg bg-white"
                    >
                      <option value="pendente">Pendente</option>
                      <option value="ativo">Ativo</option>
                      <option value="bloqueado">Bloqueado</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-stone-600 mb-1">Acesso até</label>
                    <input
                      type="date"
                      value={
                        valorAtual(f, 'acesso_ate')
                          ? String(valorAtual(f, 'acesso_ate')).split('T')[0]
                          : ''
                      }
                      onChange={(e) => atualizarRascunho(f.id, 'acesso_ate', e.target.value || null)}
                      className="w-full px-2 py-1.5 border border-stone-200 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-stone-600 mb-1">Plano</label>
                    <select
                      value={String(valorAtual(f, 'plano'))}
                      onChange={(e) => atualizarRascunho(f.id, 'plano', e.target.value)}
                      className="w-full px-2 py-1.5 border border-stone-200 rounded-lg bg-white"
                    >
                      <option value="mensal">Mensal</option>
                      <option value="anual">Anual</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-stone-600 mb-1 flex items-center gap-1">
                      <Users className="w-3 h-3" /> Limite usuários
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={Number(valorAtual(f, 'limite_usuarios'))}
                      onChange={(e) => atualizarRascunho(f.id, 'limite_usuarios', Number(e.target.value))}
                      className="w-full px-2 py-1.5 border border-stone-200 rounded-lg bg-white"
                    />
                    <p className="text-[10px] text-stone-400 mt-0.5">{f.total_usuarios} em uso</p>
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={() => salvar(f)}
                      disabled={!sujo || salvandoId === f.id}
                      className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-900 text-white font-semibold disabled:opacity-40"
                    >
                      <Save className="w-3.5 h-3.5" /> {salvandoId === f.id ? 'Salvando...' : 'Salvar'}
                    </button>
                  </div>
                </div>

                <div className="mt-2">
                  <input
                    type="text"
                    placeholder="Observações (forma de pagamento, combinados...)"
                    value={String(valorAtual(f, 'observacoes') ?? '')}
                    onChange={(e) => atualizarRascunho(f.id, 'observacoes', e.target.value)}
                    className="w-full px-2 py-1.5 border border-stone-200 rounded-lg text-xs bg-white"
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modalUsuariosFamilia && (
        <ModalUsuariosFamilia familia={modalUsuariosFamilia} onClose={() => setModalUsuariosFamilia(null)} onMudou={carregar} />
      )}

      {modalBackupsFamilia && (
        <ModalBackupsFamilia familia={modalBackupsFamilia} onClose={() => setModalBackupsFamilia(null)} />
      )}
    </div>
  );
};

const ModalUsuariosFamilia: React.FC<{ familia: FamiliaAdmin; onClose: () => void; onMudou: () => void }> = ({
  familia,
  onClose,
  onMudou,
}) => {
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processandoId, setProcessandoId] = useState<string | null>(null);
  const [senhaGerada, setSenhaGerada] = useState<{ email: string; senha: string } | null>(null);

  const carregarUsuarios = async () => {
    setLoading(true);
    const resp = await api.adminListarUsuarios(familia.id);
    if (resp.ok) setUsuarios(resp.data.usuarios || []);
    setLoading(false);
  };

  useEffect(() => {
    carregarUsuarios();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleResetarSenha = async (usuarioAuthId: string, email: string) => {
    if (!confirm(`Gerar uma nova senha provisória para ${email}? A senha atual dela deixa de funcionar.`)) return;
    setProcessandoId(usuarioAuthId);
    const resp = await api.adminResetarSenha(familia.id, usuarioAuthId);
    setProcessandoId(null);
    if (!resp.ok) {
      alert(resp.data?.error || 'Erro ao resetar senha.');
      return;
    }
    setSenhaGerada({ email, senha: resp.data.senhaTemporaria });
    carregarUsuarios();
  };

  const handleExcluir = async (usuarioAuthId: string, email: string) => {
    if (!confirm(`Excluir permanentemente o acesso de ${email}? Essa ação não pode ser desfeita.`)) return;
    setProcessandoId(usuarioAuthId);
    const resp = await api.adminExcluirUsuario(familia.id, usuarioAuthId);
    setProcessandoId(null);
    if (!resp.ok) {
      alert(resp.data?.error || 'Erro ao excluir usuário.');
      return;
    }
    carregarUsuarios();
    onMudou();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-lg overflow-hidden my-6">
        <div className="p-4 bg-stone-900 text-white flex items-center justify-between">
          <div>
            <h2 className="font-extrabold text-sm">Usuários de {familia.nome_familia}</h2>
            <p className="text-[11px] text-stone-300">Limite do plano: {familia.limite_usuarios} usuário(s)</p>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-white">✕</button>
        </div>

        <div className="p-5 text-xs">
          {senhaGerada && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 mb-4">
              <p className="font-bold text-emerald-900 mb-1">Nova senha gerada para {senhaGerada.email}</p>
              <p className="font-mono text-emerald-800 text-sm">{senhaGerada.senha}</p>
              <p className="text-[11px] text-emerald-700 mt-1">
                Passe pra pessoa agora — essa senha só aparece essa vez. Ela vai ser obrigada a trocar no próximo acesso.
              </p>
              <button onClick={() => setSenhaGerada(null)} className="text-[11px] font-semibold text-emerald-800 underline mt-1">
                Fechar aviso
              </button>
            </div>
          )}

          {loading ? (
            <p className="text-stone-500">Carregando...</p>
          ) : usuarios.length === 0 ? (
            <p className="text-stone-500">Nenhum usuário encontrado.</p>
          ) : (
            <div className="space-y-2">
              {usuarios.map((u) => (
                <div key={u.id} className="flex items-center justify-between border border-stone-200 rounded-xl p-3">
                  <div>
                    <p className="font-semibold text-stone-900">{u.nome}</p>
                    <p className="text-stone-500">{u.email}</p>
                    {u.senha_provisoria && (
                      <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                        Aguardando 1º acesso
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleResetarSenha(u.id, u.email)}
                      disabled={processandoId === u.id}
                      className="px-2.5 py-1.5 text-[11px] font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg disabled:opacity-50"
                    >
                      Resetar senha
                    </button>
                    <button
                      onClick={() => handleExcluir(u.id, u.email)}
                      disabled={processandoId === u.id}
                      className="px-2.5 py-1.5 text-[11px] font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg disabled:opacity-50"
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const tipoStyle: Record<string, string> = {
  automatico: 'bg-stone-100 text-stone-600',
  manual: 'bg-blue-100 text-blue-700',
  'pre-restauracao': 'bg-amber-100 text-amber-800',
};

const tipoLabel: Record<string, string> = {
  automatico: 'Automático (diário)',
  manual: 'Manual',
  'pre-restauracao': 'Antes de uma restauração',
};

const ModalBackupsFamilia: React.FC<{ familia: FamiliaAdmin; onClose: () => void }> = ({ familia, onClose }) => {
  const [snapshots, setSnapshots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [restaurandoId, setRestaurandoId] = useState<string | null>(null);

  const carregarSnapshots = async () => {
    setLoading(true);
    const resp = await api.adminHistoricoBackups(familia.id);
    if (resp.ok) setSnapshots(resp.data.snapshots || []);
    setLoading(false);
  };

  useEffect(() => {
    carregarSnapshots();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRestaurar = async (backupId: string, dataCriacao: string) => {
    const dataFormatada = new Date(dataCriacao).toLocaleString('pt-BR');
    if (
      !confirm(
        `Restaurar o backup de ${dataFormatada} para ${familia.nome_familia}?\n\n` +
          `Isso vai SUBSTITUIR todos os dados atuais dessa família pelos dados salvos nesse backup. ` +
          `O estado atual é salvo automaticamente antes, então dá pra desfazer se precisar.`
      )
    )
      return;
    setRestaurandoId(backupId);
    const resp = await api.adminRestaurarBackup(backupId);
    setRestaurandoId(null);
    if (!resp.ok) {
      alert(resp.data?.error || 'Erro ao restaurar backup.');
      return;
    }
    alert('Backup restaurado com sucesso.');
    carregarSnapshots();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-lg overflow-hidden my-6">
        <div className="p-4 bg-stone-900 text-white flex items-center justify-between">
          <div>
            <h2 className="font-extrabold text-sm">Backups de {familia.nome_familia}</h2>
            <p className="text-[11px] text-stone-300">Snapshots automáticos (diários) e manuais</p>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-white">✕</button>
        </div>

        <div className="p-5 text-xs">
          {loading ? (
            <p className="text-stone-500">Carregando...</p>
          ) : snapshots.length === 0 ? (
            <p className="text-stone-500">
              Nenhum snapshot salvo ainda para esse cliente. Eles aparecem aqui depois do primeiro backup automático
              (diário) ou de um "Salvar snapshot agora" manual.
            </p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {snapshots.map((s) => (
                <div key={s.id} className="flex items-center justify-between border border-stone-200 rounded-xl p-3">
                  <div>
                    <p className="font-semibold text-stone-900">{new Date(s.criado_em).toLocaleString('pt-BR')}</p>
                    <span className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${tipoStyle[s.tipo] || 'bg-stone-100 text-stone-600'}`}>
                      {tipoLabel[s.tipo] || s.tipo}
                    </span>
                  </div>
                  <button
                    onClick={() => handleRestaurar(s.id, s.criado_em)}
                    disabled={restaurandoId === s.id}
                    className="px-3 py-1.5 text-[11px] font-bold text-white bg-stone-900 hover:bg-stone-800 rounded-lg disabled:opacity-50"
                  >
                    {restaurandoId === s.id ? 'Restaurando...' : 'Restaurar'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
