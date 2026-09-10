import React, { useState, useEffect } from 'react';
import { useFinance } from '../context/FinanceContext';
import {
  X,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  CreditCard,
  Building2,
  ChevronDown,
} from 'lucide-react';

interface NovoLancamentoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NovoLancamentoModal: React.FC<NovoLancamentoModalProps> = ({ isOpen, onClose }) => {
  const { integrantes, fazendas, contas, cartoes, addDespesa, addReceita, addTransferencia } = useFinance();

  const [tipo, setTipo] = useState<'DESPESA' | 'RECEITA' | 'TRANSFERENCIA'>('DESPESA');
  const [meioPagamento, setMeioPagamento] = useState<'A_DEFINIR' | 'CONTA' | 'CARTAO'>('A_DEFINIR');
  const [showMais, setShowMais] = useState(false);

  // Common fields
  const [descricao, setDescricao] = useState('');
  const [categoria, setCategoria] = useState('Produção Rural');
  const [valor, setValor] = useState('');
  const [dataVencimento, setDataVencimento] = useState(() => new Date().toISOString().split('T')[0]);
  const [dataCompetencia, setDataCompetencia] = useState(dataVencimento);
  const [competenciaEditada, setCompetenciaEditada] = useState(false);
  const [integranteId, setIntegranteId] = useState(integrantes[0]?.id || '');
  const [fazendaId, setFazendaId] = useState('');
  const [contaId, setContaId] = useState('');
  const [cartaoId, setCartaoId] = useState(cartoes[0]?.id || '');
  const [fornecedor, setFornecedor] = useState('');
  const [cliente, setCliente] = useState('');
  const [observacao, setObservacao] = useState('');
  const [jaPago, setJaPago] = useState(false);

  // Installments
  const [isParcelado, setIsParcelado] = useState(false);
  const [totalParcelas, setTotalParcelas] = useState('3');

  // Transfer fields
  const [transfDestinoId, setTransfDestinoId] = useState(contas[1]?.id || '');

  const [anexoNome, setAnexoNome] = useState('');

  // Keep competência in sync with vencimento unless the person edited it manually
  useEffect(() => {
    if (!competenciaEditada) setDataCompetencia(dataVencimento);
  }, [dataVencimento, competenciaEditada]);

  const mostrarIntegrante = integrantes.length > 1;
  const mostrarFazenda = fazendas.length > 1;

  if (!isOpen) return null;

  const resetAndClose = () => {
    setShowMais(false);
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(valor.replace(',', '.')) || 0;
    if (val <= 0 || !descricao.trim()) {
      alert('Informe uma descrição e um valor válido.');
      return;
    }

    if (tipo === 'TRANSFERENCIA') {
      if (!contaId) {
        alert('Selecione a conta bancária de origem.');
        return;
      }
      if (contaId === transfDestinoId) {
        alert('As contas de origem e destino devem ser diferentes.');
        return;
      }
      addTransferencia({
        contaOrigemId: contaId,
        contaDestinoId: transfDestinoId,
        valor: val,
        data: dataCompetencia,
        descricao,
        observacao,
      });
      resetAndClose();
      return;
    }

    if (tipo === 'RECEITA') {
      addReceita({
        descricao,
        categoria,
        valor: val,
        dataCompetencia,
        dataPrevista: dataVencimento,
        dataRecebimento: jaPago ? dataVencimento : undefined,
        status: jaPago ? 'Recebida' : 'Prevista',
        integranteId,
        fazendaId: fazendaId || undefined,
        contaId: contaId || undefined,
        clientePagador: cliente,
        observacao,
        anexos: anexoNome ? [anexoNome] : [],
      });
      resetAndClose();
      return;
    }

    // DESPESA (normal ou parcelada)
    if (jaPago && meioPagamento === 'A_DEFINIR') {
      alert('Como a despesa já foi paga, selecione a conta bancária ou cartão utilizado para liquidação.');
      return;
    }

    const nParcelas = isParcelado ? Math.max(1, parseInt(totalParcelas, 10)) : 1;
    const valorPorParcela = val / nParcelas;

    for (let i = 1; i <= nParcelas; i++) {
      const vDate = new Date(dataVencimento);
      vDate.setMonth(vDate.getMonth() + (i - 1));
      const vencStr = vDate.toISOString().split('T')[0];
      const descFinal = isParcelado ? `${descricao} (${i}/${nParcelas})` : descricao;

      addDespesa({
        descricao: descFinal,
        categoria,
        valor: valorPorParcela,
        dataCompetencia,
        dataVencimento: vencStr,
        dataPagamento: jaPago && i === 1 ? dataVencimento : undefined,
        status: jaPago && i === 1 ? 'Pago' : 'A pagar',
        integranteId,
        fazendaId: fazendaId || undefined,
        contaId: meioPagamento === 'CONTA' && contaId ? contaId : undefined,
        cartaoId: meioPagamento === 'CARTAO' && cartaoId ? cartaoId : undefined,
        fornecedor,
        parcelaAtual: isParcelado ? i : undefined,
        totalParcelas: isParcelado ? nParcelas : undefined,
        observacao,
        anexos: anexoNome ? [anexoNome] : [],
      });
    }
    resetAndClose();
  };

