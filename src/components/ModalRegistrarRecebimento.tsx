import React, { useState } from 'react';
import { formatCurrency } from '../utils/formatters';
import { X } from 'lucide-react';

export const ModalRegistrarRecebimento: React.FC<{
  receita: any;
  contas: any[];
  onClose: () => void;
  onConfirmar: (data: string, contaId: string) => void;
}> = ({ receita, contas, onClose, onConfirmar }) => {
  const [dataRecebimento, setDataRecebimento] = useState(() => new Date().toISOString().split('T')[0]);
  const [contaId, setContaId] = useState(contas[0]?.id || '');

  const handleConfirmar = () => {
    if (!contaId) {
      alert('Selecione a conta que recebeu o dinheiro.');
      return;
    }
    onConfirmar(dataRecebimento, contaId);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-sm overflow-hidden">
        <div className="p-4 bg-stone-900 text-white flex items-center justify-between">
          <h2 className="font-extrabold text-sm">Registrar Recebimento</h2>
          <button onClick={onClose} className="text-stone-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-3 text-xs">
          <div className="bg-stone-50 rounded-lg p-3">
            <p className="font-bold text-stone-900">{receita.descricao}</p>
            <p className="text-stone-500">{formatCurrency(receita.valor)}</p>
          </div>
          <div>
            <label className="block font-bold text-stone-700 mb-1">Recebido na conta</label>
            <select value={contaId} onChange={(e) => setContaId(e.target.value)} className="w-full px-3 py-2 border border-stone-200 rounded-lg bg-white">
              {contas.map((c) => (
                <option key={c.id} value={c.id}>{c.nomePersonalizado} ({c.banco})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-bold text-stone-700 mb-1">Data do recebimento</label>
            <input type="date" value={dataRecebimento} onChange={(e) => setDataRecebimento(e.target.value)} className="w-full px-3 py-2 border border-stone-200 rounded-lg bg-white" />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
            <button onClick={onClose} className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-lg">Cancelar</button>
            <button onClick={handleConfirmar} className="px-5 py-2 font-bold bg-stone-900 text-white rounded-xl">Confirmar Recebimento</button>
          </div>
        </div>
      </div>
    </div>
  );
};
