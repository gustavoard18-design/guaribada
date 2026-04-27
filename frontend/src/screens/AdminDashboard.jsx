import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { STATUS_LIST, STATUS_LABELS, STATUS_COLORS_BORDER } from '../utils/constants';
import { maskPhone } from '../utils/format';
import toast from 'react-hot-toast';

const STATUS_OPTIONS = STATUS_LIST;

const DAYS_AHEAD = 30;
const DAY_NAMES  = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
const MONTH_NAMES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

function addDays(date, n) { const d = new Date(date); d.setDate(d.getDate() + n); return d; }
function formatDate(d) { return d.toISOString().split('T')[0]; }

// ── Modal de novo agendamento ────────────────────────────────────────────────
function NewBookingModal({ onClose, onCreated, API }) {
  const [step, setStep]           = useState(1);
  const [services, setServices]   = useState([]);
  const [selected, setSelected]   = useState(null);
  const [selectedDate, setDate]   = useState(formatDate(new Date()));
  const [slots, setSlots]         = useState([]);
  const [selectedSlot, setSlot]   = useState('');
  const [client, setClient]       = useState({ name: '', phone: '' });
  const [loading, setLoading]     = useState(false);

  const dates = Array.from({ length: DAYS_AHEAD }, (_, i) => addDays(new Date(), i));

  useEffect(() => {
    API.get('/services').then(r => setServices(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (selected && selectedDate) {
      setSlots([]); setSlot('');
      API.get(`/bookings/available-slots?date=${selectedDate}&serviceId=${selected._id}`)
        .then(r => setSlots(r.data))
        .catch(() => toast.error('Erro ao carregar horários'));
    }
  }, [selected, selectedDate]);

  const handleCreate = async () => {
    if (!client.name.trim()) return toast.error('Nome do cliente é obrigatório');
    if (!client.phone.trim()) return toast.error('Telefone é obrigatório');
    setLoading(true);
    try {
      await API.post('/bookings', {
        serviceId: selected._id,
        date: new Date(`${selectedDate}T${selectedSlot}:00`).toISOString(),
        guest: client,
      });
      toast.success('Agendamento criado!');
      onCreated();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao criar agendamento');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full md:max-w-lg bg-[#0f1729] border border-white/10 rounded-t-3xl md:rounded-3xl p-6 max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-display text-xl text-white font-bold">Novo Agendamento</h2>
            <p className="text-white/40 text-xs mt-0.5">Criado pelo admin</p>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white text-xl transition-colors">✕</button>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center gap-2 mb-6">
          {['Serviço','Data/Hora','Cliente'].map((label, i) => (
            <div key={i} className="flex items-center gap-2 flex-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all
                ${step > i+1 ? 'bg-[#25D366] text-white' : step === i+1 ? 'bg-[#25D366]/30 text-[#25D366] border border-[#25D366]' : 'bg-white/10 text-white/30'}`}>
                {step > i+1 ? '✓' : i+1}
              </div>
              <span className={`text-xs hidden sm:block ${step === i+1 ? 'text-white/70' : 'text-white/30'}`}>{label}</span>
              {i < 2 && <div className={`h-px flex-1 ${step > i+1 ? 'bg-[#25D366]' : 'bg-white/10'}`} />}
            </div>
          ))}
        </div>

        {/* STEP 1 — Serviço */}
        {step === 1 && (
          <div>
            <div className="space-y-2 mb-5">
              {services.map(s => (
                <button key={s._id} onClick={() => setSelected(s)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left
                    ${selected?._id === s._id ? 'border-[#25D366] bg-[#25D366]/10' : 'border-white/10 bg-white/5 hover:bg-white/8'}`}>
                  <span className="text-2xl">{s.icon}</span>
                  <div className="flex-1">
                    <p className="text-white text-sm font-semibold">{s.name}</p>
                    <p className="text-white/40 text-xs">{s.duration} min</p>
                  </div>
                  <p className="text-[#25D366] font-bold text-sm">R$ {s.price}</p>
                </button>
              ))}
            </div>
            <button onClick={() => { if (!selected) return toast.error('Selecione um serviço'); setStep(2); }}
              className="w-full bg-[#25D366] text-white font-bold py-3.5 rounded-xl transition-all active:scale-95">
              Continuar →
            </button>
          </div>
        )}

        {/* STEP 2 — Data e horário */}
        {step === 2 && (
          <div>
            <p className="text-white/50 text-xs mb-4">Serviço: <span className="text-white">{selected?.name}</span></p>

            {/* Calendário */}
            <div className="flex gap-2 overflow-x-auto pb-2 mb-5 scrollbar-hide">
              {dates.map(d => {
                const key = formatDate(d);
                const isSun = d.getDay() === 0;
                return (
                  <button key={key} disabled={isSun} onClick={() => setDate(key)}
                    className={`flex-shrink-0 flex flex-col items-center p-2.5 rounded-xl border w-14 transition-all
                      ${isSun ? 'opacity-20 cursor-not-allowed border-white/5 bg-white/5'
                      : key === selectedDate ? 'border-[#25D366] bg-[#25D366]/20 text-white'
                      : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10'}`}>
                    <span className="text-xs">{DAY_NAMES[d.getDay()]}</span>
                    <span className="text-lg font-bold">{d.getDate()}</span>
                    <span className="text-xs text-white/40">{MONTH_NAMES[d.getMonth()]}</span>
                  </button>
                );
              })}
            </div>

            {/* Horários */}
            <p className="text-white/60 text-xs font-medium mb-2">Horários disponíveis</p>
            {slots.length === 0 ? (
              <p className="text-white/30 text-xs py-3 text-center">Carregando...</p>
            ) : (
              <div className="grid grid-cols-4 gap-2 mb-5">
                {slots.map(sl => (
                  <button key={sl.time} disabled={!sl.available} onClick={() => setSlot(sl.time)}
                    className={`py-2.5 rounded-xl text-sm font-semibold transition-all
                      ${!sl.available ? 'opacity-30 cursor-not-allowed bg-white/5 text-white/30'
                      : selectedSlot === sl.time ? 'bg-[#25D366] text-white'
                      : 'bg-white/10 text-white hover:bg-white/20'}`}>
                    {sl.time}
                  </button>
                ))}
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="flex-1 border border-white/10 text-white/60 font-semibold py-3.5 rounded-xl text-sm">← Voltar</button>
              <button onClick={() => { if (!selectedSlot) return toast.error('Selecione um horário'); setStep(3); }}
                className="flex-1 bg-[#25D366] text-white font-bold py-3.5 rounded-xl text-sm transition-all active:scale-95">
                Continuar →
              </button>
            </div>
          </div>
        )}

        {/* STEP 3 — Dados do cliente */}
        {step === 3 && (
          <div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-2 mb-5">
              <Row label="Serviço" value={selected?.name} />
              <Row label="Data" value={new Date(selectedDate + 'T12:00').toLocaleDateString('pt-BR', { weekday:'short', day:'2-digit', month:'short' })} />
              <Row label="Horário" value={selectedSlot} />
              <div className="border-t border-white/10 pt-2">
                <Row label="Total" value={`R$ ${selected?.price}`} highlight />
              </div>
            </div>

            <p className="text-white/70 text-sm font-medium mb-3">Dados do cliente</p>
            <div className="space-y-3 mb-5">
              <input
                placeholder="Nome completo *"
                value={client.name}
                onChange={e => setClient(c => ({ ...c, name: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-[#25D366] text-sm"
              />
              <input
                type="tel"
                placeholder="(24) 99999-9999 *"
                value={client.phone}
                maxLength={15}
                onChange={e => setClient(c => ({ ...c, phone: maskPhone(e.target.value) }))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-[#25D366] text-sm"
              />
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="flex-1 border border-white/10 text-white/60 font-semibold py-3.5 rounded-xl text-sm">← Voltar</button>
              <button onClick={handleCreate} disabled={loading}
                className="flex-1 bg-[#25D366] text-white font-bold py-3.5 rounded-xl text-sm transition-all active:scale-95 disabled:opacity-60">
                {loading ? 'Criando...' : '✓ Criar Agendamento'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value, highlight }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-white/50 text-xs">{label}</span>
      <span className={`font-semibold text-sm ${highlight ? 'text-[#25D366]' : 'text-white'}`}>{value}</span>
    </div>
  );
}

// ── Dashboard principal ──────────────────────────────────────────────────────
export default function AdminDashboard() {
  const { API, setScreen } = useApp();
  const [stats, setStats]       = useState(null);
  const [bookings, setBookings] = useState([]);
  const [filterDate, setFilterDate]     = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [loading, setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);

  const loadStats    = () => API.get('/bookings/dashboard').then(r => setStats(r.data)).catch(() => {});
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

  const handleCreated = () => { loadBookings(); loadStats(); };

  return (
    <div className="min-h-screen bg-[#0a0f1e] p-5 max-w-3xl mx-auto">

      {showModal && (
        <NewBookingModal
          API={API}
          onClose={() => setShowModal(false)}
          onCreated={handleCreated}
        />
      )}

      {/* Header */}
      <div className="pt-4 mb-8 flex items-center justify-between">
        <div>
          <p className="text-white/50 text-sm">Painel Admin</p>
          <h1 className="font-display text-2xl text-white font-bold">Dashboard</h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowModal(true)}
            className="bg-[#25D366] text-white text-sm font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-lg shadow-[#25D366]/20"
          >
            + Agendar
          </button>
          <button
            onClick={() => setScreen('adminservices')}
            className="bg-white/10 border border-white/10 text-white text-sm font-semibold px-4 py-2 rounded-xl"
          >
            ⚙️ Serviços
          </button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <StatCard icon="📅" label="Hoje"       value={stats.todayCount} color="text-blue-400" />
          <StatCard icon="⏳" label="Pendentes"  value={stats.pending}    color="text-yellow-400" />
          <StatCard icon="✅" label="Concluídos" value={stats.completed}  color="text-[#25D366]" />
          <StatCard icon="💰" label="Receita"    value={`R$${stats.revenue}`} color="text-[#25D366]" />
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

      {/* Lista de agendamentos */}
      {loading ? (
        <p className="text-white/30 text-center py-10">Carregando...</p>
      ) : bookings.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">🗓️</div>
          <p className="text-white/50 mb-4">Nenhum agendamento encontrado</p>
          <button
            onClick={() => setShowModal(true)}
            className="bg-[#25D366] text-white text-sm font-bold px-5 py-2.5 rounded-xl"
          >
            + Criar agendamento
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map(b => {
            const dateObj = new Date(b.date);
            return (
              <div key={b._id} className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-white font-semibold">{b.client?.name || b.guest?.name}</p>
                      {!b.client && <span className="text-white/30 text-xs border border-white/20 px-1.5 py-0.5 rounded-full">convidado</span>}
                    </div>
                    <p className="text-white/50 text-xs truncate">{b.client?.email || b.guest?.email || ''}</p>
                    {(b.client?.phone || b.guest?.phone) && (
                      <p className="text-white/40 text-xs">{b.client?.phone || b.guest?.phone}</p>
                    )}
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
                    className={`text-xs font-semibold px-3 py-1.5 rounded-xl border cursor-pointer bg-[#1f2937] ${STATUS_COLORS_BORDER[b.status]}`}
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
