import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, formatDate } from '../utils/formatters';
import {
  Truck,
  Package,
  ClipboardList,
  Plus,
  X,
  Trash2,
} from 'lucide-react';
import { CategoriaProduto, UnidadeMedida } from '../types';

const statusStyle: Record<string, string> = {
  Pendente: 'bg-amber-100 text-amber-800',
  'Parcialmente entregue': 'bg-blue-100 text-blue-800',
  Entregue: 'bg-emerald-100 text-emerald-800',
  Cancelado: 'bg-stone-200 text-stone-500',
};

export const ComprasEstoqueView: React.FC = () => {
  const {
    fornecedores,
    addFornecedor,
    toggleFornecedorAtivo,
    produtos,
    addProduto,
    toggleProdutoAtivo,
    pedidosCompra,
    addPedidoCompra,
    cancelarPedidoCompra,
    fazendas,
  } = useFinance();

  const [tab, setTab] = useState<'pedidos' | 'produtos' | 'fornecedores'>('pedidos');

  return (
    <div className="max-w-5xl mx-auto pb-12">
      <div className="mb-1">
        <h1 className="text-sm font-extrabold text-stone-900 tracking-tight">Compras & Estoque</h1>
        <p className="text-xs text-stone-500">
          Insumos controlados (defensivos, sementes, fertilizantes) — compras avulsas continuam no Novo Lançamento
        </p>
      </div>

      <div className="flex gap-2 my-4 bg-stone-100 rounded-xl p-1 w-fit">
        <button
          onClick={() => setTab('pedidos')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            tab === 'pedidos' ? 'bg-white shadow-xs text-stone-900' : 'text-stone-500'
          }`}
        >
          <ClipboardList className="w-3.5 h-3.5" /> Pedidos de Compra
        </button>
        <button
          onClick={() => setTab('produtos')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            tab === 'produtos' ? 'bg-white shadow-xs text-stone-900' : 'text-stone-500'
          }`}
        >
          <Package className="w-3.5 h-3.5" /> Produtos & Estoque
        </button>
        <button
          onClick={() => setTab('fornecedores')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            tab === 'fornecedores' ? 'bg-white shadow-xs text-stone-900' : 'text-stone-500'
          }`}
        >
          <Truck className="w-3.5 h-3.5" /> Fornecedores
        </button>
      </div>

      {tab === 'fornecedores' && (
        <PainelFornecedores fornecedores={fornecedores} addFornecedor={addFornecedor} toggleFornecedorAtivo={toggleFornecedorAtivo} />
      )}
      {tab === 'produtos' && (
        <PainelProdutos produtos={produtos} addProduto={addProduto} toggleProdutoAtivo={toggleProdutoAtivo} />
      )}
      {tab === 'pedidos' && (
        <PainelPedidos
          pedidos={pedidosCompra}
          fornecedores={fornecedores}
          produtos={produtos}
          fazendas={fazendas}
          addPedidoCompra={addPedidoCompra}
          cancelarPedidoCompra={cancelarPedidoCompra}
        />
      )}
    </div>
  );
};

// ---------- Fornecedores ----------
const PainelFornecedores: React.FC<any> = ({ fornecedores, addFornecedor, toggleFornecedorAtivo }) => {
  const [showModal, setShowModal] = useState(false);
  const [nome, setNome] = useState('');
  const [cnpjCpf, setCnpjCpf] = useState('');
  const [telefone, setTelefone] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) return;
    addFornecedor({ nome: nome.trim(), cnpjCpf, telefone, ativo: true });
    setShowModal(false);
    setNome('');
    setCnpjCpf('');
    setTelefone('');
  };

  return (
    <div>
      <div className="flex justify-end mb-3">
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs py-2 px-4 rounded-xl"
        >
          <Plus className="w-4 h-4" /> Novo Fornecedor
        </button>
      </div>
      <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden">
        {fornecedores.length === 0 ? (
          <p className="text-xs text-stone-500 p-4">Nenhum fornecedor cadastrado ainda.</p>
        ) : (
          fornecedores.map((f: any) => (
            <div key={f.id} className="flex items-center justify-between px-4 py-3 border-b border-stone-100 last:border-0 text-xs">
              <div>
                <p className={`font-semibold ${f.ativo ? 'text-stone-900' : 'text-stone-400 line-through'}`}>{f.nome}</p>
                <p className="text-stone-500">{f.cnpjCpf || '—'} {f.telefone ? `· ${f.telefone}` : ''}</p>
              </div>
              <label className="flex items-center gap-1.5 text-stone-500 cursor-pointer">
                <input type="checkbox" checked={f.ativo} onChange={() => toggleFornecedorAtivo(f.id)} className="rounded" /> Ativo
              </label>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-sm overflow-hidden">
            <div className="p-4 bg-stone-900 text-white flex items-center justify-between">
              <h2 className="font-extrabold text-sm">Novo Fornecedor</h2>
              <button onClick={() => setShowModal(false)} className="text-stone-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleAdd} className="p-5 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-stone-700 mb-1">Nome</label>
                <input value={nome} onChange={(e) => setNome(e.target.value)} className="w-full px-3 py-2 border border-stone-200 rounded-lg" required />
              </div>
              <div>
                <label className="block font-bold text-stone-700 mb-1">CNPJ/CPF (opcional)</label>
                <input value={cnpjCpf} onChange={(e) => setCnpjCpf(e.target.value)} className="w-full px-3 py-2 border border-stone-200 rounded-lg" />
              </div>
              <div>
                <label className="block font-bold text-stone-700 mb-1">Telefone (opcional)</label>
                <input value={telefone} onChange={(e) => setTelefone(e.target.value)} className="w-full px-3 py-2 border border-stone-200 rounded-lg" />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-lg">Cancelar</button>
                <button type="submit" className="px-5 py-2 font-bold bg-stone-900 text-white rounded-xl">Adicionar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// ---------- Produtos ----------
const PainelProdutos: React.FC<any> = ({ produtos, addProduto, toggleProdutoAtivo }) => {
  const [showModal, setShowModal] = useState(false);
  const [nome, setNome] = useState('');
  const [categoria, setCategoria] = useState<CategoriaProduto>('Defensivo Agrícola');
  const [unidadeMedida, setUnidadeMedida] = useState<UnidadeMedida>('L');
  const [estoqueMinimo, setEstoqueMinimo] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) return;
    addProduto({
      nome: nome.trim(),
      categoria,
      unidadeMedida,
      estoqueMinimo: estoqueMinimo ? Number(estoqueMinimo) : undefined,
      ativo: true,
    });
    setShowModal(false);
    setNome('');
    setEstoqueMinimo('');
  };

  return (
    <div>
      <div className="flex justify-end mb-3">
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs py-2 px-4 rounded-xl"
        >
          <Plus className="w-4 h-4" /> Novo Produto
        </button>
      </div>
      <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden">
        {produtos.length === 0 ? (
          <p className="text-xs text-stone-500 p-4">
            Nenhum produto no catálogo ainda. Cadastre aqui os insumos que você quer controlar em estoque
            (defensivos, sementes, fertilizantes) — coisas avulsas continuam indo direto no Novo Lançamento.
          </p>
        ) : (
          produtos.map((p: any) => (
            <div key={p.id} className="flex items-center justify-between px-4 py-3 border-b border-stone-100 last:border-0 text-xs">
              <div>
                <p className={`font-semibold ${p.ativo ? 'text-stone-900' : 'text-stone-400 line-through'}`}>{p.nome}</p>
                <p className="text-stone-500">{p.categoria} · unidade: {p.unidadeMedida}</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="font-bold text-stone-900">{p.estoqueAtual} {p.unidadeMedida}</p>
                  <p className="text-[10px] text-stone-400">em estoque</p>
                </div>
                <label className="flex items-center gap-1.5 text-stone-500 cursor-pointer">
                  <input type="checkbox" checked={p.ativo} onChange={() => toggleProdutoAtivo(p.id)} className="rounded" /> Ativo
                </label>
              </div>
            </div>
          ))
        )}
      </div>
      <p className="text-[11px] text-stone-400 mt-2">
        O estoque só muda quando você registrar a entrega de um pedido (próxima etapa) ou o consumo na lavoura — por enquanto, começa em 0.
      </p>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-sm overflow-hidden">
            <div className="p-4 bg-stone-900 text-white flex items-center justify-between">
              <h2 className="font-extrabold text-sm">Novo Produto</h2>
              <button onClick={() => setShowModal(false)} className="text-stone-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleAdd} className="p-5 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-stone-700 mb-1">Nome</label>
                <input placeholder="Ex: Glifosato 500ml, Semente Soja TMG7062" value={nome} onChange={(e) => setNome(e.target.value)} className="w-full px-3 py-2 border border-stone-200 rounded-lg" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Categoria</label>
                  <select value={categoria} onChange={(e) => setCategoria(e.target.value as CategoriaProduto)} className="w-full px-3 py-2 border border-stone-200 rounded-lg bg-white">
                    <option value="Defensivo Agrícola">Defensivo Agrícola</option>
                    <option value="Semente">Semente</option>
                    <option value="Fertilizante">Fertilizante</option>
                    <option value="Outro Insumo">Outro Insumo</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Unidade</label>
                  <select value={unidadeMedida} onChange={(e) => setUnidadeMedida(e.target.value as UnidadeMedida)} className="w-full px-3 py-2 border border-stone-200 rounded-lg bg-white">
                    <option value="L">Litro (L)</option>
                    <option value="kg">Quilo (kg)</option>
                    <option value="saca">Saca</option>
                    <option value="ton">Tonelada</option>
                    <option value="unidade">Unidade</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block font-bold text-stone-700 mb-1">Estoque mínimo (opcional)</label>
                <input type="number" value={estoqueMinimo} onChange={(e) => setEstoqueMinimo(e.target.value)} className="w-full px-3 py-2 border border-stone-200 rounded-lg" />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-lg">Cancelar</button>
                <button type="submit" className="px-5 py-2 font-bold bg-stone-900 text-white rounded-xl">Adicionar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// ---------- Pedidos de Compra ----------
const PainelPedidos: React.FC<any> = ({ pedidos, fornecedores, produtos, fazendas, addPedidoCompra, cancelarPedidoCompra }) => {
  const [showModal, setShowModal] = useState(false);
  const [fornecedorId, setFornecedorId] = useState(fornecedores[0]?.id || '');
  const [fazendaId, setFazendaId] = useState('');
  const [dataPedido, setDataPedido] = useState(() => new Date().toISOString().split('T')[0]);
  const [previsaoEntrega, setPrevisaoEntrega] = useState('');
  const [observacao, setObservacao] = useState('');
  const [itens, setItens] = useState<{ produtoId: string; quantidade: string; valorUnitario: string }[]>([
    { produtoId: produtos[0]?.id || '', quantidade: '', valorUnitario: '' },
  ]);

  const produtosAtivos = produtos.filter((p: any) => p.ativo);

  const addLinha = () => setItens((prev) => [...prev, { produtoId: produtosAtivos[0]?.id || '', quantidade: '', valorUnitario: '' }]);
  const removerLinha = (idx: number) => setItens((prev) => prev.filter((_, i) => i !== idx));
  const atualizarLinha = (idx: number, campo: string, valor: string) =>
    setItens((prev) => prev.map((it, i) => (i === idx ? { ...it, [campo]: valor } : it)));

  const totalPedido = itens.reduce((sum, it) => sum + (Number(it.quantidade) || 0) * (Number(it.valorUnitario.replace(',', '.')) || 0), 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fornecedorId) {
      alert('Cadastre e escolha um fornecedor primeiro.');
      return;
    }
    const itensValidos = itens.filter((it) => it.produtoId && Number(it.quantidade) > 0);
    if (itensValidos.length === 0) {
      alert('Adicione ao menos um item com quantidade.');
      return;
    }
    addPedidoCompra({
      fornecedorId,
      fazendaId: fazendaId || undefined,
      dataPedido,
      previsaoEntrega: previsaoEntrega || undefined,
      observacao,
      itens: itensValidos.map((it) => ({
        produtoId: it.produtoId,
        quantidade: Number(it.quantidade),
        valorUnitario: Number(it.valorUnitario.replace(',', '.')) || 0,
        quantidadeRecebida: 0,
      })),
    });
    setShowModal(false);
    setItens([{ produtoId: produtosAtivos[0]?.id || '', quantidade: '', valorUnitario: '' }]);
    setObservacao('');
  };

  if (fornecedores.length === 0 || produtos.length === 0) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900">
        Antes de criar um pedido, cadastre pelo menos um <strong>Fornecedor</strong> e um <strong>Produto</strong> nas abas ao lado.
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-end mb-3">
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs py-2 px-4 rounded-xl"
        >
          <Plus className="w-4 h-4" /> Novo Pedido de Compra
        </button>
      </div>

      <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden">
        {pedidos.length === 0 ? (
          <p className="text-xs text-stone-500 p-4">Nenhum pedido de compra registrado ainda.</p>
        ) : (
          pedidos.map((p: any) => {
            const fornecedor = fornecedores.find((f: any) => f.id === p.fornecedorId);
            return (
              <div key={p.id} className="px-4 py-3 border-b border-stone-100 last:border-0 text-xs">
                <div className="flex items-center justify-between mb-1">
                  <div>
                    <p className="font-semibold text-stone-900">{fornecedor?.nome || 'Fornecedor removido'}</p>
                    <p className="text-stone-500">Pedido em {formatDate(p.dataPedido)}{p.previsaoEntrega ? ` · previsão de entrega ${formatDate(p.previsaoEntrega)}` : ''}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-stone-900">{formatCurrency(p.valorTotal)}</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusStyle[p.status] || 'bg-stone-100 text-stone-700'}`}>
                      {p.status}
                    </span>
                  </div>
                </div>
                <div className="text-stone-500">
                  {p.itens.map((it: any, i: number) => {
                    const prod = produtos.find((pr: any) => pr.id === it.produtoId);
                    return (
                      <span key={i}>
                        {i > 0 && ' · '}
                        {prod?.nome || 'produto removido'} ({it.quantidade} {prod?.unidadeMedida})
                      </span>
                    );
                  })}
                </div>
                {p.status === 'Pendente' && (
                  <button
                    onClick={() => confirm('Cancelar esse pedido?') && cancelarPedidoCompra(p.id)}
                    className="text-[11px] text-rose-600 hover:underline mt-1"
                  >
                    Cancelar pedido
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-lg overflow-hidden my-6">
            <div className="p-4 bg-stone-900 text-white flex items-center justify-between">
              <h2 className="font-extrabold text-sm">Novo Pedido de Compra</h2>
              <button onClick={() => setShowModal(false)} className="text-stone-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Fornecedor</label>
                  <select value={fornecedorId} onChange={(e) => setFornecedorId(e.target.value)} className="w-full px-3 py-2 border border-stone-200 rounded-lg bg-white">
                    {fornecedores.map((f: any) => (
                      <option key={f.id} value={f.id}>{f.nome}</option>
                    ))}
                  </select>
                </div>
                {fazendas.length >= 1 && (
                  <div>
                    <label className="block font-bold text-stone-700 mb-1">Fazenda (opcional)</label>
                    <select value={fazendaId} onChange={(e) => setFazendaId(e.target.value)} className="w-full px-3 py-2 border border-stone-200 rounded-lg bg-white">
                      <option value="">Geral</option>
                      {fazendas.map((f: any) => (
                        <option key={f.id} value={f.id}>{f.nome}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Data do pedido</label>
                  <input type="date" value={dataPedido} onChange={(e) => setDataPedido(e.target.value)} className="w-full px-3 py-2 border border-stone-200 rounded-lg bg-white" />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Previsão de entrega (opcional)</label>
                  <input type="date" value={previsaoEntrega} onChange={(e) => setPrevisaoEntrega(e.target.value)} className="w-full px-3 py-2 border border-stone-200 rounded-lg bg-white" />
                </div>
              </div>

              <div className="border-t border-stone-100 pt-3">
                <p className="font-bold text-stone-700 mb-2">Itens</p>
                <div className="space-y-2">
                  {itens.map((it, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <select
                        value={it.produtoId}
                        onChange={(e) => atualizarLinha(idx, 'produtoId', e.target.value)}
                        className="flex-1 px-2 py-2 border border-stone-200 rounded-lg bg-white"
                      >
                        {produtosAtivos.map((p: any) => (
                          <option key={p.id} value={p.id}>{p.nome}</option>
                        ))}
                      </select>
                      <input
                        type="number"
                        placeholder="Qtd"
                        value={it.quantidade}
                        onChange={(e) => atualizarLinha(idx, 'quantidade', e.target.value)}
                        className="w-16 px-2 py-2 border border-stone-200 rounded-lg"
                      />
                      <input
                        type="text"
                        placeholder="R$ unit."
                        value={it.valorUnitario}
                        onChange={(e) => atualizarLinha(idx, 'valorUnitario', e.target.value)}
                        className="w-24 px-2 py-2 border border-stone-200 rounded-lg"
                      />
                      {itens.length > 1 && (
                        <button type="button" onClick={() => removerLinha(idx)} className="text-stone-400 hover:text-rose-600">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button type="button" onClick={addLinha} className="mt-2 text-[11px] font-semibold text-stone-600 hover:text-stone-900 flex items-center gap-1">
                  <Plus className="w-3 h-3" /> Adicionar item
                </button>
              </div>

              <div className="flex items-center justify-between bg-stone-50 rounded-lg px-3 py-2">
                <span className="font-bold text-stone-700">Total do pedido</span>
                <span className="font-extrabold text-stone-900">{formatCurrency(totalPedido)}</span>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Observação (opcional)</label>
                <input value={observacao} onChange={(e) => setObservacao(e.target.value)} className="w-full px-3 py-2 border border-stone-200 rounded-lg" />
              </div>

              <p className="text-[11px] text-stone-400">
                Esse pedido ainda não gera Contas a Pagar nem entra no estoque automaticamente — isso vem nas próximas etapas
                (recebimento da entrega e condição de pagamento).
              </p>

              <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-lg">Cancelar</button>
                <button type="submit" className="px-5 py-2 font-bold bg-stone-900 text-white rounded-xl">Registrar Pedido</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
