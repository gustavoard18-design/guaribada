import { Toaster } from 'react-hot-toast';
import { AppProvider, useApp } from './context/AppContext';
import LoginScreen    from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import HomeScreen     from './screens/HomeScreen';
import BookingScreen  from './screens/BookingScreen';
import MyBookingsScreen from './screens/MyBookingsScreen';
import AdminDashboard from './screens/AdminDashboard';
import AdminServices  from './screens/AdminServices';
import Navbar         from './components/Navbar';

function Router() {
  const { screen, user, loading } = useApp();

  if (loading) return (
    <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center">
      <div className="text-center">
        <div className="text-5xl mb-4 animate-bounce">🚗</div>
        <p className="text-white/60 font-display">Guaribada</p>
      </div>
    </div>
  );

  const screens = {
    login:        <LoginScreen />,
    register:     <RegisterScreen />,
    home:         <HomeScreen />,
    booking:      <BookingScreen />,
    guestbooking: <BookingScreen guestMode />,
    mybookings:   <MyBookingsScreen />,
    admin:        <AdminDashboard />,
    adminservices: <AdminServices />,
  };

  return (
    <div className="min-h-screen bg-[#0a0f1e] font-sans">
      {user && <Navbar />}
      <div className={user ? 'pb-20 md:pb-0 md:pt-16' : ''}>
        {!user && screen !== 'register' ? <LoginScreen /> : screens[screen] || <HomeScreen />}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Toaster
        position="top-center"
        toastOptions={{
          style: { background: '#1f2937', color: '#fff', borderRadius: 12 },
        }}
      />
      <Router />
    </AppProvider>
  );
}
