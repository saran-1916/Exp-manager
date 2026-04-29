import React, { useMemo, useState, useEffect } from 'react';
import { supabase } from '../../services/supabaseClient';
import { Card } from '../ui/Card';
import { CategoryIcon } from '../ui/CategoryIcon';
import {
  Calendar,
  CheckCircle2,
  Edit3,
  IndianRupee,
  LayoutGrid,
  Loader2,
  MessageSquare,
  Plus,
  Save,
  Tag,
  X
} from 'lucide-react';
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

const SUBCATEGORY_TABLES = ['sub_categories', 'subcategories'];
const fieldClass = "w-full rounded-xl border border-[#F0F0F0] bg-white px-4 py-3 text-sm font-bold text-black outline-none transition-all focus:border-black disabled:opacity-30";
const labelClass = "text-[11px] font-black uppercase tracking-[0.18em] text-[#888888] flex items-center gap-2";

export default function ExpenseForm({ editTransaction, clearEdit }) {
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [subCategoryTable, setSubCategoryTable] = useState(SUBCATEGORY_TABLES[0]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [selectedManagerCategoryId, setSelectedManagerCategoryId] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [editingSubcategoryId, setEditingSubcategoryId] = useState(null);
  const [draftName, setDraftName] = useState('');
  const [newCategoryOpen, setNewCategoryOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [savingKey, setSavingKey] = useState('');
  const [savedKey, setSavedKey] = useState('');
  
  const [form, setForm] = useState(initialState);

  // Fetch metadata for dropdowns
  const fetchMeta = async () => {
    const { data: cats } = await supabase.from('categories').select('*').order('name', { ascending: true });
    let subs = [];
    let resolvedTable = subCategoryTable;

    for (const table of SUBCATEGORY_TABLES) {
      const { data, error } = await supabase.from(table).select('*').order('name', { ascending: true });
      if (!error) {
        subs = data || [];
        resolvedTable = table;
        break;
      }
    }

    setCategories(cats || []);
    setSubcategories(subs);
    setSubCategoryTable(resolvedTable);
    setSelectedManagerCategoryId(prev => prev || cats?.[0]?.id || '');
  };

  useEffect(() => {
    fetchMeta();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const flashSaved = (key) => {
    setSavedKey(key);
    setTimeout(() => setSavedKey(''), 1200);
  };

  const startCategoryEdit = (category) => {
    setEditingCategoryId(category.id);
    setEditingSubcategoryId(null);
    setDraftName(category.name || '');
  };

  const startSubcategoryEdit = (subcategory) => {
    setEditingSubcategoryId(subcategory.id);
    setEditingCategoryId(null);
    setDraftName(subcategory.name || '');
  };

  const cancelInlineEdit = () => {
    setEditingCategoryId(null);
    setEditingSubcategoryId(null);
    setDraftName('');
  };

  const saveCategoryName = async (categoryId) => {
    const cleanName = draftName.trim();
    if (!cleanName) return;

    const key = `category-${categoryId}`;
    setSavingKey(key);
    const { error } = await supabase.from('categories').update({ name: cleanName }).eq('id', categoryId);
    setSavingKey('');

    if (!error) {
      setCategories(prev => prev.map(c => c.id === categoryId ? { ...c, name: cleanName } : c));
      cancelInlineEdit();
      flashSaved(key);
    }
  };

  const saveSubcategoryName = async (subcategoryId) => {
    const cleanName = draftName.trim();
    if (!cleanName) return;

    const key = `subcategory-${subcategoryId}`;
    setSavingKey(key);
    const { error } = await supabase.from(subCategoryTable).update({ name: cleanName }).eq('id', subcategoryId);
    setSavingKey('');

    if (!error) {
      setSubcategories(prev => prev.map(s => s.id === subcategoryId ? { ...s, name: cleanName } : s));
      cancelInlineEdit();
      flashSaved(key);
    }
  };

  const createCategory = async () => {
    const cleanName = newCategoryName.trim();
    if (!cleanName) return;

    const key = 'category-new';
    setSavingKey(key);
    const { data, error } = await supabase
      .from('categories')
      .insert([{ name: cleanName, type: 'Expense', icon_slug: 'tag' }])
      .select()
      .single();
    setSavingKey('');

    if (!error && data) {
      setCategories(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      setSelectedManagerCategoryId(data.id);
      setNewCategoryName('');
      setNewCategoryOpen(false);
      flashSaved(key);
    }
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

  const selectedCategory = categories.find(c => c.id === form.category_id);
  const selectedCategoryName = selectedCategory?.name || 'Pending sub-category selection';
  const selectedCategoryType = selectedCategory?.type;
  const managerSubcategories = useMemo(
    () => subcategories.filter(s => s.category_id === selectedManagerCategoryId),
    [subcategories, selectedManagerCategoryId]
  );
  const selectedManagerCategory = categories.find(c => c.id === selectedManagerCategoryId);

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-4xl space-y-8 pb-24 font-sans">
      <Card className="border border-[#F0F0F0] bg-white p-6 md:p-8">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-8 border-b border-[#F0F0F0] pb-6">
          <div>
            <h2 className="text-3xl font-black text-black tracking-tight leading-none">
              {editTransaction ? 'Update Entry' : 'Add New Entry'}
            </h2>
            <p className="text-xs font-black text-[#888888] mt-2 uppercase tracking-[0.2em]">Expense manager</p>
          </div>
          {editTransaction && (
            <button 
              type="button"
              onClick={clearEdit} 
              className="px-4 py-2 bg-white text-rose-700 rounded-xl text-xs font-bold uppercase hover:bg-rose-50 transition-all flex items-center gap-2 border border-[#F0F0F0]"
            >
              <X size={14} /> Cancel Edit
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Date */}
            <div className="space-y-2">
              <label className={labelClass}>
                <Calendar size={14} strokeWidth={1.7} /> Date
              </label>
              <input 
                type="date" 
                className={fieldClass}
                value={form.date}
                onChange={e => setForm({...form, date: e.target.value})}
                required
              />
            </div>

            {/* Subcategory */}
            <div className="space-y-2">
              <label className={labelClass}>
                <Tag size={14} strokeWidth={1.7} /> Sub-category
              </label>
              <select 
                className={`${fieldClass} appearance-none cursor-pointer`}
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
            <label className={labelClass}>
              <LayoutGrid size={14} strokeWidth={1.7} /> Main category
            </label>
            <div className={`flex w-full items-center gap-3 border rounded-xl px-4 py-3 font-bold text-sm transition-colors ${form.category_id ? 'bg-[#111111] border-[#111111] text-white' : 'bg-white border-[#F0F0F0] text-[#888888]'}`}>
              {form.category_id && (
                <CategoryIcon iconSlug={selectedCategory?.icon_slug} className="h-9 w-9 border-white/10 bg-white/10 text-slate-300" size={16} />
              )}
              <span className="truncate">{selectedCategoryName}</span>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className={labelClass}>
              <MessageSquare size={14} strokeWidth={1.7} /> Description
            </label>
            <input 
              type="text" 
              placeholder="What is this for?"
              className={fieldClass}
              value={form.description}
              onChange={e => setForm({...form, description: e.target.value})}
            />
          </div>

          {/* Amount Area */}
          <div className="rounded-2xl border border-[#F0F0F0] bg-white p-5 md:p-6">
             <div className="grid grid-cols-2 gap-4 md:gap-6">
                <div className="space-y-2">
                  <label className={labelClass}>
                    <IndianRupee size={14} strokeWidth={1.7} className="text-rose-500" /> Amount spent
                  </label>
                  <input 
                    type="number" 
                    step="0.01"
                    disabled={selectedCategoryType === 'Income'}
                    className="w-full rounded-xl border-0 border-b-2 border-rose-500 bg-white px-0 py-3 text-lg font-black text-black outline-none transition-all disabled:opacity-20 md:text-xl"
                    value={form.debit}
                    onChange={e => setForm({...form, debit: e.target.value, credit: ''})}
                  />
                </div>
                <div className="space-y-2">
                  <label className={labelClass}>
                    <IndianRupee size={14} strokeWidth={1.7} className="text-emerald-500" /> Amount received
                  </label>
                  <input 
                    type="number" 
                    step="0.01"
                    disabled={selectedCategoryType === 'Expense'}
                    className="w-full rounded-xl border-0 border-b-2 border-emerald-500 bg-white px-0 py-3 text-lg font-black text-black outline-none transition-all disabled:opacity-20 md:text-xl"
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
            className={`w-full py-4 rounded-xl text-white font-black text-base transition-all flex items-center justify-center gap-3 active:scale-[0.98] shadow-[0_18px_40px_rgba(0,0,0,0.22)] ${
              success ? 'bg-emerald-500' : 'bg-black hover:bg-[#111111]'
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

      <Card className="border border-[#F0F0F0] bg-white p-6 md:p-8">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-black">Manage Categories</h2>
            <p className="mt-2 text-xs font-black uppercase tracking-[0.2em] text-[#888888]">List and chip manager</p>
          </div>
          <button
            type="button"
            onClick={() => setNewCategoryOpen(true)}
            className="grid h-11 w-11 place-items-center rounded-xl border border-[#F0F0F0] bg-white text-black transition hover:border-black"
            aria-label="New category"
          >
            <Plus size={20} strokeWidth={1.7} />
          </button>
        </div>

        {newCategoryOpen && (
          <div className="mb-5 flex gap-2 rounded-2xl border border-[#F0F0F0] p-2">
            <input
              className="min-w-0 flex-1 rounded-xl border-0 px-3 py-2 text-sm font-bold text-black outline-none"
              placeholder="New category name"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              autoFocus
            />
            <button type="button" onClick={createCategory} className="grid h-10 w-10 place-items-center rounded-xl bg-black text-white">
              {savingKey === 'category-new' ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
            </button>
            <button type="button" onClick={() => setNewCategoryOpen(false)} className="grid h-10 w-10 place-items-center rounded-xl text-[#888888]">
              <X size={16} />
            </button>
          </div>
        )}

        <div className="flex gap-3 overflow-x-auto pb-3">
          {categories.map(category => {
            const isActive = selectedManagerCategoryId === category.id;
            const key = `category-${category.id}`;

            return (
              <div
                key={category.id}
                className={`flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 transition ${isActive ? 'border-black bg-black text-white' : 'border-[#F0F0F0] bg-white text-black'}`}
              >
                {editingCategoryId === category.id ? (
                  <>
                    <input
                      className={`w-36 bg-transparent text-sm font-black outline-none ${isActive ? 'text-white placeholder:text-white/50' : 'text-black'}`}
                      value={draftName}
                      onChange={(e) => setDraftName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && saveCategoryName(category.id)}
                      autoFocus
                    />
                    <button type="button" onClick={() => saveCategoryName(category.id)} className="text-current">
                      {savingKey === key ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                    </button>
                  </>
                ) : (
                  <>
                    <button type="button" onClick={() => setSelectedManagerCategoryId(category.id)} className="text-sm font-black">
                      {category.name}
                    </button>
                    <button type="button" onClick={() => startCategoryEdit(category)} className={isActive ? 'text-white/70' : 'text-[#888888]'}>
                      {savedKey === key ? <CheckCircle2 size={13} className="text-emerald-500" /> : <Edit3 size={13} strokeWidth={1.7} />}
                    </button>
                  </>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-6 rounded-3xl border border-[#F0F0F0] p-5 md:p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#888888]">Sub-categories</p>
              <h3 className="mt-1 text-xl font-black text-black">{selectedManagerCategory?.name || 'Select a category'}</h3>
            </div>
            {savedKey.startsWith('subcategory-') && (
              <div className="flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-600">
                <CheckCircle2 size={14} /> Saved
              </div>
            )}
          </div>

          <div className="space-y-2">
            {managerSubcategories.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-[#F0F0F0] px-4 py-8 text-center text-sm font-bold text-[#888888]">
                No sub-categories found.
              </p>
            ) : managerSubcategories.map(subcategory => {
              const key = `subcategory-${subcategory.id}`;
              return (
                <div key={subcategory.id} className="flex items-center justify-between gap-3 rounded-2xl border border-[#F0F0F0] px-4 py-3">
                  {editingSubcategoryId === subcategory.id ? (
                    <input
                      className="min-w-0 flex-1 text-sm font-black text-black outline-none"
                      value={draftName}
                      onChange={(e) => setDraftName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && saveSubcategoryName(subcategory.id)}
                      autoFocus
                    />
                  ) : (
                    <button type="button" onClick={() => handleSubChange(subcategory.id)} className="min-w-0 flex-1 text-left text-sm font-black text-black">
                      {subcategory.name}
                    </button>
                  )}

                  <div className="flex items-center gap-2 text-[#888888]">
                    {editingSubcategoryId === subcategory.id ? (
                      <>
                        <button type="button" onClick={() => saveSubcategoryName(subcategory.id)}>
                          {savingKey === key ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                        </button>
                        <button type="button" onClick={cancelInlineEdit}><X size={16} /></button>
                      </>
                    ) : (
                      <button type="button" onClick={() => startSubcategoryEdit(subcategory)}>
                        {savedKey === key ? <CheckCircle2 size={16} className="text-emerald-500" /> : <Edit3 size={15} strokeWidth={1.7} />}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
