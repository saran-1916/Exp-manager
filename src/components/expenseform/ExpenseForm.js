import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabaseClient';
import { Card } from '../ui/Card';
import { Save, X, Calendar, Tag, MessageSquare, IndianRupee, LayoutGrid } from 'lucide-react';
import { motion } from 'framer-motion';

// ✅ FIXED: Moving this OUTSIDE the function tells React it never changes.
// This removes the ESLint warning.
const initialState = {
  date: new Date().toISOString().split('T')[0],
  description: '',
  debit: '',
  credit: '',
  category_id: '',
  subcategory_id: ''
};

export default function ExpenseForm({ editTransaction, clearEdit }) {
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [form, setForm] = useState(initialState);

  // Fetch metadata for dropdowns
  useEffect(() => {
    const fetchMeta = async () => {
      const { data: cats } = await supabase.from('categories').select('*');
      const { data: subs } = await supabase.from('subcategories').select('*');
      setCategories(cats || []);
      setSubcategories(subs || []);
    };
    fetchMeta();
  }, []);

  // Handle Filling and Clearing the form
  useEffect(() => {
    if (editTransaction) {
      setForm({
        date: editTransaction.date || '',
        description: editTransaction.description || '',
        debit: editTransaction.debit || '',
        credit: editTransaction.credit || '',
        category_id: editTransaction.category_id || '',
        subcategory_id: editTransaction.subcategory_id || ''
      });
    } else {
      setForm(initialState);
    }
  }, [editTransaction]);

  const handleSubChange = (subId) => {
    const sub = subcategories.find(s => s.id === subId);
    setForm(prev => ({ 
      ...prev, 
      subcategory_id: subId,
      category_id: sub ? sub.category_id : '' 
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    const payload = {
      ...form,
      user_id: user.id,
      debit: form.debit || null,
      credit: form.credit || null
    };

    let error;
    if (editTransaction) {
      const result = await supabase.from('transactions').update(payload).eq('id', editTransaction.id);
      error = result.error;
    } else {
      const result = await supabase.from('transactions').insert([payload]);
      error = result.error;
    }

    setLoading(false);
    if (!error) {
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        if (clearEdit) clearEdit();
      }, 1500);
      
      if (!editTransaction) setForm(initialState);
    }
  };

  const selectedCategoryName = categories.find(c => c.id === form.category_id)?.name || 'Pending sub-category selection';
  const selectedCategoryType = categories.find(c => c.id === form.category_id)?.type;

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto pb-20">
      <Card className="shadow-xl border border-slate-200 bg-white">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-8 border-b border-slate-100 pb-5">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight leading-none">
              {editTransaction ? 'Update Entry' : 'Add New Entry'}
            </h2>
            <p className="text-sm font-medium text-slate-500 mt-1 uppercase tracking-tighter">Expense Manager</p>
          </div>
          {editTransaction && (
            <button 
              type="button"
              onClick={clearEdit} 
              className="px-4 py-2 bg-rose-50 text-rose-700 rounded-xl text-xs font-bold uppercase hover:bg-rose-100 transition-all flex items-center gap-2 border border-rose-100"
            >
              <X size={14} /> Cancel Edit
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Date */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2 italic">
                <Calendar size={14} /> Date
              </label>
              <input 
                type="date" 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 transition-all font-medium text-slate-700"
                value={form.date}
                onChange={e => setForm({...form, date: e.target.value})}
                required
              />
            </div>

            {/* Subcategory */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2 italic">
                <Tag size={14} /> Sub-Category
              </label>
              <select 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 transition-all font-medium text-slate-700 appearance-none cursor-pointer"
                value={form.subcategory_id}
                onChange={e => handleSubChange(e.target.value)}
                required
              >
                <option value="">Choose Sub-Category</option>
                {subcategories.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>

          {/* Main Category Display */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2 italic">
              <LayoutGrid size={14} /> Main Category
            </label>
            <div className={`w-full border rounded-xl px-4 py-3 font-bold text-sm transition-colors ${form.category_id ? 'bg-indigo-50 border-indigo-100 text-indigo-700' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
               {selectedCategoryName}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2 italic">
              <MessageSquare size={14} /> Description
            </label>
            <input 
              type="text" 
              placeholder="What is this for?"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 transition-all font-medium text-slate-700"
              value={form.description}
              onChange={e => setForm({...form, description: e.target.value})}
            />
          </div>

          {/* Amount Area */}
          <div className="p-6 bg-slate-50/50 rounded-2xl border border-slate-100">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-rose-600 uppercase flex items-center gap-2 italic">
                    <IndianRupee size={14} /> Amount Spent (-)
                  </label>
                  <input 
                    type="number" 
                    step="0.01"
                    disabled={selectedCategoryType === 'Income'}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-rose-500 transition-all font-bold text-xl text-rose-600 disabled:opacity-20"
                    value={form.debit}
                    onChange={e => setForm({...form, debit: e.target.value, credit: ''})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-emerald-600 uppercase flex items-center gap-2 italic">
                    <IndianRupee size={14} /> Amount Received (+)
                  </label>
                  <input 
                    type="number" 
                    step="0.01"
                    disabled={selectedCategoryType === 'Expense'}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-emerald-500 transition-all font-bold text-xl text-emerald-700 disabled:opacity-20"
                    value={form.credit}
                    onChange={e => setForm({...form, credit: e.target.value, debit: ''})}
                  />
                </div>
             </div>
          </div>

          {/* Submit */}
          <button 
            type="submit" 
            disabled={loading}
            className={`w-full py-4 rounded-2xl text-white font-bold text-lg shadow-lg transition-all flex items-center justify-center gap-3 active:scale-[0.98] ${
              success ? 'bg-emerald-500 shadow-emerald-100' : 'bg-slate-800 hover:bg-slate-950 shadow-slate-200'
            }`}
          >
            {loading ? 'Processing...' : success ? 'Successfully Saved!' : (
              <>
                <Save size={20} />
                {editTransaction ? 'Save Changes' : 'Add Transaction'}
              </>
            )}
          </button>
        </form>
      </Card>
    </motion.div>
  );
}