import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import toast from 'react-hot-toast';

const EMPTY = { name: '', description: '', price: '', duration: '', icon: '🚗' };
const ICONS  = ['🚿','✨','🧹','💎','🛡️','🚗','🧼','🪣','🔧','⭐'];

export default function AdminServices() {
  const { API } = useApp();
  const [services, setServices] = useState([]);
  const [form, setForm]         = useState(EMPTY);
  const [editing, setEditing]   = useState(null);
  const [showForm, setShowForm] = useState(false);

  const load = () => API.get('/services').then(r => setServices(r.data)).catch(() => {});
  useEffect(() => { load(); }, []);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const openCreate = () => { setForm(EMPTY); setEditing(null); setShowForm(true); };
  const openEdit   = s   => { setForm({ name: s.name, description: s.description, price: s.price, duration: s.duration, icon: s.icon }); setEditing(s._id); setShowForm(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const body = { ...form, price: Number(form.price), duration: Number(form.duration) };
    try {
      if (editing) {
        await API.put(`/services/${editing}`, body);
        toast.success('Serviço atualizado!');
      } else {
        await API.post('/services', body);
        toast.success('Serviço criado!');
      }
      setShowForm(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Desativar este serviço?')) return;
    await API.delete(`/services/${id}`);
    toast.success('Serviço desativado');
    load();
  };

  const seedDefaults = async () => {
    await API.post('/services/seed');
    toast.success('Serviços padrão criados!');
    load();
  };

  return (
    <div className="min-h-screen bg-[#0a0f1e] p-5 max-w-lg mx-auto">
      <div className="pt-4 mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-white font-bold">Serviços</h1>
          <p className="text-white/50 text-sm">{services.length} serviços ativos</p>
        </div>
        <div className="flex gap-2">
          {services.length === 0 && (
            <button onClick={seedDefaults} className="bg-white/10 border border-white/10 text-white text-sm font-semibold px-3 py-2 rounded-xl">
              Padrões
            </button>
          )}
          <button onClick={openCreate} className="bg-[#25D366] text-white text-sm font-bold px-4 py-2 rounded-xl">
            + Novo
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {services.map(s => (
          <div key={s._id} className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-4">
            <span className="text-3xl">{s.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold">{s.name}</p>
              <p className="text-white/50 text-xs mt-0.5">{s.description}</p>
              <p className="text-[#25D366] font-bold text-sm mt-1">R$ {s.price} · {s.duration} min</p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button onClick={() => openEdit(s)} className="bg-white/10 text-white/70 px-3 py-1.5 rounded-xl text-xs font-semibold">
                Editar
              </button>
              <button onClick={() => handleDelete(s._id)} className="bg-red-400/10 text-red-400 px-3 py-1.5 rounded-xl text-xs font-semibold">
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-end md:items-center justify-center p-4">
          <div className="bg-[#111827] rounded-3xl p-6 w-full max-w-sm border border-white/10">
            <h3 className="font-display text-xl text-white font-bold mb-5">
              {editing ? 'Editar Serviço' : 'Novo Serviço'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="flex gap-2 flex-wrap mb-1">
                {ICONS.map(ic => (
                  <button type="button" key={ic} onClick={() => setForm(f => ({...f, icon: ic}))}
                    className={`text-2xl p-2 rounded-xl transition-all ${form.icon === ic ? 'bg-[#25D366]/30 ring-1 ring-[#25D366]' : 'bg-white/5'}`}>
                    {ic}
                  </button>
                ))}
              </div>
              {[
                ['Nome',      'name',        'Lavagem Simples', 'text'],
                ['Descrição', 'description', 'Lavagem externa completa', 'text'],
                ['Preço (R$)','price',       '40', 'number'],
                ['Duração (min)','duration', '30', 'number'],
              ].map(([label, key, ph, type]) => (
                <div key={key}>
                  <label className="text-white/60 text-xs mb-1 block">{label}</label>
                  <input type={type} required placeholder={ph} value={form[key]} onChange={set(key)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#25D366] transition-colors" />
                </div>
              ))}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 border border-white/10 text-white/60 py-3 rounded-xl text-sm font-semibold">
                  Cancelar
                </button>
                <button type="submit"
                  className="flex-1 bg-[#25D366] text-white py-3 rounded-xl text-sm font-bold">
                  {editing ? 'Salvar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
