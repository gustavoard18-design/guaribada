const router = require('express').Router();
const supabase = require('../lib/supabase');
const { authenticate, adminOnly, optionalAuthenticate } = require('../middleware/auth');

const MAX_PER_SLOT = 2;

// Converte linha do Supabase para o formato esperado pelo frontend
function fmtBooking(b) {
  if (!b) return null;
  return {
    _id:        b.id,
    client:     b.profile  || null,
    guest:      b.guest_name ? { name: b.guest_name, phone: b.guest_phone } : null,
    service:    b.service  ? { ...b.service, _id: b.service.id } : null,
    date:       b.date,
    status:     b.status,
    vehicle:    { plate: b.vehicle_plate || '', model: b.vehicle_model || '', color: b.vehicle_color || '' },
    notes:      b.notes,
    totalPrice: b.total_price,
    createdAt:  b.created_at,
  };
}

async function getOccupiedMinutes(dayStart, dayEnd, excludeId = null) {
  let query = supabase
    .from('bookings')
    .select('date, service:service_id(duration)')
    .gte('date', dayStart.toISOString())
    .lt('date',  dayEnd.toISOString())
    .neq('status', 'cancelled');

  if (excludeId) query = query.neq('id', excludeId);

  const { data: booked } = await query;
  const occupied = {};
  (booked || []).forEach(b => {
    const d = new Date(b.date);
    const slotStart = d.getHours() * 60 + d.getMinutes();
    for (let m = slotStart; m < slotStart + b.service.duration; m += 30)
      occupied[m] = (occupied[m] || 0) + 1;
  });
  return occupied;
}

function hasTimeConflict(occupied, bookingDate, duration) {
  const requestedMinute = bookingDate.getHours() * 60 + bookingDate.getMinutes();
  const slotsNeeded = Math.ceil(duration / 30);
  return Array.from({ length: slotsNeeded }, (_, i) => requestedMinute + i * 30)
              .some(m => (occupied[m] || 0) >= MAX_PER_SLOT);
}

// GET /api/bookings/available-slots  (público)
router.get('/available-slots', async (req, res) => {
  const { date, serviceId } = req.query;
  if (!date || !serviceId) return res.status(400).json({ error: 'Parâmetros ausentes' });

  const { data: service } = await supabase.from('services').select('*').eq('id', serviceId).single();
  if (!service) return res.status(404).json({ error: 'Serviço não encontrado' });

  const start = new Date(date); start.setHours(8,  0, 0, 0);
  const end   = new Date(date); end.setHours(18, 0, 0, 0);
  const occupied = await getOccupiedMinutes(start, end);

  const slots = [];
  for (let m = 8 * 60; m <= 17 * 60 + 30; m += 30) {
    const slotEnd = m + service.duration;
    const available =
      ![...Array(Math.ceil(service.duration / 30))].some((_, i) => (occupied[m + i * 30] || 0) >= MAX_PER_SLOT)
      && slotEnd <= 18 * 60;
    const hh = String(Math.floor(m / 60)).padStart(2, '0');
    const mm = String(m % 60).padStart(2, '0');
    slots.push({ time: `${hh}:${mm}`, available });
  }
  res.json(slots);
});

