import React from 'react';
import { Card } from '../ui/Card';
import { User, Mail, ShieldCheck, Calendar, HardDrive, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../../services/supabaseClient';

export default function Profile({ user }) {
  const handleLogout = () => supabase.auth.signOut();

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto space-y-8 pb-20 font-sans text-slate-900">
      <header>
        <h1 className="text-3xl font-black uppercase italic tracking-tighter">Account Identity</h1>
        <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-1">Authorized User Profile</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Identity Card */}
        <Card className="lg:col-span-2 border-2 border-slate-100 p-10 bg-white shadow-xl rounded-[2.5rem]">
          <div className="flex flex-col md:flex-row items-center gap-8 mb-12">
            <div className="w-24 h-24 rounded-[2rem] bg-slate-900 flex items-center justify-center text-white shadow-2xl">
               <User size={48} />
            </div>
            <div className="text-center md:text-left">
               <h2 className="text-3xl font-black tracking-tighter leading-none mb-2 italic uppercase">
                  {user?.email?.split('@')[0]}
               </h2>
               <p className="flex items-center justify-center md:justify-start gap-2 text-indigo-600 font-black text-xs uppercase tracking-widest">
                  <Mail size={14} /> {user?.email}
               </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="p-6 bg-slate-50 rounded-3xl border border-slate-200">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Calendar size={14} className="text-slate-900"/> Enrollment Date
                </p>
                <p className="text-lg font-bold text-slate-800 italic">
                  {new Date(user?.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
             </div>
             <div className="p-6 bg-slate-50 rounded-3xl border border-slate-200">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <ShieldCheck size={14} className="text-slate-900"/> Verification Status
                </p>
                <p className="text-xs font-black text-emerald-600 uppercase tracking-widest bg-emerald-100/50 w-fit px-3 py-1 rounded-full">
                  Verified Vault Account
                </p>
             </div>
          </div>
        </Card>

        {/* System Info Sidebar */}
        <div className="space-y-6">
           <Card className="bg-slate-900 text-white p-8 rounded-[2rem] shadow-2xl">
              <div className="flex items-center gap-2 text-indigo-400 mb-6">
                <HardDrive size={16}/>
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">System Metadata</span>
              </div>
              <div className="space-y-6">
                 <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Unique Identifier</p>
                    <p className="text-[10px] font-mono text-slate-300 break-all">{user?.id}</p>
                 </div>
                 <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Provider</p>
                    <p className="text-xs font-black uppercase italic tracking-tighter">Supabase Auth (Cloud)</p>
                 </div>
              </div>
           </Card>

           <button 
             onClick={handleLogout}
             className="w-full flex items-center justify-center gap-3 py-5 rounded-[2rem] bg-rose-50 text-rose-600 border-2 border-rose-100 font-black uppercase text-xs tracking-widest hover:bg-rose-600 hover:text-white transition-all shadow-lg shadow-rose-100"
           >
             <LogOut size={18}/> End Session
           </button>
        </div>
      </div>
    </motion.div>
  );
}