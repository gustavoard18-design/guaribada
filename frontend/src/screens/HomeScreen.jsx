import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { STATUS_COLORS, STATUS_LABELS_LONG } from '../utils/constants';

export default function HomeScreen() {
  const { user, setScreen, API } = useApp();
  const [services, setServices] = useState([]);
  const [lastBooking, setLastBooking] = useState(null);

  useEffect(() => {
    API.get('/services').then(r => setServices(r.data)).catch(() => {});
    if (user) {
      API.get('/bookings/my').then(r => {
        const active = r.data.find(b => !['cancelled','completed'].includes(b.status));
        setLastBooking(active || r.data[0] || null);
      }).catch(() => {});
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0f1e] p-5 max-w-lg mx-auto">
      {/* Header */}
      <div className="pt-4 mb-8">
        <p className="text-white/50 text-sm">Bem-vindo de volta,</p>
        <h1 className="font-display text-3xl text-white font-bold">{user?.name?.split(' ')[0]} 👋</h1>
      </div>

      {/* Próximo agendamento */}
      {lastBooking && (
        <div className="bg-gradient-to-br from-[#25D366]/20 to-[#128C7E]/10 border border-[#25D366]/30 rounded-3xl p-5 mb-6">
          <p className="text-[#25D366] text-xs font-semibold uppercase tracking-widest mb-2">Próximo agendamento</p>
          <p className="text-white text-xl font-bold">{lastBooking.service?.name}</p>
          <p className="text-white/60 text-sm mt-1">
            {new Date(lastBooking.date).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
            {' às '}
            {new Date(lastBooking.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </p>
          <span className={`inline-block mt-3 px-3 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[lastBooking.status]}`}>
            {STATUS_LABELS_LONG[lastBooking.status]}
          </span>
        </div>
      )}

      {/* CTA Agendar */}
      <button
        onClick={() => setScreen('booking')}
        className="w-full bg-[#25D366] hover:bg-[#1ebe5d] text-white font-bold py-5 rounded-3xl text-lg transition-all active:scale-95 shadow-lg shadow-[#25D366]/20 mb-8 flex items-center justify-center gap-3"
      >
        <span className="text-2xl">📅</span>
        Agendar Serviço
      </button>

      {/* Serviços disponíveis */}
      <div className="mb-6">
        <h2 className="text-white font-display font-bold text-xl mb-4">Nossos Serviços</h2>
        <div className="grid grid-cols-2 gap-3">
          {services.map(s => (
            <button
              key={s._id}
              onClick={() => setScreen('booking')}
              className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl p-4 text-left transition-all active:scale-95"
            >
              <div className="text-3xl mb-2">{s.icon}</div>
              <p className="text-white font-semibold text-sm leading-tight">{s.name}</p>
              <p className="text-[#25D366] font-bold mt-1">R$ {s.price}</p>
              <p className="text-white/40 text-xs mt-0.5">{s.duration} min</p>
            </button>
          ))}
        </div>
      </div>

      {/* Botão agendar novamente */}
      {lastBooking?.status === 'completed' && (
        <button
          onClick={() => setScreen('booking')}
          className="w-full border border-white/10 hover:border-white/30 text-white/70 font-semibold py-4 rounded-2xl text-sm transition-all flex items-center justify-center gap-2"
        >
          🔄 Agendar novamente — {lastBooking.service?.name}
        </button>
      )}

      {/* Info */}
      <div className="mt-8 bg-white/3 rounded-2xl p-4 flex items-center gap-3">
        <span className="text-2xl">📍</span>
        <div>
          <p className="text-white font-medium text-sm">Guaribada Lava-Jato</p>
          <p className="text-white/50 text-xs">Av. José Ribeiro de Moura, 700 - Centro, Carmo - RJ · Ao lado do Posto Ribeiro · Seg–Sáb 8h–18h</p>
        </div>
      </div>
    </div>
  );
}
