import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, formatDate } from '../utils/formatters';
import { Tractor, ArrowUpRight, ArrowDownLeft, RefreshCw, FileText, CheckCircle2, ShieldCheck, Plus, X } from 'lucide-react';
import { OperacaoFinanceira, TipoOperacaoFinanceira } from '../types';

export const OperacoesView: React.FC = () => {
  const { operacoes, addOperacao, integrantes } = useFinance();

  const [showModal, setShowModal] = useState(false);
  const [tipo, setTipo] = useState<TipoOperacaoFinanceira>('CPR financeira');
  const [instituicao, setInstituicao] = useState('');
  const [valor, setValor] = useState('');
  const [detalhes, setDetalhes] = useState('');
  const [responsavelId, setResponsavelId] = useState(integrantes[0]?.id || '');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(valor.replace(',', '.')) || 0;
    if (val <= 0 || !instituicao) return;

    const today = new Date().toISOString().split('T')[0];
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);

    addOperacao({
      tipo,
      instituicao,
      responsavelId,
      valorTotal: val,
      dataContratacao: today,
      dataVencimento: nextYear.toISOString().split('T')[0],
      parcelas: 1,
      observacao: detalhes,
      status: 'Em andamento',
    });

    setShowModal(false);
    setInstituicao('');
    setValor('');
    setDetalhes('');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-stone-900 tracking-tight">
            Operações Agrícolas & Bancárias
          </h1>
          <p className="text-xs text-stone-500">
            Cédulas de Produto Rural (CPR), operações de crédito rural, custeios, aplicações e garantias
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs py-2 px-4 rounded-xl transition-colors shadow-2xs"
        >
          <Plus className="w-3.5 h-3.5" /> Nova Operação
        </button>
      </div>

      {/* Grid of Operations */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {operacoes.map((op) => (
          <div
            key={op.id}
            className="bg-white rounded-2xl border border-stone-200/80 p-5 shadow-xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between mb-3">
                <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                  {op.tipo}
                </span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    op.status === 'Liquidada'
                      ? 'bg-stone-100 text-stone-700'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {op.status}
                </span>
              </div>

              <h3 className="text-base font-extrabold text-stone-900 leading-tight">
                {op.instituicao}
              </h3>
              <p className="text-xs text-stone-500 mt-1">{op.observacao || 'Sem observações adicionais.'}</p>
            </div>

            <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-stone-400 block">
                  Contratação
                </span>
                <span className="text-xs font-semibold text-stone-700">{formatDate(op.dataContratacao)}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-stone-400 block">
                  Valor Total
                </span>
                <span className="text-base font-extrabold text-stone-900">
                  {formatCurrency(op.valorTotal)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-stone-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 bg-stone-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">Registrar Operação Bancária / Rural</h3>
              <button onClick={() => setShowModal(false)} className="text-stone-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-5 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-stone-700 mb-1">Tipo de Operação</label>
                <select
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value as TipoOperacaoFinanceira)}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg bg-white"
                >
                  <option value="CPR financeira">CPR Financeira</option>
                  <option value="Crédito rural">Crédito Rural</option>
                  <option value="Custeio">Custeio Agrícola</option>
                  <option value="Investimento agrícola">Investimento Agrícola</option>
                  <option value="Capital de giro">Capital de Giro</option>
                  <option value="Limite bancário">Limite Bancário</option>
                  <option value="Antecipações">Antecipações</option>
                  <option value="Operações estruturadas">Operações Estruturadas</option>
                  <option value="Outros">Outros</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Instituição / Contraparte</label>
                <input
                  type="text"
                  placeholder="Ex: Banco do Brasil / Cargill"
                  value={instituicao}
                  onChange={(e) => setInstituicao(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Valor da Operação (R$)</label>
                <input
                  type="text"
                  placeholder="0,00"
                  value={valor}
                  onChange={(e) => setValor(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg font-bold text-sm"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Detalhes e Cláusulas</label>
                <textarea
                  rows={2}
                  placeholder="Ex: CPR vinculada a entrega de safra de milho."
                  value={detalhes}
                  onChange={(e) => setDetalhes(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-bold bg-stone-900 text-white hover:bg-stone-800 rounded-lg"
                >
                  Salvar Operação
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
