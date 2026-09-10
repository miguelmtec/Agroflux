import React from 'react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, formatDate, getDaysDifference } from '../utils/formatters';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  CalendarCheck,
  AlertCircle,
  Clock,
  CreditCard,
  Building2,
  ArrowRight,
  ChevronRight,
  Layers,
  Sparkles,
  PieChart as PieIcon,
  HelpCircle,
  Trees,
} from 'lucide-react';

interface DashboardViewProps {
  onNavigate: (module: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const {
    saldoDisponivelTotal,
    receitasMesTotal,
    despesasMesTotal,
    saldoProjetadoTotal,
    patrimonioLiquidoTotal,
    totalDividas,
    despesas,
    receitas,
    fazendas,
    emprestimos,
    cartoes,
    selectedMemberId,
    integrantes,
  } = useFinance();

  // Current member display label
  const memberLabel =
    selectedMemberId === 'TODOS'
      ? 'Visão Consolidada da Família'
      : `Visão de ${integrantes.find((i) => i.id === selectedMemberId)?.apelido || 'Integrante'}`;

  // Central de atenção data calculations
  const contasAtrasadas = despesas.filter(
    (d) =>
      !d.deletedAt &&
      (d.status === 'Atrasado' || (d.status === 'A pagar' && getDaysDifference(d.dataVencimento) < 0))
  );

  const contasVencendo7Dias = despesas.filter((d) => {
    if (d.deletedAt || d.status !== 'A pagar') return false;
    const diff = getDaysDifference(d.dataVencimento);
    return diff >= 0 && diff <= 7;
  });

  const faturasVencendoMes = cartoes.length; // Active credit cards with open invoices

  const parcelasEmprestimosProximas = emprestimos
    .filter((e) => e.status === 'Ativo')
    .flatMap((e) => e.parcelas)
    .filter((p) => {
      if (p.status !== 'Pendente') return false;
      const diff = getDaysDifference(p.vencimento);
      return diff >= -5 && diff <= 30;
    });

  const totalAReceberPendente = receitas
    .filter((r) => !r.deletedAt && (r.status === 'Prevista' || r.status === 'Atrasada'))
    .reduce((sum, r) => sum + r.valor, 0);

  // Onde você está gastando - Category aggregations
  const categoryTotals: Record<string, number> = {};
  let totalDespesasCategorias = 0;

  despesas
    .filter((d) => !d.deletedAt && d.status !== 'Cancelado')
    .forEach((d) => {
      const cat = d.categoria || 'Outros';
      categoryTotals[cat] = (categoryTotals[cat] || 0) + d.valor;
      totalDespesasCategorias += d.valor;
    });

  const topCategories = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([nome, valor]) => ({
      nome,
      valor,
      percentual: totalDespesasCategorias > 0 ? (valor / totalDespesasCategorias) * 100 : 0,
    }));

