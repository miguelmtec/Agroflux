import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency } from '../utils/formatters';
import {
  Landmark,
  Plus,
  ArrowLeftRight,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Building,
  CreditCard,
  X,
  History,
} from 'lucide-react';
import { TipoContaBancaria } from '../types';

export const BancosView: React.FC = () => {
  const {
    contas,
    getContaSaldoAtual,
    saldoDisponivelTotal,
    adjustContaSaldo,
    addConta,
    addTransferencia,
    currentUser,
  } = useFinance();

  // Modals state
  const [showNewAccountModal, setShowNewAccountModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState<string | null>(null); // contaId
  const [showTransferModal, setShowTransferModal] = useState(false);

  // Form states
  const [ajusteNovoSaldo, setAjusteNovoSaldo] = useState('');
  const [ajusteJustificativa, setAjusteJustificativa] = useState('');

  // Transfer state
  const [transfOrigem, setTransfOrigem] = useState(contas[0]?.id || '');
  const [transfDestino, setTransfDestino] = useState(contas[1]?.id || '');
  const [transfValor, setTransfValor] = useState('');
  const [transfDesc, setTransfDesc] = useState('');
  const [transfObs, setTransfObs] = useState('');

  // New Account state
  const [novoBanco, setNovoBanco] = useState('');
  const [novoNome, setNovoNome] = useState('');
  const [novaAgencia, setNovaAgencia] = useState('');
  const [novaConta, setNovaConta] = useState('');
  const [novoTipo, setNovoTipo] = useState<TipoContaBancaria>('Conta Corrente');
  const [novoTitular, setNovoTitular] = useState('');
  const [novoSaldoInicial, setNovoSaldoInicial] = useState('');
  const [novoLimite, setNovoLimite] = useState('');

  const canAdjust = currentUser?.perfil === 'ADMINISTRADOR' || currentUser?.permissoes?.alterarBancos;

  const handleAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showAdjustModal || !ajusteNovoSaldo || !ajusteJustificativa.trim()) {
      alert('Preencha o novo saldo e a justificativa obrigatória para auditoria.');
      return;
    }
    const val = parseFloat(ajusteNovoSaldo.replace(',', '.'));
    adjustContaSaldo(showAdjustModal, val, ajusteJustificativa.trim());
    setShowAdjustModal(null);
    setAjusteNovoSaldo('');
    setAjusteJustificativa('');
  };

  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (transfOrigem === transfDestino) {
      alert('A conta de origem e destino devem ser diferentes.');
      return;
    }
    const val = parseFloat(transfValor.replace(',', '.'));
    if (!val || val <= 0) {
      alert('Informe um valor válido para a transferência.');
      return;
    }
    addTransferencia({
      contaOrigemId: transfOrigem,
      contaDestinoId: transfDestino,
      valor: val,
      data: new Date().toISOString().split('T')[0],
      descricao: transfDesc || 'Transferência entre contas',
      observacao: transfObs,
    });
    setShowTransferModal(false);
    setTransfValor('');
    setTransfDesc('');
    setTransfObs('');
  };

  const handleNewAccountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoBanco || !novoNome) {
      alert('Preencha o banco e o nome da conta.');
      return;
    }
    addConta({
      banco: novoBanco,
      nomePersonalizado: novoNome,
      agencia: novaAgencia,
      conta: novaConta,
      tipo: novoTipo,
      titular: novoTitular || 'Grupo Familiar',
      saldoInicial: parseFloat(novoSaldoInicial.replace(',', '.')) || 0,
      limite: parseFloat(novoLimite.replace(',', '.')) || 0,
      cor: '#0f2942',
      ativa: true,
    });
    setShowNewAccountModal(false);
    setNovoBanco('');
    setNovoNome('');
    setNovaAgencia('');
    setNovaConta('');
    setNovoTitular('');
    setNovoSaldoInicial('');
    setNovoLimite('');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-stone-900 tracking-tight">
            Bancos & Contas Bancárias
          </h1>
          <p className="text-xs text-stone-500">
            Saldos em tempo real, conciliação e transferências internas
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTransferModal(true)}
            className="flex items-center gap-1.5 bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs py-2 px-3.5 rounded-xl transition-colors shadow-2xs"
          >
            <ArrowLeftRight className="w-3.5 h-3.5" /> Transferência
          </button>
          <button
            onClick={() => setShowNewAccountModal(true)}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs py-2 px-3.5 rounded-xl transition-colors shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" /> Cadastrar Conta
          </button>
        </div>
      </div>

      {/* Overview Metric Banner */}
      <div className="bg-gradient-to-r from-stone-900 via-orange-950 to-stone-900 text-white p-5 rounded-2xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] uppercase tracking-wider text-stone-400 font-bold block">
            Saldo Total Consolidado em Bancos
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 tracking-tight mt-1">
            {formatCurrency(saldoDisponivelTotal)}
          </div>
          <span className="text-xs text-stone-300 mt-1 block">
            Distribuído entre {contas.filter((c) => c.ativa).length} contas bancárias ativas
          </span>
        </div>

        <div className="text-xs text-stone-300 bg-white/10 p-3 rounded-xl border border-white/10 max-w-sm">
          <p className="font-semibold text-white mb-0.5">Regra Contábil AgroFlux:</p>
          O saldo é calculado dinamicamente: Saldo inicial + receitas recebidas - despesas pagas por esta conta (não faturadas em cartão) ± transferências.
        </div>
      </div>

      {/* Account Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
        {contas.map((conta) => {
          const saldoAtual = getContaSaldoAtual(conta.id);

          return (
            <div
              key={conta.id}
              className="bg-white rounded-2xl border border-stone-200/80 p-5 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-stone-100 text-stone-800 font-extrabold flex items-center justify-center text-lg border border-stone-200">
                      🏛️
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-stone-900 leading-tight">
                        {conta.nomePersonalizado}
                      </h3>
                      <span className="text-xs text-stone-500 font-medium block">
                        {conta.banco} • {conta.tipo}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      conta.ativa ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-100 text-stone-500'
                    }`}
                  >
                    {conta.ativa ? 'Ativa' : 'Inativa'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 py-3 border-y border-stone-100 text-xs">
                  <div>
                    <span className="text-stone-400 block text-[10px] uppercase font-bold">
                      Titular
                    </span>
                    <span className="font-semibold text-stone-800 truncate block">
                      {conta.titular}
                    </span>
                  </div>
                  <div>
                    <span className="text-stone-400 block text-[10px] uppercase font-bold">
                      Agência / Conta
                    </span>
                    <span className="font-semibold text-stone-800">
                      Ag. {conta.agencia || '-'} / CC {conta.conta || '-'}
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex items-baseline justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-stone-400 block">
                      Saldo Disponível Atual
                    </span>
                    <div
                      className={`text-xl font-extrabold tracking-tight ${
                        saldoAtual >= 0 ? 'text-stone-900' : 'text-rose-600'
                      }`}
                    >
                      {formatCurrency(saldoAtual)}
                    </div>
                  </div>
                  {conta.limite > 0 && (
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-stone-400 block">
                        Limite Cheque Especial
                      </span>
                      <span className="text-xs font-bold text-stone-600">
                        {formatCurrency(conta.limite)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Card Actions */}
              <div className="mt-5 pt-3 border-t border-stone-100 flex items-center justify-between">
                <span className="text-[11px] text-stone-400">
                  Saldo Inicial: {formatCurrency(conta.saldoInicial)}
                </span>
                {canAdjust && (
                  <button
                    onClick={() => {
                      setShowAdjustModal(conta.id);
                      setAjusteNovoSaldo(saldoAtual.toFixed(2));
                    }}
                    className="text-xs font-semibold text-orange-700 hover:text-orange-900 flex items-center gap-1 hover:underline"
                  >
                    <Sliders className="w-3.5 h-3.5" /> Ajustar Saldo (Auditado)
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Manual Balance Adjustment Modal (Section 4 with mandatory audit log) */}
      {showAdjustModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-stone-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 bg-stone-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-sm">Ajuste Manual de Saldo Bancário</h3>
              </div>
              <button
                onClick={() => setShowAdjustModal(null)}
                className="text-stone-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAdjustSubmit} className="p-5 space-y-4">
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-xs text-amber-800">
                <strong>Atenção:</strong> Por razões de conformidade e integridade contábil, todo ajuste manual de saldo fica registrado permanentemente no <strong>Log de Auditoria</strong> do sistema.
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Novo Saldo Real da Conta (R$)
                </label>
                <input
                  type="text"
                  value={ajusteNovoSaldo}
                  onChange={(e) => setAjusteNovoSaldo(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Justificativa Obrigatória do Ajuste
                </label>
                <textarea
                  rows={3}
                  value={ajusteJustificativa}
                  onChange={(e) => setAjusteJustificativa(e.target.value)}
                  placeholder="Ex: Conciliação com extrato bancário oficial do dia 30/08 com estorno de tarifas."
                  className="w-full px-3 py-2 text-xs border border-stone-200 rounded-lg"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdjustModal(null)}
                  className="px-4 py-2 text-xs text-stone-600 hover:bg-stone-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-stone-900 text-white hover:bg-stone-800 rounded-lg"
                >
                  Confirmar e Gravar em Auditoria
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transfer Modal (Section 5) */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-stone-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 bg-stone-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ArrowLeftRight className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-sm">Transferência Entre Contas</h3>
              </div>
              <button
                onClick={() => setShowTransferModal(false)}
                className="text-stone-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleTransferSubmit} className="p-5 space-y-4 text-xs">
              <p className="text-stone-500">
                Transferências movimentam fundos entre contas sem impactar receitas ou despesas.
              </p>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Conta de Origem (Sai o dinheiro)</label>
                <select
                  value={transfOrigem}
                  onChange={(e) => setTransfOrigem(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg bg-white"
                >
                  {contas.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nomePersonalizado} ({formatCurrency(getContaSaldoAtual(c.id))})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Conta de Destino (Entra o dinheiro)</label>
                <select
                  value={transfDestino}
                  onChange={(e) => setTransfDestino(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg bg-white"
                >
                  {contas.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nomePersonalizado} ({formatCurrency(getContaSaldoAtual(c.id))})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Valor da Transferência (R$)</label>
                <input
                  type="text"
                  value={transfValor}
                  onChange={(e) => setTransfValor(e.target.value)}
                  placeholder="0,00"
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg font-bold text-sm"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Descrição / Finalidade</label>
                <input
                  type="text"
                  value={transfDesc}
                  onChange={(e) => setTransfDesc(e.target.value)}
                  placeholder="Ex: Suporte de caixa para pagamento de folha"
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-bold bg-stone-900 text-white hover:bg-stone-800 rounded-lg"
                >
                  Efetuar Transferência
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Account Modal (Section 4) */}
      {showNewAccountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-stone-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 bg-stone-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">Cadastrar Nova Conta Bancária</h3>
              <button
                onClick={() => setShowNewAccountModal(false)}
                className="text-stone-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleNewAccountSubmit} className="p-5 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-stone-700 mb-1">Banco / Instituição</label>
                <input
                  type="text"
                  placeholder="Ex: Banco Santander / Bradesco Agro"
                  value={novoBanco}
                  onChange={(e) => setNovoBanco(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Nome Personalizado da Conta</label>
                <input
                  type="text"
                  placeholder="Ex: Santander Pessoal - Pai"
                  value={novoNome}
                  onChange={(e) => setNovoNome(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Agência</label>
                  <input
                    type="text"
                    placeholder="0000"
                    value={novaAgencia}
                    onChange={(e) => setNovaAgencia(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Conta</label>
                  <input
                    type="text"
                    placeholder="00000-0"
                    value={novaConta}
                    onChange={(e) => setNovaConta(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Tipo da Conta</label>
                  <select
                    value={novoTipo}
                    onChange={(e) => setNovoTipo(e.target.value as TipoContaBancaria)}
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg bg-white"
                  >
                    <option value="Conta Corrente">Conta Corrente</option>
                    <option value="Poupança">Poupança</option>
                    <option value="Conta Digital">Conta Digital</option>
                    <option value="Conta Empresarial">Conta Empresarial</option>
                    <option value="Conta Investimento">Conta Investimento</option>
                    <option value="Caixa/Dinheiro">Caixa/Dinheiro</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Titular</label>
                  <input
                    type="text"
                    placeholder="Nome do Titular"
                    value={novoTitular}
                    onChange={(e) => setNovoTitular(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Saldo Inicial (R$)</label>
                  <input
                    type="text"
                    placeholder="0,00"
                    value={novoSaldoInicial}
                    onChange={(e) => setNovoSaldoInicial(e.target.value)}
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

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewAccountModal(false)}
                  className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-bold bg-stone-900 text-white hover:bg-stone-800 rounded-lg"
                >
                  Salvar Conta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
