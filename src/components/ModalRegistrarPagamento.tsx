import React, { useState } from 'react';
import { formatCurrency } from '../utils/formatters';
import { X, Building2, CreditCard } from 'lucide-react';

export const ModalRegistrarPagamento: React.FC<{
  despesa: any;
  contas: any[];
  cartoes: any[];
  onClose: () => void;
  onConfirmarConta: (data: string, contaId: string) => void;
  onConfirmarCartao: (cartaoId: string) => void;
}> = ({ despesa, contas, cartoes, onClose, onConfirmarConta, onConfirmarCartao }) => {
  const [forma, setForma] = useState<'CONTA' | 'CARTAO'>('CONTA');
  const [dataPagamento, setDataPagamento] = useState(() => new Date().toISOString().split('T')[0]);
  const [contaId, setContaId] = useState(contas[0]?.id || '');
  const [cartaoId, setCartaoId] = useState(cartoes[0]?.id || '');

  const handleConfirmar = () => {
    if (forma === 'CONTA') {
      if (!contaId) {
        alert('Selecione a conta bancária usada no pagamento.');
        return;
      }
      onConfirmarConta(dataPagamento, contaId);
    } else {
      if (!cartaoId) {
        alert('Selecione o cartão usado.');
        return;
      }
      onConfirmarCartao(cartaoId);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-sm overflow-hidden">
        <div className="p-4 bg-stone-900 text-white flex items-center justify-between">
          <h2 className="font-extrabold text-sm">Registrar Pagamento</h2>
          <button onClick={onClose} className="text-stone-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-3 text-xs">
          <div className="bg-stone-50 rounded-lg p-3">
            <p className="font-bold text-stone-900">{despesa.descricao}</p>
            <p className="text-stone-500">{formatCurrency(despesa.valor)}</p>
          </div>

          <div className="flex gap-2 bg-stone-100 rounded-xl p-1 w-fit">
            <button
              type="button"
              onClick={() => setForma('CONTA')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
                forma === 'CONTA' ? 'bg-white shadow-xs text-stone-900' : 'text-stone-500'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" /> Conta
            </button>
            <button
              type="button"
              onClick={() => setForma('CARTAO')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
                forma === 'CARTAO' ? 'bg-white shadow-xs text-stone-900' : 'text-stone-500'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" /> Cartão
            </button>
          </div>

          {forma === 'CONTA' ? (
            <>
              <div>
                <label className="block font-bold text-stone-700 mb-1">Pago com a conta</label>
                <select value={contaId} onChange={(e) => setContaId(e.target.value)} className="w-full px-3 py-2 border border-stone-200 rounded-lg bg-white">
                  {contas.map((c) => (
                    <option key={c.id} value={c.id}>{c.nomePersonalizado} ({c.banco})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-bold text-stone-700 mb-1">Data do pagamento</label>
                <input type="date" value={dataPagamento} onChange={(e) => setDataPagamento(e.target.value)} className="w-full px-3 py-2 border border-stone-200 rounded-lg bg-white" />
              </div>
            </>
          ) : (
            <div>
              <label className="block font-bold text-stone-700 mb-1">Cartão usado</label>
              <select value={cartaoId} onChange={(e) => setCartaoId(e.target.value)} className="w-full px-3 py-2 border border-stone-200 rounded-lg bg-white">
                {cartoes.map((c) => (
                  <option key={c.id} value={c.id}>{c.nome} (final {c.ultimosDigitos})</option>
                ))}
              </select>
              <p className="text-[11px] text-stone-400 mt-1">
                Fica marcada no cartão e é paga junto com a fatura — não some de "A pagar" agora, some quando a fatura for quitada.
              </p>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
            <button onClick={onClose} className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-lg">Cancelar</button>
            <button onClick={handleConfirmar} className="px-5 py-2 font-bold bg-stone-900 text-white rounded-xl">
              {forma === 'CONTA' ? 'Confirmar Pagamento' : 'Atribuir ao Cartão'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
