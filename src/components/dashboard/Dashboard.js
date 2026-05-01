import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTransactions } from '../../hooks/useTransactions';
import { Card } from '../ui/Card';
import { CategoryIcon } from '../ui/CategoryIcon';
import { format, addMonths, subMonths } from 'date-fns';
import {
  ArrowDownLeft,
  BarChart2,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  History,
  PlusCircle,
  Sparkles,
  Wallet
} from 'lucide-react';

const currency = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0
});

const formatCurrency = (value) => currency.format(Number(value || 0));


export default function Dashboard({ user }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const { monthlyTransactions, carryForward, salaryThisMonth, expensesThisMonth, loading } = useTransactions(user?.id, currentDate);

  const totalMonthlyIncome = carryForward + salaryThisMonth;
  const currentBalance = totalMonthlyIncome - expensesThisMonth;
  const spendRate = totalMonthlyIncome > 0 ? Math.min((expensesThisMonth / totalMonthlyIncome) * 100, 100) : 0;
  const remainingRate = totalMonthlyIncome > 0 ? Math.max((currentBalance / totalMonthlyIncome) * 100, 0) : 0;
  const userInitials = user?.email?.slice(0, 2).toUpperCase() || 'SP';

  // Visual Hierarchy Logic
  const hierarchy = useMemo(() => {
    const grouped = monthlyTransactions.reduce((acc, t) => {
      if (t.debit > 0) {
        const cat = t.categories?.name || 'General';
        if (!acc[cat]) acc[cat] = { total: 0, subs: {}, iconSlug: t.categories?.icon_slug };
        acc[cat].total += Number(t.debit);
        const sub = t.subcategories?.name || 'Other';
        acc[cat].subs[sub] = (acc[cat].subs[sub] || 0) + Number(t.debit);
      }
      return acc;
    }, {});

    return Object.entries(grouped)
      .sort(([, a], [, b]) => b.total - a.total)
      .map(([cat, data], index) => ({
        cat,
        total: data.total,
        iconSlug: data.iconSlug,
        subs: Object.entries(data.subs).sort(([, a], [, b]) => b - a),
        tone: [
          'from-indigo-500 to-sky-400',
          'from-rose-500 to-orange-400',
          'from-emerald-500 to-teal-400',
          'from-amber-500 to-yellow-300',
          'from-violet-500 to-fuchsia-400'
        ][index % 5]
      }));
  }, [monthlyTransactions]);

  const recentTransactions = monthlyTransactions.slice(0, 4);
  const heroStats = [
    { label: 'Salary', value: formatCurrency(salaryThisMonth), tone: 'text-[#4DBBFF]' },
    { label: 'Carry forward', value: formatCurrency(carryForward), tone: 'text-zinc-300' },
    { label: 'Total income', value: formatCurrency(totalMonthlyIncome), tone: 'text-white' },
    { label: 'Spent', value: formatCurrency(expensesThisMonth), tone: 'text-[#4DBBFF]' }
  ];
  const quickActions = [
    { label: 'Add expense', path: '/form', icon: PlusCircle, tone: 'bg-indigo-600 text-white shadow-indigo-600/20' },
    { label: 'History', path: '/transactions', icon: History, tone: 'bg-white text-slate-900 ring-1 ring-slate-200' },
    { label: 'Tracker', path: '/money-tracker', icon: Wallet, tone: 'bg-white text-slate-900 ring-1 ring-slate-200' },
    { label: 'Statistics', path: '/statistics', icon: BarChart2, tone: 'bg-white text-slate-900 ring-1 ring-slate-200' }
  ];

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="rounded-3xl border border-slate-200 bg-white px-8 py-6 text-center shadow-sm">
          <div className="mx-auto mb-4 h-10 w-10 animate-pulse rounded-2xl bg-slate-900" />
          <p className="text-xs font-black uppercase tracking-[0.35em] text-slate-500">Syncing data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="-m-4 min-h-screen bg-white font-sans md:-m-10">
      <section className="bg-white px-4 pb-8 pt-6 text-black md:px-10 md:pb-10 md:pt-10">
        <div className="mx-auto max-w-7xl">

          {/* ── Top bar: month navigator + profile badge (mobile) ── */}
          <div className="relative flex items-center justify-between gap-2 lg:justify-start">

            {/* Month navigator */}
            <div className="flex items-center gap-2 rounded-2xl border border-[#F0F0F0] bg-white p-2">
              <button
                onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                className="grid h-10 w-10 place-items-center rounded-xl border border-[#F0F0F0] text-black transition hover:border-[#0077FF] hover:text-[#0077FF]"
                aria-label="Previous month"
              >
                <ChevronLeft size={20} />
              </button>
              <div className="min-w-0 w-[160px] px-2 text-center">
                <p className="spera-truncate-label font-black uppercase tracking-[0.25em] text-[#71717A]">Statement</p>
                <h2 className="spera-truncate text-base font-black text-black">{format(currentDate, 'MMMM yyyy')}</h2>
              </div>
              <button
                onClick={() => setCurrentDate(addMonths(currentDate, 1))}
                className="grid h-10 w-10 place-items-center rounded-xl border border-[#F0F0F0] text-black transition hover:border-[#0077FF] hover:text-[#0077FF]"
                aria-label="Next month"
              >
                <ChevronRight size={20} />
              </button>
            </div>

            {/* Profile badge — visible on mobile only, hidden on lg+ (handled by sidebar/nav) */}
            <Link
              to="/profile"
              className="lg:hidden flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#F0F0F0] bg-white text-xs font-black text-[#71717A] shadow-sm transition active:scale-95 hover:border-[#0077FF] hover:text-[#0077FF]"
              aria-label="Profile"
            >
              {userInitials}
            </Link>

          </div>
          {/* ── /Top bar ── */}

          <div className="mt-8 grid gap-5 lg:grid-cols-[minmax(0,0.68fr)_minmax(280px,0.32fr)] lg:items-stretch">
            <div className="rounded-[28px] bg-[#111111] p-5 text-white sm:p-7">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-white/5 text-[#0077FF] sm:h-12 sm:w-12">
                    <CreditCard size={22} strokeWidth={1.7} />
                  </div>
                  <div className="spera-truncate-flex">
                    <p className="spera-truncate-label font-black uppercase tracking-[0.3em] text-zinc-500">Spera card</p>
                    <p className="spera-truncate text-sm font-bold text-zinc-300">Monthly account</p>
                  </div>
                </div>
                <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-black text-zinc-200">
                  {userInitials}
                </div>
              </div>

              <div className="pt-8">
                <p className="spera-truncate-label font-black uppercase tracking-[0.32em] text-zinc-500">Current balance</p>
                <h2 className={`mt-3 break-words text-4xl font-black tracking-tight sm:text-6xl ${currentBalance < 0 ? 'text-rose-300' : 'text-white'}`}>
                  {formatCurrency(currentBalance)}
                </h2>
                <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
                  {heroStats.map((stat) => (
                    <div key={stat.label} className="min-w-0 max-w-full overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-3 sm:p-4">
                      <p className="spera-truncate-label font-black uppercase tracking-[0.16em] text-zinc-500">{stat.label}</p>
                      <p className={`mt-2 break-words text-sm font-black sm:text-base ${stat.tone}`}>{stat.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-[#F0F0F0] bg-white p-5">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div className="spera-truncate-flex">
                  <p className="spera-truncate-label font-black uppercase tracking-[0.28em] text-[#71717A]">Available</p>
                  <p className="mt-1 text-4xl font-black tracking-tight text-black">{remainingRate.toFixed(0)}%</p>
                </div>
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#EAF4FF] text-[#0077FF]">
                  <Wallet size={21} strokeWidth={1.7} />
                </div>
              </div>
              <div className="mb-2 flex items-center justify-between gap-3 text-xs font-bold text-[#71717A]">
                <span className="spera-truncate">Used this month</span>
                <span className="shrink-0 text-black">{spendRate.toFixed(0)}%</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-[#F4F4F5]">
                <div className="h-full rounded-full bg-[#0077FF]" style={{ width: `${spendRate}%` }} />
              </div>
              <div className="mt-4 flex max-w-full items-center gap-2 overflow-hidden rounded-2xl border border-[#F0F0F0] px-4 py-3 text-black">
                <CalendarDays size={18} className="text-[#0077FF]" />
                <span className="spera-truncate-button font-black">{format(currentDate, 'MMM yyyy')}</span>
                <span className="ml-auto shrink-0 text-xs font-bold text-[#71717A]">{monthlyTransactions.length} entries</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white px-4 pb-28 pt-2 md:px-10 md:pb-16">
        <div className="mx-auto max-w-7xl space-y-6">
          <Card className="border border-[#F0F0F0] p-4 sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="spera-truncate-label font-black uppercase tracking-[0.28em] text-[#71717A]">Actions</p>
                <h3 className="spera-truncate mt-1 text-xl font-black tracking-tight text-black">Quick access</h3>
              </div>
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#EAF4FF] text-[#0077FF]">
                <Sparkles size={18} strokeWidth={1.7} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {quickActions.map((action) => (
                <Link
                  key={action.path}
                  to={action.path}
                  className={`flex min-h-[72px] min-w-0 max-w-full flex-1 flex-col items-start justify-center gap-2 overflow-hidden rounded-xl border border-[#F0F0F0] p-4 font-black transition active:scale-[0.98] ${action.path === '/form' ? 'bg-[#0077FF] text-white' : 'bg-white text-black'}`}
                >
                  <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${action.path === '/form' ? 'bg-white/15' : 'bg-[#F8F8F8] text-[#0077FF]'}`}>
                    <action.icon size={19} strokeWidth={1.7} />
                  </span>
                  <span className="spera-card-text w-full font-black">
                    {action.label}
                  </span>
                </Link>
              ))}
            </div>
          </Card>

          <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_0.72fr]">
            <Card className="border border-[#F0F0F0] p-5 sm:p-8">
              <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 flex-1">
                  <p className="spera-truncate-label font-black uppercase tracking-[0.28em] text-[#71717A]">Analysis</p>
                  <h3 className="spera-truncate mt-1 text-2xl font-black tracking-tight text-black">Monthly spending</h3>
                </div>
                <div className="spera-truncate-button shrink-0 rounded-xl border border-[#F0F0F0] bg-white px-4 py-2 font-black text-black">
                  {formatCurrency(expensesThisMonth)}
                </div>
              </div>

              {hierarchy.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-[#F0F0F0] bg-white px-6 py-14 text-center">
                  <p className="text-sm font-black uppercase tracking-[0.18em] text-[#71717A]">No expenses yet</p>
                  <p className="mt-2 text-sm font-semibold text-[#71717A]">This month is still clean.</p>
                </div>
              ) : (
                <div className="space-y-7">
                  {hierarchy.map((data) => {
                    const perc = expensesThisMonth > 0 ? Math.round((data.total / expensesThisMonth) * 100) : 0;
                    return (
                      <div key={data.cat} className="space-y-3">
                        <div className="flex items-end justify-between gap-4">
                          <div className="flex min-w-0 items-center gap-3">
                            <CategoryIcon iconSlug={data.iconSlug} className="h-10 w-10 bg-[#111111] text-white" />
                            <div className="spera-truncate-flex">
                              <p className="spera-truncate-button font-black uppercase tracking-tight text-black">{data.cat}</p>
                              <p className="spera-truncate mt-1 text-xs font-semibold text-[#71717A]">{data.subs.length} subcategories</p>
                            </div>
                          </div>
                          <div className="min-w-0 max-w-[45%] shrink-0 text-right">
                            <p className="text-base font-black text-black">{formatCurrency(data.total)}</p>
                            <p className="text-xs font-black text-[#71717A]">{perc}%</p>
                          </div>
                        </div>
                        <div className="h-2.5 overflow-hidden rounded-full bg-[#F4F4F5]">
                          <div className="h-full rounded-full bg-[#0077FF]" style={{ width: `${perc}%` }} />
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {data.subs.map(([sub, val]) => (
                            <div key={sub} className="spera-truncate max-w-full rounded-full border border-[#F0F0F0] bg-white px-3 py-1 text-[11px] font-black uppercase tracking-tight text-[#71717A]">
                              {sub}: {formatCurrency(val)}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

            <Card className="border border-[#F0F0F0] p-5 sm:p-8">
              <div className="mb-6 flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="spera-truncate-label font-black uppercase tracking-[0.28em] text-[#71717A]">Activity</p>
                  <h3 className="spera-truncate mt-1 text-2xl font-black tracking-tight text-black">Recent entries</h3>
                </div>
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#EAF4FF] text-[#0077FF]">
                  <CreditCard size={20} strokeWidth={1.7} />
                </div>
              </div>

              <div className="space-y-3">
                {recentTransactions.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-[#F0F0F0] bg-white px-5 py-12 text-center">
                    <p className="text-sm font-black uppercase tracking-[0.18em] text-[#71717A]">No entries</p>
                    <p className="mt-2 text-sm font-semibold text-[#71717A]">Transactions will appear here.</p>
                  </div>
                ) : (
                  recentTransactions.map((transaction) => {
                    const isCredit = Number(transaction.credit || 0) > 0;
                    const amount = isCredit ? transaction.credit : transaction.debit;
                    return (
                      <div key={transaction.id} className="flex items-center gap-3 rounded-2xl border border-[#F0F0F0] bg-white p-3">
                        {isCredit ? (
                          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
                            <ArrowDownLeft size={19} strokeWidth={1.7} />
                          </div>
                        ) : (
                          <CategoryIcon iconSlug={transaction.categories?.icon_slug} className="h-11 w-11 shrink-0 bg-[#111111] text-white" size={19} />
                        )}
                        <div className="spera-truncate-flex">
                          <p className="spera-truncate-button font-black text-black">{transaction.categories?.name || transaction.description || 'Transaction'}</p>
                          <p className="spera-truncate mt-0.5 text-xs font-bold text-[#71717A]">{format(new Date(transaction.date), 'dd MMM yyyy')}</p>
                        </div>
                        <p className={`shrink-0 text-sm font-black ${isCredit ? 'text-emerald-600' : 'text-black'}`}>
                          {isCredit ? '+' : '-'}{formatCurrency(amount)}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>
            </Card>
          </section>
        </div>
      </section>
    </div>
  );
}