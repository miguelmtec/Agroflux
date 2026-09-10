/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { FinanceProvider, useFinance } from './context/FinanceContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { TransacoesView } from './components/TransacoesView';
import { AgendaView } from './components/AgendaView';
import { ContasPagarView } from './components/ContasPagarView';
import { ContasReceberView } from './components/ContasReceberView';
import { BancosView } from './components/BancosView';
import { CartoesView } from './components/CartoesView';
import { EmprestimosView } from './components/EmprestimosView';
import { OperacoesView } from './components/OperacoesView';
import { RecorrenciasView } from './components/RecorrenciasView';
import { GrupoFamiliarView } from './components/GrupoFamiliarView';
import { FluxoCaixaView } from './components/FluxoCaixaView';
import { RelatoriosView } from './components/RelatoriosView';
import { DocumentosView } from './components/DocumentosView';
import { AdministracaoView } from './components/AdministracaoView';
import { FazendasUsuariosView } from './components/FazendasUsuariosView';
import { NovoLancamentoModal } from './components/NovoLancamentoModal';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { AuthModal } from './components/AuthModal';
import { PainelMasterView } from './components/PainelMasterView';

const MainAppContent: React.FC = () => {
  const { currentUser, authLoading, isMaster, acessoLiberado, statusAcesso, acessoAte, logout } = useFinance();
  const [currentModule, setCurrentModule] = useState<string>('dashboard');

  useEffect(() => {
    if (isMaster) setCurrentModule('painel-master');
  }, [isMaster]);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNewTxModal, setShowNewTxModal] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Global Ctrl+K shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearchModal((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 text-stone-500 text-sm">
        Carregando...
      </div>
    );
  }

  if (!currentUser) {
    return <AuthModal isOpen fullScreen />;
  }

  if (!isMaster && !acessoLiberado) {
    const mensagem =
      statusAcesso === 'expirado'
        ? `Seu acesso expirou${acessoAte ? ` em ${new Date(acessoAte).toLocaleDateString('pt-BR')}` : ''}.`
        : statusAcesso === 'bloqueado'
        ? 'Seu acesso foi bloqueado.'
        : 'Sua conta foi criada e está aguardando liberação de acesso.';
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 p-6">
        <div className="bg-white border border-stone-200 rounded-2xl shadow-xs p-8 max-w-sm w-full text-center">
          <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-4 text-xl font-bold">
            !
          </div>
          <h2 className="font-bold text-stone-900 mb-2">Acesso pendente</h2>
          <p className="text-sm text-stone-600 mb-6">{mensagem} Fale com quem te vendeu o sistema para liberar.</p>
          <button
            onClick={logout}
            className="w-full py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-sm font-semibold"
          >
            Sair
          </button>
        </div>
      </div>
    );
  }

  const renderModule = () => {
    switch (currentModule) {
      case 'painel-master':
        return isMaster ? <PainelMasterView /> : <DashboardView onNavigate={setCurrentModule} />;
      case 'dashboard':
        return <DashboardView onNavigate={setCurrentModule} />;
      case 'lancamentos':
        return <TransacoesView />;
      case 'agenda':
        return <AgendaView />;
      case 'contas-pagar':
        return <ContasPagarView />;
      case 'contas-receber':
        return <ContasReceberView />;
      case 'bancos':
        return <BancosView />;
      case 'cartoes':
        return <CartoesView />;
      case 'emprestimos':
        return <EmprestimosView />;
      case 'operacoes':
        return <OperacoesView />;
      case 'fazendas':
        return <FazendasUsuariosView initialTab="FAZENDAS" />;
      case 'recorrencias':
        return <RecorrenciasView />;
      case 'grupo-familiar':
        return <GrupoFamiliarView />;
      case 'fluxo-caixa':
        return <FluxoCaixaView />;
      case 'relatorios':
        return <RelatoriosView />;
      case 'documentos':
        return <DocumentosView />;
      case 'administracao':
        return <AdministracaoView />;
      default:
        return isMaster ? <PainelMasterView /> : <DashboardView onNavigate={setCurrentModule} />;
    }
  };

  return (
    <div className="min-h-screen bg-stone-50/70 text-stone-900 flex flex-col font-sans selection:bg-emerald-200">
      {/* Top Navbar */}
      <Navbar
        onOpenNewTransaction={() => setShowNewTxModal(true)}
        onOpenSearch={() => setShowSearchModal(true)}
        onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
        onOpenAuth={() => setShowAuthModal(true)}
        onNavigate={setCurrentModule}
      />

      {/* Main Body Layout */}
      <div className="flex-1 max-w-7xl w-full mx-auto flex">
        {/* Navigation Sidebar */}
        <Sidebar
          currentModule={currentModule}
          onSelectModule={setCurrentModule}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Content View Area */}
        <main className="flex-1 min-w-0 px-4 sm:px-6 lg:px-8 py-6">
          {renderModule()}
        </main>
      </div>

      {/* Global Modals */}
      <NovoLancamentoModal
        isOpen={showNewTxModal}
        onClose={() => setShowNewTxModal(false)}
      />

      <GlobalSearchModal
        isOpen={showSearchModal}
        onClose={() => setShowSearchModal(false)}
        onNavigate={setCurrentModule}
      />

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <FinanceProvider>
      <MainAppContent />
    </FinanceProvider>
  );
}
