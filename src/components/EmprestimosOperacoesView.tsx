import React, { useState } from 'react';
import { EmprestimosView } from './EmprestimosView';
import { OperacoesView } from './OperacoesView';
import { Building2, Tractor } from 'lucide-react';

// Antes eram duas telas separadas no menu ("Empréstimos" e "Operações
// Agrícolas") que faziam coisas muito parecidas e confundiam. Agora ficam
// juntas aqui, em abas, mas continuam sendo os mesmos componentes de antes
// por baixo — nenhum dado foi perdido ou movido.
export const EmprestimosOperacoesView: React.FC = () => {
  const [tab, setTab] = useState<'emprestimos' | 'operacoes'>('emprestimos');

  return (
    <div>
      <div className="flex gap-2 mb-5 bg-stone-100 rounded-xl p-1 w-fit">
        <button
          onClick={() => setTab('emprestimos')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            tab === 'emprestimos' ? 'bg-white shadow-xs text-stone-900' : 'text-stone-500'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" /> Empréstimos & Financiamentos
        </button>
        <button
          onClick={() => setTab('operacoes')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            tab === 'operacoes' ? 'bg-white shadow-xs text-stone-900' : 'text-stone-500'
          }`}
        >
          <Tractor className="w-3.5 h-3.5" /> Operações Rurais (CPR, Custeio, Capital de Giro)
        </button>
      </div>
      {tab === 'emprestimos' ? <EmprestimosView /> : <OperacoesView />}
    </div>
  );
};
