import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { maskPhone } from '../utils/format';
import toast from 'react-hot-toast';

const Field = ({ label, type = 'text', value, onChange, placeholder, maxLength }) => (
  <div>
    <label className="block text-white/70 text-sm mb-1.5 font-medium">{label}</label>
    <input
      type={type} value={value} onChange={onChange} placeholder={placeholder} maxLength={maxLength}
      className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-white placeholder:text-white/30 focus:outline-none focus:border-[#25D366] transition-colors"
    />
  </div>
);

export default function RegisterScreen() {
  const { register, setScreen } = useApp();
  const [form, setForm]       = useState({ name: '', email: '', phone: '', password: '' });
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));
  const setPhone = (e) => setForm(f => ({ ...f, phone: maskPhone(e.target.value) }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) return toast.error('Senha deve ter no mínimo 6 caracteres');
    setLoading(true);
    try {
      await register(form.name, form.email, form.password, form.phone);
      setScreen('home');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao cadastrar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0f1e] flex flex-col items-center justify-center p-6">
      <div className="text-center mb-8">
        <div className="text-5xl mb-3">✨</div>
        <h1 className="font-display text-3xl text-white font-bold">Criar Conta</h1>
        <p className="text-white/50 mt-1 text-sm">Guaribada Lava-Jato</p>
      </div>
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <Field label="Nome completo" value={form.name} onChange={set('name')} placeholder="João Silva" />
        <Field label="E-mail" type="email" value={form.email} onChange={set('email')} placeholder="seu@email.com" />
        <Field label="WhatsApp" type="tel" value={form.phone} onChange={setPhone} placeholder="(24) 99999-9999" maxLength={15} />
        <Field label="Senha" type="password" value={form.password} onChange={set('password')} placeholder="••••••••" />
        <button
          type="submit" disabled={loading}
          className="w-full bg-[#25D366] hover:bg-[#1ebe5d] disabled:opacity-60 text-white font-bold py-4 rounded-2xl text-lg transition-all active:scale-95 mt-2"
        >
          {loading ? 'Criando conta...' : 'Criar Conta'}
        </button>
      </form>
      <p className="mt-8 text-white/50 text-sm">
        Já tem conta?{' '}
        <button onClick={() => setScreen('login')} className="text-[#25D366] font-semibold">
          Entrar
        </button>
      </p>
    </div>
  );
}
