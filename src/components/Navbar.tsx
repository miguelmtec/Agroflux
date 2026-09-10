import React from 'react';
import { useFinance } from '../context/FinanceContext';
import {
  Search,
  Plus,
  Users,
  LogOut,
  Shield,
  Bell,
  ChevronDown,
  Menu,
  Sparkles,
} from 'lucide-react';

interface NavbarProps {
  onOpenNewTransaction: () => void;
  onOpenSearch: () => void;
  onToggleSidebar: () => void;
  onOpenAuth: () => void;
  onNavigate: (module: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenNewTransaction,
  onOpenSearch,
  onToggleSidebar,
  onOpenAuth,
  onNavigate,
}) => {
  const { currentUser, integrantes, selectedMemberId, setSelectedMemberId, logout } = useFinance();

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-stone-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        {/* Left: Mobile menu button & Brand */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="p-2 -ml-1.5 rounded-lg text-stone-600 hover:text-stone-900 hover:bg-stone-100 lg:hidden"
            aria-label="Abrir menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div
            onClick={() => onNavigate('dashboard')}
            className="flex items-center gap-2.5 cursor-pointer select-none"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-stone-900 via-orange-950 to-stone-800 flex items-center justify-center text-emerald-400 font-extrabold text-lg shadow-sm border border-stone-700/40">
              🌾
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-stone-900 text-base tracking-tight leading-none">
                  AGROFLUX
                </span>
                <span className="text-[10px] font-bold tracking-widest uppercase bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.2 rounded">
                  Familiar
                </span>
              </div>
              <span className="text-[11px] text-stone-500 font-medium block leading-tight">
                Gestão Patrimonial do Agro
              </span>
            </div>
          </div>
        </div>

        {/* Center: Member Filter Pill (TODOS | PAI | MÃE | FILHA 1 | FILHA 2) */}
        <div className="hidden md:flex items-center bg-stone-100/90 p-1 rounded-xl border border-stone-200/60 shadow-2xs">
          <button
            onClick={() => setSelectedMemberId('TODOS')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
              selectedMemberId === 'TODOS'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/50'
            }`}
          >
            Todos
          </button>
          {integrantes.map((int) => {
            const isSelected = selectedMemberId === int.id;
            return (
              <button
                key={int.id}
                onClick={() => setSelectedMemberId(int.id)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all ${
                  isSelected
                    ? 'bg-white text-stone-900 shadow-xs border border-stone-200/80'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/50'
                }`}
              >
                <span className="text-xs">{int.avatar || '👤'}</span>
                <span>{int.apelido.toUpperCase()}</span>
              </button>
            );
          })}
        </div>

        {/* Right: Search, New Transaction, User profile */}
        <div className="flex items-center gap-2.5">
          {/* Global Search Button */}
          <button
            onClick={onOpenSearch}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-stone-500 hover:text-stone-800 bg-stone-50 hover:bg-stone-100 border border-stone-200 text-xs transition-colors"
            title="Pesquisar em todo o AgroFlux (Ctrl+K)"
          >
            <Search className="w-3.5 h-3.5" />
            <span className="hidden xl:inline font-medium">Buscar lançamentos...</span>
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-white border border-stone-200 rounded text-stone-400">
              ⌘K
            </kbd>
          </button>

          {/* Quick Add Button */}
          <button
            onClick={onOpenNewTransaction}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold text-xs py-2 px-3 sm:px-4 rounded-xl shadow-xs transition-all transform hover:-transtone-y-0.5"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">NOVO LANÇAMENTO</span>
            <span className="sm:hidden">Novo</span>
          </button>

          {/* User Profile Pill */}
          {currentUser ? (
            <div className="flex items-center gap-2 pl-2 border-l border-stone-200">
              <div
                onClick={onOpenAuth}
                className="flex items-center gap-2 cursor-pointer p-1 rounded-xl hover:bg-stone-100 transition-colors"
                title="Clique para gerenciar conta ou alternar usuário"
              >
                <img
                  src={currentUser.foto}
                  alt={currentUser.nome}
                  referrerPolicy="no-referrer"
                  className="w-8 h-8 rounded-full object-cover border border-stone-300"
                />
                <div className="hidden lg:block text-left">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold text-stone-800 leading-tight">
                      {currentUser.nome.split(' ')[0]}
                    </span>
                    <span className="text-[9px] bg-stone-800 text-white font-semibold px-1.5 py-0.2 rounded">
                      {currentUser.perfil}
                    </span>
                  </div>
                  <span className="text-[10px] text-stone-500 truncate block max-w-[120px]">
                    {currentUser.emailGoogle}
                  </span>
                </div>
              </div>

              <button
                onClick={logout}
                className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                title="Sair do sistema"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="text-xs font-semibold text-orange-700 bg-orange-50 border border-orange-200 hover:bg-orange-100 px-3 py-1.5 rounded-xl transition-colors"
            >
              Entrar com Google
            </button>
          )}
        </div>
      </div>

      {/* Mobile Member Filter Row */}
      <div className="md:hidden flex items-center overflow-x-auto px-4 py-2 bg-stone-50 border-t border-stone-200/60 no-scrollbar gap-1.5">
        <button
          onClick={() => setSelectedMemberId('TODOS')}
          className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg shrink-0 ${
            selectedMemberId === 'TODOS'
              ? 'bg-stone-900 text-white'
              : 'bg-white border border-stone-200 text-stone-600'
          }`}
        >
          Todos
        </button>
        {integrantes.map((int) => (
          <button
            key={int.id}
            onClick={() => setSelectedMemberId(int.id)}
            className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg shrink-0 flex items-center gap-1 ${
              selectedMemberId === int.id
                ? 'bg-white text-stone-900 border-2 border-orange-600 font-bold'
                : 'bg-white border border-stone-200 text-stone-600'
            }`}
          >
            <span>{int.avatar}</span>
            <span>{int.apelido}</span>
          </button>
        ))}
      </div>
    </header>
  );
};
