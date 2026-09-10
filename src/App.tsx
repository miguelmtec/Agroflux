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

const MainAppContent: React.FC = () => {
  const { currentUser, authLoading } = useFinance();
  const [currentModule, setCurrentModule] = useState<string>('dashboard');
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

  const renderModule = () => {
    switch (currentModule) {
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
        return <DashboardView onNavigate={setCurrentModule} />;
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
