import { useState, useEffect } from 'react';
import { supabase } from '../../services/supabaseClient';

function ExpenseForm({ userId, editTransaction, clearEdit }) {
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [form, setForm] = useState({
    date: '',
    description: '',
    debit: '',
    credit: '',
    category_id: '',
    subcategory_id: ''
  });

  useEffect(() => {
    supabase.from('categories').select('*').then(({ data, error }) => {
      if (error) console.error("Category fetch error:", error.message);
      setCategories(data || []);
    });
  }, []);

  useEffect(() => {
    supabase.from('subcategories').select('*').then(({ data, error }) => {
      if (error) console.error("Subcategory fetch error:", error.message);
      setSubcategories(data || []);
    });
  }, []);

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

 async function handleSubmit(e) {
  e.preventDefault();
  if (!validate()) return;

  // ✅ Get the logged-in user directly from Supabase Auth
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    console.error("User not authenticated");
    alert("You must be logged in to save a transaction.");
    return;
  }

  const cleanedForm = {
    ...form,
    debit: form.debit === '' ? null : Number(form.debit),
    credit: form.credit === '' ? null : Number(form.credit),
    user_id: user.id  // ✅ This matches auth.users.id
  };

  let result;
  if (editTransaction) {
    result = await supabase.from('transactions').update(cleanedForm).eq('id', editTransaction.id);
  } else {
    result = await supabase.from('transactions').insert([cleanedForm]);
  }

  if (result.error) {
    console.error("Save error:", result.error.message);
    setSuccessMessage('');
    alert("Failed to save transaction: " + result.error.message);
  } else {
    setSuccessMessage(editTransaction ? "Transaction updated successfully!" : "Transaction added successfully!");
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
        <h2 className="text-3xl font-bold text-black mb-6 text-center">
          {editTransaction ? "Edit Transaction" : "Add Transaction"}
        </h2>

        {/* ✅ Success Banner */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-100 border border-green-300 text-green-700 rounded-md text-center font-medium">
            {successMessage}
          </div>
        )}

        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* Date */}
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

          {/* Subcategory */}
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

          {/* Category */}
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

          {/* Amounts */}
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
          {/* Description */}
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
              className="flex-1 bg-black text-white text-lg font-semibold px-6 py-3 rounded-md hover:bg-gray-800 transition"
            >
              {editTransaction ? "Update Transaction" : "Add Transaction"}
            </button>

            {editTransaction && (
              <button
                type="button"
                className="flex-1 bg-gray-200 text-black text-lg font-semibold px-6 py-3 rounded-md hover:bg-gray-300 transition"
                onClick={clearEdit}
              >
                Cancel Edit
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

export default ExpenseForm;
