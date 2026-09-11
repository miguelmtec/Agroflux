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
    </div>
  );
};
