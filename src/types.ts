export type UserProfile = 'ADMINISTRADOR' | 'OPERADOR' | 'VISUALIZACAO';
export type UserStatus = 'Pendente' | 'Ativo' | 'Bloqueado';

export interface UserPermissions {
  visualizarFinanceiro: boolean;
  lancarDespesas: boolean;
  lancarReceitas: boolean;
  editarLancamentos: boolean;
  excluirLancamentos: boolean;
  visualizarBancos: boolean;
  alterarBancos: boolean;
  visualizarCartoes: boolean;
  administrarUsuarios: boolean;
}

export interface UsuarioAutorizado {
  id: string;
  nome: string;
  emailGoogle: string;
  foto: string;
  status: UserStatus;
  perfil: UserProfile;
  permissoes: UserPermissions;
  integranteId?: string;
  dataAutorizacao?: string;
  ultimoAcesso?: string;
  criadoEm: string;
  atualizadoEm: string;
}

export interface Fazenda {
  id: string;
  nome: string;
  matricula?: string;
  municipio: string;
  uf: string;
  areaHectares: number;
  culturaPrincipal?: string; // Soja, Milho, Pecuária, Café, etc.
  culturasPrincipais: string[];
  ativa: boolean;
  cor?: string;
  corIdentificacao?: string;
  observacoes?: string;
}

export interface IntegranteFamiliar {
  id: string;
  nome: string;
  apelido: string;
  cpf?: string;
  telefone?: string;
  email?: string;
  ativo: boolean;
  observacoes?: string;
  cor: string;
  avatar?: string;
}

export type TipoContaBancaria =
  | 'Conta Corrente'
  | 'Poupança'
  | 'Conta Digital'
  | 'Conta Empresarial'
  | 'Conta Investimento'
  | 'Caixa/Dinheiro'
  | 'Outros';

export interface ContaBancaria {
  id: string;
  banco: string;
  nomePersonalizado: string;
  agencia: string;
  conta: string;
  tipo: TipoContaBancaria;
  titular: string;
  integranteId?: string;
  saldoInicial: number;
  limite: number;
  cor: string;
  ativa: boolean;
}

export interface Transferencia {
  id: string;
  contaOrigemId: string;
  contaDestinoId: string;
  valor: number;
  data: string;
  descricao: string;
  observacao?: string;
  deletedAt?: string;
  criadoPor: string;
  criadoEm: string;
}

export type StatusReceita = 'Prevista' | 'Recebida' | 'Atrasada' | 'Cancelada';
export type StatusDespesa = 'A pagar' | 'Pago' | 'Atrasado' | 'Cancelado';
export type ClassificacaoDespesa = 'FIXA' | 'VARIAVEL';
export type Periodicidade =
  | 'semanal'
  | 'quinzenal'
  | 'mensal'
  | 'bimestral'
  | 'trimestral'
  | 'semestral'
  | 'anual';

export interface AnexoDocumento {
  id: string;
  nome: string;
  tipo: 'PDF' | 'JPG' | 'PNG' | 'XML';
  tamanho: string;
  dataUpload: string;
  url?: string;
}

export interface Receita {
  id: string;
  descricao: string;
  categoria: string;
  integranteId: string; // PERTENCE A QUEM
  contaId: string; // CONTA DE RECEBIMENTO
  fazendaId?: string; // VÍNCULO COM A FAZENDA / PROPRIEDADE
  valor: number;
  dataCompetencia: string;
  dataPrevista: string;
  dataRecebida?: string;
  status: StatusReceita;
  recorrente: boolean;
  recorrenciaId?: string;
  numeroDocumento?: string;
  clientePagador?: string;
  observacoes?: string;
  anexos?: AnexoDocumento[];
  deletedAt?: string;
  criadoPor: string;
  criadoEm: string;
}

export interface Despesa {
  id: string;
  descricao: string;
  categoria: string;
  subcategoria?: string;
  integranteId: string; // PERTENCE A QUEM (Responsável Financeiro)
  contaId?: string; // CONTA UTILIZADA (se paga por conta bancária)
  cartaoId?: string; // CARTÃO UTILIZADO (se paga por cartão)
  fazendaId?: string; // VÍNCULO COM A FAZENDA / PROPRIEDADE
  faturaMesAno?: string; // Mês da fatura se for em cartão
  valor: number;
  dataCompetencia: string;
  dataVencimento: string;
  dataPagamento?: string;
  status: StatusDespesa;
  formaPagamento?: string;
  recorrente?: boolean;
  recorrenciaId?: string;
  parcelada?: boolean;
  compraParceladaId?: string;
  numeroParcela?: number;
  totalParcelas?: number;
  classificacao?: ClassificacaoDespesa;
  fornecedor?: string;
  numeroDocumento?: string;
  observacao?: string;
  anexos?: AnexoDocumento[];
  deletedAt?: string;
  criadoPor: string;
  criadoEm: string;
}

