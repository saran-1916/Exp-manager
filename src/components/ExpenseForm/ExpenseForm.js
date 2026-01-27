import { useState, useEffect } from 'react';
import { supabase } from '../../services/supabaseClient';

function ExpenseForm({ userId, editTransaction, clearEdit }) {
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({
    date: '',
    description: '',
    debit: '',
    credit: '',
    category_id: '',
    subcategory_id: ''
  });

  // Fetch categories
  useEffect(() => {
    supabase.from('categories').select('*').then(({ data, error }) => {
      if (error) console.error("Category fetch error:", error.message);
      setCategories(data || []);
    });
  }, []);

  // Fetch subcategories
  useEffect(() => {
    supabase.from('subcategories').select('*').then(({ data, error }) => {
      if (error) console.error("Subcategory fetch error:", error.message);
      setSubcategories(data || []);
    });
  }, []);

  // Prefill form when editing
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
    }
  }, [editTransaction]);

  // Handle subcategory change → auto-fill category + enforce type
  async function handleSubcategoryChange(subId) {
    setForm(prev => ({ ...prev, subcategory_id: subId }));

    if (subId) {
      const { data, error } = await supabase
        .from('subcategories')
        .select('category_id, categories(type)')
        .eq('id', subId)
        .single();

      if (!error && data) {
        const catType = data.categories?.type;
        setForm(prev => ({
          ...prev,
          category_id: data.category_id,
          debit: catType === 'Expense' ? prev.debit : '',
          credit: catType === 'Income' ? prev.credit : ''
        }));
      }
    }
  }

  // Validation
  function validate() {
    const newErrors = {};
    if (!form.date) newErrors.date = "Date is required.";
    if (!form.subcategory_id) newErrors.subcategory_id = "Subcategory is required.";
    if (!form.category_id) newErrors.category_id = "Category is missing. Please reselect subcategory.";
    const categoryType = categories.find(c => c.id === form.category_id)?.type;
    if (categoryType === 'Expense' && !form.debit) newErrors.debit = "Debit amount is required.";
    if (categoryType === 'Income' && !form.credit) newErrors.credit = "Credit amount is required.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  // Submit handler
  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;

    const cleanedForm = {
      ...form,
      debit: form.debit === '' ? null : Number(form.debit),
      credit: form.credit === '' ? null : Number(form.credit),
      user_id: userId
    };

    let result;
    if (editTransaction) {
      result = await supabase.from('transactions').update(cleanedForm).eq('id', editTransaction.id);
    } else {
      result = await supabase.from('transactions').insert([cleanedForm]);
    }

    if (result.error) {
      console.error("Save error:", result.error.message);
      alert("Failed to save transaction: " + result.error.message);
    } else {
      alert(editTransaction ? "Transaction updated!" : "Transaction added!");
      setForm({
        date: '',
        description: '',
        debit: '',
        credit: '',
        category_id: '',
        subcategory_id: ''
      });
      clearEdit && clearEdit();
      setErrors({});
    }
  }

  const categoryType = categories.find(c => c.id === form.category_id)?.type;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-100 to-white">
      <div className="w-full max-w-2xl p-10 bg-white shadow-2xl rounded-xl border border-gray-200">
        <h2 className="text-3xl font-bold text-black mb-8 text-center">
          {editTransaction ? "Edit Transaction" : "Add Transaction"}
        </h2>
        <form className="space-y-6" onSubmit={handleSubmit}>
          
          {/* 1. Date */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-lg focus:outline-none focus:ring-2 focus:ring-black"
              value={form.date}
              onChange={e => setForm({ ...form, date: e.target.value })}
            />
            {errors.date && <p className="text-red-500 text-sm mt-1">{errors.date}</p>}
          </div>

          {/* 2. Subcategory */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Subcategory <span className="text-red-500">*</span>
            </label>
            <select
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-lg focus:outline-none focus:ring-2 focus:ring-black"
              value={form.subcategory_id}
              onChange={e => handleSubcategoryChange(e.target.value)}
            >
              <option value="">Select Subcategory</option>
              {subcategories.map(sub => (
                <option key={sub.id} value={sub.id}>{sub.name}</option>
              ))}
            </select>
            {errors.subcategory_id && <p className="text-red-500 text-sm mt-1">{errors.subcategory_id}</p>}
          </div>

          {/* 3. Category auto-filled */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Category <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-lg bg-gray-100"
              value={categories.find(c => c.id === form.category_id)?.name || ''}
              readOnly
            />
            {errors.category_id && <p className="text-red-500 text-sm mt-1">{errors.category_id}</p>}
          </div>

          {/* 4. Amount fields */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Debit ₹ {categoryType === 'Expense' && <span className="text-red-500">*</span>}
              </label>
              <input
                type="number"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-lg focus:outline-none focus:ring-2 focus:ring-black"
                value={form.debit}
                onChange={e => setForm({ ...form, debit: e.target.value })}
                disabled={categoryType !== 'Expense'}
              />
              {errors.debit && <p className="text-red-500 text-sm mt-1">{errors.debit}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Credit ₹ {categoryType === 'Income' && <span className="text-red-500">*</span>}
              </label>
              <input
                type="number"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-lg focus:outline-none focus:ring-2 focus:ring-black"
                value={form.credit}
                onChange={e => setForm({ ...form, credit: e.target.value })}
                disabled={categoryType !== 'Income'}
              />
              {errors.credit && <p className="text-red-500 text-sm mt-1">{errors.credit}</p>}
            </div>
          </div>

          {/* 5. Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-lg focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="Description"
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
            />
          </div>

          {/* Buttons */}
          <div className="flex space-x-4">
            <button
              type="submit"
              className="flex-1 bg-black text-white text-lg font-semibold px-6 py-3 rounded-md hover:bg
