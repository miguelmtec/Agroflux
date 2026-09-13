import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, formatDate, getDaysDifference } from '../utils/formatters';
import { ModalRegistrarPagamento } from './ModalRegistrarPagamento';
import { ArrowDownCircle, Check, AlertTriangle } from 'lucide-react';

// Tela dedicada só pra dar baixa (liquidar) contas já lançadas. O cadastro
// da despesa em si acontece em "Contas a Pagar" — aqui é só o trabalho de
// "quais estão pendentes, e como vou quitar cada uma".
export const BaixaContasPagarView: React.FC = () => {
  const { despesas, integrantes, contas, cartoes, selectedMemberId, marcarDespesaPaga, atribuirCartaoDespesa } = useFinance();
  const [despesaPagando, setDespesaPagando] = useState<any>(null);

  const pendentes = despesas
    .filter((d) => !d.deletedAt && d.status !== 'Pago')
    .filter((d) => selectedMemberId === 'TODOS' || d.integranteId === selectedMemberId)
    .sort((a, b) => new Date(a.dataVencimento).getTime() - new Date(b.dataVencimento).getTime());

  const totalPendente = pendentes.reduce((s, d) => s + d.valor, 0);

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-stone-900 tracking-tight flex items-center gap-2">
            <ArrowDownCircle className="w-5 h-5 text-rose-600" /> Baixa de Contas a Pagar
          </h1>
          <p className="text-xs text-stone-500">
            Liquide o que está pendente: escolha a conta ou cartão usado e a data do pagamento.
          </p>
        </div>
        <div className="text-xs font-bold text-stone-700 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-xl">
          Total pendente: <span className="text-rose-800 font-extrabold">{formatCurrency(totalPendente)}</span>
        </div>
      </div>

      <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden">
        {pendentes.length === 0 ? (
          <p className="text-xs text-stone-500 p-6 text-center">
            Nenhuma conta pendente de baixa — tudo pago, ou nada lançado ainda em "Contas a Pagar".
          </p>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-bold uppercase text-[10px]">
              <tr>
                <th className="py-2.5 px-4">Descrição</th>
                <th className="py-2.5 px-4">Fornecedor</th>
                <th className="py-2.5 px-4">Pertence a</th>
                <th className="py-2.5 px-4">Vencimento</th>
                <th className="py-2.5 px-4 text-right">Valor</th>
                <th className="py-2.5 px-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {pendentes.map((d) => {
                const diff = getDaysDifference(d.dataVencimento);
                const atrasada = diff < 0;
                return (
                  <tr key={d.id} className="hover:bg-stone-50">
                    <td className="py-3 px-4 font-bold text-stone-900">{d.descricao}</td>
                    <td className="py-3 px-4 text-stone-600">{d.fornecedor || '—'}</td>
                    <td className="py-3 px-4 text-stone-600">
                      {integrantes.find((i) => i.id === d.integranteId)?.apelido || 'Família'}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-stone-800 block">{formatDate(d.dataVencimento)}</span>
                      {atrasada && (
                        <span className="text-[10px] font-bold text-rose-600 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Atrasada há {Math.abs(diff)} dias
                        </span>
                      )}
                      {d.cartaoId && <span className="text-[10px] font-bold text-purple-600">No cartão, aguardando fatura</span>}
                    </td>
                    <td className="py-3 px-4 text-right font-extrabold text-stone-900">{formatCurrency(d.valor)}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setDespesaPagando(d)}
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

      {despesaPagando && (
        <ModalRegistrarPagamento
          despesa={despesaPagando}
          contas={contas}
          cartoes={cartoes}
          onClose={() => setDespesaPagando(null)}
          onConfirmarConta={(data, contaId) => {
            marcarDespesaPaga(despesaPagando.id, data, contaId);
            setDespesaPagando(null);
          }}
          onConfirmarCartao={(cartaoId) => {
            atribuirCartaoDespesa(despesaPagando.id, cartaoId);
            setDespesaPagando(null);
          }}
        />
      )}
    </div>
  );
};
