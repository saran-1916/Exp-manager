import { useState, useEffect } from 'react';
import { supabase } from '../../services/supabaseClient';

function ExpenseForm({ userId, editTransaction, clearEdit }) {
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
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
          // enforce debit/credit based on type
          debit: catType === 'Expense' ? prev.debit : '',
          credit: catType === 'Income' ? prev.credit : ''
        }));
      }
    }
  }

  // Submit handler with validation
  async function handleSubmit(e) {
    e.preventDefault();

    // ✅ Validation checks
    if (!form.date) {
      alert("Please select a date.");
      return;
    }
    if (!form.subcategory_id) {
      alert("Please select a subcategory.");
      return;
    }
    if (!form.category_id) {
      alert("Category is missing. Please reselect subcategory.");
      return;
    }
    const categoryType = categories.find(c => c.id === form.category_id)?.type;
    if (categoryType === 'Expense' && !form.debit) {
      alert("Please enter a debit amount for this expense.");
      return;
    }
    if (categoryType === 'Income' && !form.credit) {
      alert("Please enter a credit amount for this income.");
      return;
    }

    const cleanedForm = {
      ...form,
      debit: form.debit === '' ? null : Number(form.debit),
      credit: form.credit === '' ? null : Number(form.credit),
      user_id: userId
    };

    let result;
    if (editTransaction) {
      result = await supabase
        .from('transactions')
        .update(cleanedForm)
        .eq('id', editTransaction.id);
    } else {
      result = await supabase
        .from('transactions')
        .insert([cleanedForm]);
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
    }
  }

  const categoryType = categories.find(c => c.id === form.category_id)?.type;

  return (
    <div className="max-w-2xl mx-auto mt-10 p-8 bg-white shadow-xl rounded-xl border border-gray-300">
      <h2 className="text-3xl font-bold text-black mb-8 text-center">
        {editTransaction ? "Edit Transaction" : "Add Transaction"}
      </h2>
      <form className="space-y-6" onSubmit={handleSubmit}>
        <div>
          <label className="label">Date</label>
          <input
            type="date"
            className="input text-lg"
            value={form.date}
            onChange={e => setForm({ ...form, date: e.target.value })}
          />
        </div>

        <div>
          <label className="label">Description</label>
          <input
            type="text"
            className="input text-lg"
            placeholder="Description"
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
          />
        </div>

        {/* Amount fields with enforcement */}
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="label">Debit ₹</label>
            <input
              type="number"
              className="input text-lg"
              value={form.debit}
              onChange={e => setForm({ ...form, debit: e.target.value })}
              disabled={categoryType !== 'Expense'}
            />
          </div>
          <div>
            <label className="label">Credit ₹</label>
            <input
              type="number"
              className="input text-lg"
              value={form.credit}
              onChange={e => setForm({ ...form, credit: e.target.value })}
              disabled={categoryType !== 'Income'}
            />
          </div>
        </div>

        {/* Subcategory first */}
        <div>
          <label className="label">Subcategory</label>
          <select
            className="input text-lg"
            value={form.subcategory_id}
            onChange={e => handleSubcategoryChange(e.target.value)}
          >
            <option value="">Select Subcategory</option>
            {subcategories.map(sub => (
              <option key={sub.id} value={sub.id}>{sub.name}</option>
            ))}
          </select>
        </div>

        {/* Category auto-filled */}
        <div>
          <label className="label">Category</label>
          <input
            type="text"
            className="input text-lg bg-gray-100"
            value={categories.find(c => c.id === form.category_id)?.name || ''}
            readOnly
          />
        </div>

        <div className="flex space-x-4">
          <button
            type="submit"
            className="flex-1 bg-black text-white text-lg font-semibold px-6 py-3 rounded-md hover:bg-gray-800 transition"
          >
            {editTransaction ? "Update Transaction" : "Add Transaction"}
          </button>

          {editTransaction && (
            <button
              type="button"
              className="flex-1 bg-gray-300 text-black text-lg font-semibold px-6 py-3 rounded-md hover:bg-gray-400 transition"
              onClick={clearEdit}
            >
              Cancel Edit
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

export default ExpenseForm;