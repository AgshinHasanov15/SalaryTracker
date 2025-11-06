import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

interface MonthSelectorProps {
  currentMonth: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  isCurrentMonth: boolean;
}

export default function MonthSelector({
  currentMonth,
  onPrevMonth,
  onNextMonth,
  isCurrentMonth,
}: MonthSelectorProps) {
  const formatMonth = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-4 flex items-center justify-between border border-slate-200">
      <button
        onClick={onPrevMonth}
        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
        title="Previous month"
      >
        <ChevronLeft size={24} className="text-slate-600" />
      </button>

      <div className="flex items-center gap-2">
        <Calendar size={20} className="text-blue-600" />
        <h2 className="text-xl font-bold text-slate-800">
          {formatMonth(currentMonth)}
        </h2>
        {isCurrentMonth && (
          <span className="bg-blue-100 text-blue-700 text-xs font-medium px-2 py-1 rounded-full">
            Current
          </span>
        )}
      </div>

      <button
        onClick={onNextMonth}
        disabled={isCurrentMonth}
        className="p-2 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        title="Next month"
      >
        <ChevronRight size={24} className="text-slate-600" />
      </button>
    </div>
  );
}
