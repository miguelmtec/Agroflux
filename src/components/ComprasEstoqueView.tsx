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
  Sprout,
  Boxes,
} from 'lucide-react';

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
    registrarEntregaPedido,
    gerarPagamentoPedido,
    fazendas,
    talhoes,
    addTalhao,
    toggleTalhaoAtivo,
    safras,
    addSafra,
    toggleSafraAtiva,
    consumos,
    registrarConsumoInsumo,
  } = useFinance();

  const [tab, setTab] = useState<'pedidos' | 'produtos' | 'fornecedores' | 'safras' | 'consumo'>('pedidos');

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
        <button
          onClick={() => setTab('safras')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            tab === 'safras' ? 'bg-white shadow-xs text-stone-900' : 'text-stone-500'
          }`}
        >
          <Sprout className="w-3.5 h-3.5" /> Safras & Talhões
        </button>
        <button
          onClick={() => setTab('consumo')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            tab === 'consumo' ? 'bg-white shadow-xs text-stone-900' : 'text-stone-500'
          }`}
        >
          <Sprout className="w-3.5 h-3.5" /> Consumo
        </button>
      </div>

      {tab === 'fornecedores' && (
        <PainelFornecedores fornecedores={fornecedores} addFornecedor={addFornecedor} toggleFornecedorAtivo={toggleFornecedorAtivo} />
      )}
      {tab === 'produtos' && (
        <PainelProdutos produtos={produtos} addProduto={addProduto} toggleProdutoAtivo={toggleProdutoAtivo} />
      )}
      {tab === 'safras' && (
        <PainelSafrasTalhoes
          safras={safras}
          addSafra={addSafra}
          toggleSafraAtiva={toggleSafraAtiva}
          talhoes={talhoes}
          addTalhao={addTalhao}
          toggleTalhaoAtivo={toggleTalhaoAtivo}
          fazendas={fazendas}
        />
      )}
      {tab === 'consumo' && (
        <PainelConsumo
          produtos={produtos}
          fazendas={fazendas}
          talhoes={talhoes}
          safras={safras}
          consumos={consumos}
          registrarConsumoInsumo={registrarConsumoInsumo}
        />
      )}
      {tab === 'pedidos' && (
        <PainelPedidos
          pedidos={pedidosCompra}
          fornecedores={fornecedores}
          produtos={produtos}
          fazendas={fazendas}
          addPedidoCompra={addPedidoCompra}
          cancelarPedidoCompra={cancelarPedidoCompra}
          registrarEntregaPedido={registrarEntregaPedido}
          gerarPagamentoPedido={gerarPagamentoPedido}
        />
      )}
    </div>
  );
};

// ---------- Fornecedores ----------
const TIPOS_FORNECEDOR = ['Revenda Agrícola', 'Cooperativa', 'Indústria', 'Distribuidor', 'Transportadora', 'Prestador de Serviço'];

