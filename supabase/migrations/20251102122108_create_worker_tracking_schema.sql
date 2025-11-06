/*
  # Worker Tracking App Schema

  ## Overview
  This migration creates the complete database schema for a worker tracking application
  that tracks money taken and time worked by each worker, with monthly archival capabilities.

  ## New Tables

  ### 1. `workers`
  Stores worker information
  - `id` (uuid, primary key) - Unique identifier
  - `user_id` (uuid) - Reference to authenticated user
  - `name` (text) - Worker's name
  - `created_at` (timestamptz) - When worker was added
  - `is_active` (boolean) - Whether worker is currently active (for soft deletes)

  ### 2. `transactions`
  Records individual money/time entries for workers
  - `id` (uuid, primary key) - Unique identifier
  - `worker_id` (uuid, foreign key) - Reference to worker
  - `amount` (numeric) - Money amount taken
  - `hours` (numeric) - Time worked in hours
  - `date` (date) - Date of transaction
  - `notes` (text) - Optional notes
  - `created_at` (timestamptz) - When transaction was recorded

  ### 3. `monthly_summaries`
  Archives monthly data when month is closed
  - `id` (uuid, primary key) - Unique identifier
  - `user_id` (uuid) - Reference to authenticated user
  - `worker_id` (uuid) - Reference to worker (nullable - worker might be deleted)
  - `worker_name` (text) - Worker name at time of archive
  - `month` (date) - First day of the month being archived
  - `total_amount` (numeric) - Total money for the month
  - `total_hours` (numeric) - Total hours for the month
  - `transaction_count` (integer) - Number of transactions
  - `created_at` (timestamptz) - When summary was created

  ## Security
  - Enable RLS on all tables
  - Users can only access their own data
  - Policies enforce user ownership for all operations

  ## Important Notes
  1. Transactions are linked to workers via foreign key with CASCADE delete
  2. Monthly summaries preserve worker names even if worker is deleted
  3. All monetary amounts use numeric type for precision
  4. Dates are stored as date type for easy monthly grouping
*/

CREATE TABLE IF NOT EXISTS workers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true
);

CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id uuid NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  amount numeric(10, 2) DEFAULT 0,
  hours numeric(8, 2) DEFAULT 0,
  date date DEFAULT CURRENT_DATE,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS monthly_summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  worker_id uuid,
  worker_name text NOT NULL,
  month date NOT NULL,
  total_amount numeric(10, 2) DEFAULT 0,
  total_hours numeric(8, 2) DEFAULT 0,
  transaction_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_workers_user_id ON workers(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_worker_id ON transactions(worker_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_monthly_summaries_user_month ON monthly_summaries(user_id, month);

ALTER TABLE workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_summaries ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own workers') THEN
    CREATE POLICY "Users can view own workers"
      ON workers FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert own workers') THEN
    CREATE POLICY "Users can insert own workers"
      ON workers FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update own workers') THEN
    CREATE POLICY "Users can update own workers"
      ON workers FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete own workers') THEN
    CREATE POLICY "Users can delete own workers"
      ON workers FOR DELETE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own transactions') THEN
    CREATE POLICY "Users can view own transactions"
      ON transactions FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM workers
          WHERE workers.id = transactions.worker_id
          AND workers.user_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert own transactions') THEN
    CREATE POLICY "Users can insert own transactions"
      ON transactions FOR INSERT
      TO authenticated
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM workers
          WHERE workers.id = transactions.worker_id
          AND workers.user_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update own transactions') THEN
    CREATE POLICY "Users can update own transactions"
      ON transactions FOR UPDATE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM workers
          WHERE workers.id = transactions.worker_id
          AND workers.user_id = auth.uid()
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM workers
          WHERE workers.id = transactions.worker_id
          AND workers.user_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete own transactions') THEN
    CREATE POLICY "Users can delete own transactions"
      ON transactions FOR DELETE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM workers
          WHERE workers.id = transactions.worker_id
          AND workers.user_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own monthly summaries') THEN
    CREATE POLICY "Users can view own monthly summaries"
      ON monthly_summaries FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert own monthly summaries') THEN
    CREATE POLICY "Users can insert own monthly summaries"
      ON monthly_summaries FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update own monthly summaries') THEN
    CREATE POLICY "Users can update own monthly summaries"
      ON monthly_summaries FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete own monthly summaries') THEN
    CREATE POLICY "Users can delete own monthly summaries"
      ON monthly_summaries FOR DELETE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;
