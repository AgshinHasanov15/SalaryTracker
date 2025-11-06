import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Worker {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  is_active: boolean;
}

export interface Transaction {
  id: string;
  worker_id: string;
  amount: number;
  hours: number;
  date: string;
  notes: string;
  created_at: string;
}

export interface MonthlySummary {
  id: string;
  user_id: string;
  worker_id: string | null;
  worker_name: string;
  month: string;
  total_amount: number;
  total_hours: number;
  transaction_count: number;
  created_at: string;
}

export interface WorkerWithStats extends Worker {
  totalAmount: number;
  totalHours: number;
  transactionCount: number;
  avgPerDay: number;
}