const PainelFornecedores: React.FC<any> = ({ fornecedores, addFornecedor, toggleFornecedorAtivo }) => {
  const [showModal, setShowModal] = useState(false);
  const [expandido, setExpandido] = useState<string | null>(null);
  const [nome, setNome] = useState('');
  const [tipo, setTipo] = useState('');
  const [cnpjCpf, setCnpjCpf] = useState('');
  const [inscricaoEstadual, setInscricaoEstadual] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [contatoResponsavel, setContatoResponsavel] = useState('');
  const [cidade, setCidade] = useState('');
  const [uf, setUf] = useState('');
  const [observacao, setObservacao] = useState('');

  const limpar = () => {
    setNome(''); setTipo(''); setCnpjCpf(''); setInscricaoEstadual(''); setTelefone('');
    setEmail(''); setContatoResponsavel(''); setCidade(''); setUf(''); setObservacao('');
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) return;
    addFornecedor({
      nome: nome.trim(), tipo, cnpjCpf, inscricaoEstadual, telefone, email,
      contatoResponsavel, cidade, uf, observacao, ativo: true,
    });
    setShowModal(false);
    limpar();
  };

  const inputClass = 'w-full px-3 py-2 border border-stone-200 rounded-lg';
  const labelClass = 'block font-bold text-stone-700 mb-1';

  return (
    <div>
      <datalist id="tipos-fornecedor">
        {TIPOS_FORNECEDOR.map((t) => <option key={t} value={t} />)}
      </datalist>

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
          fornecedores.map((f: any) => {
            const aberto = expandido === f.id;
            return (
              <div key={f.id} className="border-b border-stone-100 last:border-0 text-xs">
                <div
                  className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-stone-50"
                  onClick={() => setExpandido(aberto ? null : f.id)}
                >
                  <div>
                    <p className={`font-semibold ${f.ativo ? 'text-stone-900' : 'text-stone-400 line-through'}`}>{f.nome}</p>
                    <p className="text-stone-500">
                      {f.tipo || '—'} {f.cidade ? `· ${f.cidade}${f.uf ? '/' + f.uf : ''}` : ''}
                    </p>
                  </div>
                  <label
                    className="flex items-center gap-1.5 text-stone-500 cursor-pointer"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input type="checkbox" checked={f.ativo} onChange={() => toggleFornecedorAtivo(f.id)} className="rounded" /> Ativo
                  </label>
                </div>
                {aberto && (
                  <div className="px-4 pb-3 grid grid-cols-2 gap-x-4 gap-y-1 text-stone-600">
                    <p><span className="text-stone-400">CNPJ/CPF:</span> {f.cnpjCpf || '—'}</p>
                    <p><span className="text-stone-400">Inscrição Estadual:</span> {f.inscricaoEstadual || '—'}</p>
                    <p><span className="text-stone-400">Telefone:</span> {f.telefone || '—'}</p>
                    <p><span className="text-stone-400">E-mail:</span> {f.email || '—'}</p>
                    <p><span className="text-stone-400">Contato:</span> {f.contatoResponsavel || '—'}</p>
                    {f.observacao && <p className="col-span-2"><span className="text-stone-400">Obs:</span> {f.observacao}</p>}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-md overflow-hidden my-6">
            <div className="p-4 bg-stone-900 text-white flex items-center justify-between">
              <h2 className="font-extrabold text-sm">Novo Fornecedor</h2>
              <button onClick={() => setShowModal(false)} className="text-stone-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleAdd} className="p-5 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className={labelClass}>Nome</label>
                  <input value={nome} onChange={(e) => setNome(e.target.value)} className={inputClass} required />
                </div>
                <div className="col-span-2">
                  <label className={labelClass}>Tipo (opcional)</label>
                  <input
                    list="tipos-fornecedor"
                    placeholder="Escolha uma sugestão ou digite a sua"
                    value={tipo}
                    onChange={(e) => setTipo(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>CNPJ/CPF</label>
                  <input value={cnpjCpf} onChange={(e) => setCnpjCpf(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Inscrição Estadual</label>
                  <input value={inscricaoEstadual} onChange={(e) => setInscricaoEstadual(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Telefone</label>
                  <input value={telefone} onChange={(e) => setTelefone(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>E-mail</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
                </div>
                <div className="col-span-2">
                  <label className={labelClass}>Contato / responsável (opcional)</label>
                  <input value={contatoResponsavel} onChange={(e) => setContatoResponsavel(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Cidade</label>
                  <input value={cidade} onChange={(e) => setCidade(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>UF</label>
                  <input maxLength={2} value={uf} onChange={(e) => setUf(e.target.value.toUpperCase())} className={inputClass} />
                </div>
                <div className="col-span-2">
                  <label className={labelClass}>Observação</label>
                  <input value={observacao} onChange={(e) => setObservacao(e.target.value)} className={inputClass} />
                </div>
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
const CATEGORIAS_PRODUTO = ['Defensivo Agrícola', 'Semente', 'Fertilizante', 'Corretivo de Solo', 'Ração/Nutrição Animal', 'Combustível', 'Peças & Manutenção', 'Outro Insumo'];
const UNIDADES_PRODUTO = ['kg', 'Litro (L)', 'Saca 50kg', 'Saca 60kg', 'Big Bag 1000kg', 'Tonelada', 'Fardo', 'Caixa', 'Unidade'];

const PainelProdutos: React.FC<any> = ({ produtos, addProduto, toggleProdutoAtivo }) => {
  const [showModal, setShowModal] = useState(false);
  const [nome, setNome] = useState('');
  const [categoria, setCategoria] = useState('Defensivo Agrícola');
  const [unidadeMedida, setUnidadeMedida] = useState('Litro (L)');
  const [estoqueMinimo, setEstoqueMinimo] = useState('');

  // categorias e unidades já usadas pelo cliente entram na lista de sugestões também
  const sugestoesCategoria = Array.from(new Set([...CATEGORIAS_PRODUTO, ...produtos.map((p: any) => p.categoria)]));
  const sugestoesUnidade = Array.from(new Set([...UNIDADES_PRODUTO, ...produtos.map((p: any) => p.unidadeMedida)]));

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !categoria.trim() || !unidadeMedida.trim()) return;
    addProduto({
      nome: nome.trim(),
      categoria: categoria.trim(),
      unidadeMedida: unidadeMedida.trim(),
      estoqueMinimo: estoqueMinimo ? Number(estoqueMinimo) : undefined,
      ativo: true,
    });
    setShowModal(false);
    setNome('');
    setEstoqueMinimo('');
  };

  return (
    <div>
      <datalist id="categorias-produto">
        {sugestoesCategoria.map((c) => <option key={c} value={c} />)}
      </datalist>
      <datalist id="unidades-produto">
        {sugestoesUnidade.map((u) => <option key={u} value={u} />)}
      </datalist>

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
              <div>
                <label className="block font-bold text-stone-700 mb-1">Categoria</label>
                <input
                  list="categorias-produto"
                  placeholder="Escolha uma sugestão ou digite a sua"
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block font-bold text-stone-700 mb-1">Unidade de medida</label>
                <input
                  list="unidades-produto"
                  placeholder="Ex: Saco 60kg, Bag 1000kg, Litro..."
                  value={unidadeMedida}
                  onChange={(e) => setUnidadeMedida(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg"
                  required
                />
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
const PainelPedidos: React.FC<any> = ({ pedidos, fornecedores, produtos, fazendas, addPedidoCompra, cancelarPedidoCompra, registrarEntregaPedido, gerarPagamentoPedido }) => {
  const [showModal, setShowModal] = useState(false);
  const [pedidoEntrega, setPedidoEntrega] = useState<any>(null);
  const [pedidoPagamento, setPedidoPagamento] = useState<any>(null);
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
                <div className="flex gap-3 mt-2">
                  {p.status !== 'Entregue' && p.status !== 'Cancelado' && (
                    <button
                      onClick={() => setPedidoEntrega(p)}
                      className="flex items-center gap-1 text-[11px] font-semibold text-blue-700 hover:underline"
                    >
                      <Boxes className="w-3 h-3" /> Registrar entrega
                    </button>
                  )}
                  {!p.pagamentoGerado && p.status !== 'Cancelado' && (
                    <button
                      onClick={() => setPedidoPagamento(p)}
                      className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:underline"
                    >
                      Gerar Contas a Pagar
                    </button>
                  )}
                  {p.pagamentoGerado && (
                    <span className="text-[11px] text-stone-400">Pagamento já gerado em Contas a Pagar</span>
                  )}
                </div>
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
                Depois de criado, você registra a entrega (atualiza o estoque) e gera as Contas a Pagar
                separadamente, na lista de pedidos.
              </p>

              <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-lg">Cancelar</button>
                <button type="submit" className="px-5 py-2 font-bold bg-stone-900 text-white rounded-xl">Registrar Pedido</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {pedidoEntrega && (
        <ModalEntrega
          pedido={pedidoEntrega}
          produtos={produtos}
          onClose={() => setPedidoEntrega(null)}
          onConfirmar={(entregas) => {
            registrarEntregaPedido(pedidoEntrega.id, entregas);
            setPedidoEntrega(null);
          }}
        />
      )}

      {pedidoPagamento && (
        <ModalPagamento
          pedido={pedidoPagamento}
          onClose={() => setPedidoPagamento(null)}
          onConfirmar={(parcelas) => {
            gerarPagamentoPedido(pedidoPagamento.id, parcelas);
            setPedidoPagamento(null);
          }}
        />
      )}
    </div>
  );
};

// ---------- Modal: Registrar Entrega ----------
const ModalEntrega: React.FC<any> = ({ pedido, produtos, onClose, onConfirmar }) => {
  const [quantidades, setQuantidades] = useState<Record<string, string>>({});

  const handleConfirmar = () => {
    const entregas = pedido.itens
      .map((it: any) => ({ produtoId: it.produtoId, quantidade: Number(quantidades[it.produtoId] || 0) }))
      .filter((e: any) => e.quantidade > 0);
    if (entregas.length === 0) {
      alert('Informe quanto chegou de pelo menos um item.');
      return;
    }
    onConfirmar(entregas);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-md overflow-hidden">
        <div className="p-4 bg-stone-900 text-white flex items-center justify-between">
          <h2 className="font-extrabold text-sm">Registrar Entrega</h2>
          <button onClick={onClose} className="text-stone-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-3 text-xs">
          <p className="text-stone-500">Informe quanto chegou agora de cada item (pode ser parcial).</p>
          {pedido.itens.map((it: any) => {
            const produto = produtos.find((p: any) => p.id === it.produtoId);
            const faltam = it.quantidade - it.quantidadeRecebida;
            return (
              <div key={it.produtoId} className="flex items-center justify-between gap-3 border-b border-stone-100 pb-2">
                <div>
                  <p className="font-semibold text-stone-900">{produto?.nome}</p>
                  <p className="text-stone-500">
                    Pedido: {it.quantidade} · Já recebido: {it.quantidadeRecebida} · Falta: {faltam} {produto?.unidadeMedida}
                  </p>
                </div>
                <input
                  type="number"
                  placeholder="0"
                  max={faltam}
                  value={quantidades[it.produtoId] || ''}
                  onChange={(e) => setQuantidades((prev) => ({ ...prev, [it.produtoId]: e.target.value }))}
                  className="w-20 px-2 py-2 border border-stone-200 rounded-lg text-center"
                />
              </div>
            );
          })}
          <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
            <button onClick={onClose} className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-lg">Cancelar</button>
            <button onClick={handleConfirmar} className="px-5 py-2 font-bold bg-stone-900 text-white rounded-xl">Confirmar Entrega</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ---------- Modal: Gerar Pagamento ----------
const ModalPagamento: React.FC<any> = ({ pedido, onClose, onConfirmar }) => {
  const [modo, setModo] = useState<'avista' | 'parcelado'>('avista');
  const [primeiroVencimento, setPrimeiroVencimento] = useState(() => new Date().toISOString().split('T')[0]);
  const [qtdParcelas, setQtdParcelas] = useState('3');
  const [intervaloDias, setIntervaloDias] = useState('30');

  const handleConfirmar = () => {
    if (modo === 'avista') {
      onConfirmar([{ valor: pedido.valorTotal, vencimento: primeiroVencimento }]);
      return;
    }
    const n = Math.max(1, Number(qtdParcelas));
    const valorParcela = pedido.valorTotal / n;
    const parcelas = Array.from({ length: n }, (_, i) => {
      const data = new Date(primeiroVencimento);
      data.setDate(data.getDate() + i * Number(intervaloDias));
      return { valor: valorParcela, vencimento: data.toISOString().split('T')[0] };
    });
    onConfirmar(parcelas);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-sm overflow-hidden">
        <div className="p-4 bg-stone-900 text-white flex items-center justify-between">
          <h2 className="font-extrabold text-sm">Gerar Contas a Pagar</h2>
          <button onClick={onClose} className="text-stone-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-3 text-xs">
          <div className="flex items-center justify-between bg-stone-50 rounded-lg px-3 py-2">
            <span className="font-bold text-stone-700">Total do pedido</span>
            <span className="font-extrabold text-stone-900">{formatCurrency(pedido.valorTotal)}</span>
          </div>
          <div className="flex gap-2 bg-stone-100 rounded-xl p-1 w-fit">
            <button
              onClick={() => setModo('avista')}
              className={`px-3 py-1.5 rounded-lg font-bold ${modo === 'avista' ? 'bg-white shadow-xs text-stone-900' : 'text-stone-500'}`}
            >
              À vista
            </button>
            <button
              onClick={() => setModo('parcelado')}
              className={`px-3 py-1.5 rounded-lg font-bold ${modo === 'parcelado' ? 'bg-white shadow-xs text-stone-900' : 'text-stone-500'}`}
            >
              Parcelado
            </button>
          </div>
          <div>
            <label className="block font-bold text-stone-700 mb-1">
              {modo === 'avista' ? 'Vencimento' : 'Vencimento da 1ª parcela'}
            </label>
            <input type="date" value={primeiroVencimento} onChange={(e) => setPrimeiroVencimento(e.target.value)} className="w-full px-3 py-2 border border-stone-200 rounded-lg bg-white" />
          </div>
          {modo === 'parcelado' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-stone-700 mb-1">Quantas parcelas</label>
                <input type="number" min={2} value={qtdParcelas} onChange={(e) => setQtdParcelas(e.target.value)} className="w-full px-3 py-2 border border-stone-200 rounded-lg" />
              </div>
              <div>
                <label className="block font-bold text-stone-700 mb-1">Intervalo (dias)</label>
                <input type="number" min={1} value={intervaloDias} onChange={(e) => setIntervaloDias(e.target.value)} className="w-full px-3 py-2 border border-stone-200 rounded-lg" />
              </div>
            </div>
          )}
          <p className="text-[11px] text-stone-400">Isso cria a(s) despesa(s) direto em "Contas a Pagar", já vinculada(s) a este pedido.</p>
          <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
            <button onClick={onClose} className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-lg">Cancelar</button>
            <button onClick={handleConfirmar} className="px-5 py-2 font-bold bg-stone-900 text-white rounded-xl">Gerar</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ---------- Fase 4: Safras & Talhões ----------
const PainelSafrasTalhoes: React.FC<any> = ({ safras, addSafra, toggleSafraAtiva, talhoes, addTalhao, toggleTalhaoAtivo, fazendas }) => {
  const [showSafraModal, setShowSafraModal] = useState(false);
  const [showTalhaoModal, setShowTalhaoModal] = useState(false);
  const [nomeSafra, setNomeSafra] = useState('');
  const [inicioSafra, setInicioSafra] = useState('');
  const [fimSafra, setFimSafra] = useState('');
  const [nomeTalhao, setNomeTalhao] = useState('');
  const [fazendaTalhao, setFazendaTalhao] = useState(fazendas[0]?.id || '');
  const [areaTalhao, setAreaTalhao] = useState('');
  const [culturaTalhao, setCulturaTalhao] = useState('');

  const handleAddSafra = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeSafra.trim()) return;
    addSafra({ nome: nomeSafra.trim(), dataInicio: inicioSafra || undefined, dataFim: fimSafra || undefined, ativa: true });
    setShowSafraModal(false);
    setNomeSafra(''); setInicioSafra(''); setFimSafra('');
  };

  const handleAddTalhao = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeTalhao.trim() || !fazendaTalhao) return;
    addTalhao({
      nome: nomeTalhao.trim(),
      fazendaId: fazendaTalhao,
      areaHectares: areaTalhao ? Number(areaTalhao) : undefined,
      culturaAtual: culturaTalhao || undefined,
      ativo: true,
    });
    setShowTalhaoModal(false);
    setNomeTalhao(''); setAreaTalhao(''); setCulturaTalhao('');
  };

  return (
    <div className="grid sm:grid-cols-2 gap-4">
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="font-bold text-stone-800 text-xs">Safras</p>
          <button onClick={() => setShowSafraModal(true)} className="flex items-center gap-1 text-[11px] font-semibold text-stone-600 hover:text-stone-900">
            <Plus className="w-3 h-3" /> Nova Safra
          </button>
        </div>
        <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden">
          {safras.length === 0 ? (
            <p className="text-xs text-stone-500 p-4">Nenhuma safra cadastrada. Ex: "Verão 2025/26", "Inverno 2026".</p>
          ) : (
            safras.map((s: any) => (
              <div key={s.id} className="flex items-center justify-between px-4 py-2.5 border-b border-stone-100 last:border-0 text-xs">
                <div>
                  <p className={`font-semibold ${s.ativa ? 'text-stone-900' : 'text-stone-400 line-through'}`}>{s.nome}</p>
                  {(s.dataInicio || s.dataFim) && (
                    <p className="text-stone-500">{s.dataInicio ? formatDate(s.dataInicio) : '?'} — {s.dataFim ? formatDate(s.dataFim) : '?'}</p>
                  )}
                </div>
                <label className="flex items-center gap-1.5 text-stone-500 cursor-pointer">
                  <input type="checkbox" checked={s.ativa} onChange={() => toggleSafraAtiva(s.id)} className="rounded" /> Ativa
                </label>
              </div>
            ))
          )}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="font-bold text-stone-800 text-xs">Talhões</p>
          <button onClick={() => setShowTalhaoModal(true)} className="flex items-center gap-1 text-[11px] font-semibold text-stone-600 hover:text-stone-900">
            <Plus className="w-3 h-3" /> Novo Talhão
          </button>
        </div>
        <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden">
          {talhoes.length === 0 ? (
            <p className="text-xs text-stone-500 p-4">Nenhum talhão cadastrado ainda.</p>
          ) : (
            talhoes.map((t: any) => {
              const fazenda = fazendas.find((f: any) => f.id === t.fazendaId);
              return (
                <div key={t.id} className="flex items-center justify-between px-4 py-2.5 border-b border-stone-100 last:border-0 text-xs">
                  <div>
                    <p className={`font-semibold ${t.ativo ? 'text-stone-900' : 'text-stone-400 line-through'}`}>{t.nome}</p>
                    <p className="text-stone-500">
                      {fazenda?.nome || 'fazenda removida'}{t.areaHectares ? ` · ${t.areaHectares} ha` : ''}{t.culturaAtual ? ` · ${t.culturaAtual}` : ''}
                    </p>
                  </div>
                  <label className="flex items-center gap-1.5 text-stone-500 cursor-pointer">
                    <input type="checkbox" checked={t.ativo} onChange={() => toggleTalhaoAtivo(t.id)} className="rounded" /> Ativo
                  </label>
                </div>
              );
            })
          )}
        </div>
      </div>

      {showSafraModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-sm overflow-hidden">
            <div className="p-4 bg-stone-900 text-white flex items-center justify-between">
              <h2 className="font-extrabold text-sm">Nova Safra</h2>
              <button onClick={() => setShowSafraModal(false)} className="text-stone-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleAddSafra} className="p-5 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-stone-700 mb-1">Nome da safra</label>
                <input placeholder='Ex: "Verão 2025/26"' value={nomeSafra} onChange={(e) => setNomeSafra(e.target.value)} className="w-full px-3 py-2 border border-stone-200 rounded-lg" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Início (opcional)</label>
                  <input type="date" value={inicioSafra} onChange={(e) => setInicioSafra(e.target.value)} className="w-full px-3 py-2 border border-stone-200 rounded-lg" />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Fim (opcional)</label>
                  <input type="date" value={fimSafra} onChange={(e) => setFimSafra(e.target.value)} className="w-full px-3 py-2 border border-stone-200 rounded-lg" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
                <button type="button" onClick={() => setShowSafraModal(false)} className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-lg">Cancelar</button>
                <button type="submit" className="px-5 py-2 font-bold bg-stone-900 text-white rounded-xl">Adicionar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showTalhaoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-sm overflow-hidden">
            <div className="p-4 bg-stone-900 text-white flex items-center justify-between">
              <h2 className="font-extrabold text-sm">Novo Talhão</h2>
              <button onClick={() => setShowTalhaoModal(false)} className="text-stone-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleAddTalhao} className="p-5 space-y-3 text-xs">
              {fazendas.length === 0 ? (
                <p className="text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
                  Cadastre uma Fazenda primeiro, em "Fazendas & Usuários".
                </p>
              ) : (
                <>
                  <div>
                    <label className="block font-bold text-stone-700 mb-1">Fazenda</label>
                    <select value={fazendaTalhao} onChange={(e) => setFazendaTalhao(e.target.value)} className="w-full px-3 py-2 border border-stone-200 rounded-lg bg-white">
                      {fazendas.map((f: any) => <option key={f.id} value={f.id}>{f.nome}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-stone-700 mb-1">Nome do talhão</label>
                    <input placeholder="Ex: Talhão 3, Gleba Norte" value={nomeTalhao} onChange={(e) => setNomeTalhao(e.target.value)} className="w-full px-3 py-2 border border-stone-200 rounded-lg" required />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-stone-700 mb-1">Área (ha)</label>
                      <input type="number" value={areaTalhao} onChange={(e) => setAreaTalhao(e.target.value)} className="w-full px-3 py-2 border border-stone-200 rounded-lg" />
                    </div>
                    <div>
                      <label className="block font-bold text-stone-700 mb-1">Cultura atual</label>
                      <input placeholder="Ex: Soja" value={culturaTalhao} onChange={(e) => setCulturaTalhao(e.target.value)} className="w-full px-3 py-2 border border-stone-200 rounded-lg" />
                    </div>
                  </div>
                </>
              )}
              <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
                <button type="button" onClick={() => setShowTalhaoModal(false)} className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-lg">Cancelar</button>
                <button type="submit" disabled={fazendas.length === 0} className="px-5 py-2 font-bold bg-stone-900 text-white rounded-xl disabled:opacity-40">Adicionar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// ---------- Fase 4: Consumo de Insumos ----------
const PainelConsumo: React.FC<any> = ({ produtos, fazendas, talhoes, safras, consumos, registrarConsumoInsumo }) => {
  const [showModal, setShowModal] = useState(false);
  const [produtoId, setProdutoId] = useState('');
  const [fazendaId, setFazendaId] = useState('');
  const [talhaoId, setTalhaoId] = useState('');
  const [safraId, setSafraId] = useState('');
  const [quantidade, setQuantidade] = useState('');
  const [data, setData] = useState(() => new Date().toISOString().split('T')[0]);
  const [observacao, setObservacao] = useState('');

  const produtosComEstoque = produtos.filter((p: any) => p.ativo && p.estoqueAtual > 0);
  const talhoesDaFazenda = talhoes.filter((t: any) => !fazendaId || t.fazendaId === fazendaId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!produtoId || !quantidade) {
      alert('Escolha o produto e a quantidade usada.');
      return;
    }
    const resultado = registrarConsumoInsumo({
      produtoId,
      fazendaId: fazendaId || undefined,
      talhaoId: talhaoId || undefined,
      safraId: safraId || undefined,
      quantidade: Number(quantidade),
      data,
      observacao,
    });
    if (!resultado.success) {
      alert(resultado.message);
      return;
    }
    setShowModal(false);
    setProdutoId(''); setQuantidade(''); setObservacao('');
  };

  return (
    <div>
      <div className="flex justify-end mb-3">
        <button
          onClick={() => setShowModal(true)}
          disabled={produtosComEstoque.length === 0}
          className="flex items-center gap-1.5 bg-stone-900 hover:bg-stone-800 disabled:opacity-40 text-white font-semibold text-xs py-2 px-4 rounded-xl"
        >
          <Plus className="w-4 h-4" /> Registrar Consumo
        </button>
      </div>
      {produtosComEstoque.length === 0 && (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-3 mb-3">
          Nenhum produto com estoque disponível ainda — registre uma entrega de pedido primeiro.
        </p>
      )}
      <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden">
        {consumos.length === 0 ? (
          <p className="text-xs text-stone-500 p-4">Nenhum consumo registrado ainda.</p>
        ) : (
          consumos.map((c: any) => {
            const produto = produtos.find((p: any) => p.id === c.produtoId);
            const fazenda = fazendas.find((f: any) => f.id === c.fazendaId);
            const talhao = talhoes.find((t: any) => t.id === c.talhaoId);
            const safra = safras.find((s: any) => s.id === c.safraId);
            return (
              <div key={c.id} className="px-4 py-3 border-b border-stone-100 last:border-0 text-xs">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-stone-900">
                    {produto?.nome || 'produto removido'} — {c.quantidade} {produto?.unidadeMedida}
                  </p>
                  <p className="text-stone-500">{formatDate(c.data)}</p>
                </div>
                <p className="text-stone-500">
                  {[fazenda?.nome, talhao?.nome, safra?.nome].filter(Boolean).join(' · ') || 'Sem fazenda/talhão/safra vinculado'}
                </p>
              </div>
            );
          })
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-sm overflow-hidden">
            <div className="p-4 bg-stone-900 text-white flex items-center justify-between">
              <h2 className="font-extrabold text-sm">Registrar Consumo</h2>
              <button onClick={() => setShowModal(false)} className="text-stone-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-stone-700 mb-1">Produto</label>
                <select value={produtoId} onChange={(e) => setProdutoId(e.target.value)} className="w-full px-3 py-2 border border-stone-200 rounded-lg bg-white" required>
                  <option value="">Selecione...</option>
                  {produtosComEstoque.map((p: any) => (
                    <option key={p.id} value={p.id}>{p.nome} ({p.estoqueAtual} {p.unidadeMedida} em estoque)</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-bold text-stone-700 mb-1">Quantidade usada</label>
                <input type="number" value={quantidade} onChange={(e) => setQuantidade(e.target.value)} className="w-full px-3 py-2 border border-stone-200 rounded-lg" required />
              </div>
              {fazendas.length >= 1 && (
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Fazenda</label>
                  <select value={fazendaId} onChange={(e) => { setFazendaId(e.target.value); setTalhaoId(''); }} className="w-full px-3 py-2 border border-stone-200 rounded-lg bg-white">
                    <option value="">Geral</option>
                    {fazendas.map((f: any) => <option key={f.id} value={f.id}>{f.nome}</option>)}
                  </select>
                </div>
              )}
              {talhoesDaFazenda.length > 0 && (
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Talhão (opcional)</label>
                  <select value={talhaoId} onChange={(e) => setTalhaoId(e.target.value)} className="w-full px-3 py-2 border border-stone-200 rounded-lg bg-white">
                    <option value="">—</option>
                    {talhoesDaFazenda.map((t: any) => <option key={t.id} value={t.id}>{t.nome}</option>)}
                  </select>
                </div>
              )}
              {safras.length > 0 && (
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Safra (opcional)</label>
                  <select value={safraId} onChange={(e) => setSafraId(e.target.value)} className="w-full px-3 py-2 border border-stone-200 rounded-lg bg-white">
                    <option value="">—</option>
                    {safras.map((s: any) => <option key={s.id} value={s.id}>{s.nome}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="block font-bold text-stone-700 mb-1">Data</label>
                <input type="date" value={data} onChange={(e) => setData(e.target.value)} className="w-full px-3 py-2 border border-stone-200 rounded-lg bg-white" />
              </div>
              <div>
                <label className="block font-bold text-stone-700 mb-1">Observação (opcional)</label>
                <input value={observacao} onChange={(e) => setObservacao(e.target.value)} className="w-full px-3 py-2 border border-stone-200 rounded-lg" />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-lg">Cancelar</button>
                <button type="submit" className="px-5 py-2 font-bold bg-stone-900 text-white rounded-xl">Registrar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
