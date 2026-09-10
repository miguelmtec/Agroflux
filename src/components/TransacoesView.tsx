import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, formatDate } from '../utils/formatters';
import {
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowLeftRight,
  CheckCircle2,
  Trash2,
  Calendar,
  CreditCard,
  Building2,
  Tag,
  Paperclip,
  Check,
  Trees,
  X,
} from 'lucide-react';

export const TransacoesView: React.FC = () => {
  const {
    receitas,
    despesas,
    transferencias,
    integrantes,
    fazendas,
    contas,
    cartoes,
    selectedMemberId,
    marcarDespesaPaga,
    marcarReceitaRecebida,
    deleteDespesa,
    deleteReceita,
    currentUser,
  } = useFinance();

  const [tipoFilter, setTipoFilter] = useState<'TODOS' | 'DESPESA' | 'RECEITA' | 'TRANSFERENCIA'>('TODOS');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('TODOS');
  const [fazendaFilter, setFazendaFilter] = useState<string>('TODAS');

  // Liquidation modal (for paying an expense or receiving a revenue with bank account selection)
  const [modalLiquidacao, setModalLiquidacao] = useState<{
    isOpen: boolean;
    item: UnifiedTransaction | null;
    dataPagamento: string;
    contaId: string;
  }>({
    isOpen: false,
    item: null,
    dataPagamento: new Date().toISOString().split('T')[0],
    contaId: '',
  });

  // Can user edit/delete
  const canDelete = currentUser?.perfil === 'ADMINISTRADOR' || currentUser?.permissoes?.excluirLancamentos;
  const canEdit = currentUser?.perfil !== 'VISUALIZACAO';

  // Combine and normalize transactions for unified listing
  interface UnifiedTransaction {
    id: string;
    tipo: 'DESPESA' | 'RECEITA' | 'TRANSFERENCIA';
    descricao: string;
    categoria: string;
    valor: number;
    data: string;
    dataVencimentoOuPrevista: string;
    status: string;
    integranteNome?: string;
    fazendaNome?: string;
    fazendaId?: string;
    contaNome?: string;
    cartaoNome?: string;
    fornecedorOuCliente?: string;
    temAnexo: boolean;
    raw: any;
  }

  const list: UnifiedTransaction[] = [];

  // Despesas
  despesas.forEach((d) => {
    if (d.deletedAt) return;
    if (selectedMemberId !== 'TODOS' && d.integranteId !== selectedMemberId) return;

    const int = integrantes.find((i) => i.id === d.integranteId);
    const cta = contas.find((c) => c.id === d.contaId);
    const card = cartoes.find((c) => c.id === d.cartaoId);
    const faz = fazendas.find((f) => f.id === d.fazendaId);

    list.push({
      id: d.id,
      tipo: 'DESPESA',
      descricao: d.descricao,
      categoria: d.categoria,
      valor: d.valor,
      data: d.dataCompetencia,
      dataVencimentoOuPrevista: d.dataVencimento,
      status: d.status,
      integranteNome: int?.apelido || 'Família',
      fazendaNome: faz?.nome,
      fazendaId: d.fazendaId,
      contaNome: cta?.nomePersonalizado,
      cartaoNome: card?.nome,
      fornecedorOuCliente: d.fornecedor,
      temAnexo: !!(d.anexos && d.anexos.length > 0),
      raw: d,
    });
  });

  // Receitas
  receitas.forEach((r) => {
    if (r.deletedAt) return;
    if (selectedMemberId !== 'TODOS' && r.integranteId !== selectedMemberId) return;

    const int = integrantes.find((i) => i.id === r.integranteId);
    const cta = contas.find((c) => c.id === r.contaId);
    const faz = fazendas.find((f) => f.id === r.fazendaId);

    list.push({
      id: r.id,
      tipo: 'RECEITA',
      descricao: r.descricao,
      categoria: r.categoria,
      valor: r.valor,
      data: r.dataCompetencia,
      dataVencimentoOuPrevista: r.dataPrevista,
      status: r.status,
      integranteNome: int?.apelido || 'Família',
      fazendaNome: faz?.nome,
      fazendaId: r.fazendaId,
      contaNome: cta?.nomePersonalizado,
      fornecedorOuCliente: r.clientePagador,
      temAnexo: !!(r.anexos && r.anexos.length > 0),
      raw: r,
    });
  });

  // Transferências
  transferencias.forEach((t) => {
    if (t.deletedAt) return;
    const ctaOrigem = contas.find((c) => c.id === t.contaOrigemId);
    const ctaDestino = contas.find((c) => c.id === t.contaDestinoId);

    list.push({
      id: t.id,
      tipo: 'TRANSFERENCIA',
      descricao: t.descricao,
      categoria: 'Transferência Interna',
      valor: t.valor,
      data: t.data,
      dataVencimentoOuPrevista: t.data,
      status: 'Concluída',
      contaNome: `${ctaOrigem?.banco || 'Origem'} ➔ ${ctaDestino?.banco || 'Destino'}`,
      temAnexo: false,
      raw: t,
    });
  });

  // Sort descending by date
  list.sort((a, b) => new Date(b.dataVencimentoOuPrevista).getTime() - new Date(a.dataVencimentoOuPrevista).getTime());

  // Filter
  const filtered = list.filter((item) => {
    if (tipoFilter !== 'TODOS' && item.tipo !== tipoFilter) return false;
    if (statusFilter !== 'TODOS' && item.status !== statusFilter) return false;
    if (fazendaFilter !== 'TODAS' && item.fazendaId !== fazendaFilter) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchDesc = item.descricao.toLowerCase().includes(q);
      const matchCat = item.categoria.toLowerCase().includes(q);
      const matchPart = item.fornecedorOuCliente?.toLowerCase().includes(q) || false;
      const matchMember = item.integranteNome?.toLowerCase().includes(q) || false;
      const matchFazenda = item.fazendaNome?.toLowerCase().includes(q) || false;
      return matchDesc || matchCat || matchPart || matchMember || matchFazenda;
    }
    return true;
  });

  const abrirModalPagar = (item: UnifiedTransaction) => {
    setModalLiquidacao({
      isOpen: true,
      item,
      dataPagamento: new Date().toISOString().split('T')[0],
      contaId: item.raw?.contaId || contas[0]?.id || '',
    });
  };

  const abrirModalReceber = (item: UnifiedTransaction) => {
    setModalLiquidacao({
      isOpen: true,
      item,
      dataPagamento: new Date().toISOString().split('T')[0],
      contaId: item.raw?.contaId || contas[0]?.id || '',
    });
  };

  const confirmarLiquidacao = () => {
    if (!modalLiquidacao.item) return;
    const { item, dataPagamento, contaId } = modalLiquidacao;

    if (item.tipo === 'DESPESA') {
      marcarDespesaPaga(item.id, dataPagamento, contaId || undefined);
    } else if (item.tipo === 'RECEITA') {
      marcarReceitaRecebida(item.id, dataPagamento, contaId || undefined);
    }
    setModalLiquidacao({ isOpen: false, item: null, dataPagamento: '', contaId: '' });
  };

  return (
    <div className="space-y-5 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-stone-900 tracking-tight">
            Lançamentos Financeiros
          </h1>
          <p className="text-xs text-stone-500">
            Histórico completo de despesas, receitas e transferências bancárias
          </p>
        </div>
        <div className="text-xs text-stone-500 bg-stone-100 px-3 py-1.5 rounded-xl font-medium">
          Total de {filtered.length} lançamentos encontrados
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -transtone-y-1/2" />
          <input
            type="text"
            placeholder="Filtrar por descrição, fornecedor, cliente ou categoria..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs border border-stone-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-orange-500 bg-stone-50/50"
          />
        </div>

        {/* Type Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <select
            value={fazendaFilter}
            onChange={(e) => setFazendaFilter(e.target.value)}
            className="text-xs py-1.5 px-2.5 bg-stone-100 hover:bg-stone-200 border border-stone-200 rounded-xl font-medium text-stone-700 cursor-pointer"
          >
            <option value="TODAS">🌾 Todas as Fazendas</option>
            {fazendas.map((f) => (
              <option key={f.id} value={f.id}>
                🌾 {f.nome}
              </option>
            ))}
          </select>

          {(['TODOS', 'DESPESA', 'RECEITA', 'TRANSFERENCIA'] as const).map((tipo) => (
            <button
              key={tipo}
              onClick={() => setTipoFilter(tipo)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-colors ${
                tipoFilter === tipo
                  ? 'bg-stone-900 text-white'
                  : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
              }`}
            >
              {tipo === 'TODOS'
                ? 'Todos'
                : tipo === 'DESPESA'
                ? 'Despesas'
                : tipo === 'RECEITA'
                ? 'Receitas'
                : 'Transferências'}
            </button>
          ))}
        </div>
      </div>

      {/* Transactions Table / List */}
      <div className="bg-white rounded-2xl border border-stone-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-3 text-center w-12">Tipo</th>
                <th className="py-3 px-4 min-w-[200px]">Descrição & Categoria</th>
                <th className="py-3 px-3 whitespace-nowrap">Pertence a</th>
                <th className="py-3 px-3 whitespace-nowrap">Conta / Cartão</th>
                <th className="py-3 px-3 whitespace-nowrap">Vencimento / Prev.</th>
                <th className="py-3 px-4 text-right whitespace-nowrap">Valor</th>
                <th className="py-3 px-3 text-center whitespace-nowrap">Status</th>
                <th className="py-3 px-4 text-right sticky right-0 bg-stone-50 shadow-[-6px_0_12px_-4px_rgba(0,0,0,0.08)] z-10 w-36 whitespace-nowrap">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-stone-400">
                    Nenhum lançamento corresponde aos filtros selecionados.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="group hover:bg-stone-50/90 transition-colors">
                    {/* Tipo Icon */}
                    <td className="py-3.5 px-3 text-center">
                      {item.tipo === 'RECEITA' ? (
                        <div className="w-7 h-7 mx-auto rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                          <ArrowDownLeft className="w-4 h-4" />
                        </div>
                      ) : item.tipo === 'DESPESA' ? (
                        <div className="w-7 h-7 mx-auto rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                          <ArrowUpRight className="w-4 h-4" />
                        </div>
                      ) : (
                        <div className="w-7 h-7 mx-auto rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                          <ArrowLeftRight className="w-4 h-4" />
                        </div>
                      )}
                    </td>

                    {/* Descricao */}
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-stone-900 truncate">{item.descricao}</span>
                        {item.fazendaNome && (
                          <span className="bg-emerald-50 text-emerald-800 text-[10px] font-bold px-1.5 py-0.5 rounded border border-emerald-200 shrink-0 flex items-center gap-0.5">
                            🌾 {item.fazendaNome}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-stone-500 flex items-center gap-2 mt-0.5">
                        <span className="bg-stone-100 px-1.5 py-0.2 rounded font-medium text-stone-600">
                          {item.categoria}
                        </span>
                        {item.fornecedorOuCliente && (
                          <span className="truncate max-w-[150px]">
                            • {item.fornecedorOuCliente}
                          </span>
                        )}
                        {item.temAnexo && <Paperclip className="w-3 h-3 text-stone-400" />}
                      </div>
                    </td>

                    {/* Pertence a */}
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <span className="font-semibold text-stone-700 bg-stone-100 px-2 py-0.5 rounded-lg text-[11px]">
                        {item.integranteNome || 'Família'}
                      </span>
                    </td>

                    {/* Conta ou Cartão Utilizado */}
                    <td className="py-3.5 px-3">
                      <div className="text-stone-800 font-medium">
                        {item.cartaoNome ? (
                          <span className="inline-flex items-center gap-1 text-purple-700 font-semibold whitespace-nowrap">
                            <CreditCard className="w-3.5 h-3.5" />
                            {item.cartaoNome}
                          </span>
                        ) : item.contaNome ? (
                          <span className="inline-flex items-center gap-1 text-stone-700 whitespace-nowrap">
                            <Building2 className="w-3.5 h-3.5 text-stone-400" />
                            {item.contaNome}
                          </span>
                        ) : (
                          <span
                            className="inline-flex items-center gap-1 text-amber-800 bg-amber-50 px-2 py-0.5 rounded text-[10px] font-semibold border border-amber-200 whitespace-nowrap"
                            title="Conta bancária ainda não vinculada. Escolha a conta no momento do pagamento."
                          >
                            ⏳ A definir ao pagar
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Vencimento */}
                    <td className="py-3.5 px-3 text-stone-600 whitespace-nowrap">
                      {formatDate(item.dataVencimentoOuPrevista)}
                    </td>

                    {/* Valor */}
                    <td
                      className={`py-3.5 px-4 text-right font-extrabold text-sm whitespace-nowrap ${
                        item.tipo === 'RECEITA'
                          ? 'text-emerald-700'
                          : item.tipo === 'DESPESA'
                          ? 'text-stone-900'
                          : 'text-blue-700'
                      }`}
                    >
                      {item.tipo === 'RECEITA' ? '+' : item.tipo === 'DESPESA' ? '-' : ''}
                      {formatCurrency(item.valor)}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-3 text-center whitespace-nowrap">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          item.status === 'Pago' || item.status === 'Recebida' || item.status === 'Concluída'
                            ? 'bg-emerald-100 text-emerald-800'
                            : item.status === 'Atrasado' || item.status === 'Atrasada'
                            ? 'bg-rose-100 text-rose-800'
                            : item.status === 'A pagar' || item.status === 'Prevista'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-stone-100 text-stone-600'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>

                    {/* Ações: Sticky right-0 para sempre aparecer do lado direito */}
                    <td className="py-3.5 px-4 text-right sticky right-0 bg-white group-hover:bg-stone-50/95 shadow-[-6px_0_12px_-4px_rgba(0,0,0,0.08)] z-10 w-36">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Botão Pagar */}
                        {canEdit && item.tipo === 'DESPESA' && item.status !== 'Pago' && (
                          <button
                            onClick={() => abrirModalPagar(item)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-emerald-700 hover:text-white bg-emerald-50 hover:bg-emerald-600 border border-emerald-300 rounded-lg shadow-2xs transition-all cursor-pointer whitespace-nowrap"
                            title="Efetuar pagamento e liquidar despesa"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Pagar</span>
                          </button>
                        )}

                        {/* Botão Receber */}
                        {canEdit && item.tipo === 'RECEITA' && item.status !== 'Recebida' && (
                          <button
                            onClick={() => abrirModalReceber(item)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-emerald-700 hover:text-white bg-emerald-50 hover:bg-emerald-600 border border-emerald-300 rounded-lg shadow-2xs transition-all cursor-pointer whitespace-nowrap"
                            title="Confirmar recebimento do valor"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Receber</span>
                          </button>
                        )}

                        {/* Liquidado Badge */}
                        {(item.status === 'Pago' || item.status === 'Recebida' || item.status === 'Concluída') && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50/90 px-2 py-0.5 rounded-md border border-emerald-200/70 whitespace-nowrap">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Liquidado
                          </span>
                        )}

                        {/* Excluir */}
                        {canDelete && item.tipo !== 'TRANSFERENCIA' && (
                          <button
                            onClick={() => {
                              if (confirm(`Deseja realmente excluir "${item.descricao}"?`)) {
                                if (item.tipo === 'DESPESA') deleteDespesa(item.id);
                                else if (item.tipo === 'RECEITA') deleteReceita(item.id);
                              }
                            }}
                            className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer shrink-0"
                            title="Excluir lançamento"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Liquidação / Confirmação de Pagamento ou Recebimento */}
      {modalLiquidacao.isOpen && modalLiquidacao.item && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 bg-stone-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <h3 className="font-extrabold text-sm tracking-tight">
                  {modalLiquidacao.item.tipo === 'DESPESA'
                    ? 'Confirmar Pagamento de Despesa'
                    : 'Confirmar Recebimento'}
                </h3>
              </div>
              <button
                onClick={() => setModalLiquidacao({ isOpen: false, item: null, dataPagamento: '', contaId: '' })}
                className="text-stone-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              {/* Resumo do Lançamento */}
              <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200/80 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-stone-800 text-sm">{modalLiquidacao.item.descricao}</span>
                  <span className="text-base font-extrabold text-stone-900">
                    {formatCurrency(modalLiquidacao.item.valor)}
                  </span>
                </div>
                <div className="text-[11px] text-stone-500 flex items-center gap-2">
                  <span>Categoria: {modalLiquidacao.item.categoria}</span>
                  <span>•</span>
                  <span>Vencimento: {formatDate(modalLiquidacao.item.dataVencimentoOuPrevista)}</span>
                </div>

                {!modalLiquidacao.item.contaNome && modalLiquidacao.item.tipo === 'DESPESA' && (
                  <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-[11px] flex items-start gap-1.5 mt-2">
                    <span>💡</span>
                    <span>
                      Este lançamento não tinha conta bancária previamente vinculada. Selecione abaixo a conta que realizou o pagamento!
                    </span>
                  </div>
                )}
              </div>

              {/* Data do Pagamento */}
              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  {modalLiquidacao.item.tipo === 'DESPESA' ? 'Data do Pagamento' : 'Data do Recebimento'}
                </label>
                <input
                  type="date"
                  value={modalLiquidacao.dataPagamento}
                  onChange={(e) =>
                    setModalLiquidacao((prev) => ({ ...prev, dataPagamento: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg bg-white font-medium text-stone-800"
                  required
                />
              </div>

              {/* Seleção da Conta Bancária */}
              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  {modalLiquidacao.item.tipo === 'DESPESA'
                    ? 'Conta Bancária Pagadora (Débito)'
                    : 'Conta Bancária de Depósito (Crédito)'}
                </label>
                <select
                  value={modalLiquidacao.contaId}
                  onChange={(e) =>
                    setModalLiquidacao((prev) => ({ ...prev, contaId: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg bg-white font-medium text-stone-800"
                >
                  <option value="">Sem conta bancária (não vincular saldo)</option>
                  {contas.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nomePersonalizado} ({c.banco}) — Saldo: {formatCurrency(c.saldoAtual)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setModalLiquidacao({ isOpen: false, item: null, dataPagamento: '', contaId: '' })}
                  className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-lg font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={confirmarLiquidacao}
                  className="px-5 py-2 font-bold bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl transition-all shadow-xs flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  {modalLiquidacao.item.tipo === 'DESPESA' ? 'Confirmar Pagamento' : 'Confirmar Recebimento'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
