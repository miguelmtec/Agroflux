import React, { createContext, useContext, useState, useEffect, useMemo, useRef } from 'react';
import { api } from '../lib/api';
import {
  UsuarioAutorizado,
  IntegranteFamiliar,
  Fazenda,
  ContaBancaria,
  Receita,
  Despesa,
  Transferencia,
  Recorrencia,
  CompraParcelada,
  CartaoCredito,
  EmprestimoFinanciamento,
  OperacaoFinanceira,
  LogAuditoria,
  EncerramentoMes,
  UserProfile,
  UserPermissions,
  CategoriaPlanoContas,
  Fornecedor,
  Produto,
  PedidoCompra,
  Talhao,
  Safra,
  ConsumoInsumo,
} from '../types';

interface FinanceContextType {
  currentUser: UsuarioAutorizado | null;
  usuarios: UsuarioAutorizado[];
  integrantes: IntegranteFamiliar[];
  fazendas: Fazenda[];
  selectedFazendaId: string; // 'TODAS' or fazendaId
  setSelectedFazendaId: (id: string) => void;
  contas: ContaBancaria[];
  receitas: Receita[];
  despesas: Despesa[];
  transferencias: Transferencia[];
  recorrencias: Recorrencia[];
  comprasParceladas: CompraParcelada[];
  cartoes: CartaoCredito[];
  emprestimos: EmprestimoFinanciamento[];
  operacoes: OperacaoFinanceira[];
  auditorias: LogAuditoria[];
  encerramentos: EncerramentoMes[];
  selectedMemberId: string; // 'TODOS' or integranteId
  setSelectedMemberId: (id: string) => void;

  // Fazendas Management
  addFazenda: (fazenda: Omit<Fazenda, 'id'>) => void;
  updateFazenda: (id: string, data: Partial<Fazenda>) => void;
  deleteFazenda: (id: string) => void;
  toggleFazendaAtiva: (id: string) => void;
  categoriasPlanoContas: CategoriaPlanoContas[];
  addCategoriaPlanoContas: (categoria: Omit<CategoriaPlanoContas, 'id' | 'criadoEm'>) => void;
  updateCategoriaPlanoContas: (id: string, data: Partial<CategoriaPlanoContas>) => void;
  toggleCategoriaAtiva: (id: string) => void;
  removerCategoriaPlanoContas: (id: string) => void;
  fornecedores: Fornecedor[];
  addFornecedor: (f: Omit<Fornecedor, 'id' | 'criadoEm'>) => void;
  updateFornecedor: (id: string, data: Partial<Fornecedor>) => void;
  toggleFornecedorAtivo: (id: string) => void;
  removerFornecedor: (id: string) => { success: boolean; message?: string };
  produtos: Produto[];
  addProduto: (p: Omit<Produto, 'id' | 'criadoEm' | 'estoqueAtual'>) => void;
  updateProduto: (id: string, data: Partial<Produto>) => void;
  toggleProdutoAtivo: (id: string) => void;
  removerProduto: (id: string) => { success: boolean; message?: string };
  pedidosCompra: PedidoCompra[];
  addPedidoCompra: (p: Omit<PedidoCompra, 'id' | 'criadoEm' | 'valorTotal' | 'status'>) => void;
  cancelarPedidoCompra: (id: string) => void;
  registrarEntregaPedido: (pedidoId: string, entregas: { produtoId: string; quantidade: number }[]) => void;
  gerarPagamentoPedido: (pedidoId: string, parcelas: { valor: number; vencimento: string }[]) => void;
  talhoes: Talhao[];
  addTalhao: (t: Omit<Talhao, 'id' | 'criadoEm'>) => void;
  updateTalhao: (id: string, data: Partial<Talhao>) => void;
  toggleTalhaoAtivo: (id: string) => void;
  removerTalhao: (id: string) => { success: boolean; message?: string };
  safras: Safra[];
  addSafra: (s: Omit<Safra, 'id' | 'criadoEm'>) => void;
  updateSafra: (id: string, data: Partial<Safra>) => void;
  toggleSafraAtiva: (id: string) => void;
  removerSafra: (id: string) => { success: boolean; message?: string };
  consumos: ConsumoInsumo[];
  registrarConsumoInsumo: (c: Omit<ConsumoInsumo, 'id' | 'criadoEm'>) => { success: boolean; message?: string };

  // User Management
  updateUsuarioNome: (id: string, novoNome: string) => void;
  updateUsuario: (id: string, data: Partial<UsuarioAutorizado>) => void;
  addUsuarioAutorizado: (user: Omit<UsuarioAutorizado, 'id' | 'criadoEm' | 'atualizadoEm'>) => void;

  // Compatibility aliases
  auditLogs: LogAuditoria[];
  approveUsuario: (id: string, perfil?: UserProfile, permissoes?: Partial<UserPermissions>) => void;
  blockUsuario: (id: string) => void;
  updateUsuarioPerfil: (id: string, perfil: UserProfile) => void;
  addUsuarioPendente: (email: string, nome: string, perfilOrIntegranteId?: any, maybeIntegranteId?: string) => void;
  fecharMesFinanceiro: (mesAno: string, transferirPendentes?: boolean, observacoes?: string) => { sucesso: boolean; contasTransferidas: number; saldoFinal: number };

  // Real auth (Firebase) + multi-tenant status
  authLoading: boolean;
  familiaId: string | null;
  nomeFamilia: string;
  isMaster: boolean;
  acessoLiberado: boolean;
  statusAcesso: string;
  acessoAte: string | null;
  limiteUsuarios: number;
  precisaTrocarSenha: boolean;
  convidarUsuario: (
    nome: string,
    email: string,
    perfil: string,
    integranteId?: string
  ) => Promise<{ success: boolean; senhaTemporaria?: string; message?: string }>;
  trocarSenha: (senhaAtual: string, novaSenha: string) => Promise<{ success: boolean; message?: string }>;
  login: (email: string, senha: string) => Promise<{ success: boolean; message?: string }>;
  signUp: (
    email: string,
    senha: string,
    nomeUsuario: string,
    nomeFamilia: string
  ) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;

  // Calculations
  getContaSaldoAtual: (contaId: string) => number;
  saldoDisponivelTotal: number;
  receitasMesTotal: number;
  despesasMesTotal: number;
  saldoProjetadoTotal: number;
  patrimonioLiquidoTotal: number;
  totalDividas: number;

  // CRUD & Operations
  addReceita: (receita: Omit<Receita, 'id' | 'criadoEm' | 'criadoPor'>) => void;
  updateReceita: (id: string, receita: Partial<Receita>) => void;
  deleteReceita: (id: string) => void;
  marcarReceitaRecebida: (id: string, dataRecebimento?: string, contaId?: string) => void;

  addDespesa: (despesa: Omit<Despesa, 'id' | 'criadoEm' | 'criadoPor'>) => void;
  updateDespesa: (id: string, despesa: Partial<Despesa>) => void;
  deleteDespesa: (id: string) => void;
  marcarDespesaPaga: (id: string, dataPagamento?: string, contaId?: string) => void;
  atribuirCartaoDespesa: (id: string, cartaoId: string) => void;

  addTransferencia: (transf: Omit<Transferencia, 'id' | 'criadoEm' | 'criadoPor'>) => void;
  adjustContaSaldo: (contaId: string, novoSaldo: number, justificativa: string) => void;
  addConta: (conta: Omit<ContaBancaria, 'id'>) => void;
  updateConta: (id: string, conta: Partial<ContaBancaria>) => void;

  addCartao: (cartao: Omit<CartaoCredito, 'id'>) => void;
  updateCartao: (id: string, cartao: Partial<CartaoCredito>) => void;
  pagarFaturaCartao: (cartaoId: string, valor: number, contaId: string, mesAno: string) => void;

  addCompraParcelada: (compra: {
    descricao: string;
    categoria: string;
    integranteId: string;
    cartaoId?: string;
    contaId?: string;
    valorTotal: number;
    qtdParcelas: number;
    dataPrimeiraParcela: string;
    estabelecimento?: string;
    classificacao?: 'FIXA' | 'VARIAVEL';
  }) => void;

  addEmprestimo: (emp: Omit<EmprestimoFinanciamento, 'id'>) => void;
  pagarParcelaEmprestimo: (emprestimoId: string, numeroParcela: number, contaId?: string) => void;
  updateParcelaDataEmprestimo: (emprestimoId: string, numeroParcela: number, novaData: string, novoValor?: number) => void;
  amortizarEmprestimo: (emprestimoId: string, valorAmortizado: number, contaId?: string) => void;
  quitarEmprestimo: (emprestimoId: string, contaId?: string) => void;

  addOperacao: (op: Omit<OperacaoFinanceira, 'id'>) => void;
  updateOperacao: (id: string, op: Partial<OperacaoFinanceira>) => void;

  addIntegrante: (int: Omit<IntegranteFamiliar, 'id'>) => void;
  updateIntegrante: (id: string, int: Partial<IntegranteFamiliar>) => void;

  addRecorrencia: (rec: Omit<Recorrencia, 'id'>) => void;
  updateRecorrencia: (id: string, rec: Partial<Recorrencia>) => void;