// POST /api/bookings  (autenticado ou convidado)
router.post('/', optionalAuthenticate, async (req, res) => {
  try {
    const { serviceId, date, vehicle, notes, guest } = req.body;

    if (!serviceId || !date) return res.status(400).json({ error: 'Serviço e data são obrigatórios' });

    // Precisa de usuário logado OU dados do convidado
    const isGuestBooking = !!guest?.name;
    if (!req.user && !isGuestBooking)
      return res.status(400).json({ error: 'Nome é obrigatório para agendamento sem cadastro' });
    if (!req.user && !guest?.phone?.trim())
      return res.status(400).json({ error: 'Telefone é obrigatório para agendamento sem cadastro' });

    const { data: service } = await supabase.from('services').select('*').eq('id', serviceId).single();
    if (!service) return res.status(404).json({ error: 'Serviço não encontrado' });

    const bookingDate = new Date(date);
    if (isNaN(bookingDate.getTime())) return res.status(400).json({ error: 'Data inválida' });

    const dayStart = new Date(bookingDate); dayStart.setHours(0, 0, 0, 0);
    const dayEnd   = new Date(bookingDate); dayEnd.setHours(23, 59, 59, 999);

    const occupied = await getOccupiedMinutes(dayStart, dayEnd);
    if (hasTimeConflict(occupied, bookingDate, service.duration))
      return res.status(409).json({ error: 'Horário não disponível. Escolha outro horário.' });

    const bookingData = {
      service_id:    serviceId,
      date:          bookingDate.toISOString(),
      vehicle_plate: vehicle?.plate || null,
      vehicle_model: vehicle?.model || null,
      vehicle_color: vehicle?.color || null,
      notes:         notes || null,
      total_price:   service.price,
      status:        'pending',
    };

    // Se guest data for passado explicitamente → agendamento de convidado
    // (admin criando para cliente ou fluxo sem cadastro)
    if (isGuestBooking) {
      bookingData.guest_name  = guest.name;
      bookingData.guest_phone = guest.phone;
    } else {
      bookingData.client_id = req.user.id;
    }

    const { data: booking, error } = await supabase
      .from('bookings')
      .insert(bookingData)
      .select('*, service:service_id(*), profile:profiles!client_id(name, email, phone)')
      .single();

    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json(fmtBooking(booking));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/bookings/my
router.get('/my', authenticate, async (req, res) => {
  const { data, error } = await supabase
    .from('bookings')
    .select('*, service:service_id(*)')
    .eq('client_id', req.user.id)
    .order('date', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json((data || []).map(fmtBooking));
});

// GET /api/bookings  (admin)
router.get('/', authenticate, adminOnly, async (req, res) => {
  const { date, status } = req.query;

  let query = supabase
    .from('bookings')
    .select('*, service:service_id(*), profile:profiles!client_id(name, email, phone)')
    .order('date', { ascending: true });

  if (status) query = query.eq('status', status);
  if (date) {
    const dayStart = new Date(date); dayStart.setHours(0, 0, 0, 0);
    const dayEnd   = new Date(date); dayEnd.setHours(23, 59, 59, 999);
    query = query.gte('date', dayStart.toISOString()).lt('date', dayEnd.toISOString());
  }

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json((data || []).map(fmtBooking));
});

// GET /api/bookings/dashboard  (admin)
router.get('/dashboard', authenticate, adminOnly, async (req, res) => {
  const today    = new Date(); today.setHours(0, 0, 0, 0);
  const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);

  const [
    { count: total },
    { count: todayCount },
    { count: pending },
    { count: completed },
    { data: revenueData },
  ] = await Promise.all([
    supabase.from('bookings').select('*', { count: 'exact', head: true }),
    supabase.from('bookings').select('*', { count: 'exact', head: true })
      .gte('date', today.toISOString()).lte('date', todayEnd.toISOString()),
    supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
    supabase.from('bookings').select('total_price').eq('status', 'completed'),
  ]);

  const revenue = (revenueData || []).reduce((sum, b) => sum + (b.total_price || 0), 0);
  res.json({ total, todayCount, pending, completed, revenue });
});

// PATCH /api/bookings/:id/reschedule
router.patch('/:id/reschedule', authenticate, async (req, res) => {
  try {
    const { date } = req.body;
    if (!date) return res.status(400).json({ error: 'Nova data é obrigatória' });

    const { data: booking } = await supabase
      .from('bookings').select('*, service:service_id(duration)').eq('id', req.params.id).single();
    if (!booking) return res.status(404).json({ error: 'Agendamento não encontrado' });

    if (booking.client_id !== req.user.id && req.user.role !== 'admin')
      return res.status(403).json({ error: 'Sem permissão' });

    if (['cancelled', 'completed'].includes(booking.status))
      return res.status(400).json({ error: 'Este agendamento não pode ser remarcado' });

    const newDate = new Date(date);
    if (isNaN(newDate.getTime())) return res.status(400).json({ error: 'Data inválida' });

    const dayStart = new Date(newDate); dayStart.setHours(0, 0, 0, 0);
    const dayEnd   = new Date(newDate); dayEnd.setHours(23, 59, 59, 999);

    const occupied = await getOccupiedMinutes(dayStart, dayEnd, req.params.id);
    if (hasTimeConflict(occupied, newDate, booking.service.duration))
      return res.status(409).json({ error: 'Horário não disponível. Escolha outro horário.' });

    const { data: updated, error } = await supabase
      .from('bookings')
      .update({ date: newDate.toISOString(), status: 'pending' })
      .eq('id', req.params.id)
      .select('*, service:service_id(*), profile:profiles!client_id(name, email, phone)')
      .single();

    if (error) return res.status(400).json({ error: error.message });
    res.json(fmtBooking(updated));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PATCH /api/bookings/:id/status  (admin)
router.patch('/:id/status', authenticate, adminOnly, async (req, res) => {
  const { status } = req.body;
  const { data, error } = await supabase
    .from('bookings')
    .update({ status })
    .eq('id', req.params.id)
    .select('*, service:service_id(*), profile:profiles!client_id(name, email, phone)')
    .single();

  if (error || !data) return res.status(404).json({ error: 'Agendamento não encontrado' });
  res.json(fmtBooking(data));
});

// DELETE /api/bookings/:id  (cancelar)
router.delete('/:id', authenticate, async (req, res) => {
  const { data: booking } = await supabase
    .from('bookings').select('client_id').eq('id', req.params.id).single();
  if (!booking) return res.status(404).json({ error: 'Agendamento não encontrado' });

  const isOwner = booking.client_id === req.user.id;
  if (!isOwner && req.user.role !== 'admin')
    return res.status(403).json({ error: 'Sem permissão' });

  await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', req.params.id);
  res.json({ message: 'Agendamento cancelado' });
});

module.exports = router;
