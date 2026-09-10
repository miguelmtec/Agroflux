import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency } from '../utils/formatters';
import { Users, UserPlus, Info, CheckCircle2, ShieldCheck, ArrowRight, X } from 'lucide-react';

export const GrupoFamiliarView: React.FC = () => {
  const { integrantes, addIntegrante, despesas, contas, currentUser } = useFinance();

  const [showAddModal, setShowAddModal] = useState(false);
  const [nome, setNome] = useState('');
  const [apelido, setApelido] = useState('');
  const [parentesco, setParentesco] = useState('');
  const [avatar, setAvatar] = useState('👤');

  const canAdd = currentUser?.perfil === 'ADMINISTRADOR';

  const handleCreateMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !apelido.trim()) return;

    addIntegrante({
      nome: nome.trim(),
      apelido: apelido.trim(),
      parentesco: parentesco.trim() || 'Familiar',
      avatar,
      ativo: true,
    });

    setShowAddModal(false);
    setNome('');
    setApelido('');
    setParentesco('');
  };

  // Section 17 & 18 calculation:
  // 1. Despesas por Pertencimento (Quem é o beneficiário / a quem a despesa pertence)
  // 2. Despesas por Origem do Dinheiro (De qual conta saiu o recurso real)
  const statsByMember = integrantes.map((int) => {
    // Pertencimento
    const despesasPertencem = despesas
      .filter((d) => !d.deletedAt && d.integranteId === int.id && d.status !== 'Cancelado')
      .reduce((sum, d) => sum + d.valor, 0);

    // Contas que pertencem a este integrante
    const contasDoIntegrante = contas.filter((c) =>
      c.titular.toLowerCase().includes(int.apelido.toLowerCase()) ||
      c.nomePersonalizado.toLowerCase().includes(int.apelido.toLowerCase())
    );
    const idsContas = contasDoIntegrante.map((c) => c.id);

    // Desembolso real (saiu da conta dele)
    const desembolsoReal = despesas
      .filter((d) => !d.deletedAt && d.contaId && idsContas.includes(d.contaId) && d.status === 'Pago')
      .reduce((sum, d) => sum + d.valor, 0);

    return {
      integrante: int,
      despesasPertencem,
      desembolsoReal,
      contasVinculadas: contasDoIntegrante.length,
    };
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-stone-900 tracking-tight">
            Grupo Familiar & Rateio Patrimonial
          </h1>
          <p className="text-xs text-stone-500">
            Estrutura dinâmica de integrantes com separação contábil de pertencimento vs conta pagadora
          </p>
        </div>

        {canAdd && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs py-2 px-4 rounded-xl transition-colors shadow-2xs"
          >
            <UserPlus className="w-3.5 h-3.5" /> Cadastrar Novo Integrante
          </button>
        )}
      </div>

      {/* Explanatory Banner: Section 17 & 18 Rule */}
      <div className="bg-gradient-to-r from-stone-900 to-orange-950 text-white p-5 rounded-2xl shadow-xs">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/10 text-emerald-400 flex items-center justify-center shrink-0">
            <Info className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">
              Regra de Ouro AgroFlux: Pertencimento x Conta Desembolsadora
            </h3>
            <p className="text-xs text-stone-300 mt-1 leading-relaxed">
              O sistema diferencia rigorosamente <strong>a quem a movimentação pertence</strong> do <strong>banco/conta que desembolsou o dinheiro</strong>. Por exemplo: o seguro do veículo da Filha 1 (R$ 4.500) pertence à Filha 1, mesmo tendo sido debitado da conta Itaú do Pai.
            </p>
          </div>
        </div>
      </div>

      {/* Family Members Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsByMember.map(({ integrante, despesasPertencem, desembolsoReal, contasVinculadas }) => (
          <div
            key={integrante.id}
            className="bg-white rounded-2xl border border-stone-200/80 p-5 shadow-xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 rounded-2xl bg-stone-100 flex items-center justify-center text-2xl border border-stone-200">
                  {integrante.avatar || '👤'}
                </div>
                <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                  Ativo
                </span>
              </div>

              <h3 className="text-base font-extrabold text-stone-900 leading-tight">
                {integrante.apelido}
              </h3>
              <p className="text-xs text-stone-500">{integrante.nome}</p>
              <span className="text-[11px] font-semibold text-orange-700 bg-orange-50 px-2 py-0.5 rounded mt-1 inline-block">
                {integrante.parentesco}
              </span>
            </div>

            <div className="mt-4 pt-3 border-t border-stone-100 space-y-2 text-xs">
              <div>
                <span className="text-stone-400 text-[10px] uppercase font-bold block">
                  Despesas de sua Responsabilidade:
                </span>
                <span className="text-sm font-extrabold text-stone-900">
                  {formatCurrency(despesasPertencem)}
                </span>
              </div>

              <div>
                <span className="text-stone-400 text-[10px] uppercase font-bold block">
                  Desembolsado por Contas dele(a):
                </span>
                <span className="text-sm font-bold text-stone-700">
                  {formatCurrency(desembolsoReal)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Member Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-stone-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 bg-stone-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">Cadastrar Novo Integrante Familiar</h3>
              <button onClick={() => setShowAddModal(false)} className="text-stone-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateMember} className="p-5 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-stone-700 mb-1">Nome Completo</label>
                <input
                  type="text"
                  placeholder="Ex: Carlos Eduardo de Oliveira"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Apelido / Identificador</label>
                  <input
                    type="text"
                    placeholder="Ex: Filho / Neto"
                    value={apelido}
                    onChange={(e) => setApelido(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Parentesco</label>
                  <input
                    type="text"
                    placeholder="Ex: Filho / Cônjuge / Sócio"
                    value={parentesco}
                    onChange={(e) => setParentesco(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Ícone / Emoji Avatar</label>
                <div className="flex gap-2">
                  {['👨‍🌾', '👩‍🌾', '👧', '👦', '👵', '👴', '👔', '💼'].map((em) => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => setAvatar(em)}
                      className={`text-xl p-2 rounded-xl border ${
                        avatar === em ? 'border-orange-600 bg-orange-50' : 'border-stone-200'
                      }`}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-bold bg-stone-900 text-white hover:bg-stone-800 rounded-lg"
                >
                  Salvar Integrante
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
