import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency } from '../utils/formatters';
import { Repeat, Plus, Calendar, CheckCircle2, Building2, User, X } from 'lucide-react';
import { Recorrencia, Periodicidade } from '../types';

export const RecorrenciasView: React.FC = () => {
  const { recorrencias, addRecorrencia, integrantes, contas } = useFinance();

  const [showModal, setShowModal] = useState(false);
  const [tipo, setTipo] = useState<'RECEITA' | 'DESPESA'>('DESPESA');
  const [descricao, setDescricao] = useState('');
  const [categoria, setCategoria] = useState('Moradia & Manutenção');
  const [valorEstimado, setValorEstimado] = useState('');
  const [diaVencimento, setDiaVencimento] = useState('10');
  const [periodicidade, setPeriodicidade] = useState<Periodicidade>('mensal');
  const [integranteId, setIntegranteId] = useState(integrantes[0]?.id || '');
  const [contaId, setContaId] = useState(contas[0]?.id || '');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(valorEstimado.replace(',', '.')) || 0;
    if (!descricao || val <= 0) return;

    addRecorrencia({
      tipo,
      descricao,
      categoria,
      valor: val,
      diaVencimento: parseInt(diaVencimento, 10) || 10,
      periodicidade,
      integranteId,
      contaPreferencialId: contaId,
      inicio: new Date().toISOString().split('T')[0],
      gerarAutomaticamente: true,
      ativo: true,
    });

    setShowModal(false);
    setDescricao('');
    setValorEstimado('');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-stone-900 tracking-tight">
            Contratos & Despesas Recorrentes
          </h1>
          <p className="text-xs text-stone-500">
            Controle de contas fixas: energia, internet, seguros, folha e arrendamentos mensais
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs py-2 px-4 rounded-xl transition-colors shadow-2xs"
        >
          <Plus className="w-3.5 h-3.5" /> Nova Recorrência
        </button>
      </div>

      {/* Recurrences Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {recorrencias.map((rec) => {
          const int = integrantes.find((i) => i.id === rec.integranteId);
          const cta = contas.find((c) => c.id === rec.contaPreferencialId);

          return (
            <div
              key={rec.id}
              className="bg-white rounded-2xl border border-stone-200/80 p-5 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span
                    className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded ${
                      rec.tipo === 'RECEITA'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {rec.tipo} • {rec.periodicidade}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                    Ativa
                  </span>
                </div>

                <h3 className="text-base font-extrabold text-stone-900 leading-tight">
                  {rec.descricao}
                </h3>
                <span className="text-xs text-stone-500 block mt-1">
                  Categoria: {rec.categoria}
                </span>

                <div className="mt-3 pt-3 border-t border-stone-100 space-y-1 text-xs text-stone-600">
                  <div><strong>Vencimento:</strong> Todo dia {rec.diaVencimento}</div>
                  <div><strong>Pertence a:</strong> {int?.apelido || 'Família'}</div>
                  {cta && <div><strong>Débito em:</strong> {cta.nomePersonalizado}</div>}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-stone-400">
                  Valor Estimado
                </span>
                <span className="text-base font-extrabold text-stone-900">
                  {formatCurrency(rec.valor)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-stone-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 bg-stone-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">Cadastrar Recorrência Financeira</h3>
              <button onClick={() => setShowModal(false)} className="text-stone-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-5 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-stone-700 mb-1">Tipo</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTipo('DESPESA')}
                    className={`py-2 rounded-lg font-bold ${
                      tipo === 'DESPESA' ? 'bg-rose-600 text-white' : 'bg-stone-100 text-stone-700'
                    }`}
                  >
                    Despesa Fixa
                  </button>
                  <button
                    type="button"
                    onClick={() => setTipo('RECEITA')}
                    className={`py-2 rounded-lg font-bold ${
                      tipo === 'RECEITA' ? 'bg-emerald-600 text-white' : 'bg-stone-100 text-stone-700'
                    }`}
                  >
                    Receita Recorrente
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Descrição</label>
                <input
                  type="text"
                  placeholder="Ex: Conta de Energia Sede Fazenda / Seguro Agrícola"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Valor Estimado (R$)</label>
                  <input
                    type="text"
                    placeholder="0,00"
                    value={valorEstimado}
                    onChange={(e) => setValorEstimado(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Dia do Vencimento</label>
                  <input
                    type="number"
                    min={1}
                    max={31}
                    value={diaVencimento}
                    onChange={(e) => setDiaVencimento(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Pertence a</label>
                  <select
                    value={integranteId}
                    onChange={(e) => setIntegranteId(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg bg-white"
                  >
                    {integrantes.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.apelido}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Periodicidade</label>
                  <select
                    value={periodicidade}
                    onChange={(e) => setPeriodicidade(e.target.value as Periodicidade)}
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg bg-white"
                  >
                    <option value="mensal">Mensal</option>
                    <option value="semanal">Semanal</option>
                    <option value="quinzenal">Quinzenal</option>
                    <option value="bimestral">Bimestral</option>
                    <option value="trimestral">Trimestral</option>
                    <option value="semestral">Semestral</option>
                    <option value="anual">Anual</option>
                  </select>
                </div>
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
                  Salvar Recorrência
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
