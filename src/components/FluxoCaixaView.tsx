import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, formatDate } from '../utils/formatters';
import { LineChart, AlertTriangle, CheckCircle2, TrendingUp, TrendingDown, Clock, ShieldCheck } from 'lucide-react';

export const FluxoCaixaView: React.FC = () => {
  const { saldoDisponivelTotal, receitas, despesas, emprestimos } = useFinance();

  const [periodoProjecao, setPeriodoProjecao] = useState<'7' | '30' | '60' | '90' | '180' | '365'>('30');

  const dias = parseInt(periodoProjecao, 10);
  const now = new Date();

  // Project daily balance forward
  const projectionPoints: {
    dateStr: string;
    receitas: number;
    despesas: number;
    saldo: number;
  }[] = [];

  let runningBalance = saldoDisponivelTotal;
  let minProjectedBalance = runningBalance;
  let minDate = '';

  for (let i = 1; i <= dias; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];

    // Day's projected revenues
    const dayReceitas = receitas
      .filter((r) => !r.deletedAt && r.status !== 'Cancelada' && r.dataPrevista === dateStr)
      .reduce((sum, r) => sum + r.valor, 0);

    // Day's projected expenses
    const dayDespesas = despesas
      .filter((d) => !d.deletedAt && d.status !== 'Cancelado' && d.dataVencimento === dateStr)
      .reduce((sum, d) => sum + d.valor, 0);

    // Day's loan installments
    const dayLoans = emprestimos
      .flatMap((e) => e.parcelas)
      .filter((p) => p.status === 'Pendente' && p.vencimento === dateStr)
      .reduce((sum, p) => sum + p.valor, 0);

    const totalDayOutflow = dayDespesas + dayLoans;
    runningBalance = runningBalance + dayReceitas - totalDayOutflow;

    if (runningBalance < minProjectedBalance) {
      minProjectedBalance = runningBalance;
      minDate = dateStr;
    }

    // Record sample points (daily for <=30, sampled for longer periods)
    if (dias <= 30 || i % Math.ceil(dias / 30) === 0 || i === dias) {
      projectionPoints.push({
        dateStr,
        receitas: dayReceitas,
        despesas: totalDayOutflow,
        saldo: runningBalance,
      });
    }
  }

  const hasNegativeBalanceAlert = minProjectedBalance < 0;

  // Simple SVG curve
  const balances = [saldoDisponivelTotal, ...projectionPoints.map((p) => p.saldo)];
  const minVal = Math.min(...balances);
  const maxVal = Math.max(...balances);
  const range = maxVal - minVal || 1;

  const svgCoords = balances
    .map((val, idx) => {
      const x = (idx / (balances.length - 1)) * 500;
      const y = 140 - ((val - minVal) / range) * 110 - 15;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-stone-900 tracking-tight">
            Fluxo de Caixa Realizado & Projetado
          </h1>
          <p className="text-xs text-stone-500">
            Simulação preditiva de liquidez com base em compromissos, safras e financiamentos
          </p>
        </div>

        {/* Projection Horizon Buttons (Section 19) */}
        <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl border border-stone-200 text-xs overflow-x-auto no-scrollbar">
          {[
            { id: '7', label: '7 Dias' },
            { id: '30', label: '30 Dias' },
            { id: '60', label: '60 Dias' },
            { id: '90', label: '90 Dias' },
            { id: '180', label: '6 Meses' },
            { id: '365', label: '12 Meses' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setPeriodoProjecao(item.id as any)}
              className={`px-3 py-1.5 font-bold rounded-lg transition-colors whitespace-nowrap ${
                periodoProjecao === item.id
                  ? 'bg-stone-900 text-white shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Negative Balance Alert (Section 19: Alertar caso saldo fique negativo) */}
      {hasNegativeBalanceAlert ? (
        <div className="bg-rose-50 border border-rose-300 rounded-2xl p-4 flex items-start gap-3 shadow-xs">
          <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-rose-950 text-sm">
              Alerta de Saldo Negativo Projetado
            </h3>
            <p className="text-xs text-rose-800 mt-0.5 leading-relaxed">
              O saldo projetado atinge uma mínima de{' '}
              <strong className="font-extrabold underline">{formatCurrency(minProjectedBalance)}</strong> no dia{' '}
              <strong>{formatDate(minDate)}</strong>. Recomenda-se remanejamento de vencimentos ou resgate de aplicações para evitar juros de cheque especial.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3 text-emerald-900 shadow-2xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <div className="text-xs">
            <span className="font-bold">Liquidez Projetada Saudável:</span> O saldo permanece positivo durante todo o período selecionado de {dias} dias. Mínima estimada em {formatCurrency(minProjectedBalance)}.
          </div>
        </div>
      )}

      {/* Balance Projection Chart */}
      <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-[10px] uppercase font-bold text-stone-400 block">
              Curva de Disponibilidade Financeira
            </span>
            <h3 className="text-base font-extrabold text-stone-900">
              Projeção para os Próximos {dias} Dias
            </h3>
          </div>
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-stone-400 block">Saldo Final Previsto</span>
            <span className={`text-lg font-extrabold ${runningBalance >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
              {formatCurrency(runningBalance)}
            </span>
          </div>
        </div>

        <div className="h-48 w-full relative">
          <svg viewBox="0 0 500 150" className="w-full h-full overflow-visible">
            <line x1="0" y1="30" x2="500" y2="30" stroke="#f1f5f9" strokeWidth="1" />
            <line x1="0" y1="75" x2="500" y2="75" stroke="#f1f5f9" strokeWidth="1" />
            <line x1="0" y1="120" x2="500" y2="120" stroke="#f1f5f9" strokeWidth="1" />

            <polyline
              fill="none"
              stroke="#0f2942"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={svgCoords}
            />
          </svg>
        </div>

        <div className="flex items-center justify-between text-xs text-stone-500 pt-3 border-t border-stone-100">
          <span>Hoje: {formatCurrency(saldoDisponivelTotal)}</span>
          <span className="font-semibold text-stone-700">Mínima: {formatCurrency(minProjectedBalance)}</span>
          <span>Fim do Período: {formatCurrency(runningBalance)}</span>
        </div>
      </div>

      {/* Projection Step-by-Step Table */}
      <div className="bg-white rounded-2xl border border-stone-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-stone-100">
          <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700">
            Detalhamento Diário dos Fluxos
          </h3>
        </div>

        <div className="overflow-x-auto max-h-96">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-bold uppercase text-[10px]">
              <tr>
                <th className="py-2.5 px-4">Data</th>
                <th className="py-2.5 px-4 text-right text-emerald-700">Entradas Previstas</th>
                <th className="py-2.5 px-4 text-right text-rose-700">Saídas Previstas</th>
                <th className="py-2.5 px-4 text-right font-extrabold">Saldo Projetado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {projectionPoints.map((pt, idx) => (
                <tr key={idx} className="hover:bg-stone-50">
                  <td className="py-2.5 px-4 font-semibold text-stone-800">{formatDate(pt.dateStr)}</td>
                  <td className="py-2.5 px-4 text-right text-emerald-700 font-bold">
                    {pt.receitas > 0 ? `+${formatCurrency(pt.receitas)}` : '-'}
                  </td>
                  <td className="py-2.5 px-4 text-right text-rose-700 font-bold">
                    {pt.despesas > 0 ? `-${formatCurrency(pt.despesas)}` : '-'}
                  </td>
                  <td
                    className={`py-2.5 px-4 text-right font-extrabold ${
                      pt.saldo >= 0 ? 'text-stone-900' : 'text-rose-600'
                    }`}
                  >
                    {formatCurrency(pt.saldo)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
