import React from 'react';
import { ArrowDownLeft } from 'lucide-react';
import { CategoryIcon } from '../ui/CategoryIcon';

export default function TransactionItem({ t }) {
  const isExpense = Number(t.debit) > 0;

  return (
    <div className="flex items-center justify-between p-3 hover:bg-slate-50 transition-all rounded-xl border border-transparent hover:border-slate-100">
      <div className="flex items-center gap-3">
        {isExpense ? (
          <CategoryIcon iconSlug={t.categories?.icon_slug} className="h-9 w-9 bg-slate-950 text-slate-300" size={16} />
        ) : (
          <div className="grid h-9 w-9 place-items-center rounded-2xl border border-emerald-100 bg-emerald-50 text-emerald-600">
            <ArrowDownLeft size={16} strokeWidth={1.7} />
          </div>
        )}
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
