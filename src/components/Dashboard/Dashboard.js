import React, { useState } from 'react';
import { useTransactions } from '../../hooks/useTransactions';
import { Card } from '../ui/Card';
import { format, addMonths, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Wallet } from 'lucide-react';

export default function Dashboard({ user }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const { monthlyTransactions, carryForward, salaryThisMonth, expensesThisMonth, loading } = useTransactions(user?.id, currentDate);

  const totalMonthlyIncome = carryForward + salaryThisMonth;
  const currentBalance = totalMonthlyIncome - expensesThisMonth;

  // Visual Hierarchy Logic
  const hierarchy = monthlyTransactions.reduce((acc, t) => {
    if (t.debit > 0) {
      const cat = t.categories?.name || 'General';
      if (!acc[cat]) acc[cat] = { total: 0, subs: {} };
      acc[cat].total += Number(t.debit);
      const sub = t.subcategories?.name || 'Other';
      acc[cat].subs[sub] = (acc[cat].subs[sub] || 0) + Number(t.debit);
    }
    return acc;
  }, {});

  if (loading) return <div className="h-screen flex items-center justify-center font-black text-slate-900 text-2xl animate-pulse">SYNCING DATA...</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 font-sans">
      {/* Month Selector */}
      <div className="bg-white border-2 border-slate-200 p-6 rounded-3xl shadow-sm text-center">
        <div className="flex items-center justify-between">
          <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="p-2 border rounded-full hover:bg-slate-50 transition-colors"><ChevronLeft size={24} className="text-slate-900" /></button>
          <div>
            <h2 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">{format(currentDate, 'MMMM yyyy')}</h2>
            <p className="text-sm text-slate-500 font-bold italic mt-1 underline decoration-indigo-400">Carry Forward: ₹{carryForward.toLocaleString()}</p>
          </div>
          <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="p-2 border rounded-full hover:bg-slate-50 transition-colors"><ChevronRight size={24} className="text-slate-900" /></button>
        </div>
      </div>

      {/* 3 Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-l-8 border-emerald-500 shadow-md">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Monthly Income (Salary + CF)</p>
          <div className="flex justify-between items-center mt-1">
            <h2 className="text-3xl font-black text-slate-900 tracking-tighter">₹{totalMonthlyIncome.toLocaleString()}</h2>
            <TrendingUp size={24} className="text-emerald-500" />
          </div>
        </Card>

        <Card className="border-l-8 border-rose-500 shadow-md">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Monthly Expenses</p>
          <div className="flex justify-between items-center mt-1">
            <h2 className="text-3xl font-black text-slate-900 tracking-tighter">₹{expensesThisMonth.toLocaleString()}</h2>
            <TrendingDown size={24} className="text-rose-500" />
          </div>
        </Card>

        <Card className="border-l-8 border-indigo-600 bg-indigo-50/20 shadow-md">
          <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Current Net Balance</p>
          <div className="flex justify-between items-center mt-1">
            <h2 className="text-3xl font-black text-slate-950 tracking-tighter italic">₹{currentBalance.toLocaleString()}</h2>
            <Wallet size={24} className="text-indigo-400" />
          </div>
        </Card>
      </div>

      {/* Visual Analysis */}
      <Card className="p-8 border-2 border-slate-100 shadow-sm">
        <h3 className="text-lg font-black text-slate-800 mb-8 uppercase tracking-tight border-b-2 border-slate-100 pb-2">Monthly Spending Analysis</h3>
        <div className="space-y-12">
          {Object.entries(hierarchy).map(([cat, data]) => {
            const perc = ((data.total / expensesThisMonth) * 100).toFixed(0);
            return (
              <div key={cat} className="space-y-3">
                <div className="flex justify-between items-end">
                  <span className="font-black text-slate-700 uppercase text-xs">{cat}</span>
                  <span className="font-black text-slate-900 text-base">₹{data.total.toLocaleString()} ({perc}%)</span>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                  <div className="h-full bg-slate-900 rounded-full transition-all" style={{ width: `${perc}%` }} />
                </div>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(data.subs).map(([sub, val]) => (
                    <div key={sub} className="px-3 py-1 bg-white border border-slate-200 rounded-xl text-[10px] font-black text-slate-500 uppercase tracking-tighter">
                      {sub}: ₹{val}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}