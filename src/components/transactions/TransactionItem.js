import React from 'react';
import { ArrowUpRight, ArrowDownLeft } from 'lucide-react';

export default function TransactionItem({ t }) {
  const isExpense = Number(t.debit) > 0;

  return (
    <div className="flex items-center justify-between p-3 hover:bg-slate-50 transition-all rounded-xl border border-transparent hover:border-slate-100">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-full ${isExpense ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
          {isExpense ? <ArrowUpRight size={16} /> : <ArrowDownLeft size={16} />}
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-800 line-clamp-1">{t.description || 'Transaction'}</p>
          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            {t.categories?.name || 'General'}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className={`text-sm font-bold ${isExpense ? 'text-slate-900' : 'text-emerald-600'}`}>
          {isExpense ? `-₹${Number(t.debit)}` : `+₹${Number(t.credit)}`}
        </p>
        <p className="text-[10px] text-slate-400 font-medium">{t.date}</p>
      </div>
    </div>
  );
}