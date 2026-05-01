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
  const mobileNavItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, label: 'Home' },
    { name: 'History', path: '/transactions', icon: History, label: 'History' },
    { name: 'Add Transaction', path: '/form', icon: PlusCircle, label: 'Add', featured: true },
    { name: 'Statistics', path: '/statistics', icon: BarChart2, label: 'Stats' },
    { name: 'Profile', path: '/profile', icon: User, label: 'Profile' }
  ];

  return (
    <>
    <aside className={`fixed top-0 left-0 z-50 hidden h-screen bg-slate-950 text-slate-300 transition-all duration-300 border-r border-slate-800 md:block ${collapsed ? 'w-20' : 'w-64'}`}>
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="h-20 flex items-center justify-between px-6 border-b border-slate-800/50">
          {!collapsed && <span className="font-bold text-xl text-white tracking-tight uppercase italic">Spera</span>}
          <button onClick={() => setCollapsed(!collapsed)} className="p-1.5 rounded-lg bg-slate-900 hover:bg-indigo-600 transition-colors">
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 px-3 space-y-1">
          {navItems.map((item) => (
            <Link key={item.path} to={item.path} className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${location.pathname === item.path ? 'bg-indigo-600 text-white' : 'hover:bg-slate-900 hover:text-white'}`}>
              <item.icon size={20} strokeWidth={1.7} />
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
    <nav className="fixed bottom-0 left-0 right-0 z-50 max-w-[100vw] overflow-hidden border-t border-[#F0F0F0] bg-white/95 px-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2 backdrop-blur md:hidden">
      <div className="mx-auto flex w-full max-w-[420px] items-end justify-between gap-1">
        {mobileNavItems.map((item) => {
          const active = location.pathname === item.path;
          const Icon = item.icon;
          return (
          <Link
            key={item.path}
            to={item.path}
            className={`flex min-w-0 max-w-[4.5rem] flex-1 flex-col items-center justify-center overflow-hidden rounded-xl font-black transition-all active:scale-[0.96] ${
              item.featured
                ? `h-14 max-w-[3.75rem] -translate-y-1 gap-0.5 bg-[#0077FF] text-white shadow-[0_12px_28px_rgba(0,119,255,0.22)] ${active ? 'ring-4 ring-[#EAF4FF]' : ''}`
                : `h-12 gap-0.5 px-1 text-[10px] ${active ? 'bg-[#EAF4FF] text-[#0077FF]' : 'text-[#71717A]'}`
            }`}
          >
            <Icon size={item.featured ? 21 : 17} strokeWidth={1.8} className="shrink-0" />
            <span className={`max-w-full overflow-hidden text-ellipsis whitespace-nowrap px-0.5 leading-none ${item.featured ? 'text-[10px]' : 'text-[10px]'}`}>{item.label}</span>
          </Link>
          );
        })}
      </div>
    </nav>
    </>
  );
};

export default Sidebar;
