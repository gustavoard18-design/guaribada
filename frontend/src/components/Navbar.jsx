import { useApp } from '../context/AppContext';

const NavItem = ({ icon, label, target, current, onClick }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-all
      ${current === target
        ? 'text-[#25D366]'
        : 'text-white/40 hover:text-white/70'}`}
  >
    <span className="text-xl">{icon}</span>
    <span className="text-[10px] font-medium">{label}</span>
  </button>
);

export default function Navbar() {
  const { screen, setScreen, user, logout } = useApp();
  const isAdmin = user?.role === 'admin';

  return (
    <>
      {/* Desktop top bar */}
      <nav className="hidden md:flex fixed top-0 left-0 right-0 z-50 bg-[#111827]/90 backdrop-blur border-b border-white/10 px-6 h-16 items-center justify-between">
        <button onClick={() => setScreen('home')} className="flex items-center gap-2">
          <span className="text-2xl">🚗</span>
          <span className="font-display text-white text-xl font-bold">Guaribada</span>
        </button>
        <div className="flex items-center gap-4">
          {isAdmin ? (
            <>
              <NavBtn onClick={() => setScreen('admin')} active={screen === 'admin'}>Dashboard</NavBtn>
              <NavBtn onClick={() => setScreen('adminservices')} active={screen === 'adminservices'}>Serviços</NavBtn>
            </>
          ) : (
            <>
              <NavBtn onClick={() => setScreen('home')} active={screen === 'home'}>Início</NavBtn>
              <NavBtn onClick={() => setScreen('booking')} active={screen === 'booking'}>Agendar</NavBtn>
              <NavBtn onClick={() => setScreen('mybookings')} active={screen === 'mybookings'}>Meus Pedidos</NavBtn>
            </>
          )}
          <button onClick={logout} className="text-white/50 hover:text-red-400 text-sm transition-colors">
            Sair
          </button>
        </div>
      </nav>

      {/* Mobile bottom bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#111827]/95 backdrop-blur border-t border-white/10 flex justify-around py-2 px-2">
        {isAdmin ? (
          <>
            <NavItem icon="📊" label="Dashboard" target="admin"         current={screen} onClick={() => setScreen('admin')} />
            <NavItem icon="⚙️" label="Serviços"  target="adminservices" current={screen} onClick={() => setScreen('adminservices')} />
            <NavItem icon="👤" label="Sair"       target="__logout"      current={screen} onClick={logout} />
          </>
        ) : (
          <>
            <NavItem icon="🏠" label="Início"    target="home"       current={screen} onClick={() => setScreen('home')} />
            <NavItem icon="📅" label="Agendar"   target="booking"    current={screen} onClick={() => setScreen('booking')} />
            <NavItem icon="📋" label="Pedidos"   target="mybookings" current={screen} onClick={() => setScreen('mybookings')} />
            <NavItem icon="👤" label="Sair"      target="__logout"   current={screen} onClick={logout} />
          </>
        )}
      </nav>
    </>
  );
}

function NavBtn({ children, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-all
        ${active ? 'bg-[#25D366]/20 text-[#25D366]' : 'text-white/60 hover:text-white'}`}
    >
      {children}
    </button>
  );
}
