import { useState, useEffect } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate
} from 'react-router-dom';
import Auth from './components/Auth/Auth';
import ExpenseForm from './components/ExpenseForm/ExpenseForm';
import Dashboard from './components/Dashboard/Dashboard';
import TransactionsPage from './components/Transactions/TransactionsPage';
import Profile from './components/Profile/Profile';
import Sidebar from './components/Sidebar/Sidebar';
import { supabase } from './services/supabaseClient';

function AppContent() {
  const [user, setUser] = useState(null);
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data?.session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Auth setUser={setUser} />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    );
  }

  return (
    <div className="flex">
      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        onLogout={async () => {
          await supabase.auth.signOut();
          setUser(null);
          navigate('/login');
        }}
      />
      <div className={`${collapsed ? 'ml-20' : 'ml-56'} w-full p-6 bg-gray-100 min-h-screen`}>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/form" element={<ExpenseForm />} />
          <Route path="/transactions" element={<TransactionsPage />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
