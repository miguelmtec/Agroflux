import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { KeyRound, ArrowRight } from 'lucide-react';

// Tela cheia, obrigatória, exibida quando a pessoa ainda está usando a senha
// provisória gerada por um administrador. Depois de trocar, ela é deslogada
// e precisa entrar de novo já com a senha definitiva.
export const TrocarSenhaModal: React.FC = () => {
  const { trocarSenha } = useFinance();
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sucesso, setSucesso] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (novaSenha.length < 6) {
      setError('A nova senha precisa ter pelo menos 6 caracteres.');
      return;
    }
    if (novaSenha !== confirmarSenha) {
      setError('As senhas novas não coincidem.');
      return;
    }
    setLoading(true);
    const resultado = await trocarSenha(senhaAtual, novaSenha);
    setLoading(false);
    if (!resultado.success) {
      setError(resultado.message || 'Algo deu errado.');
      return;
    }
    setSucesso(true);
  };

  if (sucesso) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 p-6">
        <div className="bg-white border border-stone-200 rounded-2xl shadow-xs p-8 max-w-sm w-full text-center">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-4">
            <KeyRound className="w-6 h-6" />
          </div>
          <h2 className="font-bold text-stone-900 mb-2">Senha atualizada!</h2>
          <p className="text-sm text-stone-600 mb-6">Recarregue a página e entre de novo com sua nova senha.</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-sm font-semibold"
          >
            Recarregar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 p-6">
      <div className="bg-white border border-stone-200 rounded-2xl shadow-xs w-full max-w-sm overflow-hidden">
        <div className="bg-gradient-to-br from-stone-900 via-stone-800 to-orange-950 p-6 text-white text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-400 mb-3">
            <KeyRound className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold tracking-tight">Defina sua senha</h2>
          <p className="text-xs text-stone-300 mt-1">
            Você está usando uma senha provisória. Escolha uma nova senha só sua pra continuar.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-3 text-xs">
          {error && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-center">
              <p className="text-sm font-semibold text-rose-800">{error}</p>
            </div>
          )}
          <div>
            <label className="block font-semibold text-stone-700 mb-1">Senha provisória (que você recebeu)</label>
            <input
              type="password"
              value={senhaAtual}
              onChange={(e) => setSenhaAtual(e.target.value)}
              className="w-full px-3 py-2 border border-stone-200 rounded-lg"
              required
            />
          </div>
          <div>
            <label className="block font-semibold text-stone-700 mb-1">Nova senha</label>
            <input
              type="password"
              placeholder="Mínimo 6 caracteres"
              value={novaSenha}
              onChange={(e) => setNovaSenha(e.target.value)}
              className="w-full px-3 py-2 border border-stone-200 rounded-lg"
              required
            />
          </div>
          <div>
            <label className="block font-semibold text-stone-700 mb-1">Confirme a nova senha</label>
            <input
              type="password"
              value={confirmarSenha}
              onChange={(e) => setConfirmarSenha(e.target.value)}
              className="w-full px-3 py-2 border border-stone-200 rounded-lg"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-stone-900 hover:bg-stone-800 disabled:opacity-60 text-white text-sm font-semibold py-2.5 rounded-xl flex items-center justify-center gap-1.5"
          >
            {loading ? 'Aguarde...' : 'Salvar nova senha'}
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>
      </div>
    </div>
  );
};
