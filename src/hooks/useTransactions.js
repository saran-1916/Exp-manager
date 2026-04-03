import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';
import { startOfMonth, format } from 'date-fns';

export function useTransactions(userId, selectedDate) {
  const [data, setData] = useState({ 
    monthlyTransactions: [], 
    allTransactions: [], 
    carryForward: 0, 
    salaryThisMonth: 0, 
    expensesThisMonth: 0 
  });
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    // If no user yet, stop loading and wait
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data: all, error } = await supabase
        .from('transactions')
        .select(`*, categories(name, type), subcategories(name)`)
        .eq('user_id', userId)
        .order('date', { ascending: false });

      if (error) throw error;

      // Logic for Carry Forward
      const mStartStr = format(startOfMonth(selectedDate), 'yyyy-MM-dd');
      const mYearMonth = mStartStr.slice(0, 7); 

      const carryForward = (all || [])
        .filter(t => t.date < mStartStr)
        .reduce((sum, t) => sum + (Number(t.credit || 0) - Number(t.debit || 0)), 0);

      const monthlyTransactions = (all || []).filter(t => t.date.startsWith(mYearMonth));
      const salaryThisMonth = monthlyTransactions.reduce((sum, t) => sum + Number(t.credit || 0), 0);
      const expensesThisMonth = monthlyTransactions.reduce((sum, t) => sum + Number(t.debit || 0), 0);

      setData({ 
        monthlyTransactions, 
        allTransactions: all || [], 
        carryForward, 
        salaryThisMonth, 
        expensesThisMonth 
      });
    } catch (err) {
      console.error("Ledger Fetch Error:", err);
    } finally {
      // ✅ This MUST be here to break the loading screen
      setLoading(false);
    }
  }, [userId, selectedDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { ...data, loading, refresh: fetchData };
}