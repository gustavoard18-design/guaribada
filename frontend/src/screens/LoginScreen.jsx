import { useState } from 'react';
import { useApp } from '../context/AppContext';
import toast from 'react-hot-toast';

export default function LoginScreen() {
  const { login, setScreen } = useApp();
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(email, password);
      setScreen(user.role === 'admin' ? 'admin' : 'home');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao entrar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0f1e] flex flex-col items-center justify-center p-6">
      {/* Logo */}
      <div className="text-center mb-10">
        <div className="text-6xl mb-3">🚗</div>
        <h1 className="font-display text-4xl text-white font-bold">Guaribada</h1>
        <p className="text-white/50 mt-1 text-sm">Lava-Jato • Carmo, RJ</p>
      </div>

      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <div>
          <label className="block text-white/70 text-sm mb-1.5 font-medium">E-mail</label>
          <input
            type="email" required value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="seu@email.com"
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-white placeholder:text-white/30 focus:outline-none focus:border-[#25D366] transition-colors"
          />
        </div>
        <div>
          <label className="block text-white/70 text-sm mb-1.5 font-medium">Senha</label>
          <input
            type="password" required value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-white placeholder:text-white/30 focus:outline-none focus:border-[#25D366] transition-colors"
          />
        </div>

        <button
          type="submit" disabled={loading}
          className="w-full bg-[#25D366] hover:bg-[#1ebe5d] disabled:opacity-60 text-white font-bold py-4 rounded-2xl text-lg transition-all active:scale-95 mt-2"
        >
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>

      <p className="mt-8 text-white/50 text-sm">
        Não tem conta?{' '}
        <button onClick={() => setScreen('register')} className="text-[#25D366] font-semibold">
          Cadastre-se
        </button>
      </p>
    </div>
  );
}
