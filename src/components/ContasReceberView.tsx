import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, formatDate, getDaysDifference } from '../utils/formatters';
import { NovoLancamentoModal } from './NovoLancamentoModal';
import { ModalRegistrarRecebimento } from './ModalRegistrarRecebimento';
import { ArrowUpCircle, CheckCircle2, Filter, Check, X, Plus } from 'lucide-react';

export const ContasReceberView: React.FC = () => {
  const { receitas, integrantes, contas, selectedMemberId, marcarReceitaRecebida } = useFinance();
  const [receitaRecebendo, setReceitaRecebendo] = useState<any>(null);
  const [showNovaReceita, setShowNovaReceita] = useState(false);

  const [activeTab, setActiveTab] = useState<'TODAS' | 'HOJE' | '7DIAS' | '30DIAS' | 'ATRASADAS' | 'RECEBIDAS'>('TODAS');

  const baseReceitas = receitas.filter((r) => {
    if (r.deletedAt) return false;
    if (selectedMemberId !== 'TODOS' && r.integranteId !== selectedMemberId) return false;
    return true;
  });

  const categorizarReceita = (r: typeof receitas[0]) => {
    if (r.status === 'Recebida') return 'RECEBIDAS';
    const diff = getDaysDifference(r.dataPrevista);
    if (diff < 0) return 'ATRASADAS';
    if (diff === 0) return 'HOJE';
    if (diff <= 7) return '7DIAS';
    if (diff <= 30) return '30DIAS';
    return 'FUTURAS';
  };

  const hoje = baseReceitas.filter((r) => categorizarReceita(r) === 'HOJE');
  const proximos7Dias = baseReceitas.filter((r) => categorizarReceita(r) === '7DIAS');
  const proximos30Dias = baseReceitas.filter((r) => categorizarReceita(r) === '30DIAS');
  const atrasadas = baseReceitas.filter((r) => categorizarReceita(r) === 'ATRASADAS');
  const recebidas = baseReceitas.filter((r) => categorizarReceita(r) === 'RECEBIDAS');

  const getListByTab = () => {
    if (activeTab === 'HOJE') return hoje;
    if (activeTab === '7DIAS') return proximos7Dias;
    if (activeTab === '30DIAS') return proximos30Dias;
    if (activeTab === 'ATRASADAS') return atrasadas;
    if (activeTab === 'RECEBIDAS') return recebidas;
    return baseReceitas;
  };

  const displayList = getListByTab();
  const totalValor = displayList.reduce((sum, r) => sum + r.valor, 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-stone-900 tracking-tight">
            Contas a Receber
          </h1>
          <p className="text-xs text-stone-500">
            Controle de créditos agrícolas, contratos de arrendamento, safras e dividendos
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNovaReceita(true)}
            className="flex items-center gap-1.5 bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs py-2 px-4 rounded-xl transition-colors shadow-2xs"
          >
            <Plus className="w-4 h-4" /> Nova Conta a Receber
          </button>
          <div className="text-xs font-bold text-stone-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
            Total da listagem: <span className="text-emerald-800 font-extrabold">{formatCurrency(totalValor)}</span>
          </div>
        </div>
      </div>

      {showNovaReceita && (
        <NovoLancamentoModal isOpen={showNovaReceita} onClose={() => setShowNovaReceita(false)} tipoFixo="RECEITA" />
      )}

      {/* Tabs Row (Section 14) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        <button
          onClick={() => setActiveTab('TODAS')}
          className={`p-3 rounded-xl border text-left transition-all ${
            activeTab === 'TODAS'
              ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
              : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
          }`}
        >
          <span className="text-[10px] uppercase font-bold text-stone-400 block">Todas</span>
          <span className="text-sm font-extrabold">{baseReceitas.length}</span>
        </button>

        <button
          onClick={() => setActiveTab('HOJE')}
          className={`p-3 rounded-xl border text-left transition-all ${
            activeTab === 'HOJE'
              ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
              : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
          }`}
        >
          <span className="text-[10px] uppercase font-bold text-emerald-400 block">A Receber Hoje</span>
          <span className="text-sm font-extrabold">{hoje.length}</span>
        </button>

        <button
          onClick={() => setActiveTab('7DIAS')}
          className={`p-3 rounded-xl border text-left transition-all ${
            activeTab === '7DIAS'
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
              : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
          }`}
        >
          <span className="text-[10px] uppercase font-bold text-emerald-400 block">Próx. 7 Dias</span>
          <span className="text-sm font-extrabold">{proximos7Dias.length}</span>
        </button>

        <button
          onClick={() => setActiveTab('30DIAS')}
          className={`p-3 rounded-xl border text-left transition-all ${
            activeTab === '30DIAS'
              ? 'bg-orange-900 text-white border-orange-900 shadow-xs'
              : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
          }`}
        >
          <span className="text-[10px] uppercase font-bold text-orange-400 block">Próx. 30 Dias</span>
          <span className="text-sm font-extrabold">{proximos30Dias.length}</span>
        </button>

        <button
          onClick={() => setActiveTab('ATRASADAS')}
          className={`p-3 rounded-xl border text-left transition-all ${
            activeTab === 'ATRASADAS'
              ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
              : 'bg-white border-rose-200 text-rose-800 hover:bg-rose-50'
          }`}
        >
          <span className="text-[10px] uppercase font-bold text-rose-500 block">Atrasadas</span>
          <span className="text-sm font-extrabold">{atrasadas.length}</span>
        </button>

        <button
          onClick={() => setActiveTab('RECEBIDAS')}
          className={`p-3 rounded-xl border text-left transition-all ${
            activeTab === 'RECEBIDAS'
              ? 'bg-stone-800 text-white border-stone-800 shadow-xs'
              : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
          }`}
        >
          <span className="text-[10px] uppercase font-bold text-emerald-400 block">Recebidas</span>
          <span className="text-sm font-extrabold">{recebidas.length}</span>
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-stone-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Descrição</th>
                <th className="py-3 px-4">Categoria</th>
                <th className="py-3 px-4">Pertence a</th>
                <th className="py-3 px-4">Conta de Recebimento</th>
                <th className="py-3 px-4">Data Prevista</th>
                <th className="py-3 px-4 text-right">Valor</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right sticky right-0 bg-stone-50 shadow-[-6px_0_12px_-4px_rgba(0,0,0,0.08)] z-10 w-28 whitespace-nowrap">
                  Ação
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {displayList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-stone-400">
                    Nenhuma conta a receber encontrada neste filtro.
                  </td>
                </tr>
              ) : (
                displayList.map((r) => {
                  const int = integrantes.find((i) => i.id === r.integranteId);
                  const cta = contas.find((c) => c.id === r.contaId);
                  const diff = getDaysDifference(r.dataPrevista);

                  return (
                    <tr key={r.id} className="group hover:bg-stone-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-stone-900">
                        {r.descricao}
                        {r.clientePagador && (
                          <span className="text-[10px] text-stone-500 block font-normal">
                            {r.clientePagador}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded font-medium text-[11px]">
                          {r.categoria}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-stone-800">
                        {int?.apelido || 'Família'}
                      </td>
                      <td className="py-3.5 px-4 text-stone-600">
                        {cta ? (
                          cta.nomePersonalizado
                        ) : (
                          <span className="text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded text-[10px] font-semibold whitespace-nowrap">
                            ⏳ A definir
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-stone-800 block">
                          {formatDate(r.dataPrevista)}
                        </span>
                        {r.status !== 'Recebida' && (
                          <span
                            className={`text-[10px] font-bold ${
                              diff < 0
                                ? 'text-rose-600'
                                : diff === 0
                                ? 'text-emerald-600'
                                : 'text-stone-500'
                            }`}
                          >
                            {diff < 0
                              ? `Atrasado há ${Math.abs(diff)} dias`
                              : diff === 0
                              ? 'Previsão para hoje'
                              : `Em ${diff} dias`}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right font-extrabold text-sm text-emerald-700">
                        +{formatCurrency(r.valor)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            r.status === 'Recebida'
                              ? 'bg-emerald-100 text-emerald-800'
                              : diff < 0
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right sticky right-0 bg-white group-hover:bg-stone-50/95 shadow-[-6px_0_12px_-4px_rgba(0,0,0,0.08)] z-10 w-28">
                        {r.status !== 'Recebida' && (
                          <button
                            onClick={() => setReceitaRecebendo(r)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-3 py-1 rounded-lg transition-colors inline-flex items-center gap-1 shadow-2xs cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" /> Receber
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {receitaRecebendo && (
        <ModalRegistrarRecebimento
          receita={receitaRecebendo}
          contas={contas}
          onClose={() => setReceitaRecebendo(null)}
          onConfirmar={(data, contaId) => {
            marcarReceitaRecebida(receitaRecebendo.id, data, contaId);
            setReceitaRecebendo(null);
          }}
        />
      )}
    </div>
  );
};

