import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../services/supabaseClient';
import { Card } from '../ui/Card';
import { 
  User, Plus, Trash2, ArrowUpRight, ArrowDownLeft, 
  CheckCircle2, Clock, Wallet, X, Edit3, Landmark, ReceiptText, History
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function MoneyTracker({ user }) {
  const [activeTab, setActiveTab] = useState('lent'); 
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null); 
  const [showAddModal, setShowAddModal] = useState(false);

  // Form States
  const [entryForm, setEntryForm] = useState({ person_name: '', amount: '', notes: '', id: null });
  const [partialAmount, setPartialAmount] = useState('');

  const refreshData = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const config = {
      lent: { table: 'lent', returns: 'lent_returns(amount, date, id)' },
      safekeeping: { table: 'safe_keeping', returns: 'safe_returns(amount, date, id)' },
      savings: { table: 'savings', returns: 'savings_returns(amount, date, id)' }
    };

    const current = config[activeTab];

    const { data: records, error } = await supabase
      .from(current.table)
      .select(`*, returns: ${current.returns}`)
      .eq('user_id', user.id)
      .order('date', { ascending: false });

    if (!error) {
      const enriched = records.map(r => {
        const returned = (r.returns || []).reduce((sum, x) => sum + Number(x.amount || 0), 0);
        return {
          ...r,
          total_returned: returned,
          remaining: Number(r.amount) - returned,
          progress: Math.min((returned / Number(r.amount)) * 100, 100)
        };
      });
      setData(enriched);
    }
    setLoading(false);
  }, [user, activeTab]);

  useEffect(() => { refreshData(); }, [refreshData]);

  const handleSaveEntry = async (e) => {
    e.preventDefault();
    const table = activeTab === 'lent' ? 'lent' : activeTab === 'safekeeping' ? 'safe_keeping' : 'savings';
    
    const payload = {
      user_id: user.id,
      amount: Number(entryForm.amount),
      notes: entryForm.notes,
      date: entryForm.id ? entryForm.date : new Date().toISOString().slice(0, 10)
    };
    if (activeTab !== 'savings') payload.person_name = entryForm.person_name;

    if (entryForm.id) {
      await supabase.from(table).update(payload).eq('id', entryForm.id);
    } else {
      await supabase.from(table).insert([payload]);
    }

    setEntryForm({ person_name: '', amount: '', notes: '', id: null });
    setShowAddModal(false);
    refreshData();
  };

  const handleEditParent = (item, e) => {
    e.stopPropagation(); // Don't open the statement panel
    setEntryForm({
      id: item.id,
      person_name: item.person_name || '',
      amount: item.amount,
      notes: item.notes || '',
      date: item.date
    });
    setShowAddModal(true);
  };

  const handleAddPartial = async (parentId) => {
    if (!partialAmount) return;
    const table = activeTab === 'lent' ? 'lent_returns' : activeTab === 'safekeeping' ? 'safe_returns' : 'savings_returns';
    const foreignKey = activeTab === 'lent' ? 'lent_id' : activeTab === 'safekeeping' ? 'safe_id' : 'saving_id';

    await supabase.from(table).insert([{
      [foreignKey]: parentId,
      amount: Number(partialAmount),
      date: new Date().toISOString().slice(0, 10)
    }]);

    setPartialAmount('');
    setSelectedItem(null);
    refreshData();
  };

  const handleDelete = async (id) => {
    if (window.confirm("Permanently delete this entire record?")) {
      const table = activeTab === 'lent' ? 'lent' : activeTab === 'safekeeping' ? 'safe_keeping' : 'savings';
      await supabase.from(table).delete().eq('id', id);
      setSelectedItem(null);
      refreshData();
    }
  };

  const globalTotalBalance = useMemo(() => data.reduce((sum, item) => sum + item.remaining, 0), [data]);

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-8 rounded-3xl border border-slate-200 shadow-sm gap-6">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-indigo-600 rounded-2xl text-white shadow-lg shadow-indigo-100">
            <Wallet size={24}/>
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter leading-none">Money Tracker</h1>
            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">Vault Management</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="bg-slate-50 border border-slate-200 px-6 py-3 rounded-2xl flex items-center gap-4">
            <div>
              <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest block">Remaining Balance</span>
              <span className="text-xl font-black text-slate-800 italic">₹{globalTotalBalance.toLocaleString()}</span>
            </div>
            {activeTab === 'lent' ? <ArrowUpRight className="text-rose-400" /> : <ArrowDownLeft className="text-emerald-400" />}
          </div>
          <button onClick={() => { setEntryForm({person_name: '', amount: '', notes: '', id: null}); setShowAddModal(true); }} className="flex-1 md:flex-none bg-slate-900 text-white font-bold uppercase text-[10px] tracking-[0.2em] px-8 py-5 rounded-2xl shadow-xl hover:bg-indigo-600 transition-all flex items-center justify-center gap-2">
            <Plus size={16}/> New Entry
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-200/50 p-1 rounded-2xl w-full md:w-fit mx-auto border border-slate-200">
        {['lent', 'safekeeping', 'savings'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-10 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.1em] transition-all ${
              activeTab === tab ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab === 'safekeeping' ? 'Safekeeping' : tab}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-20 text-center font-black text-slate-300 animate-pulse text-xl uppercase italic">Syncing with vault...</div>
        ) : data.map(item => (
          <Card key={item.id} className="group hover:border-slate-300 transition-all cursor-pointer bg-white border border-slate-200 p-6 shadow-sm flex flex-col relative" onClick={() => setSelectedItem(item)}>
            <div className="flex justify-between items-start mb-6">
               <div className="p-3 bg-slate-50 rounded-xl text-slate-400 group-hover:text-indigo-600 transition-colors">
                  {activeTab === 'savings' ? <Landmark size={20}/> : <User size={20}/>}
               </div>
               <div className="flex gap-2">
                 <button onClick={(e) => handleEditParent(item, e)} className="p-2 text-slate-400 hover:text-indigo-600 transition-colors">
                    <Edit3 size={16}/>
                 </button>
                 {item.remaining <= 0 ? (
                   <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-1">
                     <CheckCircle2 size={12}/> Settled
                   </span>
                 ) : (
                   <span className="bg-amber-50 text-amber-600 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-1">
                     <Clock size={12}/> Pending
                   </span>
                 )}
               </div>
            </div>

            <h3 className="text-xl font-bold text-slate-800 tracking-tight mb-1 uppercase italic">
              {activeTab === 'savings' ? 'Savings Goal' : item.person_name}
            </h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter truncate">{item.notes || 'No description'}</p>

            <div className="mt-8 space-y-3">
              <div className="flex justify-between items-end">
                <p className="text-[9px] font-black text-slate-400 uppercase">Balance Due</p>
                <p className="text-xl font-black text-slate-900 tracking-tighter">₹{item.remaining.toLocaleString()}</p>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${item.progress}%` }} className={`h-full ${item.remaining <= 0 ? 'bg-emerald-500' : 'bg-indigo-500'}`} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Statement Slide-over */}
      <AnimatePresence>
        {selectedItem && (
          <div className="fixed inset-0 z-[100] flex items-center justify-end bg-slate-900/20 backdrop-blur-sm">
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="w-full max-w-md h-screen bg-white shadow-2xl p-8 overflow-y-auto border-l border-slate-200">
               <div className="flex justify-between items-center mb-8">
                  <div className="flex items-center gap-2">
                    <History size={20} className="text-indigo-600"/>
                    <h2 className="text-xl font-black text-slate-900 uppercase italic">Mini-Statement</h2>
                  </div>
                  <button onClick={() => setSelectedItem(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={20}/></button>
               </div>

               <div className="space-y-8">
                  <div className="p-8 bg-slate-900 rounded-[2rem] text-white shadow-2xl">
                    <p className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] mb-2">Total Remaining</p>
                    <p className="text-5xl font-black italic tracking-tighter">₹{selectedItem.remaining.toLocaleString()}</p>
                  </div>

                  <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Add Partial Record</p>
                    <div className="flex gap-2">
                      <input type="number" placeholder="₹ Amount" className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 font-bold" value={partialAmount} onChange={(e) => setPartialAmount(e.target.value)} />
                      <button onClick={() => handleAddPartial(selectedItem.id)} className="bg-indigo-600 text-white px-6 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">Record</button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><ReceiptText size={14}/> Activity Log</p>
                    <div className="space-y-3">
                       <div className="flex justify-between p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
                          <div>
                            <p className="text-sm font-black text-slate-800 uppercase italic">Initial Amount</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">{selectedItem.date}</p>
                          </div>
                          <p className="text-sm font-black text-slate-900 italic">₹{selectedItem.amount}</p>
                       </div>
                       {(selectedItem.returns || []).map(r => (
                         <div key={r.id} className="flex justify-between p-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl animate-in slide-in-from-bottom-2">
                           <div>
                             <p className="text-sm font-black text-emerald-700 uppercase italic">Partial Back</p>
                             <p className="text-[10px] font-bold text-emerald-400 uppercase mt-1">{r.date}</p>
                           </div>
                           <p className="text-sm font-black text-emerald-600">- ₹{r.amount}</p>
                         </div>
                       ))}
                    </div>
                  </div>

                  <button onClick={() => handleDelete(selectedItem.id)} className="w-full py-4 border border-rose-100 text-rose-500 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center gap-2">
                    <Trash2 size={16}/> Delete Record
                  </button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-lg rounded-[2rem] p-10 shadow-2xl border border-slate-200">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">
                  {entryForm.id ? 'Edit' : 'New'} {activeTab}
                </h2>
                <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-900"><X size={24}/></button>
              </div>
              <form onSubmit={handleSaveEntry} className="space-y-6">
                {activeTab !== 'savings' && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest">Involved Party</label>
                    <input type="text" required placeholder="Name..." className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 outline-none focus:border-indigo-500 font-bold" value={entryForm.person_name} onChange={(e) => setEntryForm({...entryForm, person_name: e.target.value})}/>
                  </div>
                )}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest">Principal Sum</label>
                  <input type="number" required placeholder="₹ 0.00" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 outline-none focus:border-indigo-500 font-black text-3xl italic text-indigo-600" value={entryForm.amount} onChange={(e) => setEntryForm({...entryForm, amount: e.target.value})}/>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest">Description</label>
                  <input type="text" placeholder="Short note..." className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 outline-none focus:border-indigo-500 font-bold text-slate-600" value={entryForm.notes} onChange={(e) => setEntryForm({...entryForm, notes: e.target.value})}/>
                </div>
                <button type="submit" className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase italic tracking-widest shadow-xl hover:bg-indigo-600 transition-all">
                  {entryForm.id ? 'Update Record' : 'Initialize Record'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}