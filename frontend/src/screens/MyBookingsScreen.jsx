import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { openWhatsApp } from '../utils/whatsapp';
import toast from 'react-hot-toast';

const STATUS = {
  pending:     { label: 'Pendente',    color: 'text-yellow-400 bg-yellow-400/10' },
  confirmed:   { label: 'Confirmado',  color: 'text-[#25D366] bg-[#25D366]/10' },
  in_progress: { label: 'Em andamento',color: 'text-blue-400 bg-blue-400/10' },
  completed:   { label: 'Concluído',   color: 'text-white/50 bg-white/5' },
  cancelled:   { label: 'Cancelado',   color: 'text-red-400 bg-red-400/10' },
};

export default function MyBookingsScreen() {
  const { user, API, setScreen, setRescheduleBooking } = useApp();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading]   = useState(true);

  const load = () => {
    API.get('/bookings/my').then(r => setBookings(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const cancel = async (id) => {
    if (!window.confirm('Cancelar este agendamento?')) return;
    try {
      await API.delete(`/bookings/${id}`);
      toast.success('Agendamento cancelado');
      load();
    } catch {
      toast.error('Erro ao cancelar');
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center">
      <p className="text-white/50">Carregando...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0f1e] p-5 max-w-lg mx-auto">
      <div className="pt-4 mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-white font-bold">Meus Agendamentos</h1>
          <p className="text-white/50 text-sm mt-0.5">{bookings.length} no total</p>
        </div>
        <button
          onClick={() => setScreen('booking')}
          className="bg-[#25D366] text-white text-sm font-bold px-4 py-2 rounded-xl"
        >
          + Novo
        </button>
      </div>

      {bookings.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">📋</div>
          <p className="text-white/50">Nenhum agendamento ainda</p>
          <button
            onClick={() => setScreen('booking')}
            className="mt-4 text-[#25D366] font-semibold text-sm underline"
          >
            Agendar agora
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map(b => {
            const st = STATUS[b.status] || STATUS.pending;
            const dateObj = new Date(b.date);
            const isPast = dateObj < new Date();
            return (
              <div key={b._id} className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-white font-semibold">{b.service?.name}</p>
                    <p className="text-white/50 text-xs mt-0.5">
                      {dateObj.toLocaleDateString('pt-BR', { weekday:'short', day:'2-digit', month:'short' })}
                      {' às '}
                      {dateObj.toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' })}
                    </p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${st.color}`}>
                    {st.label}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#25D366] font-bold">R$ {b.totalPrice}</span>
                  <div className="flex gap-2">
                    {b.status === 'pending' && (
                      <button
                        onClick={() => openWhatsApp({ clientName: user.name, serviceName: b.service?.name, date: b.date })}
                        className="flex items-center gap-1.5 bg-[#25D366]/20 text-[#25D366] text-xs font-semibold px-3 py-1.5 rounded-xl"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                        WhatsApp
                      </button>
                    )}
                    {!isPast && !['cancelled','completed'].includes(b.status) && (
                      <>
                        <button
                          onClick={() => { setRescheduleBooking(b); setScreen('booking'); }}
                          className="text-blue-400/80 text-xs font-semibold px-3 py-1.5 rounded-xl bg-blue-400/10"
                        >
                          📅 Remarcar
                        </button>
                        <button
                          onClick={() => cancel(b._id)}
                          className="text-red-400/70 text-xs font-semibold px-3 py-1.5 rounded-xl bg-red-400/10"
                        >
                          Cancelar
                        </button>
                      </>
                    )}
                    {b.status === 'completed' && (
                      <button
                        onClick={() => setScreen('booking')}
                        className="text-[#25D366] text-xs font-semibold px-3 py-1.5 rounded-xl bg-[#25D366]/10"
                      >
                        🔄 Repetir
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
