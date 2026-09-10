import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Plus, Trash2, Layers, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

export const PlanoContasView: React.FC = () => {
  const { categoriasPlanoContas, addCategoriaPlanoContas, toggleCategoriaAtiva, removerCategoriaPlanoContas, despesas, receitas } =
    useFinance();

  const [tab, setTab] = useState<'DESPESA' | 'RECEITA'>('DESPESA');
  const [nome, setNome] = useState('');
  const [grupo, setGrupo] = useState('');

  const categorias = categoriasPlanoContas
    .filter((c) => c.tipo === tab)
    .sort((a, b) => a.nome.localeCompare(b.nome));

  const emUso = (nomeCategoria: string) =>
    tab === 'DESPESA'
      ? despesas.some((d) => d.categoria === nomeCategoria)
      : receitas.some((r) => r.categoria === nomeCategoria);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) return;
    if (categoriasPlanoContas.some((c) => c.tipo === tab && c.nome.toLowerCase() === nome.trim().toLowerCase())) {
      alert('Já existe uma categoria com esse nome.');
      return;
    }
    addCategoriaPlanoContas({ nome: nome.trim(), tipo: tab, grupo: grupo.trim() || undefined, ativa: true });
    setNome('');
    setGrupo('');
  };

  const handleRemover = (id: string, nomeCategoria: string) => {
    if (emUso(nomeCategoria)) {
      alert('Essa categoria já tem lançamentos usando ela. Desative em vez de excluir, para não perder o histórico.');
      return;
    }
    if (confirm(`Excluir a categoria "${nomeCategoria}"?`)) {
      removerCategoriaPlanoContas(id);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-9 h-9 rounded-xl bg-stone-900 text-emerald-400 flex items-center justify-center">
          <Layers className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-sm font-extrabold text-stone-900 tracking-tight">Plano de Contas</h1>
          <p className="text-xs text-stone-500">Categorias usadas nos lançamentos e nos relatórios (útil para a contabilidade)</p>
        </div>
      </div>

      <div className="flex gap-2 my-4 bg-stone-100 rounded-xl p-1 w-fit">
        <button
          onClick={() => setTab('DESPESA')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            tab === 'DESPESA' ? 'bg-white shadow-xs text-rose-700' : 'text-stone-500'
          }`}
        >
          <ArrowUpRight className="w-3.5 h-3.5" /> Despesas
        </button>
        <button
          onClick={() => setTab('RECEITA')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            tab === 'RECEITA' ? 'bg-white shadow-xs text-emerald-700' : 'text-stone-500'
          }`}
        >
          <ArrowDownLeft className="w-3.5 h-3.5" /> Receitas
        </button>
      </div>

      <form onSubmit={handleAdd} className="bg-white border border-stone-200 rounded-2xl p-4 mb-4 flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          placeholder={tab === 'DESPESA' ? 'Nova categoria de despesa (ex: Adubos & Fertilizantes)' : 'Nova categoria de receita (ex: Venda de Gado)'}
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          className="flex-1 px-3 py-2 text-xs border border-stone-200 rounded-lg"
        />
        <input
          type="text"
          placeholder="Grupo contábil (opcional, ex: Custos Operacionais)"
          value={grupo}
          onChange={(e) => setGrupo(e.target.value)}
          className="sm:w-64 px-3 py-2 text-xs border border-stone-200 rounded-lg"
        />
        <button
          type="submit"
          className="flex items-center justify-center gap-1.5 px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold rounded-lg"
        >
          <Plus className="w-3.5 h-3.5" /> Adicionar
        </button>
      </form>

      <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden">
        {categorias.length === 0 ? (
          <p className="text-xs text-stone-500 p-4">Nenhuma categoria cadastrada ainda.</p>
        ) : (
          categorias.map((c) => (
            <div key={c.id} className="flex items-center justify-between px-4 py-3 border-b border-stone-100 last:border-0">
              <div>
                <p className={`text-sm font-semibold ${c.ativa ? 'text-stone-900' : 'text-stone-400 line-through'}`}>{c.nome}</p>
                {c.grupo && <p className="text-[11px] text-stone-500">{c.grupo}</p>}
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 text-[11px] text-stone-500 cursor-pointer">
                  <input type="checkbox" checked={c.ativa} onChange={() => toggleCategoriaAtiva(c.id)} className="rounded" />
                  Ativa
                </label>
                <button onClick={() => handleRemover(c.id, c.nome)} className="text-stone-400 hover:text-rose-600">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
      <p className="text-[11px] text-stone-400 mt-2">
        Categorias inativas somem das opções de novo lançamento, mas continuam aparecendo nos lançamentos antigos e nos relatórios.
      </p>
    </div>
  );
};
