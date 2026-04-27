import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { openWhatsApp } from '../utils/whatsapp';
import toast from 'react-hot-toast';

const DAYS_AHEAD = 14;

function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function formatDate(d) {
  return d.toISOString().split('T')[0];
}

export default function BookingScreen({ guestMode = false }) {
  const { user, API, setScreen, rescheduleBooking, setRescheduleBooking } = useApp();
  const isReschedule = !!rescheduleBooking;

  const [step, setStep]               = useState(isReschedule ? 2 : 1);
  const [services, setServices]       = useState([]);
  const [selected, setSelected]       = useState(isReschedule ? rescheduleBooking.service : null);
  const [selectedDate, setSelectedDate] = useState(formatDate(new Date()));
  const [slots, setSlots]             = useState([]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [vehicle, setVehicle]         = useState({ plate: '', model: '', color: '' });
  const [guest, setGuest]             = useState({ name: '', phone: '' });
  const [loading, setLoading]         = useState(false);
  const [booking, setBooking]         = useState(null);

  const dates    = Array.from({ length: DAYS_AHEAD }, (_, i) => addDays(new Date(), i + 1));
  const dayNames = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
  const monthNames = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

  useEffect(() => {
    API.get('/services').then(r => setServices(r.data)).catch(() => {});
    return () => { if (isReschedule) setRescheduleBooking(null); };
  }, []);

  useEffect(() => {
    if (selected && selectedDate) {
      setSlots([]);
      setSelectedSlot('');
      API.get(`/bookings/available-slots?date=${selectedDate}&serviceId=${selected._id}`)
        .then(r => setSlots(r.data))
        .catch(() => toast.error('Erro ao carregar horários'));
    }
  }, [selected, selectedDate]);

  const handleBook = async () => {
    if (guestMode) {
      if (!guest.name.trim()) return toast.error('Nome é obrigatório');
      if (!guest.phone.trim()) return toast.error('Telefone é obrigatório');
    }
    setLoading(true);
    try {
      const dateTime = new Date(`${selectedDate}T${selectedSlot}:00`);

      if (isReschedule) {
        const res = await API.patch(`/bookings/${rescheduleBooking._id}/reschedule`, {
          date: dateTime.toISOString(),
        });
        setBooking(res.data);
        setRescheduleBooking(null);
        toast.success('Agendamento remarcado!');
      } else {
        const payload = { serviceId: selected._id, date: dateTime.toISOString(), vehicle };
        if (guestMode) payload.guest = guest;
        const res = await API.post('/bookings', payload);
        setBooking(res.data);
        toast.success('Agendamento criado!');
      }
      setStep(4);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao agendar');
    } finally {
      setLoading(false);
    }
  };

  const clientName = guestMode ? guest.name : (user?.name || '');
  const successBooking = booking
    ? { clientName, serviceName: selected?.name, date: booking.date }
    : null;

  return (
    <div className="min-h-screen bg-[#0a0f1e] p-5 max-w-lg mx-auto">

      {/* Header para guest / remarcar */}
      {(guestMode || isReschedule) && (
        <div className="pt-6 pb-2 flex items-center gap-3">
          <button
            onClick={() => { setRescheduleBooking(null); setScreen(guestMode ? 'login' : 'mybookings'); }}
            className="text-white/50 hover:text-white transition-colors"
          >
            ← Voltar
          </button>
          <span className="text-white/30">|</span>
          <span className="text-white/70 text-sm font-medium">
            {isReschedule ? `Remarcar: ${rescheduleBooking.service?.name}` : 'Agendar sem cadastro'}
          </span>
        </div>
      )}

      {/* Progress (não mostra em remarcar pois começa no passo 2) */}
      {!isReschedule && step < 4 && (
        <div className="flex items-center gap-2 mb-8 pt-4">
          {[1,2,3].map(n => (
            <div key={n} className="flex items-center gap-2 flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all
                ${step > n ? 'bg-[#25D366] text-white'
                : step === n ? 'bg-[#25D366]/30 text-[#25D366] border border-[#25D366]'
                : 'bg-white/10 text-white/30'}`}>
                {step > n ? '✓' : n}
              </div>
              {n < 3 && <div className={`h-0.5 flex-1 rounded ${step > n ? 'bg-[#25D366]' : 'bg-white/10'}`} />}
            </div>
          ))}
        </div>
      )}

      {isReschedule && step < 4 && (
        <div className="flex items-center gap-2 mb-8 pt-2">
          {[2,3].map((n, i) => (
            <div key={n} className="flex items-center gap-2 flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all
                ${step > n ? 'bg-[#25D366] text-white'
                : step === n ? 'bg-[#25D366]/30 text-[#25D366] border border-[#25D366]'
                : 'bg-white/10 text-white/30'}`}>
                {step > n ? '✓' : i + 1}
              </div>
              {i < 1 && <div className={`h-0.5 flex-1 rounded ${step > n ? 'bg-[#25D366]' : 'bg-white/10'}`} />}
            </div>
          ))}
        </div>
      )}

      {/* STEP 1 — Serviço (só no modo normal) */}
      {step === 1 && !isReschedule && (
        <div>
          <h2 className="font-display text-2xl text-white font-bold mb-1">Escolha o serviço</h2>
          <p className="text-white/50 text-sm mb-6">Selecione o que deseja fazer</p>
          <div className="space-y-3">
            {services.map(s => (
              <button
                key={s._id}
                onClick={() => setSelected(s)}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all text-left
                  ${selected?._id === s._id
                    ? 'border-[#25D366] bg-[#25D366]/10'
                    : 'border-white/10 bg-white/5 hover:bg-white/8'}`}
              >
                <span className="text-3xl">{s.icon}</span>
                <div className="flex-1">
                  <p className="text-white font-semibold">{s.name}</p>
                  <p className="text-white/50 text-xs mt-0.5">{s.description} · {s.duration} min</p>
                </div>
                <p className="text-[#25D366] font-bold">R$ {s.price}</p>
              </button>
            ))}
          </div>
          <button
            onClick={() => { if (!selected) return toast.error('Selecione um serviço'); setStep(2); }}
            className="w-full bg-[#25D366] text-white font-bold py-4 rounded-2xl text-lg mt-6 transition-all active:scale-95"
          >
            Continuar →
          </button>
        </div>
      )}

      {/* STEP 2 — Data e horário */}
      {step === 2 && (
        <div>
          <h2 className="font-display text-2xl text-white font-bold mb-1">
            {isReschedule ? 'Novo horário' : 'Data e horário'}
          </h2>
          <p className="text-white/50 text-sm mb-5">
            Serviço: <span className="text-white">{selected?.name}</span>
          </p>

          {/* Calendário horizontal */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
            {dates.map(d => {
              const key = formatDate(d);
              const isSelected = key === selectedDate;
              const isSun = d.getDay() === 0;
              return (
                <button
                  key={key}
                  disabled={isSun}
                  onClick={() => setSelectedDate(key)}
                  className={`flex-shrink-0 flex flex-col items-center p-3 rounded-2xl border w-16 transition-all
                    ${isSun ? 'opacity-30 cursor-not-allowed border-white/5 bg-white/5'
                    : isSelected ? 'border-[#25D366] bg-[#25D366]/20 text-white'
                    : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10'}`}
                >
                  <span className="text-xs font-medium">{dayNames[d.getDay()]}</span>
                  <span className="text-xl font-bold mt-0.5">{d.getDate()}</span>
                  <span className="text-xs text-white/50">{monthNames[d.getMonth()]}</span>
                </button>
              );
            })}
          </div>

          {/* Horários */}
          <p className="text-white/70 text-sm font-medium mb-3">Horários disponíveis</p>
          {slots.length === 0 ? (
            <p className="text-white/30 text-sm py-4 text-center">Carregando horários...</p>
          ) : (
            <div className="grid grid-cols-4 gap-2 mb-6">
              {slots.map(sl => (
                <button
                  key={sl.time}
                  disabled={!sl.available}
                  onClick={() => setSelectedSlot(sl.time)}
                  className={`py-3 rounded-xl text-sm font-semibold transition-all
                    ${!sl.available ? 'opacity-30 cursor-not-allowed bg-white/5 text-white/30'
                    : selectedSlot === sl.time ? 'bg-[#25D366] text-white'
                    : 'bg-white/10 text-white hover:bg-white/20'}`}
                >
                  {sl.time}
                </button>
              ))}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => isReschedule ? setScreen('mybookings') : setStep(1)}
              className="flex-1 border border-white/10 text-white/70 font-semibold py-4 rounded-2xl"
            >
              ← Voltar
            </button>
            <button
              onClick={() => { if (!selectedSlot) return toast.error('Selecione um horário'); setStep(3); }}
              className="flex-1 bg-[#25D366] text-white font-bold py-4 rounded-2xl transition-all active:scale-95"
            >
              Continuar →
            </button>
          </div>
        </div>
      )}

      {/* STEP 3 — Confirmação */}
      {step === 3 && (
        <div>
          <h2 className="font-display text-2xl text-white font-bold mb-1">
            {isReschedule ? 'Confirmar remarcação' : 'Confirmar'}
          </h2>
          <p className="text-white/50 text-sm mb-6">Revise os dados do agendamento</p>

          {isReschedule && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-4 flex items-center gap-3">
              <span className="text-2xl">📅</span>
              <div className="text-sm">
                <p className="text-white/50">Data atual</p>
                <p className="text-white/70">
                  {new Date(rescheduleBooking.date).toLocaleDateString('pt-BR', { weekday:'long', day:'2-digit', month:'long' })}
                  {' às '}
                  {new Date(rescheduleBooking.date).toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' })}
                </p>
              </div>
            </div>
          )}

          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3 mb-6">
            <Row label="Serviço" value={selected?.name} />
            <Row label={isReschedule ? 'Nova data' : 'Data'} value={new Date(selectedDate + 'T12:00').toLocaleDateString('pt-BR', { weekday:'long', day:'2-digit', month:'long' })} />
            <Row label={isReschedule ? 'Novo horário' : 'Horário'} value={selectedSlot} />
            <Row label="Duração" value={`${selected?.duration} minutos`} />
            <div className="border-t border-white/10 pt-3">
              <Row label="Total" value={`R$ ${selected?.price}`} highlight />
            </div>
          </div>

          {/* Dados do convidado (só no modo guest) */}
          {guestMode && (
            <>
              <p className="text-white/70 text-sm font-medium mb-3">
                Seus dados <span className="text-red-400 text-xs">*obrigatório</span>
              </p>
              <div className="space-y-3 mb-4">
                <input
                  placeholder="Seu nome completo *"
                  value={guest.name}
                  onChange={e => setGuest(g => ({ ...g, name: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-[#25D366] text-sm transition-colors"
                />
                <input
                  placeholder="Telefone / WhatsApp *"
                  value={guest.phone}
                  onChange={e => setGuest(g => ({ ...g, phone: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-[#25D366] text-sm transition-colors"
                />
              </div>
            </>
          )}

          {/* Veículo (opcional) */}
          {!isReschedule && (
            <>
              <p className="text-white/70 text-sm font-medium mb-3">
                Dados do veículo <span className="text-white/30">(opcional)</span>
              </p>
              <div className="space-y-3 mb-6">
                {[['Placa','plate','ABC-1234'],['Modelo','model','Fiat Argo'],['Cor','color','Prata']].map(([label, key, ph]) => (
                  <input
                    key={key}
                    placeholder={`${label} — ${ph}`}
                    value={vehicle[key]}
                    onChange={e => setVehicle(v => ({ ...v, [key]: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-[#25D366] text-sm transition-colors"
                  />
                ))}
              </div>
            </>
          )}

          <div className="flex gap-3 mt-2">
            <button onClick={() => setStep(2)} className="flex-1 border border-white/10 text-white/70 font-semibold py-4 rounded-2xl">
              ← Voltar
            </button>
            <button
              onClick={handleBook} disabled={loading}
              className="flex-1 bg-[#25D366] text-white font-bold py-4 rounded-2xl transition-all active:scale-95 disabled:opacity-60"
            >
              {loading ? 'Aguarde...' : isReschedule ? 'Remarcar' : 'Confirmar'}
            </button>
          </div>
        </div>
      )}

      {/* STEP 4 — Sucesso */}
      {step === 4 && booking && (
        <div className="flex flex-col items-center text-center pt-8">
          <div className="w-24 h-24 bg-[#25D366]/20 rounded-full flex items-center justify-center text-5xl mb-6">
            {isReschedule ? '📅' : '✅'}
          </div>
          <h2 className="font-display text-3xl text-white font-bold mb-2">
            {isReschedule ? 'Remarcado!' : 'Agendado!'}
          </h2>
          <p className="text-white/60 mb-8">
            {isReschedule ? 'Seu agendamento foi remarcado com sucesso.' : 'Seu agendamento foi criado com sucesso.'}
          </p>

          <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-left space-y-2 mb-8">
            <Row label="Serviço" value={selected?.name} />
            <Row
              label="Data / Hora"
              value={`${new Date(booking.date).toLocaleDateString('pt-BR')} às ${new Date(booking.date).toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' })}`}
            />
            <Row label="Valor" value={`R$ ${selected?.price}`} highlight />
          </div>

          <button
            onClick={() => openWhatsApp(successBooking)}
            className="w-full bg-[#25D366] hover:bg-[#1ebe5d] text-white font-bold py-5 rounded-2xl text-lg transition-all active:scale-95 flex items-center justify-center gap-3 shadow-xl shadow-[#25D366]/20 mb-3"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Confirmar via WhatsApp
          </button>

          {!guestMode && (
            <button onClick={() => setScreen('mybookings')} className="text-white/50 text-sm underline">
              Ver meus agendamentos
            </button>
          )}
          {guestMode && (
            <button onClick={() => setScreen('login')} className="text-white/50 text-sm underline">
              Criar conta para gerenciar agendamentos
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function Row({ label, value, highlight }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-white/50 text-sm">{label}</span>
      <span className={`font-semibold text-sm ${highlight ? 'text-[#25D366] text-base' : 'text-white'}`}>{value}</span>
    </div>
  );
}