  // Simple, clean SVG sparkline balance trajectory
  const balancePoints = [
    saldoDisponivelTotal * 0.92,
    saldoDisponivelTotal * 0.95,
    saldoDisponivelTotal * 0.91,
    saldoDisponivelTotal * 1.04,
    saldoDisponivelTotal * 0.98,
    saldoDisponivelTotal,
    saldoProjetadoTotal,
  ];
  const minVal = Math.min(...balancePoints);
  const maxVal = Math.max(...balancePoints);
  const range = maxVal - minVal || 1;
  const svgPoints = balancePoints
    .map((val, idx) => {
      const x = (idx / (balancePoints.length - 1)) * 400;
      const y = 100 - ((val - minVal) / range) * 80 - 10;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner: Member context indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-gradient-to-r from-stone-900 to-orange-950 p-4 rounded-2xl text-white shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-emerald-400">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[11px] uppercase tracking-wider text-stone-400 font-bold block">
              Visão financeira
            </span>
            <h1 className="text-base sm:text-lg font-bold text-white leading-none">
              {memberLabel}
            </h1>
          </div>
        </div>

        {/* Family Net Worth Quick Snapshot */}
        <div
          onClick={() => onNavigate('relatorios')}
          className="flex items-center gap-3 bg-white/10 hover:bg-white/15 px-3 py-1.5 rounded-xl border border-white/10 cursor-pointer transition-colors"
        >
          <div className="text-right">
            <span className="text-[10px] text-stone-300 uppercase tracking-wider font-semibold block">
              Patrimônio Financeiro Líquido
            </span>
            <span
              className={`text-sm font-extrabold ${
                patrimonioLiquidoTotal >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {formatCurrency(patrimonioLiquidoTotal)}
            </span>
          </div>
          <ChevronRight className="w-4 h-4 text-stone-400" />
        </div>
      </div>

      {/* ================================================== */}
      {/* 1. TOP 4 EXECUTIVE CARDS (Clean, Unpolluted) */}
      {/* ================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* SALDO DISPONÍVEL */}
        <div
          onClick={() => onNavigate('bancos')}
          className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs hover:shadow-md hover:border-orange-200 transition-all cursor-pointer group relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
              Saldo Disponível
            </span>
            <div className="w-8 h-8 rounded-xl bg-stone-100 group-hover:bg-orange-50 text-stone-700 group-hover:text-orange-600 flex items-center justify-center transition-colors">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-stone-900 tracking-tight">
            {formatCurrency(saldoDisponivelTotal)}
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-stone-100 text-[11px] text-stone-500">
            <span>Contas bancárias ativas</span>
            <span className="text-orange-600 font-semibold group-hover:underline flex items-center gap-0.5">
              Ver contas <ChevronRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* RECEITAS DO MÊS */}
        <div
          onClick={() => onNavigate('contas-receber')}
          className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs hover:shadow-md hover:border-emerald-200 transition-all cursor-pointer group relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
              Receitas do Mês
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-emerald-700 tracking-tight">
            {formatCurrency(receitasMesTotal)}
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-stone-100 text-[11px] text-stone-500">
            <span>Competência corrente</span>
            <span className="text-emerald-700 font-semibold group-hover:underline flex items-center gap-0.5">
              Receber <ChevronRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* DESPESAS DO MÊS */}
        <div
          onClick={() => onNavigate('contas-pagar')}
          className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs hover:shadow-md hover:border-rose-200 transition-all cursor-pointer group relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
              Despesas do Mês
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-stone-900 tracking-tight">
            {formatCurrency(despesasMesTotal)}
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-stone-100 text-[11px] text-stone-500">
            <span>Contas e operacionais</span>
            <span className="text-rose-600 font-semibold group-hover:underline flex items-center gap-0.5">
              Pagar <ChevronRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* SALDO PROJETADO */}
        <div
          onClick={() => onNavigate('fluxo-caixa')}
          className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs hover:shadow-md hover:border-orange-200 transition-all cursor-pointer group relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
              Saldo Projetado
            </span>
            <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-700 flex items-center justify-center">
              <CalendarCheck className="w-4 h-4" />
            </div>
          </div>
          <div
            className={`text-2xl font-extrabold tracking-tight ${
              saldoProjetadoTotal >= 0 ? 'text-orange-950' : 'text-rose-600'
            }`}
          >
            {formatCurrency(saldoProjetadoTotal)}
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-stone-100 text-[11px] text-stone-500">
            <span>Fechamento estimado</span>
            <span className="text-orange-600 font-semibold group-hover:underline flex items-center gap-0.5">
              Fluxo Caixa <ChevronRight className="w-3 h-3" />
            </span>
          </div>
        </div>
      </div>

      {/* ================================================== */}
      {/* 2. CENTRAL DE ATENÇÃO FINANCEIRA */}
      {/* ================================================== */}
      <div className="bg-white rounded-2xl border border-stone-200/80 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-stone-100 gap-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
              <h2 className="text-sm font-extrabold text-stone-900 tracking-tight">
                Central de atenção
              </h2>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              Alertas e compromissos prioritários
            </p>
          </div>
          <button
            onClick={() => onNavigate('agenda')}
            className="self-start sm:self-auto bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs py-2 px-4 rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            Ver agenda completa
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Badges / Highlights Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mt-4">
          {/* Contas atrasadas */}
          <div
            onClick={() => onNavigate('contas-pagar')}
            className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
              contasAtrasadas.length > 0
                ? 'bg-rose-50/70 border-rose-200 text-rose-900 hover:bg-rose-100/70'
                : 'bg-stone-50 border-stone-200 text-stone-700'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <AlertCircle
                className={`w-5 h-5 shrink-0 ${
                  contasAtrasadas.length > 0 ? 'text-rose-600' : 'text-stone-400'
                }`}
              />
              <div>
                <span className="text-sm font-extrabold block leading-tight">
                  {contasAtrasadas.length}{' '}
                  {contasAtrasadas.length === 1 ? 'conta atrasada' : 'contas atrasadas'}
                </span>
                <span className="text-[11px] text-stone-500">Exige pagamento imediato</span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-stone-400" />
          </div>

          {/* Vencem nos próximos 7 dias */}
          <div
            onClick={() => onNavigate('contas-pagar')}
            className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/60 text-amber-950 flex items-center justify-between cursor-pointer hover:bg-amber-100/60 transition-all"
          >
            <div className="flex items-center gap-2.5">
              <Clock className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <span className="text-sm font-extrabold block leading-tight">
                  {contasVencendo7Dias.length} vencem em 7 dias
                </span>
                <span className="text-[11px] text-stone-500">Programar pagamentos</span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-stone-400" />
          </div>

          {/* Faturas vencem este mês */}
          <div
            onClick={() => onNavigate('cartoes')}
            className="p-3.5 rounded-xl border border-purple-200 bg-purple-50/60 text-purple-950 flex items-center justify-between cursor-pointer hover:bg-purple-100/60 transition-all"
          >
            <div className="flex items-center gap-2.5">
              <CreditCard className="w-5 h-5 text-purple-600 shrink-0" />
              <div>
                <span className="text-sm font-extrabold block leading-tight">
                  {faturasVencendoMes} faturas este mês
                </span>
                <span className="text-[11px] text-stone-500">Cartões de crédito</span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-stone-400" />
          </div>

          {/* Parcelas de empréstimos próximas */}
          <div
            onClick={() => onNavigate('emprestimos')}
            className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/60 text-blue-950 flex items-center justify-between cursor-pointer hover:bg-blue-100/60 transition-all"
          >
            <div className="flex items-center gap-2.5">
              <Building2 className="w-5 h-5 text-blue-600 shrink-0" />
              <div>
                <span className="text-sm font-extrabold block leading-tight">
                  {parcelasEmprestimosProximas.length} empréstimos
                </span>
                <span className="text-[11px] text-stone-500">Parcelas agendadas</span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-stone-400" />
          </div>

          {/* A receber */}
          <div
            onClick={() => onNavigate('contas-receber')}
            className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/60 text-emerald-950 flex items-center justify-between cursor-pointer hover:bg-emerald-100/60 transition-all"
          >
            <div className="flex items-center gap-2.5">
              <TrendingUp className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <span className="text-sm font-extrabold block leading-tight">
                  {formatCurrency(totalAReceberPendente)}
                </span>
                <span className="text-[11px] text-stone-500">Total a receber</span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-stone-400" />
          </div>
        </div>
      </div>

      {/* ================================================== */}
      {/* 3. EVOLUÇÃO DO SALDO & 4. ONDE ESTAMOS GASTANDO */}
      {/* ================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* EVOLUÇÃO DO SALDO (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-stone-200/80 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-extrabold text-stone-900 tracking-tight">
                  Evolução do saldo
                </h3>
                <p className="text-xs text-stone-500">
                  Histórico do mês e projeção de fechamento
                </p>
              </div>
              <span className="text-xs font-bold text-stone-600 bg-stone-100 px-2.5 py-1 rounded-lg">
                Mês Atual
              </span>
            </div>

            {/* Line chart visualization */}
            <div className="h-44 w-full relative mt-2">
              <svg viewBox="0 0 400 100" className="w-full h-full overflow-visible">
                <defs>
                  <linearGradient id="balanceGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#059669" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#059669" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                {/* Horizontal Guide lines */}
                <line x1="0" y1="20" x2="400" y2="20" stroke="#f1f5f9" strokeWidth="1" />
                <line x1="0" y1="50" x2="400" y2="50" stroke="#f1f5f9" strokeWidth="1" />
                <line x1="0" y1="80" x2="400" y2="80" stroke="#f1f5f9" strokeWidth="1" />

                {/* Fill Area */}
                <polygon
                  points={`0,100 ${svgPoints} 400,100`}
                  fill="url(#balanceGrad)"
                />

                {/* Line Path */}
                <polyline
                  fill="none"
                  stroke="#059669"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={svgPoints}
                />

                {/* Last point dot */}
                <circle cx="400" cy="50" r="4" fill="#0f2942" stroke="#fff" strokeWidth="2" />
              </svg>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-stone-500 pt-3 border-t border-stone-100">
            <span>Início do Mês</span>
            <span>Semana 2</span>
            <span>Semana 3</span>
            <span>Hoje (Atual)</span>
            <span className="font-semibold text-orange-700">Projeção Fim de Mês</span>
          </div>
        </div>

        {/* ONDE ESTAMOS GASTANDO (1 col) */}
        <div className="bg-white rounded-2xl border border-stone-200/80 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-extrabold text-stone-900 tracking-tight">
                  Onde você está gastando
                </h3>
                <p className="text-xs text-stone-500">
                  Maiores categorias do mês
                </p>
              </div>
              <PieIcon className="w-4 h-4 text-stone-400" />
            </div>

            {/* Top Categories Progress Bars */}
            <div className="space-y-3.5">
              {topCategories.map((cat, idx) => (
                <div key={cat.nome}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-stone-800">{cat.nome}</span>
                    <span className="text-stone-600 font-bold">{formatCurrency(cat.valor)}</span>
                  </div>
                  <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        idx === 0
                          ? 'bg-stone-900'
                          : idx === 1
                          ? 'bg-purple-600'
                          : idx === 2
                          ? 'bg-blue-600'
                          : idx === 3
                          ? 'bg-amber-600'
                          : 'bg-emerald-600'
                      }`}
                      style={{ width: `${Math.max(5, cat.percentual)}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-stone-500 block text-right mt-0.5">
                    {cat.percentual.toFixed(1)}% do total
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-stone-100 mt-4">
            <button
              onClick={() => onNavigate('relatorios')}
              className="w-full py-2 px-3 rounded-xl border border-stone-200 hover:border-stone-300 bg-stone-50 hover:bg-stone-100 text-xs font-semibold text-stone-700 transition-colors flex items-center justify-center gap-1.5"
            >
              Ver análise completa
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ================================================== */}
      {/* 5. FAZENDAS DO GRUPO LEÃO RIBEIRO                  */}
      {/* ================================================== */}
      <div className="bg-white rounded-2xl border border-stone-200/80 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-stone-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Trees className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-stone-900 tracking-tight">
                Fazendas & propriedades
              </h3>
              <p className="text-xs text-stone-500">
                Resultado e área produtiva por fazenda
              </p>
            </div>
          </div>

          <button
            id="btn-dash-gerenciar-fazendas"
            onClick={() => onNavigate('fazendas')}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
          >
            Gerenciar
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {fazendas.map((faz) => {
            const recsFaz = receitas.filter((r) => !r.deletedAt && r.fazendaId === faz.id);
            const despsFaz = despesas.filter((d) => !d.deletedAt && d.fazendaId === faz.id);
            const totalRec = recsFaz.reduce((sum, r) => sum + r.valor, 0);
            const totalDesp = despsFaz.reduce((sum, d) => sum + d.valor, 0);
            const saldoFaz = totalRec - totalDesp;

            return (
              <div
                key={faz.id}
                onClick={() => onNavigate('fazendas')}
                className="bg-stone-50 hover:bg-stone-100/80 border border-stone-200/70 rounded-xl p-3.5 cursor-pointer transition-all hover:shadow-2xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="font-extrabold text-xs text-stone-900 truncate">
                      {faz.nome}
                    </span>
                    <span className="text-[10px] font-bold text-stone-500 bg-white px-1.5 py-0.5 rounded border border-stone-200">
                      {faz.areaHectares.toLocaleString('pt-BR')} ha
                    </span>
                  </div>
                  <span className="text-[11px] text-stone-500 block">
                    {faz.municipio} - {faz.uf}
                  </span>
                </div>

                <div className="mt-3 pt-2 border-t border-stone-200/60 flex items-center justify-between text-xs">
                  <span className="text-[10px] text-stone-400 font-medium">Margem Líquida</span>
                  <span
                    className={`font-black text-xs ${
                      saldoFaz >= 0 ? 'text-emerald-700' : 'text-rose-600'
                    }`}
                  >
                    {formatCurrency(saldoFaz)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
