import { User, DollarSign, Clock, Plus, Trash2 } from 'lucide-react';
import { WorkerWithStats } from '../lib/supabase';

interface WorkerCardProps {
  worker: WorkerWithStats;
  onAddTransaction: (workerId: string, workerName: string) => void;
  onDelete: (workerId: string, workerName: string) => void;
  onShowHistory: (workerId: string, workerName: string) => void;
}

export default function WorkerCard({ worker, onAddTransaction, onDelete, onShowHistory }: WorkerCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-6 border border-slate-200">
      <div className="flex items-start justify-between mb-4">
        <button
          onClick={() => onShowHistory(worker.id, worker.name)}
          className="flex items-center gap-3 flex-1 cursor-pointer hover:opacity-80 transition-opacity text-left"
        >
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <User className="text-blue-600" size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">{worker.name}</h3>
            <p className="text-sm text-slate-500">{worker.transactionCount} transactions</p>
          </div>
        </button>
        <button
          onClick={() => onDelete(worker.id, worker.name)}
          className="text-slate-400 hover:text-red-600 transition-colors"
          title="Delete worker"
        >
          <Trash2 size={20} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-green-50 rounded-lg p-3">
          <div className="flex items-center gap-2 text-green-700 mb-1">
            <DollarSign size={16} />
            <span className="text-xs font-medium">Total Amount</span>
          </div>
          <p className="text-2xl font-bold text-green-700">
            ₼{worker.totalAmount.toFixed(2)}
          </p>
        </div>

        <div className="bg-blue-50 rounded-lg p-3">
          <div className="flex items-center gap-2 text-blue-700 mb-1">
            <Clock size={16} />
            <span className="text-xs font-medium">Total Hours</span>
          </div>
          <p className="text-2xl font-bold text-blue-700">
            {worker.totalHours.toFixed(1)}
          </p>
        </div>
      </div>

      <div className="bg-slate-50 rounded-lg p-3 mb-4">
        <p className="text-xs text-slate-600 mb-1">Average per day</p>
        <p className="text-lg font-semibold text-slate-800">
          ₼{worker.avgPerDay.toFixed(2)}/day
        </p>
      </div>

      <button
        onClick={() => onAddTransaction(worker.id, worker.name)}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
      >
        <Plus size={20} />
        Add Transaction
      </button>
    </div>
  );
}
