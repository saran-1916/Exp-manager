# Money Tracker Database Setup Guide

If you're seeing "No records yet" or error messages on the Money Tracker page, you need to set up the required database tables in Supabase.

## Required Tables and Schema

Run the following SQL queries in your Supabase project to create the necessary tables.

### 1. LENT Table

```sql
CREATE TABLE public.lent (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  person_name VARCHAR(255) NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  notes TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX lent_user_id_idx ON public.lent(user_id);
```

### 2. LENT_RETURNS Table

```sql
CREATE TABLE public.lent_returns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lent_id UUID NOT NULL REFERENCES public.lent(id) ON DELETE CASCADE,
  amount DECIMAL(12, 2) NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX lent_returns_lent_id_idx ON public.lent_returns(lent_id);
```

### 3. DEBTS Table

```sql
CREATE TABLE public.debts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  person_name VARCHAR(255) NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  notes TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX debts_user_id_idx ON public.debts(user_id);
```

### 4. DEBT_PAYMENTS Table

```sql
CREATE TABLE public.debt_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  debt_id UUID NOT NULL REFERENCES public.debts(id) ON DELETE CASCADE,
  amount DECIMAL(12, 2) NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX debt_payments_debt_id_idx ON public.debt_payments(debt_id);
```

### 5. SAFE_KEEPING Table

```sql
CREATE TABLE public.safe_keeping (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  person_name VARCHAR(255) NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  notes TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX safe_keeping_user_id_idx ON public.safe_keeping(user_id);
```

### 6. SAFE_RETURNS Table

```sql
CREATE TABLE public.safe_returns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  safe_id UUID NOT NULL REFERENCES public.safe_keeping(id) ON DELETE CASCADE,
  amount DECIMAL(12, 2) NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX safe_returns_safe_id_idx ON public.safe_returns(safe_id);
```

### 7. SAVINGS Table

```sql
CREATE TABLE public.savings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(12, 2) NOT NULL,
  notes TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX savings_user_id_idx ON public.savings(user_id);
```

### 8. SAVINGS_RETURNS Table

```sql
CREATE TABLE public.savings_returns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  saving_id UUID NOT NULL REFERENCES public.savings(id) ON DELETE CASCADE,
  amount DECIMAL(12, 2) NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX savings_returns_saving_id_idx ON public.savings_returns(saving_id);
```

## How to Run These Queries

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy and paste each SQL query above
5. Click **Run** for each query
6. Ensure each query completes successfully (you'll see a checkmark)

## Enabling Row-Level Security (Optional but Recommended)

For security, enable RLS on these tables:

```sql
-- Enable RLS on all tables
ALTER TABLE public.lent ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lent_returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debt_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safe_keeping ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safe_returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.savings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.savings_returns ENABLE ROW LEVEL SECURITY;

-- Create policies for each table
CREATE POLICY "Users can only see their own lent records" ON public.lent
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own lent records" ON public.lent
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own lent records" ON public.lent
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own lent records" ON public.lent
  FOR DELETE USING (auth.uid() = user_id);

-- Repeat similar policies for debts, safe_keeping, and savings tables
-- (copy the pattern above and replace "lent" with the appropriate table name)
```

## Troubleshooting

### Still seeing "No records yet"?
- ✅ Ensure all tables are created successfully
- ✅ Refresh the page (Ctrl+F5 or Cmd+Shift+R)
- ✅ Check browser console for error messages

### Seeing error messages?
- ✅ Check that table names match exactly (case-sensitive in some cases)
- ✅ Verify user_id is correctly set in your auth system
- ✅ Ensure RLS policies don't block your user

### Need to check table structure?
In Supabase SQL Editor, run:
```sql
SELECT * FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('lent', 'debts', 'safe_keeping', 'savings');
```

## Features Overview

| Tab | Purpose | Tracks |
|-----|---------|--------|
| **Lent** | Money you've lent to others | Partial returns reduce remaining balance |
| **Debts** | Money you owe to creditors | Payments reduce outstanding debt |
| **Safekeeping** | Items/money held for someone else | Returns decrease the kept amount |
| **Savings** | Personal savings goals/deposits | Accumulates deposits, tracks spending |

Each entry shows:
- 📊 Progress bar (how much is returned/paid/spent)
- ✅ Settlement status (Pending/Settled)
- 📝 Activity log with complete transaction history
- 🔧 Edit, delete, and mark as settled options
