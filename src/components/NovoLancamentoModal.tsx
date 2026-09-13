import React, { useState, useEffect, useRef } from 'react';
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
  tipoFixo?: 'DESPESA' | 'RECEITA';
}

export const NovoLancamentoModal: React.FC<NovoLancamentoModalProps> = ({ isOpen, onClose, tipoFixo }) => {
  const { integrantes, fazendas, contas, cartoes, categoriasPlanoContas, selectedMemberId, fornecedores, addDespesa, addReceita, addTransferencia } = useFinance();

  const [tipo, setTipo] = useState<'DESPESA' | 'RECEITA' | 'TRANSFERENCIA'>(tipoFixo || 'DESPESA');
  const [showMais, setShowMais] = useState(false);

  // Common fields
  const [descricao, setDescricao] = useState('');
  const [categoria, setCategoria] = useState('');
  const [valor, setValor] = useState('');
  const [dataVencimento, setDataVencimento] = useState(() => new Date().toISOString().split('T')[0]);
  const [dataCompetencia, setDataCompetencia] = useState(dataVencimento);
  const [competenciaEditada, setCompetenciaEditada] = useState(false);
  const [integranteId, setIntegranteId] = useState(
    selectedMemberId && selectedMemberId !== 'TODOS' ? selectedMemberId : integrantes[0]?.id || ''
  );
  const [fazendaId, setFazendaId] = useState('');
  const [contaId, setContaId] = useState('');
  const [fornecedor, setFornecedor] = useState('');
  const [cliente, setCliente] = useState('');
  const [observacao, setObservacao] = useState('');

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

  // Seleciona a primeira categoria disponível, e o integrante do filtro
  // atualmente selecionado no topo (se houver um específico), toda vez que o modal abre
  useEffect(() => {
    if (!isOpen) return;
    if (tipoFixo && tipo !== tipoFixo) {
      setTipo(tipoFixo);
    }
    if (!categoria) {
      const primeira = categoriasPlanoContas.find((c) => c.tipo === tipo && c.ativa);
      if (primeira) setCategoria(primeira.nome);
    }
    if (selectedMemberId && selectedMemberId !== 'TODOS') {
      setIntegranteId(selectedMemberId);
    }
    if (!fazendaId && fazendas.length === 1) {
      setFazendaId(fazendas[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, categoriasPlanoContas]);

  // Se a conta ou cartão escolhido tiver um titular vinculado, o lançamento
  // já "casa" automaticamente com esse integrante, sem precisar escolher de novo.
  useEffect(() => {
    if (tipo !== 'TRANSFERENCIA' || !contaId) return;
    const vinculoId = contas.find((c) => c.id === contaId)?.integranteId;
    if (vinculoId) setIntegranteId(vinculoId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contaId, tipo]);

  const mostrarIntegrante = integrantes.length > 1;
  const mostrarFazenda = fazendas.length >= 1;

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
        status: 'Prevista',
        integranteId,
        fazendaId: fazendaId || undefined,
        clientePagador: cliente,
        observacao,
        anexos: anexoNome ? [anexoNome] : [],
      });
      resetAndClose();
      return;
    }

    // DESPESA (normal ou parcelada) — nasce sempre "A pagar"; a forma de
    // pagamento só é escolhida depois, na tela de Contas a Pagar, na hora
    // de dar baixa de verdade.
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
        status: 'A pagar',
        integranteId,
        fazendaId: fazendaId || undefined,
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
      <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-lg my-6">
        {/* Header */}
        <div className="p-4 bg-stone-900 text-white flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-emerald-400" />
            <h2 className="font-extrabold text-sm tracking-tight">
              {tipoFixo === 'DESPESA' ? 'Nova Conta a Pagar' : tipoFixo === 'RECEITA' ? 'Nova Conta a Receber' : 'Novo lançamento'}
            </h2>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {/* Tipo — só aparece se não veio fixo de uma tela específica (Contas a Pagar/Receber) */}
          {!tipoFixo && (
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => {
                setTipo('DESPESA');
                const primeira = categoriasPlanoContas.find((c) => c.tipo === 'DESPESA' && c.ativa);
                if (primeira) setCategoria(primeira.nome);
              }}
              className={`py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all ${
                tipo === 'DESPESA' ? 'bg-rose-600 text-white shadow-xs' : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
              }`}
            >
              <ArrowUpRight className="w-4 h-4" /> Despesa
            </button>
            <button
              type="button"
              onClick={() => {
                setTipo('RECEITA');
                const primeira = categoriasPlanoContas.find((c) => c.tipo === 'RECEITA' && c.ativa);
                if (primeira) setCategoria(primeira.nome);
              }}
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
          )}

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
                  {categoriasPlanoContas
                    .filter((c) => c.tipo === tipo && (c.ativa || c.nome === categoria))
                    .map((c) => (
                      <option key={c.id} value={c.nome}>{c.nome}</option>
                    ))}
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

          {/* Fornecedor / Cliente — sempre visível, é usado quase todo lançamento */}
          {tipo !== 'TRANSFERENCIA' && (
            <div>
              <label className={labelClass}>{tipo === 'DESPESA' ? 'Fornecedor' : 'Cliente / pagador'}</label>
              <ComboboxContato
                valor={tipo === 'DESPESA' ? fornecedor : cliente}
                onChange={(v) => (tipo === 'DESPESA' ? setFornecedor(v) : setCliente(v))}
                opcoes={fornecedores
                  .filter((f) => f.ativo && (tipo === 'DESPESA' ? f.relacao !== 'Cliente' : f.relacao === 'Cliente' || f.relacao === 'Ambos'))
                  .map((f) => f.nome)}
                placeholder="Digite pra buscar ou escolher (opcional)"
                inputClass={inputClass}
              />
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

          {tipo !== 'TRANSFERENCIA' && (
            <p className="text-[11px] text-stone-400 -mt-1">
              {tipo === 'DESPESA'
                ? 'Fica em "Contas a Pagar" — a forma de pagamento (conta, cartão, etc) você escolhe lá na hora de dar baixa.'
                : 'Fica em "Contas a Receber" — você marca como recebido, e escolhe a conta, lá na hora.'}
            </p>
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

// Campo de texto que também funciona como lista: digita e filtra as opções
// já cadastradas, ou clica pra escolher direto. Se o texto não bater com
// nenhuma opção, mantém o que foi digitado (permite nome novo, avulso).
const ComboboxContato: React.FC<{
  valor: string;
  onChange: (v: string) => void;
  opcoes: string[];
  placeholder?: string;
  inputClass: string;
}> = ({ valor, onChange, opcoes, placeholder, inputClass }) => {
  const [aberto, setAberto] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtradas = valor.trim()
    ? opcoes.filter((o) => o.toLowerCase().includes(valor.trim().toLowerCase()))
    : opcoes;

  useEffect(() => {
    const fecharSeClicarFora = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setAberto(false);
      }
    };
    document.addEventListener('mousedown', fecharSeClicarFora);
    return () => document.removeEventListener('mousedown', fecharSeClicarFora);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <div className="relative">
        <input
          type="text"
          value={valor}
          placeholder={placeholder}
          onChange={(e) => {
            onChange(e.target.value);
            setAberto(true);
          }}
          onFocus={() => setAberto(true)}
          className={`${inputClass} pr-7`}
        />
        <ChevronDown
          className="w-3.5 h-3.5 text-stone-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none"
        />
      </div>
      {aberto && (
        <div className="absolute z-20 mt-1 w-full bg-white border border-stone-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
          {opcoes.length === 0 ? (
            <p className="px-3 py-2 text-stone-400">
              Nenhum cadastrado ainda. Pode digitar um nome avulso aqui, ou cadastrar em Compras & Estoque → Fornecedores.
            </p>
          ) : filtradas.length === 0 ? (
            <p className="px-3 py-2 text-stone-400">Nenhum cadastrado com esse nome — pode usar o texto digitado.</p>
          ) : (
            filtradas.map((nome) => (
              <button
                key={nome}
                type="button"
                onClick={() => {
                  onChange(nome);
                  setAberto(false);
                }}
                className="w-full text-left px-3 py-2 hover:bg-stone-50 text-stone-700"
              >
                {nome}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};
