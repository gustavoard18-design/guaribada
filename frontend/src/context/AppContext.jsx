import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const AppContext = createContext();

const API = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api' });

API.interceptors.request.use(cfg => {
  const token = localStorage.getItem('token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

export function AppProvider({ children }) {
  const [user, setUser]               = useState(null);
  const [loading, setLoading]         = useState(true);
  const [screen, setScreen]           = useState('home');
  const [rescheduleBooking, setRescheduleBooking] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      API.get('/auth/me')
        .then(r => setUser(r.data.user))
        .catch(() => localStorage.removeItem('token'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const { data } = await API.post('/auth/login', { email, password });
    localStorage.setItem('token', data.token);
    setUser(data.user);
    toast.success(`Bem-vindo, ${data.user.name}!`);
    return data.user;
  };

  const register = async (name, email, password, phone) => {
    const { data } = await API.post('/auth/register', { name, email, password, phone });
    localStorage.setItem('token', data.token);
    setUser(data.user);
    toast.success('Conta criada com sucesso!');
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setScreen('home');
    toast('Até logo!', { icon: '👋' });
  };

  return (
    <AppContext.Provider value={{ user, loading, screen, setScreen, login, register, logout, API, rescheduleBooking, setRescheduleBooking }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
