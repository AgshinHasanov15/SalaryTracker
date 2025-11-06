import { useState, useEffect } from 'react';
import { supabase, Worker, Transaction, WorkerWithStats } from '../lib/supabase';
import { UserPlus, LogOut, Archive, Search, TrendingUp, DollarSign, Clock, Users } from 'lucide-react';
import WorkerCard from './WorkerCard';
import AddWorkerModal from './AddWorkerModal';
import AddTransactionModal from './AddTransactionModal';
import WorkerHistoryModal from './WorkerHistoryModal';
import MonthSelector from './MonthSelector';

export default function Dashboard() {
  const [workers, setWorkers] = useState<WorkerWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddWorker, setShowAddWorker] = useState(false);
  const [showAddTransaction, setShowAddTransaction] = useState<{ workerId: string; workerName: string } | null>(null);
  const [showHistory, setShowHistory] = useState<{ workerId: string; workerName: string; transactions: Transaction[] } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [sortBy, setSortBy] = useState<'name' | 'amount' | 'hours'>('name');

  const isCurrentMonth = () => {
    const now = new Date();
    return currentMonth.getMonth() === now.getMonth() && currentMonth.getFullYear() === now.getFullYear();
  };

  useEffect(() => {
    loadWorkers();
  }, [currentMonth]);

  const loadWorkers = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: workersData, error: workersError } = await supabase
        .from('workers')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('name');

      if (workersError) throw workersError;

      const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

      const workersWithStats: WorkerWithStats[] = await Promise.all(
        (workersData || []).map(async (worker: Worker) => {
          const { data: transactions } = await supabase
            .from('transactions')
            .select('*')
            .eq('worker_id', worker.id)
            .gte('date', startOfMonth.toISOString().split('T')[0])
            .lte('date', endOfMonth.toISOString().split('T')[0]);

          const totalAmount = transactions?.reduce((sum: number, t: Transaction) => sum + parseFloat(t.amount.toString()), 0) || 0;
          const totalHours = transactions?.reduce((sum: number, t: Transaction) => sum + parseFloat(t.hours.toString()), 0) || 0;
          const daysInMonth = endOfMonth.getDate();
          const avgPerDay = totalAmount / daysInMonth;

          return {
            ...worker,
            totalAmount,
            totalHours,
            transactionCount: transactions?.length || 0,
            avgPerDay,
          };
        })
      );

      setWorkers(workersWithStats);
    } catch (error) {
      console.error('Error loading workers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddWorker = async (name: string) => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('workers')
        .insert([{ user_id: user.id, name }]);

      if (error) throw error;
      await loadWorkers();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add worker';
      throw new Error(errorMessage);
    }
  };

  const handleAddTransaction = async (data: { amount: number; hours: number; date: string; notes: string }) => {
    if (!showAddTransaction) return;

    const { error } = await supabase
      .from('transactions')
      .insert([{
        worker_id: showAddTransaction.workerId,
        ...data,
      }]);

    if (error) throw error;
    await loadWorkers();
  };

  const handleDeleteWorker = async (workerId: string, workerName: string) => {
    if (!confirm(`Are you sure you want to delete ${workerName}? This will also delete all their transactions.`)) {
      return;
    }

    const { error } = await supabase
      .from('workers')
      .delete()
      .eq('id', workerId);

    if (error) throw error;
    await loadWorkers();
  };

  const handleShowHistory = async (workerId: string, workerName: string) => {
    const { data: transactions } = await supabase
      .from('transactions')
      .select('*')
      .eq('worker_id', workerId)
      .order('date', { ascending: false });

    setShowHistory({
      workerId,
      workerName,
      transactions: transactions || [],
    });
  };

  const handleCloseMonth = async () => {
    if (!isCurrentMonth()) {
      alert('You can only close the current month');
      return;
    }

    if (!confirm('Are you sure you want to close this month? This will archive all data and reset for the next month.')) {
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const monthDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).toISOString().split('T')[0];

      for (const worker of workers) {
        if (worker.transactionCount > 0) {
          await supabase.from('monthly_summaries').insert([{
            user_id: user.id,
            worker_id: worker.id,
            worker_name: worker.name,
            month: monthDate,
            total_amount: worker.totalAmount,
            total_hours: worker.totalHours,
            transaction_count: worker.transactionCount,
          }]);
        }
      }

      const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

      for (const worker of workers) {
        await supabase
          .from('transactions')
          .delete()
          .eq('worker_id', worker.id)
          .gte('date', startOfMonth.toISOString().split('T')[0])
          .lte('date', endOfMonth.toISOString().split('T')[0]);
      }

      alert('Month closed successfully!');
      await loadWorkers();
    } catch (error) {
      console.error('Error closing month:', error);
      alert('Error closing month');
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const filteredWorkers = workers
    .filter(w => w.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      switch (sortBy) {
        case 'amount':
          return b.totalAmount - a.totalAmount;
        case 'hours':
          return b.totalHours - a.totalHours;
        default:
          return a.name.localeCompare(b.name);
      }
    });

  const totals = workers.reduce(
    (acc, w) => ({
      amount: acc.amount + w.totalAmount,
      hours: acc.hours + w.totalHours,
      workers: acc.workers + 1,
    }),
    { amount: 0, hours: 0, workers: 0 }
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-slate-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-slate-800">Worker Tracker</h1>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 px-4 py-2 text-slate-700 hover:bg-white rounded-lg transition-colors"
          >
            <LogOut size={20} />
            Sign Out
          </button>
        </div>

        <div className="mb-6">
          <MonthSelector
            currentMonth={currentMonth}
            onPrevMonth={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
            onNextMonth={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
            isCurrentMonth={isCurrentMonth()}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <DollarSign className="text-green-600" size={20} />
              </div>
              <div>
                <p className="text-sm text-slate-600">Total Amount</p>
                <p className="text-2xl font-bold text-slate-800">₼{totals.amount.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Clock className="text-blue-600" size={20} />
              </div>
              <div>
                <p className="text-sm text-slate-600">Total Hours</p>
                <p className="text-2xl font-bold text-slate-800">{totals.hours.toFixed(1)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <Users className="text-purple-600" size={20} />
              </div>
              <div>
                <p className="text-sm text-slate-600">Active Workers</p>
                <p className="text-2xl font-bold text-slate-800">{totals.workers}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-4 mb-6 border border-slate-200">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="text"
                placeholder="Search workers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'name' | 'amount' | 'hours')}
                className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="name">Sort by Name</option>
                <option value="amount">Sort by Amount</option>
                <option value="hours">Sort by Hours</option>
              </select>

              <button
                onClick={() => setShowAddWorker(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap"
              >
                <UserPlus size={20} />
                Add Worker
              </button>

              {isCurrentMonth() && (
                <button
                  onClick={handleCloseMonth}
                  className="bg-orange-600 hover:bg-orange-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap"
                >
                  <Archive size={20} />
                  Close Month
                </button>
              )}
            </div>
          </div>
        </div>

        {filteredWorkers.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center border border-slate-200">
            <Users size={48} className="mx-auto text-slate-300 mb-4" />
            <h3 className="text-xl font-semibold text-slate-700 mb-2">No workers yet</h3>
            <p className="text-slate-500 mb-6">Get started by adding your first worker</p>
            <button
              onClick={() => setShowAddWorker(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors inline-flex items-center gap-2"
            >
              <UserPlus size={20} />
              Add First Worker
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredWorkers.map((worker) => (
              <WorkerCard
                key={worker.id}
                worker={worker}
                onAddTransaction={(id, name) => setShowAddTransaction({ workerId: id, workerName: name })}
                onDelete={handleDeleteWorker}
                onShowHistory={handleShowHistory}
              />
            ))}
          </div>
        )}
      </div>

      {showAddWorker && (
        <AddWorkerModal
          onClose={() => setShowAddWorker(false)}
          onAdd={handleAddWorker}
        />
      )}

      {showAddTransaction && (
        <AddTransactionModal
          workerId={showAddTransaction.workerId}
          workerName={showAddTransaction.workerName}
          onClose={() => setShowAddTransaction(null)}
          onAdd={handleAddTransaction}
        />
      )}

      {showHistory && (
        <WorkerHistoryModal
          workerName={showHistory.workerName}
          transactions={showHistory.transactions}
          onClose={() => setShowHistory(null)}
        />
      )}
    </div>
  );
}