export interface Recorrencia {
  id: string;
  tipo: 'RECEITA' | 'DESPESA';
  descricao: string;
  categoria: string;
  integranteId: string;
  fazendaId?: string;
  contaPreferencialId?: string;
  cartaoPreferencialId?: string;
  valor: number;
  periodicidade: Periodicidade;
  diaVencimento: number;
  inicio: string;
  fim?: string;
  gerarAutomaticamente: boolean;
  ativo: boolean;
}

export interface CompraParcelada {
  id: string;
  descricao: string;
  categoria: string;
  integranteId: string;
  cartaoId?: string;
  contaId?: string;
  valorTotal: number;
  qtdParcelas: number;
  valorParcela: number;
  dataPrimeiraParcela: string;
  estabelecimento?: string;
  observacao?: string;
  criadoEm: string;
}

export interface CartaoCredito {
  id: string;
  nome: string;
  banco: string;
  bandeira: string;
  finalCartao: string;
  titular: string;
  integranteId?: string;
  limite: number;
  melhorDiaCompra: number;
  diaFechamento: number;
  diaVencimento: number;
  contaPagamentoId: string;
  ativa: boolean;
  cor: string;
}

export interface ParcelaEmprestimo {
  numero: number;
  vencimento: string;
  valor: number;
  status: 'Pendente' | 'Paga' | 'Atrasada';
  dataPagamento?: string;
  valorPago?: number;
}

export interface EmprestimoFinanciamento {
  id: string;
  instituicao?: string;
  credor?: string;
  nomeOperacao: string;
  tipo?: TipoEmprestimo | string;
  integranteResponsavelId?: string;
  integranteId?: string;
  contaRelacionadaId?: string;
  valorContratado: number;
  valorLiberado?: number;
  dataContratacao: string;
  numeroParcelas?: number;
  quantidadeParcelas?: number;
  parcelasPagas?: number;
  valorParcelas?: number;
  primeiroVencimento?: string;
  ultimoVencimento?: string;
  taxaJuros?: string;
  saldoDevedor: number;
  bensGarantia?: string;
  periodicidade?: 'ANUAL_SAFRA' | 'SEMESTRAL' | 'MENSAL' | 'PERSONALIZADA' | string;
  observacao?: string;
  anexos?: AnexoDocumento[];
  status: 'Ativo' | 'Quitado' | 'Em atraso';
  parcelas: ParcelaEmprestimo[];
}

export type TipoOperacaoFinanceira =
  | 'CPR financeira'
  | 'Capital de giro'
  | 'Crédito rural'
  | 'Custeio'
  | 'Investimento agrícola'
  | 'Limite bancário'
  | 'Antecipações'
  | 'Operações estruturadas'
  | 'Outros';

export interface OperacaoFinanceira {
  id: string;
  instituicao: string;
  tipo: TipoOperacaoFinanceira;
  responsavelId: string;
  valorTotal: number;
  dataContratacao: string;
  dataVencimento: string;
  parcelas: number;
  taxas?: string;
  garantia?: string;
  observacao?: string;
  anexos?: AnexoDocumento[];
  status: 'Ativa' | 'Liquidada' | 'Em andamento';
}

export interface LogAuditoria {
  id: string;
  usuarioId: string;
  usuarioNome: string;
  usuarioEmail: string;
  acao:
    | 'CRIAR'
    | 'EDITAR'
    | 'EXCLUIR'
    | 'AJUSTE_SALDO'
    | 'APROVACAO'
    | 'BLOQUEIO'
    | 'PERMISSAO'
    | 'ENCERRAMENTO'
    | 'PAGAMENTO'
    | 'RECEBIMENTO';
  entidade: string;
  entidadeId: string;
  dataHora: string;
  informacaoAnterior?: string;
  informacaoNova?: string;
  detalhes: string;
}

export interface EncerramentoMes {
  id: string;
  mesAno: string; // YYYY-MM
  dataEncerramento: string;
  usuarioId: string;
  usuarioNome: string;
  saldoFinalTotal: number;
  contasNaoPagasTransferidas: number;
  receitasNaoRecebidasTransferidas: number;
  observacoes?: string;
}

export type PerfilAcesso = UserProfile;
export type TipoEmprestimo = 'Crédito Rural' | 'Financiamento Maquinário' | 'Custeio Agrícola' | 'Capital de Giro' | 'Outros';

export interface CategoriaPlanoContas {
  id: string;
  nome: string;
  tipo: 'DESPESA' | 'RECEITA';
  grupo?: string; // agrupamento maior, ex: "Custos Operacionais", "Administrativo" — útil pro contador
  ativa: boolean;
  criadoEm: string;
}

