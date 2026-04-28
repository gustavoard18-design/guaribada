import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';

const AppContext = createContext();

const API = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api' });

// Token atual da sessão Supabase (atualizado via onAuthStateChange)
let currentToken = null;

API.interceptors.request.use(cfg => {
  if (currentToken) cfg.headers.Authorization = `Bearer ${currentToken}`;
  return cfg;
});

export function AppProvider({ children }) {
  const [user, setUser]                                   = useState(null);
  const [loading, setLoading]                             = useState(true);
  const [screen, setScreen]                               = useState('home');
  const [rescheduleBooking, setRescheduleBooking]         = useState(null);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        currentToken = session.access_token;
        try {
          const { data } = await API.get('/auth/me');
          setUser(data.user);
        } catch {
          await supabase.auth.signOut();
          currentToken = null;
        }
      }
      setLoading(false);
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      currentToken = session?.access_token || null;
      if (event === 'SIGNED_OUT') {
        setUser(null);
        setScreen('home');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(
      error.message === 'Invalid login credentials' ? 'Credenciais inválidas' : error.message
    );

    currentToken = data.session.access_token;
    const { data: res } = await API.get('/auth/me');
    setUser(res.user);
    toast.success(`Bem-vindo, ${res.user.name}!`);
    return res.user;
  };

  const register = async (name, email, password, phone) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, phone } },
    });
    if (error) throw new Error(error.message);
    if (!data.session) throw new Error('Verifique seu e-mail para confirmar o cadastro.');

    currentToken = data.session.access_token;
    // Aguarda o trigger criar o perfil no banco
    await new Promise(r => setTimeout(r, 500));
    const { data: res } = await API.get('/auth/me');
    setUser(res.user);
    toast.success('Conta criada com sucesso!');
    return res.user;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    currentToken = null;
    setUser(null);
    setScreen('home');
    toast('Até logo!', { icon: '👋' });
  };

  return (
    <AppContext.Provider value={{
      user, loading, screen, setScreen,
      login, register, logout, API,
      rescheduleBooking, setRescheduleBooking,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
