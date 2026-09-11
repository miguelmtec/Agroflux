import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Plus, Trash2, Pencil, Layers, ArrowUpRight, ArrowDownLeft, X } from 'lucide-react';

export const PlanoContasView: React.FC = () => {
  const { categoriasPlanoContas, addCategoriaPlanoContas, updateCategoriaPlanoContas, toggleCategoriaAtiva, removerCategoriaPlanoContas, despesas, receitas } =
    useFinance();

  const [tab, setTab] = useState<'DESPESA' | 'RECEITA'>('DESPESA');
  const [showModal, setShowModal] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [nome, setNome] = useState('');
  const [grupo, setGrupo] = useState('');

  const categorias = categoriasPlanoContas
    .filter((c) => c.tipo === tab)
    .sort((a, b) => a.nome.localeCompare(b.nome));

  const emUso = (nomeCategoria: string) =>
    tab === 'DESPESA'
      ? despesas.some((d) => d.categoria === nomeCategoria)
      : receitas.some((r) => r.categoria === nomeCategoria);

  const abrirNovo = () => {
    setEditandoId(null);
    setNome('');
    setGrupo('');
    setShowModal(true);
  };

  const abrirEdicao = (c: any) => {
    setEditandoId(c.id);
    setNome(c.nome);
    setGrupo(c.grupo || '');
    setShowModal(true);
  };

  const handleSalvar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) return;
    const duplicado = categoriasPlanoContas.some(
      (c) => c.tipo === tab && c.id !== editandoId && c.nome.toLowerCase() === nome.trim().toLowerCase()
    );
    if (duplicado) {
      alert('Já existe uma categoria com esse nome.');
      return;
    }
    if (editandoId) {
      updateCategoriaPlanoContas(editandoId, { nome: nome.trim(), grupo: grupo.trim() || undefined });
    } else {
      addCategoriaPlanoContas({ nome: nome.trim(), tipo: tab, grupo: grupo.trim() || undefined, ativa: true });
    }
    setShowModal(false);
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

      <div className="flex items-center justify-between my-4">
        <div className="flex gap-2 bg-stone-100 rounded-xl p-1 w-fit">
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
        <button
          onClick={abrirNovo}
          className="flex items-center gap-1.5 bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs py-2 px-4 rounded-xl"
        >
          <Plus className="w-4 h-4" /> Nova Categoria
        </button>
      </div>

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
                <button onClick={() => abrirEdicao(c)} className="text-stone-400 hover:text-stone-700">
                  <Pencil className="w-4 h-4" />
                </button>
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

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-sm overflow-hidden">
            <div className="p-4 bg-stone-900 text-white flex items-center justify-between">
              <h2 className="font-extrabold text-sm">{editandoId ? 'Editar Categoria' : `Nova Categoria de ${tab === 'DESPESA' ? 'Despesa' : 'Receita'}`}</h2>
              <button onClick={() => setShowModal(false)} className="text-stone-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSalvar} className="p-5 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-stone-700 mb-1">Nome da categoria</label>
                <input
                  placeholder={tab === 'DESPESA' ? 'Ex: Adubos & Fertilizantes' : 'Ex: Venda de Gado'}
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block font-bold text-stone-700 mb-1">Grupo contábil (opcional)</label>
                <input
                  placeholder="Ex: Custos Operacionais"
                  value={grupo}
                  onChange={(e) => setGrupo(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-lg">Cancelar</button>
                <button type="submit" className="px-5 py-2 font-bold bg-stone-900 text-white rounded-xl">{editandoId ? 'Salvar' : 'Adicionar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
