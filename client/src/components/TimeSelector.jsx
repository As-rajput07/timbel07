import { Clock, RefreshCw } from 'lucide-react'

export default function TimeSelector({ selectedTime, onSelect, onSyncNow }) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative w-full sm:w-40">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Clock className="h-5 w-5 text-violet-primary" />
        </div>
        <input
          type="time"
          value={selectedTime}
          onChange={(e) => onSelect(e.target.value)}
          className="w-full pl-10 pr-3 py-3 bg-slate-darker border border-slate-border text-text-primary rounded-xl focus:outline-none focus:border-violet-primary focus:ring-1 focus:ring-violet-primary transition-colors [&::-webkit-calendar-picker-indicator]:filter-[invert(1)]"
        />
      </div>
      
      <button
        onClick={onSyncNow}
        className="p-3 bg-slate-darker border border-slate-border text-text-muted hover:text-violet-primary hover:border-violet-primary/50 rounded-xl transition-colors group flex-shrink-0"
        title="Sync with current time"
      >
        <RefreshCw className="h-5 w-5 group-hover:rotate-180 transition-transform duration-500" />
      </button>
    </div>
  )
}
