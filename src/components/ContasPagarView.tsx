import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, formatDate, getDaysDifference } from '../utils/formatters';
import {
  ArrowDownCircle,
  Clock,
  AlertTriangle,
  Calendar,
  Filter,
  CheckCircle,
  Building2,
  Tag,
  User,
  Check,
} from 'lucide-react';

export const ContasPagarView: React.FC = () => {
  const { despesas, integrantes, contas, selectedMemberId, marcarDespesaPaga } = useFinance();

  const [activeTab, setActiveTab] = useState<'TODAS' | 'HOJE' | '7DIAS' | '30DIAS' | 'ATRASADAS' | 'FUTURAS'>('TODAS');
  const [filterCategoria, setFilterCategoria] = useState<string>('TODAS');
  const [filterBanco, setFilterBanco] = useState<string>('TODOS');
  const [filterIntegrante, setFilterIntegrante] = useState<string>('TODOS');

  // Base filtering by member
  const baseDespesas = despesas.filter((d) => {
    if (d.deletedAt) return false;
    if (selectedMemberId !== 'TODOS' && d.integranteId !== selectedMemberId) return false;
    return true;
  });

  // Categorize by time buckets
  const categorizarDespesa = (d: typeof despesas[0]) => {
    if (d.status === 'Pago') return 'PAGO';
    const diff = getDaysDifference(d.dataVencimento);
    if (diff < 0) return 'ATRASADAS';
    if (diff === 0) return 'HOJE';
    if (diff <= 7) return '7DIAS';
    if (diff <= 30) return '30DIAS';
    return 'FUTURAS';
  };

  const atrasadas = baseDespesas.filter((d) => categorizarDespesa(d) === 'ATRASADAS');
  const hoje = baseDespesas.filter((d) => categorizarDespesa(d) === 'HOJE');
  const proximos7Dias = baseDespesas.filter((d) => categorizarDespesa(d) === '7DIAS');
  const proximos30Dias = baseDespesas.filter((d) => categorizarDespesa(d) === '30DIAS');
  const futuras = baseDespesas.filter((d) => categorizarDespesa(d) === 'FUTURAS');

  // Filter selection
  const getListByTab = () => {
    let list = baseDespesas;
    if (activeTab === 'HOJE') list = hoje;
    else if (activeTab === '7DIAS') list = proximos7Dias;
    else if (activeTab === '30DIAS') list = proximos30Dias;
    else if (activeTab === 'ATRASADAS') list = atrasadas;
    else if (activeTab === 'FUTURAS') list = futuras;

    return list.filter((d) => {
      if (filterCategoria !== 'TODAS' && d.categoria !== filterCategoria) return false;
      if (filterBanco !== 'TODOS' && d.contaId !== filterBanco) return false;
      if (filterIntegrante !== 'TODOS' && d.integranteId !== filterIntegrante) return false;
      return true;
    });
  };

  const displayList = getListByTab();
  const totalValor = displayList.reduce((sum, d) => sum + d.valor, 0);

  // Unique categories for filter dropdown
  const categorias = Array.from(new Set(despesas.map((d) => d.categoria))).filter(Boolean);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-stone-900 tracking-tight">
            Contas a Pagar
          </h1>
          <p className="text-xs text-stone-500">
            Controle de compromissos, vencimentos e contas bancárias de liquidação
          </p>
        </div>
        <div className="text-xs font-bold text-stone-700 bg-stone-100 px-3 py-1.5 rounded-xl">
          Total da listagem: <span className="text-stone-950 font-extrabold">{formatCurrency(totalValor)}</span>
        </div>
      </div>

      {/* Tabs Row (Section 13) */}
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
          <span className="text-sm font-extrabold">{baseDespesas.length}</span>
        </button>

        <button
          onClick={() => setActiveTab('HOJE')}
          className={`p-3 rounded-xl border text-left transition-all ${
            activeTab === 'HOJE'
              ? 'bg-orange-900 text-white border-orange-900 shadow-xs'
              : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
          }`}
        >
          <span className="text-[10px] uppercase font-bold text-orange-400 block">Hoje</span>
          <span className="text-sm font-extrabold">{hoje.length}</span>
        </button>

        <button
          onClick={() => setActiveTab('7DIAS')}
          className={`p-3 rounded-xl border text-left transition-all ${
            activeTab === '7DIAS'
              ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
              : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
          }`}
        >
          <span className="text-[10px] uppercase font-bold text-amber-500 block">Próx. 7 Dias</span>
          <span className="text-sm font-extrabold">{proximos7Dias.length}</span>
        </button>

        <button
          onClick={() => setActiveTab('30DIAS')}
          className={`p-3 rounded-xl border text-left transition-all ${
            activeTab === '30DIAS'
              ? 'bg-blue-700 text-white border-blue-700 shadow-xs'
              : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
          }`}
        >
          <span className="text-[10px] uppercase font-bold text-blue-400 block">Próx. 30 Dias</span>
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
          onClick={() => setActiveTab('FUTURAS')}
          className={`p-3 rounded-xl border text-left transition-all ${
            activeTab === 'FUTURAS'
              ? 'bg-stone-800 text-white border-stone-800 shadow-xs'
              : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
          }`}
        >
          <span className="text-[10px] uppercase font-bold text-stone-400 block">Futuras</span>
          <span className="text-sm font-extrabold">{futuras.length}</span>
        </button>
      </div>

      {/* Filters bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-stone-200/80 shadow-xs flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs text-stone-500 font-semibold mr-1">
          <Filter className="w-3.5 h-3.5" />
          Filtros:
        </div>

        {/* Categoria */}
        <select
          value={filterCategoria}
          onChange={(e) => setFilterCategoria(e.target.value)}
          className="text-xs py-1.5 px-2.5 rounded-lg border border-stone-200 bg-stone-50 text-stone-700"
        >
          <option value="TODAS">Todas as Categorias</option>
          {categorias.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        {/* Banco */}
        <select
          value={filterBanco}
          onChange={(e) => setFilterBanco(e.target.value)}
          className="text-xs py-1.5 px-2.5 rounded-lg border border-stone-200 bg-stone-50 text-stone-700"
        >
          <option value="TODOS">Todas as Contas Bancárias</option>
          {contas.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nomePersonalizado}
            </option>
          ))}
        </select>

        {/* Integrante */}
        <select
          value={filterIntegrante}
          onChange={(e) => setFilterIntegrante(e.target.value)}
          className="text-xs py-1.5 px-2.5 rounded-lg border border-stone-200 bg-stone-50 text-stone-700"
        >
          <option value="TODOS">Todos os Integrantes</option>
          {integrantes.map((i) => (
            <option key={i.id} value={i.id}>
              {i.apelido} ({i.nome})
            </option>
          ))}
        </select>
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
                <th className="py-3 px-4">Conta Pagadora</th>
                <th className="py-3 px-4">Vencimento</th>
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
                    Nenhuma conta a pagar encontrada neste filtro.
                  </td>
                </tr>
              ) : (
                displayList.map((d) => {
                  const int = integrantes.find((i) => i.id === d.integranteId);
                  const cta = contas.find((c) => c.id === d.contaId);
                  const diff = getDaysDifference(d.dataVencimento);

                  return (
                    <tr key={d.id} className="group hover:bg-stone-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-stone-900">
                        {d.descricao}
                        {d.fornecedor && (
                          <span className="text-[10px] text-stone-500 block font-normal">
                            {d.fornecedor}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="bg-stone-100 text-stone-700 px-2 py-0.5 rounded font-medium text-[11px]">
                          {d.categoria}
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
                          {formatDate(d.dataVencimento)}
                        </span>
                        {d.status !== 'Pago' && (
                          <span
                            className={`text-[10px] font-bold ${
                              diff < 0
                                ? 'text-rose-600'
                                : diff === 0
                                ? 'text-orange-600'
                                : 'text-stone-500'
                            }`}
                          >
                            {diff < 0
                              ? `Atrasado há ${Math.abs(diff)} dias`
                              : diff === 0
                              ? 'Vence hoje'
                              : `Em ${diff} dias`}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right font-extrabold text-sm text-stone-900">
                        {formatCurrency(d.valor)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            d.status === 'Pago'
                              ? 'bg-emerald-100 text-emerald-800'
                              : diff < 0
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {d.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right sticky right-0 bg-white group-hover:bg-stone-50/95 shadow-[-6px_0_12px_-4px_rgba(0,0,0,0.08)] z-10 w-28">
                        {d.status !== 'Pago' && (
                          <button
                            onClick={() => marcarDespesaPaga(d.id)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-3 py-1 rounded-lg transition-colors inline-flex items-center gap-1 shadow-2xs cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" /> Pagar
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
    </div>
  );
};
