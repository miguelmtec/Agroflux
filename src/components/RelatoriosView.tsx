import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, formatDate } from '../utils/formatters';
import {
  FileSpreadsheet,
  Download,
  Printer,
  FileText,
  Filter,
  CheckCircle2,
  Calendar,
  Building2,
  TrendingUp,
  TrendingDown,
  Layers,
} from 'lucide-react';

export const RelatoriosView: React.FC = () => {
  const {
    receitas,
    despesas,
    contas,
    cartoes,
    emprestimos,
    integrantes,
    transferencias,
    saldoDisponivelTotal,
    patrimonioLiquidoTotal,
  } = useFinance();

  const [selectedReportId, setSelectedReportId] = useState<number>(1);
  const [periodo, setPeriodo] = useState<'MÊS_ATUAL' | 'ANO_ATUAL' | 'TOTAL'>('MÊS_ATUAL');

  const reportList = [
    { id: 1, title: 'Extrato Consolidado Familiar', desc: 'Consolidação de todas as entradas, saídas e saldos da família' },
    { id: 2, title: 'Extrato Individual por Integrante', desc: 'Movimentações separadas por titular/beneficiário' },
    { id: 3, title: 'Despesas por Categoria', desc: 'Ranking de gastos por centro de custo' },
    { id: 4, title: 'Receitas por Categoria', desc: 'Origem dos rendimentos e receitas agrícolas' },
    { id: 5, title: 'Despesas por Fornecedor', desc: 'Valores pagos e pendentes por credor/fornecedor' },
    { id: 6, title: 'Receitas por Cliente / Pagador', desc: 'Créditos agrícolas e recebimentos comerciais' },
    { id: 7, title: 'Despesas por Conta Bancária', desc: 'Volume de saques e liquidações por agência/banco' },
    { id: 8, title: 'Gastos com Cartões de Crédito', desc: 'Faturas, limites e compras parceladas' },
    { id: 9, title: 'Relatório de Contas a Pagar', desc: 'Compromissos abertos agrupados por vencimento' },
    { id: 10, title: 'Relatório de Contas a Receber', desc: 'Previsões de recebimento futuros' },
    { id: 11, title: 'Relatório de Inadimplência / Atrasadas', desc: 'Contas com vencimento ultrapassado' },
    { id: 12, title: 'Relatório de Empréstimos e Financiamentos', desc: 'Saldos devedores, taxas e garantias' },
    { id: 13, title: 'Evolução Patrimonial Líquida', desc: 'Ativos financeiros versus dívidas consolidadas' },
    { id: 14, title: 'Demonstrativo de Resultado Mensal (DRE Familiar)', desc: 'Receitas - Custos - Despesas = Resultado Líquido' },
    { id: 15, title: 'Demonstrativo de Fluxo de Caixa (Realizado x Orçado)', desc: 'Confronto entre planejado e liquidado' },
    { id: 16, title: 'Relatório de Transferências entre Contas', desc: 'Histórico de remanejamento interno de saldos' },
  ];

  const currentReport = reportList.find((r) => r.id === selectedReportId) || reportList[0];

  // CSV Exporter
  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += `Relatorio:;${currentReport.title}\r\n`;
    csvContent += `Periodo:;${periodo}\r\n`;
    csvContent += `Data de Emissao:;${new Date().toLocaleDateString('pt-BR')}\r\n\r\n`;

    if (selectedReportId === 1 || selectedReportId === 9) {
      csvContent += 'Data;Tipo;Descricao;Categoria;Valor;Status\r\n';
      despesas.forEach((d) => {
        csvContent += `${formatDate(d.dataVencimento)};Despesa;${d.descricao};${d.categoria};${d.valor.toFixed(2)};${d.status}\r\n`;
      });
    } else {
      csvContent += 'Descricao;Valor;Status\r\n';
      csvContent += `Total Saldo Bancario;${saldoDisponivelTotal.toFixed(2)};Disponivel\r\n`;
      csvContent += `Patrimonio Liquido;${patrimonioLiquidoTotal.toFixed(2)};Calculado\r\n`;
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `agroflux_relatorio_${selectedReportId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-stone-900 tracking-tight">
            Central de Relatórios Executivos
          </h1>
          <p className="text-xs text-stone-500">
            16 relatórios gerenciais estruturados para análise financeira do grupo familiar
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold text-xs py-2 px-3 rounded-xl transition-colors"
          >
            <Download className="w-3.5 h-3.5" /> Exportar CSV / Excel
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs py-2 px-3.5 rounded-xl transition-colors shadow-2xs"
          >
            <Printer className="w-3.5 h-3.5" /> Imprimir / PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left: 16 Reports Selector (Section 20) */}
        <div className="bg-white rounded-2xl border border-stone-200/80 p-3 shadow-xs space-y-1">
          <div className="p-2 text-[10px] font-bold uppercase tracking-wider text-stone-400">
            Relatórios Disponíveis (16)
          </div>
          <div className="space-y-1 max-h-[540px] overflow-y-auto pr-1">
            {reportList.map((r) => {
              const isSelected = r.id === selectedReportId;
              return (
                <button
                  key={r.id}
                  onClick={() => setSelectedReportId(r.id)}
                  className={`w-full text-left p-2.5 rounded-xl text-xs transition-all ${
                    isSelected
                      ? 'bg-stone-900 text-white font-bold shadow-xs'
                      : 'text-stone-700 hover:bg-stone-100 font-medium'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold w-5 h-5 rounded flex items-center justify-center ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-500'
                      }`}
                    >
                      {r.id}
                    </span>
                    <span className="truncate">{r.title}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Live Report Viewer / DRE */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-stone-200/80 p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-stone-100 gap-3">
            <div>
              <span className="text-[10px] uppercase font-bold text-stone-400 block">
                Relatório Nº {currentReport.id}
              </span>
              <h2 className="text-lg font-extrabold text-stone-900">
                {currentReport.title}
              </h2>
              <p className="text-xs text-stone-500">{currentReport.desc}</p>
            </div>

            <select
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value as any)}
              className="text-xs py-1.5 px-3 rounded-lg border border-stone-200 bg-stone-50 text-stone-700 self-start sm:self-auto"
            >
              <option value="MÊS_ATUAL">Competência Atual (Mês Corrente)</option>
              <option value="ANO_ATUAL">Exercício Atual (Ano Todo)</option>
              <option value="TOTAL">Acumulado Histórico</option>
            </select>
          </div>

          {/* Report Body Depending on Selection */}
          {selectedReportId === 14 ? (
            /* DRE FAMILIAR (Section 20 - item 14) */
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400">
                Demonstrativo de Resultado do Exercício
              </h3>
              <div className="border border-stone-200 rounded-xl overflow-hidden divide-y divide-stone-100 text-xs">
                <div className="p-3 bg-stone-50 font-bold text-stone-900 flex justify-between">
                  <span>(+) RECEITA BRUTA FAMILIAR</span>
                  <span className="text-emerald-700 font-extrabold">
                    {formatCurrency(receitas.reduce((s, r) => s + r.valor, 0))}
                  </span>
                </div>
                <div className="p-3 pl-6 text-stone-600 flex justify-between">
                  <span>Receitas Agrícolas & Safras</span>
                  <span>{formatCurrency(receitas.filter(r => r.categoria.includes('Safra')).reduce((s, r) => s + r.valor, 0))}</span>
                </div>
                <div className="p-3 pl-6 text-stone-600 flex justify-between">
                  <span>Arrendamentos e Outros Rendimentos</span>
                  <span>{formatCurrency(receitas.filter(r => !r.categoria.includes('Safra')).reduce((s, r) => s + r.valor, 0))}</span>
                </div>

                <div className="p-3 bg-stone-50 font-bold text-stone-900 flex justify-between">
                  <span>(-) DESPESAS OPERACIONAIS & FAMILIARES</span>
                  <span className="text-rose-700 font-extrabold">
                    {formatCurrency(despesas.reduce((s, d) => s + d.valor, 0))}
                  </span>
                </div>
                <div className="p-3 pl-6 text-stone-600 flex justify-between">
                  <span>Produção Rural e Manutenção de Maquinário</span>
                  <span>{formatCurrency(despesas.filter(d => d.categoria.includes('Produção') || d.categoria.includes('Máquinas')).reduce((s, d) => s + d.valor, 0))}</span>
                </div>
                <div className="p-3 pl-6 text-stone-600 flex justify-between">
                  <span>Despesas Pessoais e Familiares</span>
                  <span>{formatCurrency(despesas.filter(d => !d.categoria.includes('Produção') && !d.categoria.includes('Máquinas')).reduce((s, d) => s + d.valor, 0))}</span>
                </div>

                <div className="p-4 bg-stone-900 text-white font-extrabold text-sm flex justify-between">
                  <span>(=) RESULTADO LÍQUIDO DO PERÍODO</span>
                  <span className="text-emerald-400">
                    {formatCurrency(
                      receitas.reduce((s, r) => s + r.valor, 0) - despesas.reduce((s, d) => s + d.valor, 0)
                    )}
                  </span>
                </div>
              </div>
            </div>
          ) : selectedReportId === 13 ? (
            /* EVOLUÇÃO PATRIMONIAL LÍQUIDA (Section 20 - item 13 & Section 17) */
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                  <span className="text-[10px] uppercase font-bold text-emerald-600 block">Ativos em Bancos</span>
                  <span className="text-xl font-extrabold text-emerald-950">{formatCurrency(saldoDisponivelTotal)}</span>
                </div>
                <div className="p-4 bg-rose-50 rounded-xl border border-rose-200">
                  <span className="text-[10px] uppercase font-bold text-rose-600 block">Passivos / Empréstimos</span>
                  <span className="text-xl font-extrabold text-rose-950">
                    {formatCurrency(emprestimos.reduce((s, e) => s + e.saldoDevedor, 0))}
                  </span>
                </div>
                <div className="p-4 bg-stone-900 text-white rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-stone-400 block">Patrimônio Líquido</span>
                  <span className="text-xl font-extrabold text-emerald-400">{formatCurrency(patrimonioLiquidoTotal)}</span>
                </div>
              </div>

              <div className="text-xs text-stone-500 p-4 border border-stone-100 rounded-xl">
                O patrimônio líquido financeiro representa a liquidez real do grupo familiar deduzida das obrigações contratadas de curto, médio e longo prazo.
              </div>
            </div>
          ) : (
            /* Standard Grid for Reports */
            <div className="space-y-4">
              <div className="border border-stone-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-4">Referência / Item</th>
                      <th className="py-2.5 px-4">Responsável</th>
                      <th className="py-2.5 px-4">Vencimento</th>
                      <th className="py-2.5 px-4 text-right">Valor</th>
                      <th className="py-2.5 px-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {despesas.slice(0, 10).map((d) => (
                      <tr key={d.id} className="hover:bg-stone-50">
                        <td className="py-2.5 px-4 font-bold text-stone-900">{d.descricao}</td>
                        <td className="py-2.5 px-4 text-stone-600">{integrantes.find(i => i.id === d.integranteId)?.apelido || 'Família'}</td>
                        <td className="py-2.5 px-4 text-stone-600">{formatDate(d.dataVencimento)}</td>
                        <td className="py-2.5 px-4 text-right font-extrabold text-stone-900">{formatCurrency(d.valor)}</td>
                        <td className="py-2.5 px-4 text-center">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-stone-100 text-stone-700">
                            {d.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