  // Admin User & Permissions Management
  aprovarUsuario: (id: string, perfil: UserProfile, permissoes?: Partial<UserPermissions>) => void;
  bloquearUsuario: (id: string) => void;
  removerUsuario: (id: string) => Promise<{ success: boolean; message?: string }>;
  atualizarPerfilUsuario: (id: string, perfil: UserProfile) => void;
  atualizarPermissoesUsuario: (id: string, permissoes: UserPermissions) => void;

  // Month Closing
  encerrarMes: (mesAno: string, transferirPendentes: boolean, observacoes?: string) => void;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

// Formato do JSON guardado na coluna "dados" (jsonb) da tabela `familias`
// no Postgres. Cada família só enxerga a própria linha — isso é garantido
// pelas funções em /api, que sempre filtram pelo familiaId da sessão logada.
interface FamiliaDados {
  usuarios: UsuarioAutorizado[];
  integrantes: IntegranteFamiliar[];
  fazendas: Fazenda[];
  contas: ContaBancaria[];
  receitas: Receita[];
  despesas: Despesa[];
  transferencias: Transferencia[];
  recorrencias: Recorrencia[];
  comprasParceladas: CompraParcelada[];
  cartoes: CartaoCredito[];
  emprestimos: EmprestimoFinanciamento[];
  operacoes: OperacaoFinanceira[];
  auditorias: LogAuditoria[];
  encerramentos: EncerramentoMes[];
  categoriasPlanoContas: CategoriaPlanoContas[];
  fornecedores: Fornecedor[];
  produtos: Produto[];
  pedidosCompra: PedidoCompra[];
  talhoes: Talhao[];
  safras: Safra[];
  consumos: ConsumoInsumo[];
}

const DESPESA_CATEGORIAS_PADRAO = [
  'Produção Rural',
  'Combustível & Lubrificantes',
  'Manutenção de Máquinas',
  'Moradia & Manutenção',
  'Veículos Pessoais',
  'Saúde & Seguros',
  'Educação',
  'Outros',
];
const RECEITA_CATEGORIAS_PADRAO = [
  'Safra de Soja',
  'Safra de Milho',
  'Arrendamento de Terras',
  'Rendimentos & Dividendos',
  'Outras Receitas',
];

const categoriasPadrao = (): CategoriaPlanoContas[] => {
  const hoje = new Date().toISOString().split('T')[0];
  return [
    ...DESPESA_CATEGORIAS_PADRAO.map((nome, i) => ({
      id: `cat-desp-${i}`,
      nome,
      tipo: 'DESPESA' as const,
      ativa: true,
      criadoEm: hoje,
    })),
    ...RECEITA_CATEGORIAS_PADRAO.map((nome, i) => ({
      id: `cat-rec-${i}`,
      nome,
      tipo: 'RECEITA' as const,
      ativa: true,
      criadoEm: hoje,
    })),
  ];
};

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authLoading, setAuthLoading] = useState(true);
  const [familiaId, setFamiliaId] = useState<string | null>(null);
  const [nomeFamilia, setNomeFamilia] = useState<string>('');
  const [minhaEmail, setMinhaEmail] = useState<string>('');
  const [isMaster, setIsMaster] = useState(false);
  const [acessoLiberado, setAcessoLiberado] = useState(false);
  const [statusAcesso, setStatusAcesso] = useState('pendente');
  const [acessoAte, setAcessoAte] = useState<string | null>(null);
  const [limiteUsuarios, setLimiteUsuarios] = useState(1);
  const [precisaTrocarSenha, setPrecisaTrocarSenha] = useState(false);

  const [usuarios, setUsuarios] = useState<UsuarioAutorizado[]>([]);
  const [currentUser, setCurrentUser] = useState<UsuarioAutorizado | null>(null);
  const [integrantes, setIntegrantes] = useState<IntegranteFamiliar[]>([]);
  const [fazendas, setFazendas] = useState<Fazenda[]>([]);
  const [selectedFazendaId, setSelectedFazendaId] = useState<string>('TODAS');
  const [contas, setContas] = useState<ContaBancaria[]>([]);
  const [receitas, setReceitas] = useState<Receita[]>([]);
  const [despesas, setDespesas] = useState<Despesa[]>([]);
  const [transferencias, setTransferencias] = useState<Transferencia[]>([]);
  const [recorrencias, setRecorrencias] = useState<Recorrencia[]>([]);
  const [comprasParceladas, setComprasParceladas] = useState<CompraParcelada[]>([]);
  const [cartoes, setCartoes] = useState<CartaoCredito[]>([]);
  const [emprestimos, setEmprestimos] = useState<EmprestimoFinanciamento[]>([]);
  const [operacoes, setOperacoes] = useState<OperacaoFinanceira[]>([]);
  const [auditorias, setAuditorias] = useState<LogAuditoria[]>([]);
  const [encerramentos, setEncerramentos] = useState<EncerramentoMes[]>([]);
  const [categoriasPlanoContas, setCategoriasPlanoContas] = useState<CategoriaPlanoContas[]>([]);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [pedidosCompra, setPedidosCompra] = useState<PedidoCompra[]>([]);
  const [talhoes, setTalhoes] = useState<Talhao[]>([]);
  const [safras, setSafras] = useState<Safra[]>([]);
  const [consumos, setConsumos] = useState<ConsumoInsumo[]>([]);

  const [selectedMemberId, setSelectedMemberId] = useState<string>('TODOS');

  // Evita gravar no banco enquanto ainda estamos carregando os dados da
  // sessão (senão sobrescreveríamos o banco com os arrays vazios iniciais).
  const hydratedRef = useRef(false);

  const aplicarDados = (dados: FamiliaDados, emailLogado: string) => {
    setUsuarios(dados.usuarios || []);
    setIntegrantes(dados.integrantes || []);
    setFazendas(dados.fazendas || []);
    setContas(dados.contas || []);
    setReceitas(dados.receitas || []);
    setDespesas(dados.despesas || []);
    setTransferencias(dados.transferencias || []);
    setRecorrencias(dados.recorrencias || []);
    setComprasParceladas(dados.comprasParceladas || []);
    setCartoes(dados.cartoes || []);
    setEmprestimos(dados.emprestimos || []);
    setOperacoes(dados.operacoes || []);
    setAuditorias(dados.auditorias || []);
    setEncerramentos(dados.encerramentos || []);
    setCategoriasPlanoContas(
      dados.categoriasPlanoContas && dados.categoriasPlanoContas.length > 0
        ? dados.categoriasPlanoContas
        : categoriasPadrao()
    );
    setFornecedores(dados.fornecedores || []);
    setProdutos(dados.produtos || []);
    setPedidosCompra(dados.pedidosCompra || []);
    setTalhoes(dados.talhoes || []);
    setSafras(dados.safras || []);
    setConsumos(dados.consumos || []);
    const meu = (dados.usuarios || []).find(
      (u) => u.emailGoogle.toLowerCase() === emailLogado.toLowerCase()
    );
    setCurrentUser(meu || null);
  };

  // Ao abrir o app, verifica se já existe uma sessão válida (cookie)
  useEffect(() => {
    (async () => {
      const resp = await api.me();
      if (resp.ok && resp.data?.authenticated) {
        setFamiliaId(resp.data.familiaId);
        setNomeFamilia(resp.data.nomeFamilia || '');
        setMinhaEmail(resp.data.email || '');
        setIsMaster(Boolean(resp.data.isMaster));
        setAcessoLiberado(Boolean(resp.data.acessoLiberado));
        setStatusAcesso(resp.data.statusAcesso || 'pendente');
        setAcessoAte(resp.data.acessoAte || null);
        setLimiteUsuarios(resp.data.limiteUsuarios || 1);
    setPrecisaTrocarSenha(Boolean(resp.data.precisaTrocarSenha));
        aplicarDados(resp.data.dados, resp.data.email || '');
        hydratedRef.current = true;
      }
      setAuthLoading(false);
    })();
  }, []);

  // Grava no banco sempre que algo relevante mudar (depois da carga inicial)
  useEffect(() => {
    if (!familiaId || !hydratedRef.current) return;
    const payload: FamiliaDados = {
      usuarios,
      integrantes,
      fazendas,
      contas,
      receitas,
      despesas,
      transferencias,
      recorrencias,
      comprasParceladas,
      cartoes,
      emprestimos,
      operacoes,
      auditorias,
      encerramentos,
      categoriasPlanoContas,
      fornecedores,
      produtos,
      pedidosCompra,
      talhoes,
      safras,
      consumos,
    };
    const t = setTimeout(() => {
      api.salvarFamilia(payload).then((resp) => {
        if (!resp.ok) console.error('Erro ao salvar no banco:', resp.data);
      });
    }, 500); // pequeno debounce para não salvar a cada tecla digitada
    return () => clearTimeout(t);
  }, [
    familiaId,
    usuarios,
    integrantes,
    fazendas,
    contas,
    receitas,
    despesas,
    transferencias,
    recorrencias,
    comprasParceladas,
    cartoes,
    emprestimos,
    operacoes,
    auditorias,
    encerramentos,
    categoriasPlanoContas,
    fornecedores,
    produtos,
    pedidosCompra,
    talhoes,
    safras,
    consumos,
  ]);

  // Helper: Log audit action
  const addAuditLog = (
    acao: LogAuditoria['acao'],
    entidade: string,
    entidadeId: string,
    detalhes: string,
    informacaoAnterior?: string,
    informacaoNova?: string
  ) => {
    const now = new Date();
    const dataHoraStr = `${now.toLocaleDateString('pt-BR')} ${now.toLocaleTimeString('pt-BR')}`;
    const newLog: LogAuditoria = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      usuarioId: currentUser?.id || 'sys',
      usuarioNome: currentUser?.nome || 'Sistema',
      usuarioEmail: currentUser?.emailGoogle || 'sistema@agroflux.com',
      acao,
      entidade,
      entidadeId,
      dataHora: dataHoraStr,
      informacaoAnterior,
      informacaoNova,
      detalhes,
    };
    setAuditorias((prev) => [newLog, ...prev]);
  };

  // ---- Autenticação real (via /api, que fala com o Postgres) ----

  const signUp = async (
    email: string,
    senha: string,
    nomeUsuario: string,
    nomeFamiliaInput: string
  ): Promise<{ success: boolean; message?: string }> => {
    const resp = await api.signUp({ email, senha, nomeUsuario, nomeFamilia: nomeFamiliaInput });
    if (!resp.ok) {
      return { success: false, message: resp.data?.error || 'Não foi possível criar a conta.' };
    }
    setFamiliaId(resp.data.familiaId);
    setNomeFamilia(resp.data.nomeFamilia || '');
    setMinhaEmail(email.trim().toLowerCase());
    setIsMaster(Boolean(resp.data.isMaster));
    setAcessoLiberado(Boolean(resp.data.acessoLiberado));
    setStatusAcesso(resp.data.statusAcesso || 'pendente');
    setAcessoAte(resp.data.acessoAte || null);
    setLimiteUsuarios(resp.data.limiteUsuarios || 1);
    setPrecisaTrocarSenha(Boolean(resp.data.precisaTrocarSenha));
    aplicarDados(resp.data.dados, email);
    hydratedRef.current = true;
    return { success: true };
  };

  const login = async (email: string, senha: string): Promise<{ success: boolean; message?: string }> => {
    const resp = await api.login({ email, senha });
    if (!resp.ok) {
      return { success: false, message: resp.data?.error || 'Não foi possível entrar.' };
    }
    setFamiliaId(resp.data.familiaId);
    setNomeFamilia(resp.data.nomeFamilia || '');
    setMinhaEmail(email.trim().toLowerCase());
    setIsMaster(Boolean(resp.data.isMaster));
    setAcessoLiberado(Boolean(resp.data.acessoLiberado));
    setStatusAcesso(resp.data.statusAcesso || 'pendente');
    setAcessoAte(resp.data.acessoAte || null);
    setLimiteUsuarios(resp.data.limiteUsuarios || 1);
    setPrecisaTrocarSenha(Boolean(resp.data.precisaTrocarSenha));
    aplicarDados(resp.data.dados, email);
    hydratedRef.current = true;
    return { success: true };
  };

  const logout = () => {
    if (currentUser) {
      addAuditLog('APROVACAO', 'UsuarioAutorizado', currentUser.id, `Logout efetuado: ${currentUser.emailGoogle}`);
    }
    hydratedRef.current = false;
    api.logout().finally(() => {
      setFamiliaId(null);
      setCurrentUser(null);
      setMinhaEmail('');
      setPrecisaTrocarSenha(false);
    });
  };

  const convidarUsuario = async (
    nome: string,
    email: string,
    perfil: string,
    integranteId?: string
  ): Promise<{ success: boolean; senhaTemporaria?: string; message?: string }> => {
    const resp = await api.convidarUsuario({ nome, email, perfil, integranteId });
    if (!resp.ok) {
      return { success: false, message: resp.data?.error || 'Não foi possível convidar o usuário.' };
    }
    // Atualiza a lista local com o mesmo registro que o servidor já salvou,
    // sem precisar recarregar tudo.
    setUsuarios((prev) => [...prev, resp.data.usuario]);
    return { success: true, senhaTemporaria: resp.data.senhaTemporaria };
  };

  const trocarSenha = async (
    senhaAtual: string,
    novaSenha: string
  ): Promise<{ success: boolean; message?: string }> => {
    const resp = await api.trocarSenha({ senhaAtual, novaSenha });
    if (!resp.ok) {
      return { success: false, message: resp.data?.error || 'Não foi possível trocar a senha.' };
    }
    // A troca de senha invalida a sessão no servidor (por segurança) — a
    // pessoa precisa logar de novo, já com a senha nova.
    hydratedRef.current = false;
    setFamiliaId(null);
    setCurrentUser(null);
    setMinhaEmail('');
    setPrecisaTrocarSenha(false);
    return { success: true };
  };

  // Dynamic Bank Account Balance Calculation
  // Regra fundamental do AgroFlux:
  // Saldo inicial + receitas pagas/recebidas - despesas pagas por esta conta (não via cartão)
  // + transferências recebidas - transferências enviadas
  const getContaSaldoAtual = (contaId: string): number => {
    const conta = contas.find((c) => c.id === contaId);
    if (!conta) return 0;

    let saldo = conta.saldoInicial;

    // Receitas recebidas nesta conta
    receitas.forEach((r) => {
      if (!r.deletedAt && r.status === 'Recebida' && r.contaId === contaId) {
        saldo += r.valor;
      }
    });

    // Despesas pagas diretamente por esta conta (compras com cartão NÃO abatem aqui até a fatura ser paga)
    despesas.forEach((d) => {
      if (!d.deletedAt && d.status === 'Pago' && d.contaId === contaId && !d.cartaoId) {
        saldo -= d.valor;
      }
    });

    // Transferências
    transferencias.forEach((t) => {
      if (!t.deletedAt) {
        if (t.contaDestinoId === contaId) saldo += t.valor;
        if (t.contaOrigemId === contaId) saldo -= t.valor;
      }
    });

    return saldo;
  };

  // Total Available Balance (Sum across active bank accounts)
  const saldoDisponivelTotal = useMemo(() => {
    return contas
      .filter((c) => c.ativa)
      .reduce((sum, c) => sum + getContaSaldoAtual(c.id), 0);
  }, [contas, receitas, despesas, transferencias]);

  // Total Month Revenues
  const receitasMesTotal = useMemo(() => {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
    return receitas
      .filter((r) => {
        if (r.deletedAt) return false;
        if (selectedMemberId !== 'TODOS' && r.integranteId !== selectedMemberId) return false;
        const comp = r.dataCompetencia.substring(0, 7);
        return comp === currentMonth;
      })
      .reduce((sum, r) => sum + r.valor, 0);
  }, [receitas, selectedMemberId]);

  // Total Month Expenses
  const despesasMesTotal = useMemo(() => {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
    return despesas
      .filter((d) => {
        if (d.deletedAt) return false;
        if (selectedMemberId !== 'TODOS' && d.integranteId !== selectedMemberId) return false;
        const comp = d.dataCompetencia.substring(0, 7);
        return comp === currentMonth;
      })
      .reduce((sum, d) => sum + d.valor, 0);
  }, [despesas, selectedMemberId]);

  // Projected Balance (Available + pending revenue - pending bills - credit card due - loans due this month)
  const saldoProjetadoTotal = useMemo(() => {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;

    const aReceber = receitas
      .filter((r) => !r.deletedAt && (r.status === 'Prevista' || r.status === 'Atrasada'))
      .reduce((sum, r) => sum + r.valor, 0);

    const aPagar = despesas
      .filter((d) => !d.deletedAt && (d.status === 'A pagar' || d.status === 'Atrasado'))
      .reduce((sum, d) => sum + d.valor, 0);

    const parcelasEmprestimosMes = emprestimos
      .filter((e) => e.status === 'Ativo')
      .flatMap((e) => e.parcelas)
      .filter((p) => p.status === 'Pendente' && p.vencimento.substring(0, 7) === currentMonth)
      .reduce((sum, p) => sum + p.valor, 0);

    return saldoDisponivelTotal + aReceber - aPagar - parcelasEmprestimosMes;
  }, [saldoDisponivelTotal, receitas, despesas, emprestimos]);

  // Total Debts (Loans outstanding + credit card purchases unpaid + accounts payable)
  const totalDividas = useMemo(() => {
    const saldoDevedorEmprestimos = emprestimos
      .filter((e) => e.status !== 'Quitado')
      .reduce((sum, e) => sum + e.saldoDevedor, 0);

    const contasAPagar = despesas
      .filter((d) => !d.deletedAt && d.status !== 'Pago' && d.status !== 'Cancelado')
      .reduce((sum, d) => sum + d.valor, 0);

    const operacoesAtivas = operacoes
      .filter((o) => o.status === 'Ativa')
      .reduce((sum, o) => sum + o.valorTotal, 0);

    return saldoDevedorEmprestimos + contasAPagar + operacoesAtivas;
  }, [emprestimos, despesas, operacoes]);

  // Net Financial Worth (Ativos financeiros - Dívidas financeiras)
  const patrimonioLiquidoTotal = useMemo(() => {
    const aReceberTotal = receitas
      .filter((r) => !r.deletedAt && r.status !== 'Recebida' && r.status !== 'Cancelada')
      .reduce((sum, r) => sum + r.valor, 0);

    const totalAtivos = saldoDisponivelTotal + aReceberTotal;
    return totalAtivos - totalDividas;
  }, [saldoDisponivelTotal, receitas, totalDividas]);

  // CRUD Actions
  const addReceita = (item: Omit<Receita, 'id' | 'criadoEm' | 'criadoPor'>) => {
    const newId = `rec-${Date.now()}`;
    const newRec: Receita = {
      ...item,
      id: newId,
      criadoPor: currentUser?.nome || 'Administrador',
      criadoEm: new Date().toISOString().split('T')[0],
    };
    setReceitas((prev) => [newRec, ...prev]);
    addAuditLog(
      'CRIAR',
      'Receita',
      newId,
      `Nova receita: "${newRec.descricao}" no valor de R$ ${newRec.valor.toLocaleString('pt-BR')}`
    );
  };

  const updateReceita = (id: string, updateData: Partial<Receita>) => {
    setReceitas((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          const updated = { ...r, ...updateData };
          addAuditLog(
            'EDITAR',
            'Receita',
            id,
            `Atualizada receita: "${updated.descricao}"`,
            JSON.stringify(r),
            JSON.stringify(updated)
          );
          return updated;
        }
        return r;
      })
    );
  };

  const deleteReceita = (id: string) => {
    setReceitas((prev) =>
      prev.map((r) => (r.id === id ? { ...r, deletedAt: new Date().toISOString() } : r))
    );
    addAuditLog('EXCLUIR', 'Receita', id, `Receita marcada como excluída (soft delete).`);
  };

  const marcarReceitaRecebida = (id: string, dataRecebimento?: string, contaId?: string) => {
    setReceitas((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          const updated: Receita = {
            ...r,
            status: 'Recebida',
            dataRecebida: dataRecebimento || new Date().toISOString().split('T')[0],
            contaId: contaId || r.contaId,
          };
          addAuditLog(
            'RECEBIMENTO',
            'Receita',
            id,
            `Receita "${r.descricao}" marcada como RECEBIDA. Valor: R$ ${r.valor.toLocaleString('pt-BR')}`
          );
          return updated;
        }
        return r;
      })
    );
  };

  const addDespesa = (item: Omit<Despesa, 'id' | 'criadoEm' | 'criadoPor'>) => {
    const newId = `desp-${Date.now()}`;
    const newDesp: Despesa = {
      ...item,
      id: newId,
      criadoPor: currentUser?.nome || 'Administrador',
      criadoEm: new Date().toISOString().split('T')[0],
    };
    setDespesas((prev) => [newDesp, ...prev]);
    addAuditLog(
      'CRIAR',
      'Despesa',
      newId,
      `Nova despesa: "${newDesp.descricao}" de R$ ${newDesp.valor.toLocaleString('pt-BR')}`
    );
  };

  const updateDespesa = (id: string, updateData: Partial<Despesa>) => {
    setDespesas((prev) =>
      prev.map((d) => {
        if (d.id === id) {
          const updated = { ...d, ...updateData };
          addAuditLog(
            'EDITAR',
            'Despesa',
            id,
            `Atualizada despesa: "${updated.descricao}"`,
            JSON.stringify(d),
            JSON.stringify(updated)
          );
          return updated;
        }
        return d;
      })
    );
  };

  const deleteDespesa = (id: string) => {
    setDespesas((prev) =>
      prev.map((d) => (d.id === id ? { ...d, deletedAt: new Date().toISOString() } : d))
    );
    addAuditLog('EXCLUIR', 'Despesa', id, `Despesa marcada como excluída (soft delete).`);
  };

  const marcarDespesaPaga = (id: string, dataPagamento?: string, contaId?: string) => {
    setDespesas((prev) =>
      prev.map((d) => {
        if (d.id === id) {
          const updated: Despesa = {
            ...d,
            status: 'Pago',
            dataPagamento: dataPagamento || new Date().toISOString().split('T')[0],
            contaId: contaId || d.contaId,
          };
          addAuditLog(
            'PAGAMENTO',
            'Despesa',
            id,
            `Despesa "${d.descricao}" marcada como PAGA. Valor: R$ ${d.valor.toLocaleString('pt-BR')}`
          );
          return updated;
        }
        return d;
      })
    );
  };

  // Usada quando a despesa vai ser paga no cartão em vez de sair direto da
  // conta: fica "A pagar" até a fatura do cartão ser quitada (é lá que
  // marcarDespesaPaga acontece de fato, via pagarFaturaCartao).
  const atribuirCartaoDespesa = (id: string, cartaoId: string) => {
    setDespesas((prev) =>
      prev.map((d) => {
        if (d.id === id) {
          addAuditLog('EDITAR', 'Despesa', id, `Despesa "${d.descricao}" atribuída ao cartão para pagamento na próxima fatura.`);
          return { ...d, cartaoId, contaId: undefined };
        }
        return d;
      })
    );
  };

  const addTransferencia = (transf: Omit<Transferencia, 'id' | 'criadoEm' | 'criadoPor'>) => {
    const newId = `transf-${Date.now()}`;
    const newTransf: Transferencia = {
      ...transf,
      id: newId,
      criadoPor: currentUser?.nome || 'Administrador',
      criadoEm: new Date().toISOString().split('T')[0],
    };
    setTransferencias((prev) => [newTransf, ...prev]);
    const origem = contas.find((c) => c.id === transf.contaOrigemId)?.nomePersonalizado || 'Origem';
    const destino = contas.find((c) => c.id === transf.contaDestinoId)?.nomePersonalizado || 'Destino';
    addAuditLog(
      'CRIAR',
      'Transferencia',
      newId,
      `Transferência de R$ ${transf.valor.toLocaleString('pt-BR')} de [${origem}] para [${destino}]`
    );
  };

  const adjustContaSaldo = (contaId: string, novoSaldo: number, justificativa: string) => {
    const conta = contas.find((c) => c.id === contaId);
    if (!conta) return;
    const saldoAnterior = getContaSaldoAtual(contaId);
    // Adjust saldoInicial by the difference
    const diff = novoSaldo - saldoAnterior;
    setContas((prev) =>
      prev.map((c) => (c.id === contaId ? { ...c, saldoInicial: c.saldoInicial + diff } : c))
    );
    addAuditLog(
      'AJUSTE_SALDO',
      'ContaBancaria',
      contaId,
      `Ajuste manual de saldo na conta "${conta.nomePersonalizado}". Justificativa: ${justificativa}`,
      `R$ ${saldoAnterior.toLocaleString('pt-BR')}`,
      `R$ ${novoSaldo.toLocaleString('pt-BR')}`
    );
  };

  const addConta = (novaConta: Omit<ContaBancaria, 'id'>) => {
    const newId = `cta-${Date.now()}`;
    const c: ContaBancaria = { ...novaConta, id: newId };
    setContas((prev) => [...prev, c]);
    addAuditLog('CRIAR', 'ContaBancaria', newId, `Nova conta cadastrada: "${c.nomePersonalizado}"`);
  };

  const updateConta = (id: string, data: Partial<ContaBancaria>) => {
    setContas((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          const updated = { ...c, ...data };
          addAuditLog('EDITAR', 'ContaBancaria', id, `Conta atualizada: "${updated.nomePersonalizado}"`);
          return updated;
        }
        return c;
      })
    );
  };

  const addCartao = (card: Omit<CartaoCredito, 'id'>) => {
    const newId = `card-${Date.now()}`;
    const newCard: CartaoCredito = { ...card, id: newId };
    setCartoes((prev) => [...prev, newCard]);
    addAuditLog('CRIAR', 'CartaoCredito', newId, `Novo cartão cadastrado: "${newCard.nome}"`);
  };

  const updateCartao = (id: string, data: Partial<CartaoCredito>) => {
    setCartoes((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          const updated = { ...c, ...data };
          addAuditLog('EDITAR', 'CartaoCredito', id, `Cartão atualizado: "${updated.nome}"`);
          return updated;
        }
        return c;
      })
    );
  };

  const pagarFaturaCartao = (cartaoId: string, valor: number, contaId: string, mesAno: string) => {
    const cartao = cartoes.find((c) => c.id === cartaoId);
    const conta = contas.find((c) => c.id === contaId);
    // Mark card expenses in this month as paid
    setDespesas((prev) =>
      prev.map((d) => {
        if (d.cartaoId === cartaoId && d.status === 'A pagar' && d.dataVencimento.startsWith(mesAno)) {
          return {
            ...d,
            status: 'Pago',
            dataPagamento: new Date().toISOString().split('T')[0],
            contaId: contaId,
          };
        }
        return d;
      })
    );

    addAuditLog(
      'PAGAMENTO',
      'CartaoCredito',
      cartaoId,
      `Pagamento de fatura ${mesAno} do cartão "${cartao?.nome}" no valor de R$ ${valor.toLocaleString('pt-BR')} pela conta "${conta?.nomePersonalizado}"`
    );
  };

  // Automated Installment Generator (1/N ... N/N)
  const addCompraParcelada = (compraData: {
    descricao: string;
    categoria: string;
    integranteId: string;
    cartaoId?: string;
    contaId?: string;
    valorTotal: number;
    qtdParcelas: number;
    dataPrimeiraParcela: string;
    estabelecimento?: string;
    classificacao?: 'FIXA' | 'VARIAVEL';
  }) => {
    const compraId = `compra-${Date.now()}`;
    const valorParcela = parseFloat((compraData.valorTotal / compraData.qtdParcelas).toFixed(2));
    const newCompra: CompraParcelada = {
      id: compraId,
      descricao: compraData.descricao,
      categoria: compraData.categoria,
      integranteId: compraData.integranteId,
      cartaoId: compraData.cartaoId,
      contaId: compraData.contaId,
      valorTotal: compraData.valorTotal,
      qtdParcelas: compraData.qtdParcelas,
      valorParcela,
      dataPrimeiraParcela: compraData.dataPrimeiraParcela,
      estabelecimento: compraData.estabelecimento,
      criadoEm: new Date().toISOString().split('T')[0],
    };

    setComprasParceladas((prev) => [newCompra, ...prev]);

    // Automatically generate individual despesas: 1/N, 2/N, ... N/N
    const novasDespesas: Despesa[] = [];
    const baseDate = new Date(compraData.dataPrimeiraParcela);

    for (let i = 1; i <= compraData.qtdParcelas; i++) {
      const dDate = new Date(baseDate);
      dDate.setMonth(dDate.getMonth() + (i - 1));
      const vencimentoStr = dDate.toISOString().split('T')[0];

      novasDespesas.push({
        id: `desp-${compraId}-parc-${i}`,
        descricao: `${compraData.descricao} (${i}/${compraData.qtdParcelas})`,
        categoria: compraData.categoria,
        integranteId: compraData.integranteId,
        cartaoId: compraData.cartaoId,
        contaId: compraData.contaId,
        faturaMesAno: vencimentoStr.substring(0, 7),
        valor: valorParcela,
        dataCompetencia: vencimentoStr,
        dataVencimento: vencimentoStr,
        status: 'A pagar',
        formaPagamento: compraData.cartaoId ? 'Cartão de Crédito' : 'Boleto/Débito',
        recorrente: false,
        parcelada: true,
        compraParceladaId: compraId,
        numeroParcela: i,
        totalParcelas: compraData.qtdParcelas,
        classificacao: compraData.classificacao || 'VARIAVEL',
        fornecedor: compraData.estabelecimento,
        observacao: `Parcela ${i} de ${compraData.qtdParcelas} da compra "${compraData.descricao}"`,
        criadoPor: currentUser?.nome || 'Administrador',
        criadoEm: new Date().toISOString().split('T')[0],
      });
    }

    setDespesas((prev) => [...novasDespesas, ...prev]);
    addAuditLog(
      'CRIAR',
      'CompraParcelada',
      compraId,
      `Compra parcelada gerada automaticamente: "${compraData.descricao}" em ${compraData.qtdParcelas}x de R$ ${valorParcela.toLocaleString('pt-BR')}`
    );
  };

  const addEmprestimo = (emp: Omit<EmprestimoFinanciamento, 'id'>) => {
    const newId = `emp-${Date.now()}`;
    const newEmp: EmprestimoFinanciamento = { ...emp, id: newId };
    setEmprestimos((prev) => [newEmp, ...prev]);
    addAuditLog(
      'CRIAR',
      'Emprestimo',
      newId,
      `Contratação de operação/empréstimo: "${newEmp.nomeOperacao}" no valor de R$ ${newEmp.valorContratado.toLocaleString('pt-BR')}`
    );
  };

  const pagarParcelaEmprestimo = (emprestimoId: string, numeroParcela: number, contaId?: string) => {
    setEmprestimos((prev) =>
      prev.map((e) => {
        if (e.id === emprestimoId) {
          const parcelasAtualizadas = e.parcelas.map((p) =>
            p.numero === numeroParcela
              ? {
                  ...p,
                  status: 'Paga' as const,
                  dataPagamento: new Date().toISOString().split('T')[0],
                  valorPago: p.valor,
                }
              : p
          );
          const parcela = e.parcelas.find((p) => p.numero === numeroParcela);
          const valorPago = parcela ? parcela.valor : 0;
          const novoSaldoDevedor = Math.max(0, e.saldoDevedor - valorPago);
          const quitado = novoSaldoDevedor === 0 || parcelasAtualizadas.every((p) => p.status === 'Paga');

          addAuditLog(
            'PAGAMENTO',
            'Emprestimo',
            emprestimoId,
            `Parcela ${numeroParcela} paga no valor de R$ ${valorPago.toLocaleString('pt-BR')}. Novo saldo devedor: R$ ${novoSaldoDevedor.toLocaleString('pt-BR')}`
          );

          return {
            ...e,
            saldoDevedor: novoSaldoDevedor,
            status: quitado ? 'Quitado' : e.status,
            parcelas: parcelasAtualizadas,
          };
        }
        return e;
      })
    );
  };

  const updateParcelaDataEmprestimo = (
    emprestimoId: string,
    numeroParcela: number,
    novaData: string,
    novoValor?: number
  ) => {
    setEmprestimos((prev) =>
      prev.map((e) => {
        if (e.id === emprestimoId) {
          const parcelasAtualizadas = e.parcelas.map((p) => {
            if (p.numero === numeroParcela) {
              return {
                ...p,
                vencimento: novaData,
                valor: novoValor !== undefined ? novoValor : p.valor,
              };
            }
            return p;
          });

          addAuditLog(
            'EDITAR',
            'Emprestimo',
            emprestimoId,
            `Vencimento da Parcela ${numeroParcela} da operação "${e.nomeOperacao}" atualizado para ${novaData}${novoValor ? ` (Valor R$ ${novoValor.toLocaleString('pt-BR')})` : ''}`
          );

          return {
            ...e,
            parcelas: parcelasAtualizadas,
          };
        }
        return e;
      })
    );
  };

  const amortizarEmprestimo = (emprestimoId: string, valorAmortizado: number, contaId?: string) => {
    setEmprestimos((prev) =>
      prev.map((e) => {
        if (e.id === emprestimoId) {
          const novoSaldo = Math.max(0, e.saldoDevedor - valorAmortizado);
          addAuditLog(
            'PAGAMENTO',
            'Emprestimo',
            emprestimoId,
            `Amortização extraordinária de R$ ${valorAmortizado.toLocaleString('pt-BR')}. Saldo restante: R$ ${novoSaldo.toLocaleString('pt-BR')}`
          );
          return {
            ...e,
            saldoDevedor: novoSaldo,
            status: novoSaldo === 0 ? 'Quitado' : e.status,
          };
        }
        return e;
      })
    );
  };

  const quitarEmprestimo = (emprestimoId: string, contaId?: string) => {
    setEmprestimos((prev) =>
      prev.map((e) => {
        if (e.id === emprestimoId) {
          addAuditLog(
            'PAGAMENTO',
            'Emprestimo',
            emprestimoId,
            `Quitação total da operação "${e.nomeOperacao}". Saldo quitado: R$ ${e.saldoDevedor.toLocaleString('pt-BR')}`
          );
          return {
            ...e,
            saldoDevedor: 0,
            status: 'Quitado',
            parcelas: e.parcelas.map((p) => ({ ...p, status: 'Paga' })),
          };
        }
        return e;
      })
    );
  };

  const addOperacao = (op: Omit<OperacaoFinanceira, 'id'>) => {
    const newId = `op-${Date.now()}`;
    const newOp: OperacaoFinanceira = { ...op, id: newId };
    setOperacoes((prev) => [newOp, ...prev]);
    addAuditLog(
      'CRIAR',
      'OperacaoFinanceira',
      newId,
      `Nova operação bancária: "${newOp.tipo}" - ${newOp.instituicao} no valor de R$ ${newOp.valorTotal.toLocaleString('pt-BR')}`
    );
  };

  const updateOperacao = (id: string, opData: Partial<OperacaoFinanceira>) => {
    setOperacoes((prev) =>
      prev.map((o) => (o.id === id ? { ...o, ...opData } : o))
    );
    addAuditLog('EDITAR', 'OperacaoFinanceira', id, `Operação financeira atualizada.`);
  };

  const addIntegrante = (int: Omit<IntegranteFamiliar, 'id'>) => {
    const newId = `int-${Date.now()}`;
    const newInt: IntegranteFamiliar = { ...int, id: newId };
    setIntegrantes((prev) => [...prev, newInt]);
    addAuditLog('CRIAR', 'IntegranteFamiliar', newId, `Novo integrante cadastrado: "${newInt.nome} (${newInt.apelido})"`);
  };

  const updateIntegrante = (id: string, data: Partial<IntegranteFamiliar>) => {
    setIntegrantes((prev) =>
      prev.map((i) => (i.id === id ? { ...i, ...data } : i))
    );
    addAuditLog('EDITAR', 'IntegranteFamiliar', id, `Dados do integrante atualizados.`);
  };

  const addRecorrencia = (rec: Omit<Recorrencia, 'id'>) => {
    const newId = `rec-${Date.now()}`;
    const newRec: Recorrencia = { ...rec, id: newId };
    setRecorrencias((prev) => [...prev, newRec]);
    addAuditLog('CRIAR', 'Recorrencia', newId, `Nova recorrência criada: "${newRec.descricao}"`);
  };

  const updateRecorrencia = (id: string, data: Partial<Recorrencia>) => {
    setRecorrencias((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...data } : r))
    );
    addAuditLog('EDITAR', 'Recorrencia', id, `Recorrência atualizada.`);
  };

  // Administration User Management
  const aprovarUsuario = (id: string, perfil: UserProfile, customPermissoes?: Partial<UserPermissions>) => {
    setUsuarios((prev) =>
      prev.map((u) => {
        if (u.id === id) {
          const defaultPerms: UserPermissions = {
            visualizarFinanceiro: true,
            lancarDespesas: perfil !== 'VISUALIZACAO',
            lancarReceitas: perfil !== 'VISUALIZACAO',
            editarLancamentos: perfil !== 'VISUALIZACAO',
            excluirLancamentos: perfil === 'ADMINISTRADOR',
            visualizarBancos: true,
            alterarBancos: perfil === 'ADMINISTRADOR',
            visualizarCartoes: true,
            administrarUsuarios: perfil === 'ADMINISTRADOR',
          };
          const perms = { ...defaultPerms, ...customPermissoes };
          const updated: UsuarioAutorizado = {
            ...u,
            status: 'Ativo',
            perfil,
            permissoes: perms,
            dataAutorizacao: new Date().toISOString().split('T')[0],
            atualizadoEm: new Date().toISOString().split('T')[0],
          };
          addAuditLog(
            'APROVACAO',
            'UsuarioAutorizado',
            id,
            `Usuário "${u.nome}" (${u.emailGoogle}) LIBERADO com perfil ${perfil}.`
          );
          return updated;
        }
        return u;
      })
    );
  };

  const bloquearUsuario = (id: string) => {
    setUsuarios((prev) =>
      prev.map((u) => {
        if (u.id === id) {
          addAuditLog('BLOQUEIO', 'UsuarioAutorizado', id, `Usuário "${u.nome}" foi BLOQUEADO.`);
          return { ...u, status: 'Bloqueado', atualizadoEm: new Date().toISOString().split('T')[0] };
        }
        return u;
      })
    );
  };

  const removerUsuario = async (id: string): Promise<{ success: boolean; message?: string }> => {
    const user = usuarios.find((u) => u.id === id);
    const resp = await api.excluirUsuario(id);
    if (!resp.ok) {
      return { success: false, message: resp.data?.error || 'Não foi possível excluir esse usuário.' };
    }
    setUsuarios((prev) => prev.filter((u) => u.id !== id));
    addAuditLog(
      'EXCLUIR',
      'UsuarioAutorizado',
      id,
      `Acesso do usuário "${user?.nome}" (${user?.emailGoogle}) foi removido permanentemente.`
    );
    return { success: true };
  };

  const atualizarPerfilUsuario = (id: string, perfil: UserProfile) => {
    setUsuarios((prev) =>
      prev.map((u) => {
        if (u.id === id) {
          const perms: UserPermissions = {
            visualizarFinanceiro: true,
            lancarDespesas: perfil !== 'VISUALIZACAO',
            lancarReceitas: perfil !== 'VISUALIZACAO',
            editarLancamentos: perfil !== 'VISUALIZACAO',
            excluirLancamentos: perfil === 'ADMINISTRADOR',
            visualizarBancos: true,
            alterarBancos: perfil === 'ADMINISTRADOR',
            visualizarCartoes: true,
            administrarUsuarios: perfil === 'ADMINISTRADOR',
          };
          addAuditLog(
            'PERMISSAO',
            'UsuarioAutorizado',
            id,
            `Perfil do usuário "${u.nome}" alterado para ${perfil}`
          );
          return { ...u, perfil, permissoes: perms, atualizadoEm: new Date().toISOString().split('T')[0] };
        }
        return u;
      })
    );
  };

  const atualizarPermissoesUsuario = (id: string, permissoes: UserPermissions) => {
    setUsuarios((prev) =>
      prev.map((u) => {
        if (u.id === id) {
          addAuditLog(
            'PERMISSAO',
            'UsuarioAutorizado',
            id,
            `Permissões individuais atualizadas para "${u.nome}".`
          );
          return { ...u, permissoes, atualizadoEm: new Date().toISOString().split('T')[0] };
        }
        return u;
      })
    );
  };

  // Fazendas Management
  const addFazenda = (fazenda: Omit<Fazenda, 'id'>) => {
    const nova: Fazenda = {
      ...fazenda,
      id: `faz-${Date.now()}`,
    };
    setFazendas((prev) => [...prev, nova]);
    addAuditLog('CRIAR', 'Fazenda', nova.id, `Nova fazenda cadastrada: ${nova.nome} (${nova.municipio}/${nova.uf})`);
  };

  const updateFazenda = (id: string, data: Partial<Fazenda>) => {
    setFazendas((prev) =>
      prev.map((f) => (f.id === id ? { ...f, ...data } : f))
    );
    addAuditLog('EDITAR', 'Fazenda', id, `Dados da fazenda atualizados.`);
  };

  const deleteFazenda = (id: string) => {
    const found = fazendas.find((f) => f.id === id);
    setFazendas((prev) => prev.filter((f) => f.id !== id));
    addAuditLog('EXCLUIR', 'Fazenda', id, `Fazenda excluída: ${found?.nome}`);
  };

  const toggleFazendaAtiva = (id: string) => {
    setFazendas((prev) =>
      prev.map((f) => {
        if (f.id === id) {
          const novaAtiva = !f.ativa;
          addAuditLog('EDITAR', 'Fazenda', id, `Fazenda ${f.nome} ${novaAtiva ? 'ativada' : 'inativada'}.`);
          return { ...f, ativa: novaAtiva };
        }
        return f;
      })
    );
  };

  // Plano de Contas (categorias de despesa/receita)
  const addCategoriaPlanoContas = (categoria: Omit<CategoriaPlanoContas, 'id' | 'criadoEm'>) => {
    const nova: CategoriaPlanoContas = {
      ...categoria,
      id: `cat-${Date.now()}`,
      criadoEm: new Date().toISOString().split('T')[0],
    };
    setCategoriasPlanoContas((prev) => [...prev, nova]);
    addAuditLog('CRIAR', 'CategoriaPlanoContas', nova.id, `Nova categoria de ${nova.tipo.toLowerCase()}: ${nova.nome}`);
  };

  const toggleCategoriaAtiva = (id: string) => {
    setCategoriasPlanoContas((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ativa: !c.ativa } : c))
    );
  };

  const updateCategoriaPlanoContas = (id: string, data: Partial<CategoriaPlanoContas>) => {
    setCategoriasPlanoContas((prev) => prev.map((c) => (c.id === id ? { ...c, ...data } : c)));
    addAuditLog('EDITAR', 'CategoriaPlanoContas', id, 'Categoria atualizada.');
  };

  const removerCategoriaPlanoContas = (id: string) => {
    const found = categoriasPlanoContas.find((c) => c.id === id);
    setCategoriasPlanoContas((prev) => prev.filter((c) => c.id !== id));
    addAuditLog('EXCLUIR', 'CategoriaPlanoContas', id, `Categoria excluída: ${found?.nome}`);
  };

  // Compras & Estoque (Fase 1)
  const addFornecedor = (f: Omit<Fornecedor, 'id' | 'criadoEm'>) => {
    const novo: Fornecedor = { ...f, id: `forn-${Date.now()}`, criadoEm: new Date().toISOString().split('T')[0] };
    setFornecedores((prev) => [...prev, novo]);
    addAuditLog('CRIAR', 'Fornecedor', novo.id, `Novo fornecedor cadastrado: ${novo.nome}`);
  };

  const updateFornecedor = (id: string, data: Partial<Fornecedor>) => {
    setFornecedores((prev) => prev.map((f) => (f.id === id ? { ...f, ...data } : f)));
    addAuditLog('EDITAR', 'Fornecedor', id, 'Dados do fornecedor atualizados.');
  };

  const toggleFornecedorAtivo = (id: string) => {
    setFornecedores((prev) => prev.map((f) => (f.id === id ? { ...f, ativo: !f.ativo } : f)));
  };

  const removerFornecedor = (id: string): { success: boolean; message?: string } => {
    if (pedidosCompra.some((p) => p.fornecedorId === id)) {
      return { success: false, message: 'Esse fornecedor já tem pedidos de compra vinculados. Desative em vez de excluir.' };
    }
    const found = fornecedores.find((f) => f.id === id);
    setFornecedores((prev) => prev.filter((f) => f.id !== id));
    addAuditLog('EXCLUIR', 'Fornecedor', id, `Fornecedor excluído: ${found?.nome}`);
    return { success: true };
  };

  const addProduto = (p: Omit<Produto, 'id' | 'criadoEm' | 'estoqueAtual'>) => {
    const novo: Produto = {
      ...p,
      id: `prod-${Date.now()}`,
      criadoEm: new Date().toISOString().split('T')[0],
      estoqueAtual: 0,
    };
    setProdutos((prev) => [...prev, novo]);
    addAuditLog('CRIAR', 'Produto', novo.id, `Novo produto no catálogo: ${novo.nome} (${novo.categoria})`);
  };

  const updateProduto = (id: string, data: Partial<Produto>) => {
    setProdutos((prev) => prev.map((p) => (p.id === id ? { ...p, ...data } : p)));
    addAuditLog('EDITAR', 'Produto', id, 'Dados do produto atualizados.');
  };

  const toggleProdutoAtivo = (id: string) => {
    setProdutos((prev) => prev.map((p) => (p.id === id ? { ...p, ativo: !p.ativo } : p)));
  };

  const removerProduto = (id: string): { success: boolean; message?: string } => {
    const produto = produtos.find((p) => p.id === id);
    if (produto && produto.estoqueAtual > 0) {
      return { success: false, message: 'Esse produto ainda tem estoque. Zere o estoque ou desative em vez de excluir.' };
    }
    if (pedidosCompra.some((p) => p.itens.some((it) => it.produtoId === id))) {
      return { success: false, message: 'Esse produto já foi usado em algum pedido de compra. Desative em vez de excluir.' };
    }
    if (consumos.some((c) => c.produtoId === id)) {
      return { success: false, message: 'Esse produto já tem consumo registrado. Desative em vez de excluir.' };
    }
    setProdutos((prev) => prev.filter((p) => p.id !== id));
    addAuditLog('EXCLUIR', 'Produto', id, `Produto excluído: ${produto?.nome}`);
    return { success: true };
  };

  const addPedidoCompra = (p: Omit<PedidoCompra, 'id' | 'criadoEm' | 'valorTotal' | 'status'>) => {
    const valorTotal = p.itens.reduce((sum, item) => sum + item.quantidade * item.valorUnitario, 0);
    const novo: PedidoCompra = {
      ...p,
      id: `ped-${Date.now()}`,
      criadoEm: new Date().toISOString().split('T')[0],
      valorTotal,
      status: 'Pendente',
    };
    setPedidosCompra((prev) => [novo, ...prev]);
    const fornecedorNome = fornecedores.find((f) => f.id === p.fornecedorId)?.nome || '';
    addAuditLog(
      'CRIAR',
      'PedidoCompra',
      novo.id,
      `Novo pedido de compra para ${fornecedorNome}, valor total R$ ${valorTotal.toLocaleString('pt-BR')}`
    );
  };

  const cancelarPedidoCompra = (id: string) => {
    setPedidosCompra((prev) => prev.map((p) => (p.id === id ? { ...p, status: 'Cancelado' as const } : p)));
    addAuditLog('EDITAR', 'PedidoCompra', id, 'Pedido de compra cancelado.');
  };

  // Fase 2: registrar entrega de um pedido (parcial ou total) e atualizar o estoque
  const registrarEntregaPedido = (pedidoId: string, entregas: { produtoId: string; quantidade: number }[]) => {
    const pedido = pedidosCompra.find((p) => p.id === pedidoId);
    if (!pedido) return;

    setProdutos((prev) =>
      prev.map((prod) => {
        const entrega = entregas.find((e) => e.produtoId === prod.id);
        if (!entrega || entrega.quantidade <= 0) return prod;
        return { ...prod, estoqueAtual: prod.estoqueAtual + entrega.quantidade };
      })
    );

    setPedidosCompra((prev) =>
      prev.map((p) => {
        if (p.id !== pedidoId) return p;
        const novosItens = p.itens.map((item) => {
          const entrega = entregas.find((e) => e.produtoId === item.produtoId);
          if (!entrega) return item;
          return { ...item, quantidadeRecebida: Math.min(item.quantidade, item.quantidadeRecebida + entrega.quantidade) };
        });
        const totalPedido = novosItens.reduce((sum, i) => sum + i.quantidade, 0);
        const totalRecebido = novosItens.reduce((sum, i) => sum + i.quantidadeRecebida, 0);
        const novoStatus: PedidoCompra['status'] =
          totalRecebido >= totalPedido ? 'Entregue' : totalRecebido > 0 ? 'Parcialmente entregue' : p.status;
        return { ...p, itens: novosItens, status: novoStatus };
      })
    );

    addAuditLog('RECEBIMENTO', 'PedidoCompra', pedidoId, 'Entrega registrada, estoque atualizado.');
  };

  // Fase 3: gerar as Contas a Pagar (parceladas ou não) referentes a um pedido
  const gerarPagamentoPedido = (pedidoId: string, parcelas: { valor: number; vencimento: string }[]) => {
    const pedido = pedidosCompra.find((p) => p.id === pedidoId);
    if (!pedido) return;
    const fornecedor = fornecedores.find((f) => f.id === pedido.fornecedorId);
    const primeiroProduto = produtos.find((pr) => pr.id === pedido.itens[0]?.produtoId);

    parcelas.forEach((parcela, idx) => {
      addDespesa({
        descricao: `Pedido de compra${fornecedor ? ' - ' + fornecedor.nome : ''}${parcelas.length > 1 ? ` (${idx + 1}/${parcelas.length})` : ''}`,
        categoria: primeiroProduto?.categoria || 'Produção Rural',
        integranteId: integrantes[0]?.id || '',
        fazendaId: pedido.fazendaId,
        valor: parcela.valor,
        dataCompetencia: pedido.dataPedido,
        dataVencimento: parcela.vencimento,
        status: 'A pagar',
        fornecedor: fornecedor?.nome,
        pedidoCompraId: pedido.id,
        parcelaAtual: parcelas.length > 1 ? idx + 1 : undefined,
        totalParcelas: parcelas.length > 1 ? parcelas.length : undefined,
      } as Omit<Despesa, 'id' | 'criadoEm' | 'criadoPor'>);
    });

    setPedidosCompra((prev) => prev.map((p) => (p.id === pedidoId ? { ...p, pagamentoGerado: true } : p)));
    addAuditLog(
      'CRIAR',
      'PedidoCompra',
      pedidoId,
      `Gerada${parcelas.length > 1 ? 's' : ''} ${parcelas.length} conta(s) a pagar referente(s) ao pedido.`
    );
  };

  // Fase 4: Talhões, Safras e Consumo
  const addTalhao = (t: Omit<Talhao, 'id' | 'criadoEm'>) => {
    const novo: Talhao = { ...t, id: `tal-${Date.now()}`, criadoEm: new Date().toISOString().split('T')[0] };
    setTalhoes((prev) => [...prev, novo]);
    addAuditLog('CRIAR', 'Talhao', novo.id, `Novo talhão cadastrado: ${novo.nome}`);
  };

  const updateTalhao = (id: string, data: Partial<Talhao>) => {
    setTalhoes((prev) => prev.map((t) => (t.id === id ? { ...t, ...data } : t)));
    addAuditLog('EDITAR', 'Talhao', id, 'Dados do talhão atualizados.');
  };

  const toggleTalhaoAtivo = (id: string) => {
    setTalhoes((prev) => prev.map((t) => (t.id === id ? { ...t, ativo: !t.ativo } : t)));
  };

  const removerTalhao = (id: string): { success: boolean; message?: string } => {
    if (consumos.some((c) => c.talhaoId === id)) {
      return { success: false, message: 'Esse talhão já tem consumo de insumo registrado. Desative em vez de excluir.' };
    }
    const found = talhoes.find((t) => t.id === id);
    setTalhoes((prev) => prev.filter((t) => t.id !== id));
    addAuditLog('EXCLUIR', 'Talhao', id, `Talhão excluído: ${found?.nome}`);
    return { success: true };
  };

  const addSafra = (s: Omit<Safra, 'id' | 'criadoEm'>) => {
    const nova: Safra = { ...s, id: `saf-${Date.now()}`, criadoEm: new Date().toISOString().split('T')[0] };
    setSafras((prev) => [...prev, nova]);
    addAuditLog('CRIAR', 'Safra', nova.id, `Nova safra cadastrada: ${nova.nome}`);
  };

  const updateSafra = (id: string, data: Partial<Safra>) => {
    setSafras((prev) => prev.map((s) => (s.id === id ? { ...s, ...data } : s)));
    addAuditLog('EDITAR', 'Safra', id, 'Dados da safra atualizados.');
  };

  const toggleSafraAtiva = (id: string) => {
    setSafras((prev) => prev.map((s) => (s.id === id ? { ...s, ativa: !s.ativa } : s)));
  };

  const removerSafra = (id: string): { success: boolean; message?: string } => {
    if (consumos.some((c) => c.safraId === id)) {
      return { success: false, message: 'Essa safra já tem consumo de insumo registrado. Desative em vez de excluir.' };
    }
    const found = safras.find((s) => s.id === id);
    setSafras((prev) => prev.filter((s) => s.id !== id));
    addAuditLog('EXCLUIR', 'Safra', id, `Safra excluída: ${found?.nome}`);
    return { success: true };
  };

  const registrarConsumoInsumo = (c: Omit<ConsumoInsumo, 'id' | 'criadoEm'>): { success: boolean; message?: string } => {
    const produto = produtos.find((p) => p.id === c.produtoId);
    if (!produto) return { success: false, message: 'Produto não encontrado.' };
    if (c.quantidade > produto.estoqueAtual) {
      return {
        success: false,
        message: `Estoque insuficiente: tem ${produto.estoqueAtual} ${produto.unidadeMedida}, tentando usar ${c.quantidade}.`,
      };
    }
    const novo: ConsumoInsumo = { ...c, id: `cons-${Date.now()}`, criadoEm: new Date().toISOString().split('T')[0] };
    setConsumos((prev) => [novo, ...prev]);
    setProdutos((prev) =>
      prev.map((p) => (p.id === c.produtoId ? { ...p, estoqueAtual: p.estoqueAtual - c.quantidade } : p))
    );
    addAuditLog(
      'EDITAR',
      'Produto',
      c.produtoId,
      `Consumo de ${c.quantidade} ${produto.unidadeMedida} de ${produto.nome} registrado.`
    );
    return { success: true };
  };

  // User Management
  const updateUsuarioNome = (id: string, novoNome: string) => {
    setUsuarios((prev) =>
      prev.map((u) => {
        if (u.id === id) {
          addAuditLog('EDITAR', 'UsuarioAutorizado', id, `Nome de usuário alterado de "${u.nome}" para "${novoNome}".`);
          return { ...u, nome: novoNome, atualizadoEm: new Date().toISOString().split('T')[0] };
        }
        return u;
      })
    );
  };

  const updateUsuario = (id: string, data: Partial<UsuarioAutorizado>) => {
    setUsuarios((prev) =>
      prev.map((u) => {
        if (u.id === id) {
          addAuditLog('EDITAR', 'UsuarioAutorizado', id, `Cadastro do usuário "${u.nome}" atualizado.`);
          return { ...u, ...data, atualizadoEm: new Date().toISOString().split('T')[0] };
        }
        return u;
      })
    );
  };

  const addUsuarioAutorizado = (user: Omit<UsuarioAutorizado, 'id' | 'criadoEm' | 'atualizadoEm'>) => {
    const today = new Date().toISOString().split('T')[0];
    const novo: UsuarioAutorizado = {
      ...user,
      id: `usr-${Date.now()}`,
      criadoEm: today,
      atualizadoEm: today,
    };
    setUsuarios((prev) => [...prev, novo]);
    addAuditLog('CRIAR', 'UsuarioAutorizado', novo.id, `Novo usuário pré-autorizado: ${novo.nome} (${novo.emailGoogle})`);
  };

  const addUsuarioPendente = (email: string, nome: string, perfilOrIntegranteId?: any, maybeIntegranteId?: string) => {
    const today = new Date().toISOString().split('T')[0];
    let perfil: UserProfile = 'OPERADOR';
    let integranteId: string | undefined = maybeIntegranteId;

    if (perfilOrIntegranteId) {
      if (['ADMINISTRADOR', 'OPERADOR', 'VISUALIZACAO'].includes(perfilOrIntegranteId)) {
        perfil = perfilOrIntegranteId;
      } else if (typeof perfilOrIntegranteId === 'string' && perfilOrIntegranteId.startsWith('int-')) {
        integranteId = perfilOrIntegranteId;
      }
    }

    const novo: UsuarioAutorizado = {
      id: `usr-${Date.now()}`,
      nome: nome || email.split('@')[0],
      emailGoogle: email.trim().toLowerCase(),
      foto: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      status: 'Ativo',
      perfil,
      permissoes: {
        visualizarFinanceiro: true,
        lancarDespesas: perfil !== 'VISUALIZACAO',
        lancarReceitas: perfil !== 'VISUALIZACAO',
        editarLancamentos: perfil !== 'VISUALIZACAO',
        excluirLancamentos: perfil === 'ADMINISTRADOR',
        visualizarBancos: true,
        alterarBancos: perfil === 'ADMINISTRADOR',
        visualizarCartoes: true,
        administrarUsuarios: perfil === 'ADMINISTRADOR',
      },
      integranteId,
      dataAutorizacao: today,
      criadoEm: today,
      atualizadoEm: today,
    };
    setUsuarios((prev) => [...prev, novo]);
    addAuditLog('CRIAR', 'UsuarioAutorizado', novo.id, `Usuário liberado: ${novo.nome} (${novo.emailGoogle})`);
  };

  const fecharMesFinanceiro = (mesAno: string, transferirPendentes: boolean = true, observacoes?: string) => {
    const pendingCount = despesas.filter(d => !d.deletedAt && d.status === 'A pagar' && d.dataVencimento.startsWith(mesAno)).length;
    encerrarMes(mesAno, transferirPendentes, observacoes);
    return {
      sucesso: true,
      contasTransferidas: pendingCount,
      saldoFinal: saldoDisponivelTotal,
    };
  };

  // Month Closing Wizard & Audit Log
  const encerrarMes = (mesAno: string, transferirPendentes: boolean, observacoes?: string) => {
    let transferidasContas = 0;
    let transferidasReceitas = 0;

    if (transferirPendentes) {
      // Calculate next month
      const [anoStr, mesStr] = mesAno.split('-');
      let ano = parseInt(anoStr, 10);
      let mes = parseInt(mesStr, 10) + 1;
      if (mes > 12) {
        mes = 1;
        ano += 1;
      }
      const proxMesStr = `${ano}-${mes.toString().padStart(2, '0')}`;

      // Transfer pending expenses
      setDespesas((prev) =>
        prev.map((d) => {
          if (!d.deletedAt && d.status === 'A pagar' && d.dataVencimento.startsWith(mesAno)) {
            transferidasContas++;
            const dia = d.dataVencimento.split('-')[2];
            return {
              ...d,
              dataVencimento: `${proxMesStr}-${dia}`,
              observacao: (d.observacao || '') + ` [Transferido automaticamente no encerramento de ${mesAno}]`,
            };
          }
          return d;
        })
      );

      // Transfer pending revenues
      setReceitas((prev) =>
        prev.map((r) => {
          if (!r.deletedAt && r.status === 'Prevista' && r.dataPrevista.startsWith(mesAno)) {
            transferidasReceitas++;
            const dia = r.dataPrevista.split('-')[2];
            return {
              ...r,
              dataPrevista: `${proxMesStr}-${dia}`,
              observacoes: (r.observacoes || '') + ` [Transferido no encerramento de ${mesAno}]`,
            };
          }
          return r;
        })
      );
    }

    const novoFechamento: EncerramentoMes = {
      id: `enc-${mesAno}`,
      mesAno,
      dataEncerramento: new Date().toISOString(),
      usuarioId: currentUser?.id || 'sys',
      usuarioNome: currentUser?.nome || 'Administrador',
      saldoFinalTotal: saldoDisponivelTotal,
      contasNaoPagasTransferidas: transferidasContas,
      receitasNaoRecebidasTransferidas: transferidasReceitas,
      observacoes,
    };

    setEncerramentos((prev) => [novoFechamento, ...prev]);
    addAuditLog(
      'ENCERRAMENTO',
      'EncerramentoMes',
      novoFechamento.id,
      `Mês ${mesAno} encerrado oficialmente por ${currentUser?.nome}. Transferidos: ${transferidasContas} contas e ${transferidasReceitas} receitas.`
    );
  };

  return (
    <FinanceContext.Provider
      value={{
        currentUser,
        usuarios,
        integrantes,
        contas,
        receitas,
        despesas,
        transferencias,
        recorrencias,
        comprasParceladas,
        cartoes,
        emprestimos,
        operacoes,
        auditorias,
        encerramentos,
        selectedMemberId,
        setSelectedMemberId,
        authLoading,
        familiaId,
        nomeFamilia,
        isMaster,
        acessoLiberado,
        statusAcesso,
        acessoAte,
        limiteUsuarios,
        precisaTrocarSenha,
        convidarUsuario,
        trocarSenha,
        login,
        signUp,
        logout,
        getContaSaldoAtual,
        saldoDisponivelTotal,
        receitasMesTotal,
        despesasMesTotal,
        saldoProjetadoTotal,
        patrimonioLiquidoTotal,
        totalDividas,
        addReceita,
        updateReceita,
        deleteReceita,
        marcarReceitaRecebida,
        addDespesa,
        updateDespesa,
        deleteDespesa,
        marcarDespesaPaga,
        atribuirCartaoDespesa,
        addTransferencia,
        adjustContaSaldo,
        addConta,
        updateConta,
        addCartao,
        updateCartao,
        pagarFaturaCartao,
        addCompraParcelada,
        addEmprestimo,
        pagarParcelaEmprestimo,
        updateParcelaDataEmprestimo,
        amortizarEmprestimo,
        quitarEmprestimo,
        addOperacao,
        updateOperacao,
        addIntegrante,
        updateIntegrante,
        fazendas,
        selectedFazendaId,
        setSelectedFazendaId,
        addFazenda,
        updateFazenda,
        deleteFazenda,
        toggleFazendaAtiva,
        categoriasPlanoContas,
        addCategoriaPlanoContas,
        updateCategoriaPlanoContas,
        toggleCategoriaAtiva,
        removerCategoriaPlanoContas,
        fornecedores,
        addFornecedor,
        updateFornecedor,
        toggleFornecedorAtivo,
        removerFornecedor,
        produtos,
        addProduto,
        updateProduto,
        toggleProdutoAtivo,
        removerProduto,
        pedidosCompra,
        addPedidoCompra,
        cancelarPedidoCompra,
        registrarEntregaPedido,
        gerarPagamentoPedido,
        talhoes,
        addTalhao,
        updateTalhao,
        toggleTalhaoAtivo,
        removerTalhao,
        safras,
        addSafra,
        updateSafra,
        toggleSafraAtiva,
        removerSafra,
        consumos,
        registrarConsumoInsumo,
        updateUsuarioNome,
        updateUsuario,
        addUsuarioAutorizado,
        auditLogs: auditorias,
        approveUsuario: aprovarUsuario,
        blockUsuario: bloquearUsuario,
        updateUsuarioPerfil: atualizarPerfilUsuario,
        addUsuarioPendente,
        fecharMesFinanceiro: encerrarMes,
        addRecorrencia,
        updateRecorrencia,
        aprovarUsuario,
        bloquearUsuario,
        removerUsuario,
        atualizarPerfilUsuario,
        atualizarPermissoesUsuario,
        encerrarMes,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance deve ser usado dentro de um FinanceProvider');
  }
  return context;
};
