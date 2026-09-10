import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { ShieldCheck, Lock, ArrowRight, LogOut } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose?: () => void;
  /** Quando true, é a tela cheia de login (sem opção de fechar). */
  fullScreen?: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, fullScreen }) => {
  const { currentUser, logout, login, signUp } = useFinance();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [nomeUsuario, setNomeUsuario] = useState('');
  const [nomeFamilia, setNomeFamilia] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const result =
      mode === 'login'
        ? await login(email, senha)
        : await signUp(email, senha, nomeUsuario.trim(), nomeFamilia.trim());
    setLoading(false);
    if (!result.success) {
      setError(result.message || 'Algo deu errado.');
      return;
    }
    if (onClose) onClose();
  };

  // Usuário já autenticado: modal vira um painel simples de conta.
  if (currentUser && !fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-4">
        <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-sm overflow-hidden">
          <div className="p-6 text-center">
            <img
              src={currentUser.foto}
              alt={currentUser.nome}
              className="w-16 h-16 rounded-full object-cover border border-stone-200 mx-auto mb-3"
            />
            <h3 className="font-bold text-stone-900">{currentUser.nome}</h3>
            <p className="text-xs text-stone-500 mb-4">{currentUser.emailGoogle}</p>
            <button
              onClick={() => {
                logout();
                if (onClose) onClose();
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-sm font-semibold"
            >
              <LogOut className="w-4 h-4" /> Sair da conta
            </button>
            {onClose && (
              <button onClick={onClose} className="mt-2 text-xs text-stone-500 hover:text-stone-700">
                Fechar
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${fullScreen ? 'min-h-screen' : 'fixed inset-0 z-50 p-4'} flex items-center justify-center bg-stone-900/60 backdrop-blur-xs`}>
      <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-md overflow-hidden">
        <div className="bg-gradient-to-br from-stone-900 via-stone-800 to-orange-950 p-6 text-white text-center relative">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-400 mb-3 shadow-inner">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold tracking-tight">AgroFlux</h2>
          <p className="text-xs text-stone-300 mt-1">Gestão financeira familiar</p>
        </div>

        <div className="p-6">
          <div className="flex gap-2 mb-5 bg-stone-100 rounded-xl p-1">
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                mode === 'login' ? 'bg-white shadow-xs text-stone-900' : 'text-stone-500'
              }`}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => setMode('signup')}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                mode === 'signup' ? 'bg-white shadow-xs text-stone-900' : 'text-stone-500'
              }`}
            >
              Criar conta
            </button>
          </div>

          {error && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-center mb-4">
              <p className="text-sm font-semibold text-rose-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === 'signup' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Nome da família / empresa</label>
                  <input
                    type="text"
                    placeholder="Ex: Família Ribeiro"
                    value={nomeFamilia}
                    onChange={(e) => setNomeFamilia(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Seu nome</label>
                  <input
                    type="text"
                    placeholder="Seu nome completo"
                    value={nomeUsuario}
                    onChange={(e) => setNomeUsuario(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                    required
                  />
                </div>
              </>
            )}
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">E-mail</label>
              <input
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Senha</label>
              <input
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                minLength={6}
                className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-stone-900 hover:bg-stone-800 disabled:opacity-60 text-white text-sm font-semibold py-2.5 px-3 rounded-xl transition-colors flex items-center justify-center gap-1.5"
            >
              {loading ? 'Aguarde...' : mode === 'login' ? 'Entrar' : 'Criar conta'}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-stone-100 flex items-center justify-center text-[11px] text-stone-500">
            <span className="flex items-center gap-1">
              <Lock className="w-3 h-3 text-emerald-600" />
              Seus dados ficam isolados por família
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
