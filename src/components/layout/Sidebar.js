import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, PlusCircle, History, Wallet, 
  User, LogOut, ChevronLeft, ChevronRight, BarChart2 
} from 'lucide-react';

const Sidebar = ({ user, onLogout, collapsed, setCollapsed }) => {
  const location = useLocation();

  // Extract initials from email (e.g., "john@example.com" -> "JO")
  const userInitials = user?.email?.substring(0, 2).toUpperCase() || '??';

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Add Transaction', path: '/form', icon: PlusCircle },
    { name: 'History', path: '/transactions', icon: History },
    { name: 'Money Tracker', path: '/money-tracker', icon: Wallet },
    { name: 'Statistics', path: '/statistics', icon: BarChart2 },
    { name: 'Profile', path: '/profile', icon: User }
  ];

  return (
    <aside className={`fixed top-0 left-0 h-screen z-50 bg-slate-950 text-slate-300 transition-all duration-300 border-r border-slate-800 ${collapsed ? 'w-20' : 'w-64'}`}>
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="h-20 flex items-center justify-between px-6 border-b border-slate-800/50">
          {!collapsed && <span className="font-bold text-xl text-white tracking-tight uppercase italic">Spendiz by Saran</span>}
          <button onClick={() => setCollapsed(!collapsed)} className="p-1.5 rounded-lg bg-slate-900 hover:bg-indigo-600 transition-colors">
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 px-3 space-y-1">
          {navItems.map((item) => (
            <Link key={item.path} to={item.path} className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${location.pathname === item.path ? 'bg-indigo-600 text-white' : 'hover:bg-slate-900 hover:text-white'}`}>
              <item.icon size={20} />
              {!collapsed && <span className="font-medium text-sm">{item.name}</span>}
            </Link>
          ))}
        </nav>

        {/* ✅ NEW: Global Identity Badge */}
        <div className="p-4 border-t border-slate-800/50">
          <div className={`flex items-center gap-3 p-2 rounded-2xl bg-slate-900/50 mb-2 ${collapsed ? 'justify-center' : ''}`}>
             <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center text-[10px] font-black text-white shrink-0 shadow-lg shadow-indigo-500/20">
                {userInitials}
             </div>
             {!collapsed && (
               <div className="overflow-hidden">
                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">Account</p>
                 <p className="text-xs font-bold text-slate-200 truncate">{user?.email}</p>
               </div>
             )}
          </div>
          
          <button onClick={onLogout} className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-red-500/10 hover:text-red-400 transition-all text-slate-400">
            <LogOut size={20} />
            {!collapsed && <span className="font-medium text-sm">Sign Out</span>}
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;