  const inputClass = 'w-full px-3 py-2 border border-stone-200 rounded-lg text-xs';
  const labelClass = 'block font-bold text-stone-700 mb-1';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-lg overflow-hidden my-6">
        {/* Header */}
        <div className="p-4 bg-stone-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-emerald-400" />
            <h2 className="font-extrabold text-sm tracking-tight">Novo lançamento</h2>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {/* Tipo */}
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => { setTipo('DESPESA'); setCategoria('Produção Rural'); }}
              className={`py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all ${
                tipo === 'DESPESA' ? 'bg-rose-600 text-white shadow-xs' : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
              }`}
            >
              <ArrowUpRight className="w-4 h-4" /> Despesa
            </button>
            <button
              type="button"
              onClick={() => { setTipo('RECEITA'); setCategoria('Safra de Soja'); }}
              className={`py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all ${
                tipo === 'RECEITA' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
              }`}
            >
              <ArrowDownLeft className="w-4 h-4" /> Receita
            </button>
            <button
              type="button"
              onClick={() => setTipo('TRANSFERENCIA')}
              className={`py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all ${
                tipo === 'TRANSFERENCIA' ? 'bg-blue-600 text-white shadow-xs' : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
              }`}
            >
              <ArrowLeftRight className="w-4 h-4" /> Transferência
            </button>
          </div>

          {/* Descrição & Valor */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className={labelClass}>Descrição</label>
              <input
                type="text"
                placeholder="Ex: Óleo Diesel Máquinas / Venda de Grãos"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                className={inputClass}
                required
              />
            </div>
            <div>
              <label className={labelClass}>Valor (R$)</label>
              <input
                type="text"
                placeholder="0,00"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                className={`${inputClass} font-extrabold text-sm`}
                required
              />
            </div>
          </div>

          {/* Categoria (+ Fazenda, só se houver mais de uma) */}
          {tipo !== 'TRANSFERENCIA' && (
            <div className={`grid gap-3 ${mostrarFazenda ? 'grid-cols-2' : 'grid-cols-1'}`}>
              <div>
                <label className={labelClass}>Categoria</label>
                <select value={categoria} onChange={(e) => setCategoria(e.target.value)} className={`${inputClass} bg-white`}>
                  {tipo === 'DESPESA' ? (
                    <>
                      <option value="Produção Rural">Produção Rural</option>
                      <option value="Combustível & Lubrificantes">Combustível & Lubrificantes</option>
                      <option value="Manutenção de Máquinas">Manutenção de Máquinas</option>
                      <option value="Moradia & Manutenção">Moradia & Manutenção</option>
                      <option value="Veículos Pessoais">Veículos Pessoais</option>
                      <option value="Saúde & Seguros">Saúde & Seguros</option>
                      <option value="Educação">Educação</option>
                      <option value="Outros">Outros</option>
                    </>
                  ) : (
                    <>
                      <option value="Safra de Soja">Safra de Soja</option>
                      <option value="Safra de Milho">Safra de Milho</option>
                      <option value="Arrendamento de Terras">Arrendamento de Terras</option>
                      <option value="Rendimentos & Dividendos">Rendimentos & Dividendos</option>
                      <option value="Outras Receitas">Outras Receitas</option>
                    </>
                  )}
                </select>
              </div>

              {mostrarFazenda && (
                <div>
                  <label className={labelClass}>Fazenda</label>
                  <select value={fazendaId} onChange={(e) => setFazendaId(e.target.value)} className={`${inputClass} bg-white`}>
                    <option value="">Geral / sem fazenda específica</option>
                    {fazendas.map((f) => (
                      <option key={f.id} value={f.id}>{f.nome}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Data */}
          <div>
            <label className={labelClass}>{tipo === 'RECEITA' ? 'Data prevista' : tipo === 'TRANSFERENCIA' ? 'Data' : 'Data de vencimento'}</label>
            <input
              type="date"
              value={dataVencimento}
              onChange={(e) => setDataVencimento(e.target.value)}
              className={`${inputClass} bg-white`}
              required
            />
          </div>

          {/* Meio de pagamento (despesa) */}
          {tipo === 'DESPESA' && (
            <div className="space-y-2 bg-stone-50 p-3 rounded-xl border border-stone-200/80">
              <span className="font-bold text-stone-800">Como vai pagar?</span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => { setMeioPagamento('A_DEFINIR'); setContaId(''); }}
                  className={`py-2 rounded-lg border text-xs font-bold transition-all ${
                    meioPagamento === 'A_DEFINIR' ? 'border-amber-500 bg-amber-50 text-amber-950' : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-100'
                  }`}
                >
                  Depois
                </button>
                <button
                  type="button"
                  onClick={() => { setMeioPagamento('CONTA'); if (!contaId) setContaId(contas[0]?.id || ''); }}
                  className={`py-2 rounded-lg border text-xs font-bold flex items-center justify-center gap-1 transition-all ${
                    meioPagamento === 'CONTA' ? 'border-emerald-600 bg-emerald-50 text-emerald-950' : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-100'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" /> Conta
                </button>
                <button
                  type="button"
                  onClick={() => { setMeioPagamento('CARTAO'); if (!cartaoId) setCartaoId(cartoes[0]?.id || ''); }}
                  className={`py-2 rounded-lg border text-xs font-bold flex items-center justify-center gap-1 transition-all ${
                    meioPagamento === 'CARTAO' ? 'border-purple-600 bg-purple-50 text-purple-950' : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-100'
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5" /> Cartão
                </button>
              </div>

              {meioPagamento === 'CONTA' && (
                <select value={contaId} onChange={(e) => setContaId(e.target.value)} className={`${inputClass} bg-white`}>
                  {contas.map((c) => (
                    <option key={c.id} value={c.id}>{c.nomePersonalizado} ({c.banco})</option>
                  ))}
                </select>
              )}
              {meioPagamento === 'CARTAO' && (
                <select value={cartaoId} onChange={(e) => setCartaoId(e.target.value)} className={`${inputClass} bg-white`}>
                  {cartoes.map((c) => (
                    <option key={c.id} value={c.id}>{c.nome} (final {c.ultimosDigitos})</option>
                  ))}
                </select>
              )}
              {meioPagamento === 'A_DEFINIR' && (
                <p className="text-[11px] text-stone-500">Fica em "A pagar" sem conta vinculada até você marcar como pago.</p>
              )}
            </div>
          )}

          {/* Conta de depósito (receita) */}
          {tipo === 'RECEITA' && (
            <div>
              <label className={labelClass}>Conta para receber</label>
              <select value={contaId} onChange={(e) => setContaId(e.target.value)} className={`${inputClass} bg-white`}>
                <option value="">A definir no recebimento</option>
                {contas.map((c) => (
                  <option key={c.id} value={c.id}>{c.nomePersonalizado} ({c.banco})</option>
                ))}
              </select>
            </div>
          )}

          {/* Contas de transferência */}
          {tipo === 'TRANSFERENCIA' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>De</label>
                <select value={contaId} onChange={(e) => setContaId(e.target.value)} className={`${inputClass} bg-white`}>
                  {contas.map((c) => (
                    <option key={c.id} value={c.id}>{c.nomePersonalizado}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Para</label>
                <select value={transfDestinoId} onChange={(e) => setTransfDestinoId(e.target.value)} className={`${inputClass} bg-white`}>
                  {contas.map((c) => (
                    <option key={c.id} value={c.id}>{c.nomePersonalizado}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Já pago/recebido */}
          {tipo !== 'TRANSFERENCIA' && (
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={jaPago}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setJaPago(checked);
                  if (checked && meioPagamento === 'A_DEFINIR') {
                    setMeioPagamento('CONTA');
                    setContaId(contas[0]?.id || '');
                  }
                }}
                className="rounded text-emerald-600"
              />
              <span className="font-semibold text-stone-800">
                {tipo === 'DESPESA' ? 'Já foi pago' : 'Já foi recebido'}
              </span>
            </label>
          )}

          {/* Mais opções */}
          <div className="pt-1 border-t border-stone-100">
            <button
              type="button"
              onClick={() => setShowMais((v) => !v)}
              className="flex items-center gap-1 text-stone-500 font-semibold py-2"
            >
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showMais ? 'rotate-180' : ''}`} />
              Mais opções
            </button>

            {showMais && (
              <div className="space-y-3 pt-1 pb-2">
                {tipo !== 'TRANSFERENCIA' && mostrarIntegrante && (
                  <div>
                    <label className={labelClass}>Integrante</label>
                    <select value={integranteId} onChange={(e) => setIntegranteId(e.target.value)} className={`${inputClass} bg-white`}>
                      {integrantes.map((i) => (
                        <option key={i.id} value={i.id}>{i.apelido} ({i.nome})</option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className={labelClass}>Data de competência</label>
                  <input
                    type="date"
                    value={dataCompetencia}
                    onChange={(e) => { setDataCompetencia(e.target.value); setCompetenciaEditada(true); }}
                    className={`${inputClass} bg-white`}
                  />
                  <p className="text-[11px] text-stone-500 mt-1">Mês a que o lançamento pertence, se diferente do vencimento.</p>
                </div>

                {tipo !== 'TRANSFERENCIA' && (
                  <div>
                    <label className={labelClass}>{tipo === 'DESPESA' ? 'Fornecedor' : 'Cliente / pagador'}</label>
                    <input
                      type="text"
                      value={tipo === 'DESPESA' ? fornecedor : cliente}
                      onChange={(e) => (tipo === 'DESPESA' ? setFornecedor(e.target.value) : setCliente(e.target.value))}
                      className={inputClass}
                    />
                  </div>
                )}

                {tipo === 'DESPESA' && (
                  <label className="flex items-center justify-between gap-2 cursor-pointer">
                    <span className="inline-flex items-center gap-2 font-bold text-stone-700">
                      <input
                        type="checkbox"
                        checked={isParcelado}
                        onChange={(e) => setIsParcelado(e.target.checked)}
                        className="rounded text-orange-600"
                      />
                      Compra parcelada
                    </span>
                    {isParcelado && (
                      <span className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min={2}
                          max={48}
                          value={totalParcelas}
                          onChange={(e) => setTotalParcelas(e.target.value)}
                          className="w-14 px-2 py-1 border border-stone-200 rounded-lg text-center font-bold"
                        />
                        <span className="text-stone-500">vezes</span>
                      </span>
                    )}
                  </label>
                )}

                <div>
                  <label className={labelClass}>Anexo (opcional)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Ex: NF-e_diesel_8492.pdf"
                      value={anexoNome}
                      onChange={(e) => setAnexoNome(e.target.value)}
                      className={`flex-1 ${inputClass}`}
                    />
                    <button
                      type="button"
                      onClick={() => setAnexoNome(`Comprovante_${Date.now().toString().slice(-4)}.pdf`)}
                      className="px-2.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold rounded-lg text-xs"
                    >
                      Simular
                    </button>
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Observação</label>
                  <textarea
                    value={observacao}
                    onChange={(e) => setObservacao(e.target.value)}
                    rows={2}
                    className={inputClass}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
            <button type="button" onClick={onClose} className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-lg font-medium">
              Cancelar
            </button>
            <button type="submit" className="px-5 py-2 font-bold bg-stone-900 text-white hover:bg-stone-800 rounded-xl transition-all shadow-xs">
              Confirmar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
