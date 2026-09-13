import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, formatDate, getDaysDifference } from '../utils/formatters';
import { ModalRegistrarRecebimento } from './ModalRegistrarRecebimento';
import { ArrowUpCircle, Check, AlertTriangle } from 'lucide-react';

// Tela dedicada só pra dar baixa (liquidar) receitas já lançadas. O cadastro
// da receita em si acontece em "Contas a Receber" — aqui é só o trabalho de
// "quais estão pendentes, e em qual conta entrou o dinheiro".
export const BaixaContasReceberView: React.FC = () => {
  const { receitas, integrantes, contas, selectedMemberId, marcarReceitaRecebida } = useFinance();
  const [receitaRecebendo, setReceitaRecebendo] = useState<any>(null);

  const pendentes = receitas
    .filter((r) => !r.deletedAt && r.status !== 'Recebida')
    .filter((r) => selectedMemberId === 'TODOS' || r.integranteId === selectedMemberId)
    .sort((a, b) => new Date(a.dataPrevista).getTime() - new Date(b.dataPrevista).getTime());

  const totalPendente = pendentes.reduce((s, r) => s + r.valor, 0);

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-stone-900 tracking-tight flex items-center gap-2">
            <ArrowUpCircle className="w-5 h-5 text-emerald-600" /> Baixa de Contas a Receber
          </h1>
          <p className="text-xs text-stone-500">
            Confirme o que já entrou: escolha a conta que recebeu e a data.
          </p>
        </div>
        <div className="text-xs font-bold text-stone-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
          Total pendente: <span className="text-emerald-800 font-extrabold">{formatCurrency(totalPendente)}</span>
        </div>
      </div>

      <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden">
        {pendentes.length === 0 ? (
          <p className="text-xs text-stone-500 p-6 text-center">
            Nenhuma receita pendente de baixa — tudo recebido, ou nada lançado ainda em "Contas a Receber".
          </p>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-bold uppercase text-[10px]">
              <tr>
                <th className="py-2.5 px-4">Descrição</th>
                <th className="py-2.5 px-4">Cliente / Pagador</th>
                <th className="py-2.5 px-4">Pertence a</th>
                <th className="py-2.5 px-4">Previsão</th>
                <th className="py-2.5 px-4 text-right">Valor</th>
                <th className="py-2.5 px-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {pendentes.map((r) => {
                const diff = getDaysDifference(r.dataPrevista);
                const atrasada = diff < 0;
                return (
                  <tr key={r.id} className="hover:bg-stone-50">
                    <td className="py-3 px-4 font-bold text-stone-900">{r.descricao}</td>
                    <td className="py-3 px-4 text-stone-600">{r.clientePagador || '—'}</td>
                    <td className="py-3 px-4 text-stone-600">
                      {integrantes.find((i) => i.id === r.integranteId)?.apelido || 'Família'}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-stone-800 block">{formatDate(r.dataPrevista)}</span>
                      {atrasada && (
                        <span className="text-[10px] font-bold text-rose-600 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Atrasada há {Math.abs(diff)} dias
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-extrabold text-stone-900">{formatCurrency(r.valor)}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setReceitaRecebendo(r)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1 shadow-2xs"
                      >
                        <Check className="w-3.5 h-3.5" /> Dar baixa
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {receitaRecebendo && (
        <ModalRegistrarRecebimento
          receita={receitaRecebendo}
          contas={contas}
          onClose={() => setReceitaRecebendo(null)}
          onConfirmar={(data, contaId) => {
            marcarReceitaRecebida(receitaRecebendo.id, data, contaId);
            setReceitaRecebendo(null);
          }}
        />
      )}
    </div>
  );
};
