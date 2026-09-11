import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency } from '../utils/formatters';
import { Fazenda, PerfilAcesso, UsuarioAutorizado, IntegranteFamiliar } from '../types';
import {
  Tractor,
  Users,
  Plus,
  Edit2,
  Trash2,
  MapPin,
  Trees,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  AlertCircle,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Building,
  UserCheck,
  UserX,
  X,
  ArrowRight,
  Filter,
  Layers,
  Sparkles,
  Search,
} from 'lucide-react';

interface FazendasUsuariosViewProps {
  initialTab?: 'FAZENDAS' | 'USUARIOS';
}

export const FazendasUsuariosView: React.FC<FazendasUsuariosViewProps> = ({ initialTab = 'FAZENDAS' }) => {
  const {
    fazendas,
    addFazenda,
    updateFazenda,
    deleteFazenda,
    toggleFazendaAtiva,
    usuarios,
    updateUsuarioNome,
    updateUsuario,
    addUsuarioAutorizado,
    convidarUsuario,
    integrantes,
    updateIntegrante,
    receitas,
    despesas,
    currentUser,
  } = useFinance();

  const [activeTab, setActiveTab] = useState<'FAZENDAS' | 'USUARIOS'>(initialTab);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAtivas, setFilterAtivas] = useState<'TODAS' | 'ATIVAS' | 'INATIVAS'>('TODAS');

  // Modal: Nova / Editar Fazenda
  const [showFazendaModal, setShowFazendaModal] = useState(false);
  const [editingFazendaId, setEditingFazendaId] = useState<string | null>(null);
  const [fazendaNome, setFazendaNome] = useState('');
  const [fazendaMunicipio, setFazendaMunicipio] = useState('');
  const [fazendaUf, setFazendaUf] = useState('GO');
  const [fazendaMatricula, setFazendaMatricula] = useState('');
  const [fazendaArea, setFazendaArea] = useState('');
  const [fazendaCulturas, setFazendaCulturas] = useState('');
  const [fazendaCor, setFazendaCor] = useState('#059669');
  const [fazendaObs, setFazendaObs] = useState('');

  // Modal: Editar Usuário / Nome
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [userNome, setUserNome] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPerfil, setUserPerfil] = useState<PerfilAcesso>('OPERADOR');
  const [userIntegranteId, setUserIntegranteId] = useState('');

  // Modal: Novo Usuário
  const [showNewUserModal, setShowNewUserModal] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPerfil, setNewUserPerfil] = useState<PerfilAcesso>('OPERADOR');
  const [newUserIntegranteId, setNewUserIntegranteId] = useState('');

  // Modal: Detalhes / Transações da Fazenda
  const [selectedFazendaForDetails, setSelectedFazendaForDetails] = useState<Fazenda | null>(null);

  // Calculations per Farm
  const getFazendaFinanceiro = (fId: string) => {
    const recs = receitas.filter((r) => !r.deletedAt && r.fazendaId === fId);
    const desps = despesas.filter((d) => !d.deletedAt && d.fazendaId === fId);
    const totalRec = recs.reduce((sum, r) => sum + r.valor, 0);
    const totalDesp = desps.reduce((sum, d) => sum + d.valor, 0);
    const saldo = totalRec - totalDesp;
    return { totalRec, totalDesp, saldo, recs, desps };
  };

  const totalAreaGeral = fazendas
    .filter((f) => f.ativa)
    .reduce((sum, f) => sum + f.areaHectares, 0);

  const totalReceitasFazendas = receitas
    .filter((r) => !r.deletedAt && r.fazendaId)
    .reduce((sum, r) => sum + r.valor, 0);

  const totalDespesasFazendas = despesas
    .filter((d) => !d.deletedAt && d.fazendaId)
    .reduce((sum, d) => sum + d.valor, 0);

  const handleOpenCreateFazenda = () => {
    setEditingFazendaId(null);
    setFazendaNome('');
    setFazendaMunicipio('');
    setFazendaUf('GO');
    setFazendaMatricula('');
    setFazendaArea('');
    setFazendaCulturas('Soja, Milho Safrinha');
    setFazendaCor('#059669');
    setFazendaObs('');
    setShowFazendaModal(true);
  };

  const handleOpenEditFazenda = (f: Fazenda) => {
    setEditingFazendaId(f.id);
    setFazendaNome(f.nome);
    setFazendaMunicipio(f.municipio);
    setFazendaUf(f.uf);
    setFazendaMatricula(f.matricula || '');
    setFazendaArea(f.areaHectares.toString());
    setFazendaCulturas(f.culturasPrincipais.join(', '));
    setFazendaCor(f.corIdentificacao || '#059669');
    setFazendaObs(f.observacoes || '');
    setShowFazendaModal(true);
  };

  const handleSaveFazenda = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fazendaNome.trim()) {
      alert('Por favor, informe o nome da fazenda.');
      return;
    }

    const areaNum = parseFloat(fazendaArea.replace(',', '.')) || 0;
    const culturasArr = fazendaCulturas
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);

    if (editingFazendaId) {
      updateFazenda(editingFazendaId, {
        nome: fazendaNome.trim(),
        municipio: fazendaMunicipio.trim(),
        uf: fazendaUf.trim().toUpperCase(),
        matricula: fazendaMatricula.trim(),
        areaHectares: areaNum,
        culturasPrincipais: culturasArr,
        corIdentificacao: fazendaCor,
        observacoes: fazendaObs.trim(),
      });
    } else {
      addFazenda({
        nome: fazendaNome.trim(),
        municipio: fazendaMunicipio.trim(),
        uf: fazendaUf.trim().toUpperCase(),
        matricula: fazendaMatricula.trim(),
        areaHectares: areaNum,
        culturasPrincipais: culturasArr,
        ativa: true,
        corIdentificacao: fazendaCor,
        observacoes: fazendaObs.trim(),
      });
    }

    setShowFazendaModal(false);
  };

  const handleOpenEditUser = (usr: UsuarioAutorizado) => {
    setEditingUserId(usr.id);
    setUserNome(usr.nome);
    setUserEmail(usr.emailGoogle);
    setUserPerfil(usr.perfil);
    setUserIntegranteId(usr.integranteId || '');
    setShowUserModal(true);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUserId) return;
    if (!userNome.trim()) {
      alert('Informe o nome do usuário.');
      return;
    }

    updateUsuario(editingUserId, {
      nome: userNome.trim(),
      emailGoogle: userEmail.trim().toLowerCase(),
      perfil: userPerfil,
      integranteId: userIntegranteId || undefined,
    });

    // Also sync with the linked Integrante if matched
    if (userIntegranteId) {
      updateIntegrante(userIntegranteId, {
        nome: userNome.trim(),
      });
    }

    setShowUserModal(false);
  };

  const [senhaGerada, setSenhaGerada] = useState<{ nome: string; email: string; senha: string } | null>(null);
  const [enviandoConvite, setEnviandoConvite] = useState(false);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.includes('@')) {
      alert('Informe nome e um e-mail válido para autorização.');
      return;
    }

    setEnviandoConvite(true);
    const resultado = await convidarUsuario(
      newUserName.trim(),
      newUserEmail.trim().toLowerCase(),
      newUserPerfil,
      newUserIntegranteId || undefined
    );
    setEnviandoConvite(false);

    if (!resultado.success) {
      alert(resultado.message || 'Não foi possível convidar esse usuário.');
      return;
    }

    setShowNewUserModal(false);
    setSenhaGerada({
      nome: newUserName.trim(),
      email: newUserEmail.trim().toLowerCase(),
      senha: resultado.senhaTemporaria || '',
    });
    setNewUserName('');
    setNewUserEmail('');
    setNewUserIntegranteId('');
  };

  const filteredFazendas = fazendas.filter((f) => {
    const matchesSearch =
      f.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.municipio.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.culturasPrincipais.some((c) => c.toLowerCase().includes(searchTerm.toLowerCase()));

    if (filterAtivas === 'ATIVAS') return matchesSearch && f.ativa;
    if (filterAtivas === 'INATIVAS') return matchesSearch && !f.ativa;
    return matchesSearch;
  });

  return (
    <div id="fazendas-usuarios-view" className="space-y-6 pb-12 animate-in fade-in">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-stone-900 via-stone-800 to-orange-950 text-white rounded-2xl p-6 shadow-md border border-stone-700/50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="bg-emerald-500/20 text-emerald-300 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                <Tractor className="w-3.5 h-3.5 text-emerald-400" />
                Grupo Leão Ribeiro
              </span>
              <span className="text-xs text-stone-400">• Gestão Integrada Familiar</span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white">
              Gestão de Fazendas & Usuários
            </h1>
            <p className="text-xs text-stone-300 max-w-2xl mt-1">
              Cadastre e gerencie as propriedades agrícolas do Grupo Leão Ribeiro. Vincule cada receita e despesa à sua respectiva fazenda e administre o acesso e edição de nomes dos integrantes familiares.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {activeTab === 'FAZENDAS' ? (
              <button
                id="btn-add-fazenda"
                onClick={handleOpenCreateFazenda}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-xs transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Cadastrar Nova Fazenda
              </button>
            ) : (
              <button
                id="btn-add-usuario"
                onClick={() => setShowNewUserModal(true)}
                className="flex items-center gap-2 bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-xs transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Novo Usuário
              </button>
            )}
          </div>
        </div>

        {/* Global Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-stone-700/60">
          <div className="bg-stone-800/60 rounded-xl p-3 border border-stone-700/40">
            <span className="text-[11px] text-stone-400 font-medium block">Propriedades Rurais</span>
            <span className="text-lg font-black text-white">{fazendas.length} fazendas</span>
            <span className="text-[10px] text-emerald-400 block mt-0.5">
              {fazendas.filter((f) => f.ativa).length} em operação ativa
            </span>
          </div>

          <div className="bg-stone-800/60 rounded-xl p-3 border border-stone-700/40">
            <span className="text-[11px] text-stone-400 font-medium block">Área Total Plantada</span>
            <span className="text-lg font-black text-emerald-300">
              {totalAreaGeral.toLocaleString('pt-BR')} ha
            </span>
            <span className="text-[10px] text-stone-400 block mt-0.5">Hectares cadastrados</span>
          </div>

          <div className="bg-stone-800/60 rounded-xl p-3 border border-stone-700/40">
            <span className="text-[11px] text-stone-400 font-medium block">Receitas das Fazendas</span>
            <span className="text-lg font-black text-emerald-400">
              {formatCurrency(totalReceitasFazendas)}
            </span>
            <span className="text-[10px] text-stone-400 block mt-0.5">Safras, gado & arrendamento</span>
          </div>

          <div className="bg-stone-800/60 rounded-xl p-3 border border-stone-700/40">
            <span className="text-[11px] text-stone-400 font-medium block">Despesas das Fazendas</span>
            <span className="text-lg font-black text-rose-300">
              {formatCurrency(totalDespesasFazendas)}
            </span>
            <span className="text-[10px] text-stone-400 block mt-0.5">Insumos, maquinário & folha</span>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center justify-between gap-3 border-b border-stone-200 pb-3">
        <div className="flex items-center gap-2 bg-stone-100 p-1 rounded-xl border border-stone-200">
          <button
            id="tab-fazendas"
            onClick={() => setActiveTab('FAZENDAS')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === 'FAZENDAS'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Trees className="w-4 h-4 text-emerald-600" />
            Fazendas & Propriedades ({fazendas.length})
          </button>
          <button
            id="tab-usuarios"
            onClick={() => setActiveTab('USUARIOS')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === 'USUARIOS'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Users className="w-4 h-4 text-orange-600" />
            Gestão de Usuários & Nomes ({usuarios.length})
          </button>
        </div>

        {activeTab === 'FAZENDAS' && (
          <div className="flex items-center gap-2">
            <div className="relative w-48 sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -transtone-y-1/2 text-stone-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar fazenda..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-stone-200 rounded-lg text-stone-800"
              />
            </div>
            <select
              value={filterAtivas}
              onChange={(e) => setFilterAtivas(e.target.value as any)}
              className="text-xs py-1.5 px-3 bg-white border border-stone-200 rounded-lg text-stone-700 font-medium"
            >
              <option value="TODAS">Todas</option>
              <option value="ATIVAS">Ativas</option>
              <option value="INATIVAS">Inativas</option>
            </select>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: FAZENDAS & PROPRIEDADES                                            */}
      {/* ========================================================================= */}
      {activeTab === 'FAZENDAS' && (
        <div className="space-y-6">
          {/* Farm Grid Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredFazendas.map((fazenda) => {
              const fin = getFazendaFinanceiro(fazenda.id);
              const hasProfit = fin.saldo >= 0;

              return (
                <div
                  key={fazenda.id}
                  id={`card-fazenda-${fazenda.id}`}
                  className={`bg-white rounded-2xl border transition-all p-5 shadow-2xs hover:shadow-xs flex flex-col justify-between ${
                    fazenda.ativa ? 'border-stone-200/90' : 'border-stone-200 opacity-60 bg-stone-50'
                  }`}
                >
                  <div>
                    {/* Header with name and badge */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-3.5 h-10 rounded-full shrink-0"
                          style={{ backgroundColor: fazenda.corIdentificacao || '#059669' }}
                        />
                        <div>
                          <h3 className="text-base font-extrabold text-stone-900 tracking-tight flex items-center gap-2">
                            {fazenda.nome}
                            {!fazenda.ativa && (
                              <span className="text-[10px] font-semibold text-stone-500 bg-stone-200 px-2 py-0.5 rounded-full">
                                Inativa
                              </span>
                            )}
                          </h3>
                          <div className="flex items-center gap-2 text-xs text-stone-500 mt-0.5">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-stone-400" />
                              {fazenda.municipio} - {fazenda.uf}
                            </span>
                            {fazenda.matricula && (
                              <>
                                <span>•</span>
                                <span className="font-mono text-[11px] text-stone-600">
                                  {fazenda.matricula}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          id={`btn-edit-fazenda-${fazenda.id}`}
                          onClick={() => handleOpenEditFazenda(fazenda)}
                          className="p-1.5 text-stone-400 hover:text-stone-800 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
                          title="Editar dados da fazenda"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => toggleFazendaAtiva(fazenda.id)}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            fazenda.ativa
                              ? 'text-emerald-600 hover:bg-emerald-50'
                              : 'text-stone-400 hover:bg-stone-200'
                          }`}
                          title={fazenda.ativa ? 'Inativar fazenda' : 'Ativar fazenda'}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Deseja realmente excluir a ${fazenda.nome}?`)) {
                              deleteFazenda(fazenda.id);
                            }
                          }}
                          className="p-1.5 text-stone-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Excluir fazenda"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Tags & Culturas */}
                    <div className="flex flex-wrap gap-1.5 my-3">
                      <span className="bg-stone-100 text-stone-700 text-[11px] font-bold px-2 py-0.5 rounded-md border border-stone-200">
                        🌾 {fazenda.areaHectares.toLocaleString('pt-BR')} Hectares
                      </span>
                      {fazenda.culturasPrincipais.map((cult, idx) => (
                        <span
                          key={idx}
                          className="bg-emerald-50 text-emerald-800 text-[11px] font-medium px-2 py-0.5 rounded-md border border-emerald-100"
                        >
                          {cult}
                        </span>
                      ))}
                    </div>

                    {fazenda.observacoes && (
                      <p className="text-xs text-stone-500 italic mb-3">
                        "{fazenda.observacoes}"
                      </p>
                    )}
                  </div>

                  {/* Financial Mini Dashboard for this Farm */}
                  <div className="bg-stone-50 rounded-xl p-3 border border-stone-100 mt-2">
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="font-bold text-stone-700">Resultado Financeiro</span>
                      <button
                        onClick={() => setSelectedFazendaForDetails(fazenda)}
                        className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        Ver {fin.recs.length + fin.desps.length} lançamentos
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-white p-2 rounded-lg border border-stone-200/60">
                        <span className="text-[10px] text-stone-500 block">Receitas</span>
                        <span className="text-xs font-extrabold text-emerald-700 block mt-0.5">
                          {formatCurrency(fin.totalRec)}
                        </span>
                        <span className="text-[9px] text-stone-400">{fin.recs.length} itens</span>
                      </div>

                      <div className="bg-white p-2 rounded-lg border border-stone-200/60">
                        <span className="text-[10px] text-stone-500 block">Despesas</span>
                        <span className="text-xs font-extrabold text-rose-600 block mt-0.5">
                          {formatCurrency(fin.totalDesp)}
                        </span>
                        <span className="text-[9px] text-stone-400">{fin.desps.length} itens</span>
                      </div>

                      <div
                        className={`p-2 rounded-lg border ${
                          hasProfit
                            ? 'bg-emerald-50/70 border-emerald-200 text-emerald-800'
                            : 'bg-rose-50/70 border-rose-200 text-rose-800'
                        }`}
                      >
                        <span className="text-[10px] font-medium block">Margem Líquida</span>
                        <span className="text-xs font-black block mt-0.5">
                          {formatCurrency(fin.saldo)}
                        </span>
                        <span className="text-[9px] font-medium">
                          {hasProfit ? 'Superávit' : 'Déficit'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredFazendas.length === 0 && (
            <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center">
              <Trees className="w-12 h-12 text-stone-300 mx-auto mb-3" />
              <h4 className="font-extrabold text-stone-800 text-sm">Nenhuma fazenda encontrada</h4>
              <p className="text-xs text-stone-500 max-w-sm mx-auto mt-1 mb-4">
                Cadastre as propriedades agrícolas do Grupo Leão Ribeiro para começar a alocar receitas e despesas por fazenda.
              </p>
              <button
                onClick={handleOpenCreateFazenda}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2 px-4 rounded-xl cursor-pointer"
              >
                Cadastrar Primeira Fazenda
              </button>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: GESTÃO DE USUÁRIOS & NOMES                                         */}
      {/* ========================================================================= */}
      {activeTab === 'USUARIOS' && (
        <div className="space-y-6">
          {/* Explanatory callout */}
          <div className="bg-orange-50/80 border border-orange-200 rounded-2xl p-4 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
            <div className="text-xs text-orange-950">
              <span className="font-extrabold block text-sm mb-0.5">
                Acesso Exclusivo por Autorização & Edição de Nomes
              </span>
              Nesta aba você pode renomear os usuários, ajustar os nomes dos integrantes do Grupo Leão Ribeiro, vincular contas de e-mail aos membros da família e configurar níveis de permissão (Administrador, Operador ou Visualização).
            </div>
          </div>

          {/* User List Table */}
          <div className="bg-white rounded-2xl border border-stone-200/80 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-stone-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-stone-900 text-sm">
                  Usuários Autorizados no Sistema
                </h3>
                <p className="text-xs text-stone-500">
                  Total de {usuarios.length} usuários com acesso liberado
                </p>
              </div>

              <button
                id="btn-add-user-modal"
                onClick={() => setShowNewUserModal(true)}
                className="flex items-center gap-1.5 bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs py-2 px-3.5 rounded-xl cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Novo Usuário
              </button>
            </div>

            <div className="divide-y divide-stone-100">
              {usuarios.map((usr) => {
                const linkedMember = integrantes.find((i) => i.id === usr.integranteId);
                const isCurrentUser = currentUser?.id === usr.id;

                return (
                  <div
                    key={usr.id}
                    id={`row-user-${usr.id}`}
                    className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-stone-50/70 transition-colors"
                  >
                    <div className="flex items-center gap-3.5">
                      <img
                        src={usr.foto}
                        alt={usr.nome}
                        referrerPolicy="no-referrer"
                        className="w-11 h-11 rounded-full object-cover border border-stone-200 shadow-2xs"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-stone-900 text-sm">
                            {usr.nome}
                          </span>
                          {isCurrentUser && (
                            <span className="text-[10px] font-bold bg-stone-900 text-white px-2 py-0.5 rounded-full">
                              Você
                            </span>
                          )}
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              usr.status === 'Ativo'
                                ? 'bg-emerald-100 text-emerald-800'
                                : usr.status === 'Pendente'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {usr.status}
                          </span>
                        </div>

                        <span className="text-xs text-stone-500 font-mono block">
                          {usr.emailGoogle}
                        </span>

                        <div className="flex items-center gap-2 mt-1">
                          {linkedMember ? (
                            <span className="text-[11px] text-orange-700 bg-orange-50 border border-orange-100 px-2 py-0.5 rounded-md font-medium">
                              Integrante: {linkedMember.nome} ({linkedMember.parentesco})
                            </span>
                          ) : (
                            <span className="text-[11px] text-stone-400 italic">
                              Sem vínculo a integrante específico
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 self-end md:self-center">
                      <div className="text-right mr-2 hidden sm:block">
                        <span className="text-[10px] text-stone-400 uppercase font-bold block">
                          Perfil de Acesso
                        </span>
                        <span className="text-xs font-bold text-stone-700">
                          {usr.perfil}
                        </span>
                      </div>

                      <button
                        id={`btn-edit-user-${usr.id}`}
                        onClick={() => handleOpenEditUser(usr)}
                        className="flex items-center gap-1 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold py-1.5 px-3 rounded-lg border border-stone-200 cursor-pointer transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" /> Editar Nome / Perfil
                      </button>

                      {usr.status === 'Ativo' ? (
                        <button
                          onClick={() => updateUsuario(usr.id, { status: 'Bloqueado' })}
                          className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Bloquear usuário"
                        >
                          <UserX className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => updateUsuario(usr.id, { status: 'Ativo' })}
                          className="p-1.5 text-stone-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                          title="Ativar usuário"
                        >
                          <UserCheck className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Members of the family group card */}
          <div className="bg-white rounded-2xl border border-stone-200/80 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-stone-900 text-sm">
                  Integrantes do Grupo Familiar Leão Ribeiro
                </h3>
                <p className="text-xs text-stone-500">
                  Membros da família titulares de receitas, despesas e contas
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {integrantes.map((member) => (
                <div
                  key={member.id}
                  className="bg-stone-50 rounded-xl p-3.5 border border-stone-200/70 flex flex-col justify-between"
                >
                  <div className="flex items-center gap-2.5 mb-2">
                    <span className="text-2xl">{member.avatar || '👤'}</span>
                    <div>
                      <h4 className="font-extrabold text-stone-900 text-xs">{member.nome}</h4>
                      <span className="text-[11px] text-stone-500">
                        {member.apelido} • {member.parentesco}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-stone-200/60 flex items-center justify-between">
                    <span className="text-[10px] text-emerald-700 font-bold">
                      {member.ativo ? 'Ativo na Família' : 'Inativo'}
                    </span>
                    <button
                      onClick={() => {
                        const novoNome = prompt(`Editar nome completo de ${member.apelido}:`, member.nome);
                        if (novoNome && novoNome.trim()) {
                          updateIntegrante(member.id, { nome: novoNome.trim() });
                        }
                      }}
                      className="text-[11px] font-bold text-orange-700 hover:underline cursor-pointer"
                    >
                      Editar Nome
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: NOVA OU EDITAR FAZENDA                                            */}
      {/* ========================================================================= */}
      {showFazendaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 bg-stone-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trees className="w-5 h-5 text-emerald-400" />
                <h2 className="font-extrabold text-sm">
                  {editingFazendaId ? 'Editar Dados da Fazenda' : 'Cadastrar Nova Fazenda'}
                </h2>
              </div>
              <button
                onClick={() => setShowFazendaModal(false)}
                className="text-stone-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveFazenda} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  Nome da Propriedade Rural *
                </label>
                <input
                  type="text"
                  value={fazendaNome}
                  onChange={(e) => setFazendaNome(e.target.value)}
                  placeholder="Ex: Fazenda Leão do Sul"
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg bg-white text-stone-900 font-semibold"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block font-bold text-stone-700 mb-1">Município *</label>
                  <input
                    type="text"
                    value={fazendaMunicipio}
                    onChange={(e) => setFazendaMunicipio(e.target.value)}
                    placeholder="Ex: Rio Verde"
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Estado (UF)</label>
                  <input
                    type="text"
                    value={fazendaUf}
                    maxLength={2}
                    onChange={(e) => setFazendaUf(e.target.value.toUpperCase())}
                    placeholder="GO"
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg bg-white uppercase"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    Área Total (Hectares) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={fazendaArea}
                    onChange={(e) => setFazendaArea(e.target.value)}
                    placeholder="Ex: 1850"
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg bg-white font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    Matrícula / Registro CRI
                  </label>
                  <input
                    type="text"
                    value={fazendaMatricula}
                    onChange={(e) => setFazendaMatricula(e.target.value)}
                    placeholder="Matrícula 14.890"
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  Culturas Principais & Atividades (separadas por vírgula)
                </label>
                <input
                  type="text"
                  value={fazendaCulturas}
                  onChange={(e) => setFazendaCulturas(e.target.value)}
                  placeholder="Ex: Soja, Milho Safrinha, Confinamento Nelore"
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    Cor de Destaque
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={fazendaCor}
                      onChange={(e) => setFazendaCor(e.target.value)}
                      className="w-8 h-8 rounded-md border border-stone-300 cursor-pointer p-0"
                    />
                    <span className="font-mono text-xs text-stone-600">{fazendaCor}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Observações</label>
                <textarea
                  rows={2}
                  value={fazendaObs}
                  onChange={(e) => setFazendaObs(e.target.value)}
                  placeholder="Informações adicionais de arrendamento, silos ou pivôs centrais..."
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowFazendaModal(false)}
                  className="px-4 py-2 border border-stone-200 text-stone-700 font-semibold rounded-lg hover:bg-stone-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg cursor-pointer"
                >
                  {editingFazendaId ? 'Salvar Alterações' : 'Cadastrar Fazenda'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EDITAR USUÁRIO / NOME                                             */}
      {/* ========================================================================= */}
      {showUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 bg-stone-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-orange-400" />
                <h2 className="font-extrabold text-sm">Editar Usuário & Nome</h2>
              </div>
              <button
                onClick={() => setShowUserModal(false)}
                className="text-stone-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  Nome Completo do Usuário *
                </label>
                <input
                  type="text"
                  value={userNome}
                  onChange={(e) => setUserNome(e.target.value)}
                  placeholder="Nome de exibição"
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg bg-white text-stone-900 font-bold"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  E-mail Autorizado *
                </label>
                <input
                  type="email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  placeholder="usuario@gmail.com"
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg bg-white font-mono"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  Vínculo com Integrante Familiar
                </label>
                <select
                  value={userIntegranteId}
                  onChange={(e) => setUserIntegranteId(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg bg-white font-medium"
                >
                  <option value="">Sem vínculo a membro específico</option>
                  {integrantes.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.apelido} ({i.nome} - {i.parentesco})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  Perfil de Permissão
                </label>
                <select
                  value={userPerfil}
                  onChange={(e) => setUserPerfil(e.target.value as PerfilAcesso)}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg bg-white font-bold"
                >
                  <option value="ADMINISTRADOR">ADMINISTRADOR (Acesso Total)</option>
                  <option value="OPERADOR">OPERADOR (Lançamentos e Edições)</option>
                  <option value="VISUALIZACAO">VISUALIZAÇÃO (Apenas Consulta)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowUserModal(false)}
                  className="px-4 py-2 border border-stone-200 text-stone-700 font-semibold rounded-lg hover:bg-stone-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-lg cursor-pointer"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: NOVO USUÁRIO GOOGLE                                               */}
      {/* ========================================================================= */}
      {showNewUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 bg-stone-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-400" />
                <h2 className="font-extrabold text-sm">Autorizar Novo Usuário</h2>
              </div>
              <button
                onClick={() => setShowNewUserModal(false)}
                className="text-stone-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="Ex: Carlos Leão Ribeiro"
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg bg-white font-bold"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  E-mail Autorizado *
                </label>
                <input
                  type="email"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="email@gmail.com"
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg bg-white font-mono"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  Vincular ao Integrante Familiar
                </label>
                <select
                  value={newUserIntegranteId}
                  onChange={(e) => setNewUserIntegranteId(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg bg-white font-medium"
                >
                  <option value="">Nenhum (Usuário Externo / Contador)</option>
                  {integrantes.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.apelido} ({i.nome} - {i.parentesco})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Perfil de Acesso</label>
                <select
                  value={newUserPerfil}
                  onChange={(e) => setNewUserPerfil(e.target.value as PerfilAcesso)}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg bg-white font-bold"
                >
                  <option value="ADMINISTRADOR">ADMINISTRADOR</option>
                  <option value="OPERADOR">OPERADOR</option>
                  <option value="VISUALIZACAO">VISUALIZAÇÃO</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowNewUserModal(false)}
                  className="px-4 py-2 border border-stone-200 text-stone-700 font-semibold rounded-lg hover:bg-stone-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={enviandoConvite}
                  className="px-4 py-2 bg-stone-900 hover:bg-stone-800 disabled:opacity-60 text-white font-bold rounded-lg cursor-pointer"
                >
                  {enviandoConvite ? 'Criando acesso...' : 'Autorizar Acesso'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Senha provisória gerada — mostrada UMA vez só, não fica salva em lugar nenhum */}
      {senhaGerada && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-sm overflow-hidden">
            <div className="p-4 bg-emerald-700 text-white flex items-center gap-2">
              <Users className="w-5 h-5" />
              <h2 className="font-extrabold text-sm">Acesso criado!</h2>
            </div>
            <div className="p-5 text-xs space-y-3">
              <p className="text-stone-600">
                Passe esses dados pra <strong>{senhaGerada.nome}</strong> (por WhatsApp, por exemplo). Essa senha só
                aparece essa vez — se perder, você precisa gerar outro acesso.
              </p>
              <div className="bg-stone-50 border border-stone-200 rounded-xl p-3 space-y-1.5">
                <p><span className="text-stone-400">E-mail:</span> <span className="font-mono font-bold">{senhaGerada.email}</span></p>
                <p><span className="text-stone-400">Senha provisória:</span> <span className="font-mono font-bold text-emerald-700">{senhaGerada.senha}</span></p>
              </div>
              <p className="text-[11px] text-stone-400">
                No primeiro acesso, a pessoa vai ser obrigada a trocar essa senha por uma só dela.
              </p>
              <button
                onClick={() => setSenhaGerada(null)}
                className="w-full py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold"
              >
                Ok, já anotei
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: DETALHES & LANÇAMENTOS DA FAZENDA SELECIONADA                      */}
      {/* ========================================================================= */}
      {selectedFazendaForDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 my-6">
            <div className="p-4 bg-stone-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trees className="w-5 h-5 text-emerald-400" />
                <div>
                  <h2 className="font-extrabold text-sm">{selectedFazendaForDetails.nome}</h2>
                  <span className="text-xs text-stone-300">
                    {selectedFazendaForDetails.municipio} - {selectedFazendaForDetails.uf} •{' '}
                    {selectedFazendaForDetails.areaHectares.toLocaleString('pt-BR')} ha
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedFazendaForDetails(null)}
                className="text-stone-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              {(() => {
                const fin = getFazendaFinanceiro(selectedFazendaForDetails.id);

                return (
                  <>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center">
                        <span className="text-[10px] text-emerald-700 uppercase font-bold block">
                          Total Receitas
                        </span>
                        <span className="text-base font-black text-emerald-800">
                          {formatCurrency(fin.totalRec)}
                        </span>
                      </div>
                      <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-center">
                        <span className="text-[10px] text-rose-700 uppercase font-bold block">
                          Total Despesas
                        </span>
                        <span className="text-base font-black text-rose-800">
                          {formatCurrency(fin.totalDesp)}
                        </span>
                      </div>
                      <div className="bg-stone-100 border border-stone-200 rounded-xl p-3 text-center">
                        <span className="text-[10px] text-stone-600 uppercase font-bold block">
                          Saldo Líquido
                        </span>
                        <span
                          className={`text-base font-black ${
                            fin.saldo >= 0 ? 'text-emerald-700' : 'text-rose-700'
                          }`}
                        >
                          {formatCurrency(fin.saldo)}
                        </span>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-bold text-stone-900 text-xs uppercase tracking-wider mb-2">
                        Receitas Vinculadas ({fin.recs.length})
                      </h4>
                      {fin.recs.length === 0 ? (
                        <p className="text-xs text-stone-400 italic">Nenhuma receita vinculada.</p>
                      ) : (
                        <div className="divide-y divide-stone-100 border border-stone-100 rounded-xl overflow-hidden">
                          {fin.recs.map((r) => (
                            <div
                              key={r.id}
                              className="p-2.5 bg-white flex items-center justify-between text-xs"
                            >
                              <div>
                                <span className="font-bold text-stone-800 block">{r.descricao}</span>
                                <span className="text-[10px] text-stone-500">
                                  {r.dataCompetencia} • {r.categoria}
                                </span>
                              </div>
                              <span className="font-bold text-emerald-700">
                                +{formatCurrency(r.valor)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <h4 className="font-bold text-stone-900 text-xs uppercase tracking-wider mb-2">
                        Despesas Vinculadas ({fin.desps.length})
                      </h4>
                      {fin.desps.length === 0 ? (
                        <p className="text-xs text-stone-400 italic">Nenhuma despesa vinculada.</p>
                      ) : (
                        <div className="divide-y divide-stone-100 border border-stone-100 rounded-xl overflow-hidden">
                          {fin.desps.map((d) => (
                            <div
                              key={d.id}
                              className="p-2.5 bg-white flex items-center justify-between text-xs"
                            >
                              <div>
                                <span className="font-bold text-stone-800 block">{d.descricao}</span>
                                <span className="text-[10px] text-stone-500">
                                  Venc: {d.dataVencimento} • {d.categoria}
                                </span>
                              </div>
                              <span className="font-bold text-rose-600">
                                -{formatCurrency(d.valor)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                );
              })()}
            </div>

            <div className="p-4 bg-stone-50 border-t border-stone-200 flex justify-end">
              <button
                onClick={() => setSelectedFazendaForDetails(null)}
                className="px-4 py-2 bg-stone-900 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                Fechar Detalhes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
