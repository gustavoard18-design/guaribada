import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import toast from 'react-hot-toast';

const STATUS_OPTIONS = ['pending','confirmed','in_progress','completed','cancelled'];
const STATUS_LABELS  = { pending:'Pendente', confirmed:'Confirmado', in_progress:'Em andamento', completed:'Concluído', cancelled:'Cancelado' };
const STATUS_COLORS  = {
  pending:     'text-yellow-400 bg-yellow-400/10 border-yellow-400/30',
  confirmed:   'text-[#25D366] bg-[#25D366]/10 border-[#25D366]/30',
  in_progress: 'text-blue-400 bg-blue-400/10 border-blue-400/30',
  completed:   'text-white/50 bg-white/5 border-white/10',
  cancelled:   'text-red-400 bg-red-400/10 border-red-400/30',
};

export default function AdminDashboard() {
  const { API, setScreen } = useApp();
  const [stats, setStats]     = useState(null);
  const [bookings, setBookings] = useState([]);
  const [filterDate, setFilterDate] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [loading, setLoading] = useState(true);

  const loadStats = () => API.get('/bookings/dashboard').then(r => setStats(r.data)).catch(() => {});
  const loadBookings = () => {
    const params = new URLSearchParams();
    if (filterDate)   params.append('date', filterDate);
    if (filterStatus) params.append('status', filterStatus);
    API.get(`/bookings?${params}`)
      .then(r => setBookings(r.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadStats(); loadBookings(); }, [filterDate, filterStatus]);

  const updateStatus = async (id, status) => {
    try {
      await API.patch(`/bookings/${id}/status`, { status });
      toast.success('Status atualizado!');
      loadBookings(); loadStats();
    } catch { toast.error('Erro ao atualizar'); }
  };

  return (
    <div className="min-h-screen bg-[#0a0f1e] p-5 max-w-3xl mx-auto">
      <div className="pt-4 mb-8 flex items-center justify-between">
        <div>
          <p className="text-white/50 text-sm">Painel Admin</p>
          <h1 className="font-display text-2xl text-white font-bold">Dashboard</h1>
        </div>
        <button
          onClick={() => setScreen('adminservices')}
          className="bg-white/10 border border-white/10 text-white text-sm font-semibold px-4 py-2 rounded-xl"
        >
          ⚙️ Serviços
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <StatCard icon="📅" label="Hoje" value={stats.todayCount} color="text-blue-400" />
          <StatCard icon="⏳" label="Pendentes" value={stats.pending} color="text-yellow-400" />
          <StatCard icon="✅" label="Concluídos" value={stats.completed} color="text-[#25D366]" />
          <StatCard icon="💰" label="Receita" value={`R$${stats.revenue}`} color="text-[#25D366]" />
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <input
          type="date" value={filterDate}
          onChange={e => setFilterDate(e.target.value)}
          style={{ colorScheme: 'dark' }}
          className="flex-1 bg-[#1f2937] border border-white/20 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#25D366]"
        />
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="flex-1 bg-[#1f2937] border border-white/20 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#25D366]"
        >
          <option value="">Todos os status</option>
          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
        </select>
        {(filterDate || filterStatus) && (
          <button onClick={() => { setFilterDate(''); setFilterStatus(''); }} className="text-white/50 px-3">✕</button>
        )}
      </div>

      {/* Bookings list */}
      {loading ? (
        <p className="text-white/30 text-center py-10">Carregando...</p>
      ) : bookings.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">🗓️</div>
          <p className="text-white/50">Nenhum agendamento encontrado</p>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map(b => {
            const dateObj = new Date(b.date);
            return (
              <div key={b._id} className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <p className="text-white font-semibold">{b.client?.name}</p>
                    <p className="text-white/50 text-xs truncate">{b.client?.email}</p>
                    {b.client?.phone && <p className="text-white/40 text-xs">{b.client.phone}</p>}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-white font-medium text-sm">{b.service?.name}</p>
                    <p className="text-[#25D366] font-bold text-sm">R$ {b.totalPrice}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-white/50 text-xs">
                    {dateObj.toLocaleDateString('pt-BR', { weekday:'short', day:'2-digit', month:'short' })}
                    {' às '}
                    {dateObj.toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' })}
                  </p>
                  <select
                    value={b.status}
                    onChange={e => updateStatus(b._id, e.target.value)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-xl border cursor-pointer bg-[#1f2937] ${STATUS_COLORS[b.status]}`}
                  >
                    {STATUS_OPTIONS.map(s => <option key={s} value={s} className="bg-[#1f2937] text-white">{STATUS_LABELS[s]}</option>)}
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, color }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
      <p className="text-2xl mb-2">{icon}</p>
      <p className={`font-display text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-white/50 text-xs mt-0.5">{label}</p>
    </div>
  );
}
