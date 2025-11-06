import { X, DollarSign, Clock, Calendar } from 'lucide-react';
import { Transaction } from '../lib/supabase';

interface WorkerHistoryModalProps {
  workerName: string;
  transactions: Transaction[];
  onClose: () => void;
}

export default function WorkerHistoryModal({
  workerName,
  transactions,
  onClose,
}: WorkerHistoryModalProps) {
  const sortedTransactions = [...transactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const totalAmount = transactions.reduce(
    (sum, t) => sum + parseFloat(t.amount.toString()),
    0
  );
  const totalHours = transactions.reduce(
    (sum, t) => sum + parseFloat(t.hours.toString()),
    0
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-96 overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Payment History</h2>
            <p className="text-sm text-slate-600 mt-1">{workerName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 grid grid-cols-2 gap-4">
          <div>
            <div className="flex items-center gap-2 text-slate-600 mb-1">
              <DollarSign size={16} />
              <span className="text-xs font-medium">Total Amount</span>
            </div>
            <p className="text-xl font-bold text-slate-800">₼{totalAmount.toFixed(2)}</p>
          </div>
          <div>
            <div className="flex items-center gap-2 text-slate-600 mb-1">
              <Clock size={16} />
              <span className="text-xs font-medium">Total Hours</span>
            </div>
            <p className="text-xl font-bold text-slate-800">{totalHours.toFixed(1)}h</p>
          </div>
        </div>

        <div className="overflow-y-auto flex-1">
          {sortedTransactions.length === 0 ? (
            <div className="p-6 text-center text-slate-500">
              No transactions yet
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {sortedTransactions.map((transaction) => (
                <div key={transaction.id} className="p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Calendar size={16} />
                      <span className="font-medium">
                        {new Date(transaction.date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-700">₼{parseFloat(transaction.amount.toString()).toFixed(2)}</p>
                      <p className="text-sm text-slate-600">{parseFloat(transaction.hours.toString()).toFixed(2)}h</p>
                    </div>
                  </div>
                  {transaction.notes && (
                    <p className="text-sm text-slate-600 ml-6">{transaction.notes}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-slate-200 p-4 bg-slate-50">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-white transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
