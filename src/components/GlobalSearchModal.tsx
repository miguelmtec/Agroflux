import React, { useState, useEffect } from 'react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, formatDate } from '../utils/formatters';
import { Search, X, Receipt, Building2, CreditCard, Users, FileText, ArrowRight } from 'lucide-react';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (module: string) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const { despesas, receitas, contas, cartoes, emprestimos, integrantes } = useFinance();
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const q = query.trim().toLowerCase();

  const results: {
    id: string;
    tipo: 'Despesa' | 'Receita' | 'Conta' | 'Cartão' | 'Empréstimo' | 'Integrante';
    titulo: string;
    subtitulo: string;
    detalhe?: string;
    targetModule: string;
  }[] = [];

  if (q.length >= 2) {
    // Search Despesas
    despesas.forEach((d) => {
      if (d.deletedAt) return;
      if (
        d.descricao.toLowerCase().includes(q) ||
        d.categoria.toLowerCase().includes(q) ||
        (d.fornecedor && d.fornecedor.toLowerCase().includes(q)) ||
        d.valor.toString().includes(q)
      ) {
        results.push({
          id: d.id,
          tipo: 'Despesa',
          titulo: d.descricao,
          subtitulo: `${d.categoria} • Vencimento: ${formatDate(d.dataVencimento)}`,
          detalhe: formatCurrency(d.valor),
          targetModule: 'lancamentos',
        });
      }
    });

    // Search Receitas
    receitas.forEach((r) => {
      if (r.deletedAt) return;
      if (
        r.descricao.toLowerCase().includes(q) ||
        r.categoria.toLowerCase().includes(q) ||
        (r.clientePagador && r.clientePagador.toLowerCase().includes(q)) ||
        r.valor.toString().includes(q)
      ) {
        results.push({
          id: r.id,
          tipo: 'Receita',
          titulo: r.descricao,
          subtitulo: `${r.categoria} • Previsão: ${formatDate(r.dataPrevista)}`,
          detalhe: formatCurrency(r.valor),
          targetModule: 'contas-receber',
        });
      }
    });

    // Search Contas
    contas.forEach((c) => {
      if (
        c.nomePersonalizado.toLowerCase().includes(q) ||
        c.banco.toLowerCase().includes(q) ||
        c.titular.toLowerCase().includes(q)
      ) {
        results.push({
          id: c.id,
          tipo: 'Conta',
          titulo: c.nomePersonalizado,
          subtitulo: `${c.banco} • Titular: ${c.titular}`,
          targetModule: 'bancos',
        });
      }
    });

    // Search Cartões
    cartoes.forEach((c) => {
      if (c.nome.toLowerCase().includes(q) || c.titular.toLowerCase().includes(q)) {
        results.push({
          id: c.id,
          tipo: 'Cartão',
          titulo: c.nome,
          subtitulo: `Bandeira: ${c.bandeira} • Titular: ${c.titular}`,
          targetModule: 'cartoes',
        });
      }
    });

    // Search Empréstimos
    emprestimos.forEach((e) => {
      if (
        e.nomeOperacao.toLowerCase().includes(q) ||
        e.credor.toLowerCase().includes(q) ||
        e.tipo.toLowerCase().includes(q)
      ) {
        results.push({
          id: e.id,
          tipo: 'Empréstimo',
          titulo: e.nomeOperacao,
          subtitulo: `${e.credor} • ${e.tipo}`,
          detalhe: formatCurrency(e.saldoDevedor),
          targetModule: 'emprestimos',
        });
      }
    });

    // Search Integrantes
    integrantes.forEach((i) => {
      if (i.nome.toLowerCase().includes(q) || i.apelido.toLowerCase().includes(q)) {
        results.push({
          id: i.id,
          tipo: 'Integrante',
          titulo: `${i.apelido} (${i.nome})`,
          subtitulo: `Grau de Parentesco: ${i.parentesco}`,
          targetModule: 'grupo-familiar',
        });
      }
    });
  }

  const handleSelect = (mod: string) => {
    onNavigate(mod);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-stone-900/60 backdrop-blur-xs p-4 pt-16 sm:pt-24">
      <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-stone-100 gap-3">
          <Search className="w-5 h-5 text-stone-400 shrink-0" />
          <input
            type="text"
            placeholder="Pesquise por lançamentos, pessoas, contas bancárias, cartões, credores..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full text-sm focus:outline-hidden text-stone-900 placeholder-stone-400"
            autoFocus
          />
          <button
            onClick={onClose}
            className="p-1 text-stone-400 hover:text-stone-700 rounded-lg shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2">
          {q.length < 2 ? (
            <div className="py-12 text-center text-stone-400 text-xs">
              Digite pelo menos 2 caracteres para pesquisar em todo o AgroFlux...
            </div>
          ) : results.length === 0 ? (
            <div className="py-12 text-center text-stone-400 text-xs">
              Nenhum resultado encontrado para &ldquo;{query}&rdquo;.
            </div>
          ) : (
            <div className="space-y-1">
              {results.map((item) => (
                <div
                  key={`${item.tipo}-${item.id}`}
                  onClick={() => handleSelect(item.targetModule)}
                  className="p-3 rounded-xl hover:bg-stone-50 border border-transparent hover:border-stone-100 flex items-center justify-between cursor-pointer group transition-all text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                        item.tipo === 'Despesa'
                          ? 'bg-rose-100 text-rose-800'
                          : item.tipo === 'Receita'
                          ? 'bg-emerald-100 text-emerald-800'
                          : item.tipo === 'Conta'
                          ? 'bg-blue-100 text-blue-800'
                          : item.tipo === 'Cartão'
                          ? 'bg-purple-100 text-purple-800'
                          : item.tipo === 'Empréstimo'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-stone-100 text-stone-800'
                      }`}
                    >
                      {item.tipo}
                    </span>
                    <div>
                      <h4 className="font-bold text-stone-900 leading-tight group-hover:text-orange-950">
                        {item.titulo}
                      </h4>
                      <span className="text-[11px] text-stone-500">{item.subtitulo}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {item.detalhe && (
                      <span className="font-extrabold text-stone-900">{item.detalhe}</span>
                    )}
                    <ArrowRight className="w-4 h-4 text-stone-300 group-hover:text-orange-600" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 bg-stone-50 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-400">
          <span>Busca global integrada AgroFlux</span>
          <span>Pressione ESC para fechar</span>
        </div>
      </div>
    </div>
  );
};
