import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, formatDate } from '../utils/formatters';
import {
  Building2,
  Tractor,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Plus,
  ArrowRight,
  ShieldAlert,
  Sliders,
  DollarSign,
  X,
} from 'lucide-react';
import { TipoEmprestimo } from '../types';

export const EmprestimosView: React.FC = () => {
  const { emprestimos, pagarParcelaEmprestimo, addEmprestimo, contas, integrantes } = useFinance();

  const [selectedLoanId, setSelectedLoanId] = useState<string>(emprestimos[0]?.id || '');
  const [showNewLoanModal, setShowNewLoanModal] = useState(false);

  // New loan state
  const [nomeOperacao, setNomeOperacao] = useState('');
  const [credor, setCredor] = useState('');
  const [tipo, setTipo] = useState<TipoEmprestimo>('Crédito Rural (Custeio)');
  const [valorTotal, setValorTotal] = useState('');
  const [taxaJuros, setTaxaJuros] = useState('');
  const [qtdParcelas, setQtdParcelas] = useState('12');
  const [garantia, setGarantia] = useState('');
  const [integranteResp, setIntegranteResp] = useState(integrantes[0]?.id || '');

  const selectedLoan = emprestimos.find((e) => e.id === selectedLoanId) || emprestimos[0];

  const totalDividasContratadas = emprestimos.reduce((sum, e) => sum + e.valorContratado, 0);
  const totalSaldoDevedor = emprestimos
    .filter((e) => e.status === 'Ativo')
    .reduce((sum, e) => sum + e.saldoDevedor, 0);

  const handlePagarParcela = (loanId: string, parcelaNumero: number) => {
    if (confirm(`Deseja confirmar a liquidação da parcela ${parcelaNumero}?`)) {
      pagarParcelaEmprestimo(loanId, parcelaNumero);
    }
  };

  const handleCreateLoan = (e: React.FormEvent) => {
    e.preventDefault();
    const vt = parseFloat(valorTotal.replace(',', '.')) || 0;
    const n = parseInt(qtdParcelas, 10) || 12;
    if (vt <= 0) return;

    const valorParcela = vt / n;
    const parcelas = Array.from({ length: n }).map((_, idx) => {
      const d = new Date();
      d.setMonth(d.getMonth() + (idx + 1));
      return {
        numero: idx + 1,
        vencimento: d.toISOString().split('T')[0],
        valor: valorParcela,
        status: 'Pendente' as const,
      };
    });

    addEmprestimo({
      nomeOperacao,
      credor,
      tipo,
      valorContratado: vt,
      valorLiberado: vt,
      saldoDevedor: vt,
      taxaJuros,
      quantidadeParcelas: n,
      parcelasPagas: 0,
      dataContratacao: new Date().toISOString().split('T')[0],
      bensGarantia: garantia,
      integranteId: integranteResp,
      status: 'Ativo',
      parcelas,
    });

    setShowNewLoanModal(false);
    setNomeOperacao('');
    setCredor('');
    setValorTotal('');
    setTaxaJuros('');
    setGarantia('');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-stone-900 tracking-tight">
            Empréstimos & Financiamentos
          </h1>
          <p className="text-xs text-stone-500">
            Controle de crédito rural, financiamentos de máquinas, CPRs e capital de giro
          </p>
        </div>

        <button
          onClick={() => setShowNewLoanModal(true)}
          className="flex items-center gap-1.5 bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs py-2 px-4 rounded-xl transition-colors shadow-2xs"
        >
          <Plus className="w-3.5 h-3.5" /> Novo Financiamento / CPR
        </button>
      </div>

      {/* Overview stats banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-stone-400 block">
            Saldo Devedor Total
          </span>
          <div className="text-2xl font-extrabold text-stone-900 tracking-tight mt-1">
            {formatCurrency(totalSaldoDevedor)}
          </div>
          <span className="text-xs text-stone-500 mt-1 block">
            Exigível em médio e longo prazo
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-stone-400 block">
            Total Contratado
          </span>
          <div className="text-2xl font-extrabold text-orange-900 tracking-tight mt-1">
            {formatCurrency(totalDividasContratadas)}
          </div>
          <span className="text-xs text-stone-500 mt-1 block">
            {emprestimos.length} contratos ativos registrados
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-stone-400 block">
            Garantias e Alienações
          </span>
          <div className="text-sm font-bold text-stone-800 mt-1">
            Safra de Soja & Trator John Deere
          </div>
          <span className="text-xs text-emerald-600 font-semibold mt-1 block">
            Contratos em conformidade
          </span>
        </div>
      </div>

      {/* Loans Grid and Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Contracts List */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400">
            Contratos Ativos
          </h3>
          {emprestimos.map((loan) => {
            const isSelected = loan.id === selectedLoan?.id;
            return (
              <div
                key={loan.id}
                onClick={() => setSelectedLoanId(loan.id)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'border-orange-600 bg-orange-50/50 shadow-xs'
                    : 'border-stone-200 bg-white hover:border-stone-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-orange-700 bg-orange-100/70 px-2 py-0.5 rounded">
                      {loan.tipo}
                    </span>
                    <h4 className="font-extrabold text-stone-900 text-sm mt-1.5 leading-tight">
                      {loan.nomeOperacao}
                    </h4>
                    <span className="text-xs text-stone-500 block">{loan.credor}</span>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      loan.status === 'Ativo'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-stone-100 text-stone-600'
                    }`}
                  >
                    {loan.status}
                  </span>
                </div>

                <div className="mt-3 pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                  <span className="text-stone-500">Saldo Devedor:</span>
                  <span className="font-extrabold text-stone-900">
                    {formatCurrency(loan.saldoDevedor)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: Selected Contract Details and Schedule of Installments */}
        {selectedLoan && (
          <div className="lg:col-span-2 bg-white rounded-2xl border border-stone-200/80 p-5 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-stone-100 gap-2">
              <div>
                <span className="text-[10px] uppercase font-bold text-orange-600 block">
                  {selectedLoan.tipo}
                </span>
                <h2 className="text-lg font-extrabold text-stone-900">
                  {selectedLoan.nomeOperacao}
                </h2>
                <span className="text-xs text-stone-500">
                  Credor: {selectedLoan.credor} • Contratado em: {formatDate(selectedLoan.dataContratacao)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-stone-400 block">
                  Saldo Devedor
                </span>
                <span className="text-xl font-extrabold text-stone-900">
                  {formatCurrency(selectedLoan.saldoDevedor)}
                </span>
              </div>
            </div>

            {/* Quick Meta Details */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-stone-50 p-3.5 rounded-xl border border-stone-100">
              <div>
                <span className="text-stone-400 text-[10px] uppercase font-bold block">Taxa de Juros</span>
                <span className="font-bold text-stone-800">{selectedLoan.taxaJuros}</span>
              </div>
              <div>
                <span className="text-stone-400 text-[10px] uppercase font-bold block">Valor Liberado</span>
                <span className="font-bold text-stone-800">{formatCurrency(selectedLoan.valorLiberado)}</span>
              </div>
              <div>
                <span className="text-stone-400 text-[10px] uppercase font-bold block">Progresso</span>
                <span className="font-bold text-stone-800">
                  {selectedLoan.parcelasPagas} de {selectedLoan.quantidadeParcelas} pagas
                </span>
              </div>
              <div>
                <span className="text-stone-400 text-[10px] uppercase font-bold block">Garantias</span>
                <span className="font-bold text-stone-800 truncate block">{selectedLoan.bensGarantia || 'Nenhuma'}</span>
              </div>
            </div>

            {/* Installments Table (Section 11) */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-3">
                Cronograma de Parcelas
              </h3>
              <div className="border border-stone-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 text-[10px] uppercase font-bold">
                    <tr>
                      <th className="py-2.5 px-3">Parcela</th>
                      <th className="py-2.5 px-3">Vencimento</th>
                      <th className="py-2.5 px-3 text-right">Valor</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                      <th className="py-2.5 px-3 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {selectedLoan.parcelas.map((p) => (
                      <tr key={p.numero} className="hover:bg-stone-50/70">
                        <td className="py-2.5 px-3 font-bold text-stone-800">
                          {p.numero} / {selectedLoan.quantidadeParcelas}
                        </td>
                        <td className="py-2.5 px-3 text-stone-600">{formatDate(p.vencimento)}</td>
                        <td className="py-2.5 px-3 text-right font-extrabold text-stone-900">
                          {formatCurrency(p.valor)}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              p.status === 'Pago'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {p.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          {p.status === 'Pendente' && (
                            <button
                              onClick={() => handlePagarParcela(selectedLoan.id, p.numero)}
                              className="px-2.5 py-1 text-[11px] font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
                            >
                              Liquidar Parcela
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* New Loan Modal */}
      {showNewLoanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-stone-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 bg-stone-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">Novo Financiamento / CPR</h3>
              <button onClick={() => setShowNewLoanModal(false)} className="text-stone-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateLoan} className="p-5 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-stone-700 mb-1">Identificação da Operação</label>
                <input
                  type="text"
                  placeholder="Ex: Custeio Soja 2026/2027 ou Financiamento Trator"
                  value={nomeOperacao}
                  onChange={(e) => setNomeOperacao(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Credor / Banco</label>
                  <input
                    type="text"
                    placeholder="Ex: Banco do Brasil"
                    value={credor}
                    onChange={(e) => setCredor(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Tipo de Operação</label>
                  <select
                    value={tipo}
                    onChange={(e) => setTipo(e.target.value as TipoEmprestimo)}
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg bg-white"
                  >
                    <option value="Crédito Rural (Custeio)">Crédito Rural (Custeio)</option>
                    <option value="Financiamento de Máquinas e Equipamentos">Financiamento de Máquinas</option>
                    <option value="CPR Financeira">CPR Financeira</option>
                    <option value="Capital de Giro">Capital de Giro</option>
                    <option value="Empréstimo Pessoal">Empréstimo Pessoal</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Valor Contratado (R$)</label>
                  <input
                    type="text"
                    placeholder="0,00"
                    value={valorTotal}
                    onChange={(e) => setValorTotal(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Taxa de Juros</label>
                  <input
                    type="text"
                    placeholder="Ex: 8.5% a.a."
                    value={taxaJuros}
                    onChange={(e) => setTaxaJuros(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Nº Parcelas</label>
                  <input
                    type="number"
                    min={1}
                    max={120}
                    value={qtdParcelas}
                    onChange={(e) => setQtdParcelas(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Bens em Garantia / Alienação</label>
                <input
                  type="text"
                  placeholder="Ex: Hipoteca Fazenda Santa Maria matrícula 18.234"
                  value={garantia}
                  onChange={(e) => setGarantia(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewLoanModal(false)}
                  className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-bold bg-stone-900 text-white hover:bg-stone-800 rounded-lg"
                >
                  Cadastrar Financiamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
