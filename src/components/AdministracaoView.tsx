import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, formatDate } from '../utils/formatters';
import {
  ShieldCheck,
  Users,
  History,
  Lock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  CalendarCheck,
  Plus,
  X,
  UserCheck,
  UserX,
  Key,
  Trees,
  Edit2,
} from 'lucide-react';
import { PerfilAcesso } from '../types';
import { FazendasUsuariosView } from './FazendasUsuariosView';

export const AdministracaoView: React.FC = () => {
  const {
    usuarios,
    auditLogs,
    integrantes,
    approveUsuario,
    blockUsuario,
    removerUsuario,
    updateUsuarioPerfil,
    updateUsuarioNome,
    addUsuarioPendente,
    convidarUsuario,
    fecharMesFinanceiro,
    currentUser,
  } = useFinance();

  const [activeTab, setActiveTab] = useState<'FAZENDAS' | 'USUARIOS' | 'AUDITORIA' | 'ENCERRAMENTO'>('FAZENDAS');

  // Add User State
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newPerfil, setNewPerfil] = useState<PerfilAcesso>('OPERADOR');
  const [newIntegranteId, setNewIntegranteId] = useState(integrantes[0]?.id || '');

  // Encerramento state
  const [mesFechamento, setMesFechamento] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
  });
  const [resumoFechamento, setResumoFechamento] = useState<{
    sucesso: boolean;
    contasTransferidas: number;
    saldoFinal: number;
  } | null>(null);

  const isAdmin = currentUser?.perfil === 'ADMINISTRADOR';

  const [senhaGerada, setSenhaGerada] = useState<{ nome: string; email: string; senha: string } | null>(null);
  const [enviandoConvite, setEnviandoConvite] = useState(false);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.includes('@')) {
      alert('Informe um e-mail válido.');
      return;
    }

    setEnviandoConvite(true);
    const resultado = await convidarUsuario(
      newName.trim() || newEmail.trim(),
      newEmail.trim(),
      newPerfil,
      newIntegranteId || undefined
    );
    setEnviandoConvite(false);

    if (!resultado.success) {
      alert(resultado.message || 'Não foi possível convidar esse usuário.');
      return;
    }

    setShowAddUserModal(false);
    setSenhaGerada({
      nome: newName.trim() || newEmail.trim(),
      email: newEmail.trim().toLowerCase(),
      senha: resultado.senhaTemporaria || '',
    });
    setNewEmail('');
    setNewName('');
  };

  const handleEncerrarMes = () => {
    if (
      confirm(
        `Deseja realmente consolidar e encerrar a competência ${mesFechamento}? As despesas pendentes serão transferidas para o próximo mês.`
      )
    ) {
      const res = fecharMesFinanceiro(mesFechamento);
      setResumoFechamento(res);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-stone-900 tracking-tight">
            Administração, Segurança & Auditoria
          </h1>
          <p className="text-xs text-stone-500">
            Controle de acesso, permissões granulares, trilha de auditoria e encerramento contábil
          </p>
        </div>

        {activeTab === 'USUARIOS' && isAdmin && (
          <button
            onClick={() => setShowAddUserModal(true)}
            className="flex items-center gap-1.5 bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs py-2 px-4 rounded-xl transition-colors shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" /> Pré-Autorizar E-mail
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 bg-stone-100 p-1 rounded-xl w-fit border border-stone-200">
        <button
          onClick={() => setActiveTab('FAZENDAS')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
            activeTab === 'FAZENDAS' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <Trees className="w-3.5 h-3.5 text-emerald-600" /> Fazendas & Propriedades
        </button>
        <button
          onClick={() => setActiveTab('USUARIOS')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
            activeTab === 'USUARIOS' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <Users className="w-3.5 h-3.5" /> Gestão de Usuários & Nomes
        </button>
        <button
          onClick={() => setActiveTab('AUDITORIA')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
            activeTab === 'AUDITORIA' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <History className="w-3.5 h-3.5" /> Log de Auditoria ({auditLogs.length})
        </button>
        <button
          onClick={() => setActiveTab('ENCERRAMENTO')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
            activeTab === 'ENCERRAMENTO'
              ? 'bg-white text-stone-900 shadow-xs'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <CalendarCheck className="w-3.5 h-3.5" /> Encerramento de Mês
        </button>
      </div>

      {/* TAB 0: FAZENDAS & PROPRIEDADES */}
      {activeTab === 'FAZENDAS' && (
        <FazendasUsuariosView initialTab="FAZENDAS" />
      )}

      {/* TAB 1: USUÁRIOS & PERMISSÕES */}
      {activeTab === 'USUARIOS' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-stone-200/80 p-5 shadow-xs overflow-hidden">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-4">
              Contas Autorizadas no Sistema
            </h3>

            <div className="divide-y divide-stone-100">
              {usuarios.map((usr) => {
                const int = integrantes.find((i) => i.id === usr.integranteId);

                return (
                  <div
                    key={usr.id}
                    className="py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={usr.foto}
                        alt={usr.nome}
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 rounded-full object-cover border border-stone-200 shrink-0"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-stone-900 text-sm">{usr.nome}</span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.2 rounded-full ${
                              usr.status === 'Ativo'
                                ? 'bg-emerald-100 text-emerald-800'
                                : usr.status === 'Pendente'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {usr.status}
                          </span>
                        </div>
                        <span className="text-xs text-stone-500 block">{usr.emailGoogle}</span>
                        {int && (
                          <span className="text-[11px] text-orange-700 font-medium mt-0.5 inline-block">
                            Vinculado ao integrante: {int.apelido} ({int.nome})
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end md:self-center">
                      {/* Perfil Selector */}
                      {isAdmin ? (
                        <select
                          value={usr.perfil}
                          onChange={(e) => updateUsuarioPerfil(usr.id, e.target.value as PerfilAcesso)}
                          className="text-xs font-bold py-1.5 px-3 rounded-xl border border-stone-200 bg-stone-50 text-stone-800"
                        >
                          <option value="ADMINISTRADOR">ADMINISTRADOR</option>
                          <option value="OPERADOR">OPERADOR</option>
                          <option value="VISUALIZACAO">VISUALIZAÇÃO</option>
                        </select>
                      ) : (
                        <span className="text-xs font-bold text-stone-700 bg-stone-100 px-3 py-1 rounded-lg">
                          {usr.perfil}
                        </span>
                      )}

                      {/* Editar Nome Action */}
                      <button
                        onClick={() => {
                          const novoNome = prompt('Editar nome de exibição do usuário:', usr.nome);
                          if (novoNome && novoNome.trim()) {
                            updateUsuarioNome(usr.id, novoNome.trim());
                          }
                        }}
                        className="flex items-center gap-1 text-xs font-bold py-1.5 px-2.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-100 text-stone-700 transition-colors cursor-pointer"
                        title="Editar nome do usuário"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-stone-500" />
                        Editar Nome
                      </button>

                      {/* Status Toggle Actions */}
                      {isAdmin && (
                        <div className="flex items-center gap-1.5">
                          {usr.status !== 'Ativo' ? (
                            <button
                              onClick={() => approveUsuario(usr.id)}
                              className="px-3 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors"
                            >
                              Aprovar Acesso
                            </button>
                          ) : (
                            <button
                              onClick={() => blockUsuario(usr.id)}
                              className="px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-xl transition-colors"
                            >
                              Bloquear
                            </button>
                          )}
                          <button
                            onClick={async () => {
                              if (!confirm(`Excluir o acesso de "${usr.nome}" permanentemente? Essa ação não pode ser desfeita.`)) return;
                              const resultado = await removerUsuario(usr.id);
                              if (!resultado.success) alert(resultado.message);
                            }}
                            className="px-3 py-1.5 text-xs font-bold text-stone-500 hover:bg-stone-100 border border-stone-200 rounded-xl transition-colors"
                          >
                            Excluir
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: AUDITORIA (Section 23) */}
      {activeTab === 'AUDITORIA' && (
        <div className="bg-white rounded-2xl border border-stone-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-stone-100 bg-stone-50 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700">
              Trilha de Auditoria Contábil
            </h3>
            <span className="text-xs text-stone-500">
              Registros imutáveis de criação, edição e exclusão
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-4">Data / Hora</th>
                  <th className="py-2.5 px-4">Usuário</th>
                  <th className="py-2.5 px-4">Ação</th>
                  <th className="py-2.5 px-4">Entidade</th>
                  <th className="py-2.5 px-4">Detalhes / Justificativa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-stone-50">
                    <td className="py-3 px-4 font-mono text-stone-600 text-[11px]">
                      {new Date(log.timestamp).toLocaleString('pt-BR')}
                    </td>
                    <td className="py-3 px-4 font-bold text-stone-800">{log.userName}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          log.action === 'CREATE'
                            ? 'bg-emerald-100 text-emerald-800'
                            : log.action === 'UPDATE'
                            ? 'bg-blue-100 text-blue-800'
                            : log.action === 'DELETE'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-stone-700">{log.entity}</td>
                    <td className="py-3 px-4 text-stone-600">
                      {log.justificativa ? (
                        <span className="font-medium text-orange-900 bg-orange-50 px-2 py-0.5 rounded">
                          Justificativa: {log.justificativa}
                        </span>
                      ) : (
                        log.details
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: ENCERRAMENTO DE MÊS (Section 24) */}
      {activeTab === 'ENCERRAMENTO' && (
        <div className="bg-white rounded-2xl border border-stone-200/80 p-6 shadow-xs space-y-5">
          <div>
            <h3 className="text-base font-extrabold text-stone-900">
              Rotina de Encerramento Contábil Mensal
            </h3>
            <p className="text-xs text-stone-500 mt-1">
              Consolide os saldos bancários e transfira automaticamente compromissos não pagos para o próximo período
            </p>
          </div>

          <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Selecione o Mês de Fechamento:
              </label>
              <input
                type="month"
                value={mesFechamento}
                onChange={(e) => setMesFechamento(e.target.value)}
                className="px-3 py-2 text-xs font-bold border border-stone-200 rounded-lg bg-white"
              />
            </div>

            <button
              onClick={handleEncerrarMes}
              className="bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs py-2.5 px-5 rounded-xl transition-colors shadow-2xs"
            >
              Executar Fechamento de Mês
            </button>
          </div>

          {resumoFechamento && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-950 space-y-1">
              <div className="flex items-center gap-2 font-bold text-emerald-800 text-sm">
                <CheckCircle2 className="w-4 h-4" /> Mês {mesFechamento} consolidado com sucesso!
              </div>
              <p>• {resumoFechamento.contasTransferidas} contas a pagar em aberto foram postergadas para o próximo período.</p>
              <p>• Saldo final consolidado em caixa: <strong>{formatCurrency(resumoFechamento.saldoFinal)}</strong>.</p>
            </div>
          )}
        </div>
      )}

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-stone-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 bg-stone-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">Pré-Autorizar Novo E-mail</h3>
              <button onClick={() => setShowAddUserModal(false)} className="text-stone-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-5 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-stone-700 mb-1">E-mail Autorizado</label>
                <input
                  type="email"
                  placeholder="exemplo@gmail.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Nome Completo</label>
                <input
                  type="text"
                  placeholder="Ex: Carlos Oliveira"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Perfil de Acesso</label>
                  <select
                    value={newPerfil}
                    onChange={(e) => setNewPerfil(e.target.value as PerfilAcesso)}
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg bg-white"
                  >
                    <option value="OPERADOR">OPERADOR</option>
                    <option value="ADMINISTRADOR">ADMINISTRADOR</option>
                    <option value="VISUALIZACAO">VISUALIZAÇÃO</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">Vincular a Integrante</label>
                  <select
                    value={newIntegranteId}
                    onChange={(e) => setNewIntegranteId(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg bg-white"
                  >
                    {integrantes.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.apelido}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={enviandoConvite}
                  className="px-4 py-2 font-bold bg-stone-900 text-white hover:bg-stone-800 disabled:opacity-60 rounded-lg"
                >
                  {enviandoConvite ? 'Criando acesso...' : 'Autorizar Acesso'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {senhaGerada && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-sm overflow-hidden">
            <div className="p-4 bg-emerald-700 text-white">
              <h2 className="font-extrabold text-sm">Acesso criado!</h2>
            </div>
            <div className="p-5 text-xs space-y-3">
              <p className="text-stone-600">
                Passe esses dados pra <strong>{senhaGerada.nome}</strong> (por WhatsApp, por exemplo). Essa senha só
                aparece essa vez.
              </p>
              <div className="bg-stone-50 border border-stone-200 rounded-xl p-3 space-y-1.5">
                <p><span className="text-stone-400">E-mail:</span> <span className="font-mono font-bold">{senhaGerada.email}</span></p>
                <p><span className="text-stone-400">Senha provisória:</span> <span className="font-mono font-bold text-emerald-700">{senhaGerada.senha}</span></p>
              </div>
              <p className="text-[11px] text-stone-400">
                No primeiro acesso, a pessoa vai ser obrigada a trocar essa senha por uma só dela.
              </p>
              <button
                onClick={() => setSenhaGerada(null)}
                className="w-full py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold"
              >
                Ok, já anotei
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
