import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, formatDate } from '../utils/formatters';
import { CreditCard, Plus, Calendar, DollarSign, CheckCircle2, ChevronRight, X, AlertCircle } from 'lucide-react';

export const CartoesView: React.FC = () => {
  const { cartoes, despesas, contas, integrantes, pagarFaturaCartao, addCartao } = useFinance();

  const [selectedCardId, setSelectedCardId] = useState<string>(cartoes[0]?.id || '');
  const [showPayModal, setShowPayModal] = useState(false);
  const [showNewCardModal, setShowNewCardModal] = useState(false);
  const [payContaId, setPayContaId] = useState(contas[0]?.id || '');
  const [payValor, setPayValor] = useState('');

  // Novo cartão
  const [novoNome, setNovoNome] = useState('');
  const [novoBanco, setNovoBanco] = useState('');
  const [novaBandeira, setNovaBandeira] = useState('Visa');
  const [novoFinal, setNovoFinal] = useState('');
  const [novoIntegranteId, setNovoIntegranteId] = useState(integrantes[0]?.id || '');
  const [novoLimite, setNovoLimite] = useState('');
  const [novoFechamento, setNovoFechamento] = useState('20');
  const [novoVencimento, setNovoVencimento] = useState('27');
  const [novaContaPagamentoId, setNovaContaPagamentoId] = useState(contas[0]?.id || '');

  const handleNovoCartao = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoNome || !novoBanco) {
      alert('Preencha ao menos o nome e o banco do cartão.');
      return;
    }
    const integrante = integrantes.find((i) => i.id === novoIntegranteId);
    addCartao({
      nome: novoNome,
      banco: novoBanco,
      bandeira: novaBandeira,
      finalCartao: novoFinal,
      titular: integrante?.nome || 'Grupo Familiar',
      integranteId: novoIntegranteId || undefined,
      limite: parseFloat(novoLimite.replace(',', '.')) || 0,
      melhorDiaCompra: Math.max(1, Number(novoFechamento) - 5),
      diaFechamento: Number(novoFechamento) || 20,
      diaVencimento: Number(novoVencimento) || 27,
      contaPagamentoId: novaContaPagamentoId,
      ativa: true,
      cor: '#6d28d9',
    });
    setShowNewCardModal(false);
    setNovoNome('');
    setNovoBanco('');
    setNovoFinal('');
    setNovoLimite('');
  };

  const selectedCard = cartoes.find((c) => c.id === selectedCardId) || cartoes[0];

  // Purchases made on this card
  const cardDespesas = despesas.filter(
    (d) => !d.deletedAt && d.cartaoId === selectedCard?.id
  );

  const totalFaturaAberta = cardDespesas
    .filter((d) => d.status === 'A pagar' || d.status === 'Atrasado')
    .reduce((sum, d) => sum + d.valor, 0);

  const limiteUtilizado = totalFaturaAberta;
  const limiteDisponivel = selectedCard ? Math.max(0, selectedCard.limite - limiteUtilizado) : 0;

  // Installment purchases (parceladas)
  const comprasParceladas = cardDespesas.filter(
    (d) => d.parcelaAtual !== undefined && d.totalParcelas !== undefined && d.totalParcelas > 1
  );

  const handlePagarFatura = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCard) return;
    const val = parseFloat(payValor.replace(',', '.')) || totalFaturaAberta;
    if (val <= 0) return;

    pagarFaturaCartao(selectedCard.id, payContaId, val);
    setShowPayModal(false);
    setPayValor('');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-stone-900 tracking-tight">
            Cartões & Faturas
          </h1>
          <p className="text-xs text-stone-500">
            Controle de limites, faturas abertas, vencimentos e compras parceladas
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNewCardModal(true)}
            className="flex items-center gap-1.5 bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs py-2 px-4 rounded-xl transition-colors shadow-2xs"
          >
            <Plus className="w-4 h-4" /> Novo Cartão
          </button>
          {selectedCard && (
            <button
              onClick={() => {
                setPayValor(totalFaturaAberta.toFixed(2));
                setShowPayModal(true);
              }}
              disabled={totalFaturaAberta <= 0}
              className="flex items-center gap-1.5 bg-purple-700 hover:bg-purple-800 disabled:bg-stone-300 text-white font-semibold text-xs py-2 px-4 rounded-xl transition-colors shadow-2xs"
            >
              <CheckCircle2 className="w-4 h-4" /> Pagar Fatura do Cartão
            </button>
          )}
        </div>
      </div>

      {/* Cards Selector Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cartoes.map((card) => {
          const isSelected = card.id === selectedCard?.id;
          const totalCartao = despesas
            .filter((d) => !d.deletedAt && d.cartaoId === card.id && d.status !== 'Pago')
            .reduce((sum, d) => sum + d.valor, 0);

          return (
            <div
              key={card.id}
              onClick={() => setSelectedCardId(card.id)}
              className={`p-5 rounded-2xl border cursor-pointer transition-all relative overflow-hidden ${
                isSelected
                  ? 'border-purple-600 bg-gradient-to-br from-stone-900 via-orange-950 to-purple-950 text-white shadow-md'
                  : 'border-stone-200 bg-white hover:border-stone-300 text-stone-900 shadow-xs'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <span className={`text-[10px] uppercase font-bold tracking-wider ${isSelected ? 'text-purple-300' : 'text-stone-400'}`}>
                    {card.bandeira} • **** {card.ultimosDigitos}
                  </span>
                  <h3 className="text-base font-extrabold leading-tight mt-0.5">
                    {card.nome}
                  </h3>
                  <span className={`text-xs ${isSelected ? 'text-stone-300' : 'text-stone-500'}`}>
                    Titular: {card.titular}
                  </span>
                </div>
                <CreditCard className={`w-6 h-6 ${isSelected ? 'text-purple-400' : 'text-stone-400'}`} />
              </div>

              <div className="space-y-1.5 pt-2 border-t border-white/10">
                <div className="flex items-center justify-between text-xs">
                  <span className={isSelected ? 'text-stone-300' : 'text-stone-500'}>Fatura Aberta:</span>
                  <span className={`font-extrabold ${isSelected ? 'text-white' : 'text-purple-700'}`}>
                    {formatCurrency(totalCartao)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className={isSelected ? 'text-stone-400' : 'text-stone-400'}>
                    Fecha dia {card.diaFechamento} • Vence dia {card.diaVencimento}
                  </span>
                  <span className={isSelected ? 'text-emerald-400' : 'text-emerald-600'}>
                    Limite: {formatCurrency(card.limite)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Card Details & Invoices */}
      {selectedCard && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Card Limit Status */}
          <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs">
            <h3 className="text-sm font-extrabold text-stone-900 uppercase tracking-tight mb-4">
              Status do Limite
            </h3>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs text-stone-500 mb-1">
                  <span>Limite Total:</span>
                  <span className="font-bold text-stone-800">{formatCurrency(selectedCard.limite)}</span>
                </div>
                <div className="w-full bg-stone-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-purple-600 h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, (limiteUtilizado / selectedCard.limite) * 100)}%`,
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
                <div className="p-3 rounded-xl bg-purple-50 border border-purple-100">
                  <span className="text-[10px] uppercase font-bold text-purple-600 block">Fatura Atual</span>
                  <span className="text-sm font-extrabold text-purple-950">
                    {formatCurrency(totalFaturaAberta)}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                  <span className="text-[10px] uppercase font-bold text-emerald-600 block">Disponível</span>
                  <span className="text-sm font-extrabold text-emerald-950">
                    {formatCurrency(limiteDisponivel)}
                  </span>
                </div>
              </div>

              <div className="text-[11px] text-stone-500 p-3 bg-stone-50 rounded-xl space-y-1">
                <div><strong>Fechamento da fatura:</strong> Todo dia {selectedCard.diaFechamento}</div>
                <div><strong>Vencimento da fatura:</strong> Todo dia {selectedCard.diaVencimento}</div>
              </div>
            </div>
          </div>

          {/* Card Purchases & Installments List (2 cols) */}
          <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-stone-100">
              <h3 className="text-sm font-extrabold text-stone-900 uppercase tracking-tight">
                Lançamentos no Cartão ({cardDespesas.length})
              </h3>
              <span className="text-xs text-purple-700 font-bold bg-purple-50 px-2.5 py-1 rounded-lg">
                Fatura Atual: {formatCurrency(totalFaturaAberta)}
              </span>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {cardDespesas.length === 0 ? (
                <p className="text-xs text-stone-400 py-8 text-center">
                  Nenhum lançamento registrado neste cartão.
                </p>
              ) : (
                cardDespesas.map((d) => (
                  <div
                    key={d.id}
                    className="p-3 rounded-xl border border-stone-100 bg-stone-50/50 hover:bg-stone-50 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-stone-900">{d.descricao}</span>
                        {d.totalParcelas && d.totalParcelas > 1 && (
                          <span className="text-[10px] bg-orange-100 text-orange-800 font-bold px-1.5 py-0.2 rounded">
                            Parcela {d.parcelaAtual}/{d.totalParcelas}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-stone-500">
                        {d.categoria} • Vencimento: {formatDate(d.dataVencimento)} • {d.fornecedor || 'Estabelecimento'}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="font-extrabold text-stone-900 block">
                        {formatCurrency(d.valor)}
                      </span>
                      <span
                        className={`text-[10px] font-bold ${
                          d.status === 'Pago' ? 'text-emerald-600' : 'text-purple-700'
                        }`}
                      >
                        {d.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Pay Invoice Modal (Section 10) */}
      {showPayModal && selectedCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-stone-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 bg-purple-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-purple-300" />
                <h3 className="font-bold text-sm">Pagar Fatura - {selectedCard.nome}</h3>
              </div>
              <button onClick={() => setShowPayModal(false)} className="text-purple-300 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handlePagarFatura} className="p-5 space-y-4 text-xs">
              <div className="bg-purple-50 border border-purple-200 p-3 rounded-xl text-purple-900">
                <strong>Regra de Pagamento de Fatura:</strong>
                <ul className="list-disc pl-4 mt-1 space-y-0.5 text-[11px]">
                  <li>O valor será debitado da conta bancária escolhida.</li>
                  <li>O limite de crédito de {formatCurrency(selectedCard.limite)} será restaurado.</li>
                  <li>Os lançamentos vinculados à fatura passarão para o status &ldquo;Pago&rdquo;.</li>
                </ul>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Conta Bancária de Pagamento</label>
                <select
                  value={payContaId}
                  onChange={(e) => setPayContaId(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg bg-white"
                  required
                >
                  {contas.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nomePersonalizado} ({c.banco})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Valor do Pagamento (R$)</label>
                <input
                  type="text"
                  value={payValor}
                  onChange={(e) => setPayValor(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg font-extrabold text-sm"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPayModal(false)}
                  className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-bold bg-purple-700 hover:bg-purple-800 text-white rounded-lg"
                >
                  Confirmar Pagamento de Fatura
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Card Modal */}
      {showNewCardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-md overflow-hidden">
            <div className="p-4 bg-stone-900 text-white flex items-center justify-between">
              <h2 className="font-extrabold text-sm tracking-tight">Novo Cartão</h2>
              <button onClick={() => setShowNewCardModal(false)} className="text-stone-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleNovoCartao} className="p-5 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-stone-700 mb-1">Apelido do cartão</label>
                <input
                  type="text"
                  placeholder="Ex: Cartão Empresarial Nubank"
                  value={novoNome}
                  onChange={(e) => setNovoNome(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Banco</label>
                  <input
                    type="text"
                    placeholder="Ex: Nubank"
                    value={novoBanco}
                    onChange={(e) => setNovoBanco(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Bandeira</label>
                  <select
                    value={novaBandeira}
                    onChange={(e) => setNovaBandeira(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg bg-white"
                  >
                    <option value="Visa">Visa</option>
                    <option value="Mastercard">Mastercard</option>
                    <option value="Elo">Elo</option>
                    <option value="American Express">American Express</option>
                    <option value="Outra">Outra</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Final do cartão</label>
                  <input
                    type="text"
                    maxLength={4}
                    placeholder="0000"
                    value={novoFinal}
                    onChange={(e) => setNovoFinal(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Limite (R$)</label>
                  <input
                    type="text"
                    placeholder="0,00"
                    value={novoLimite}
                    onChange={(e) => setNovoLimite(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg"
                  />
                </div>
              </div>
              {integrantes.length > 1 && (
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Titular</label>
                  <select
                    value={novoIntegranteId}
                    onChange={(e) => setNovoIntegranteId(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg bg-white"
                  >
                    {integrantes.map((ig) => (
                      <option key={ig.id} value={ig.id}>{ig.nome}</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="block font-bold text-stone-700 mb-1">Conta usada pra pagar a fatura</label>
                <select
                  value={novaContaPagamentoId}
                  onChange={(e) => setNovaContaPagamentoId(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg bg-white"
                >
                  {contas.map((c) => (
                    <option key={c.id} value={c.id}>{c.nomePersonalizado} ({c.banco})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Dia de fechamento</label>
                  <input
                    type="number"
                    min={1}
                    max={31}
                    value={novoFechamento}
                    onChange={(e) => setNovoFechamento(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Dia de vencimento</label>
                  <input
                    type="number"
                    min={1}
                    max={31}
                    value={novoVencimento}
                    onChange={(e) => setNovoVencimento(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowNewCardModal(false)}
                  className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-lg font-medium"
                >
                  Cancelar
                </button>
                <button type="submit" className="px-5 py-2 font-bold bg-stone-900 text-white hover:bg-stone-800 rounded-xl">
                  Adicionar Cartão
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
