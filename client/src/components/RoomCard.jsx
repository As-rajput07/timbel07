import { Clock, User, BookOpen } from 'lucide-react'
import StatusBadge from './StatusBadge'
import ScheduleAccordion from './ScheduleAccordion'

export default function RoomCard({ room, queryTimeInMinutes }) {
  const { name, status, currentClass, nextClass, fullSchedule } = room

  return (
    <div className="glass-card p-5 hover-lift relative overflow-hidden group">
      {/* Decorative gradient blob for 'Free' status */}
      {status === 'free' && (
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-free/5 rounded-full blur-2xl group-hover:bg-emerald-free/10 transition-colors duration-500 pointer-events-none" />
      )}
      {status === 'in-use' && (
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-red-busy/5 rounded-full blur-2xl transition-colors duration-500 pointer-events-none" />
      )}

      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-2xl font-bold font-heading text-text-primary tracking-tight">
            {name}
          </h3>
        </div>
        <StatusBadge status={status} />
      </div>

      <div className="space-y-4">
        {status === 'in-use' && currentClass && (
          <div className="bg-slate-darker/80 rounded-lg p-3 border border-slate-border/50">
            <p className="text-xs text-red-busy font-bold uppercase tracking-wider mb-2">Current Class</p>
            <h4 className="text-sm font-semibold text-text-primary mb-2 line-clamp-1" title={currentClass.subject}>
              {currentClass.subject}
            </h4>
            <div className="flex flex-col gap-1.5 text-xs text-text-muted">
              <div className="flex items-center gap-2">
                <Clock size={12} className="text-violet-primary" />
                <span>{currentClass.start_time} - {currentClass.end_time}</span>
              </div>
              <div className="flex items-center gap-2">
                <User size={12} className="text-violet-primary" />
                <span className="truncate">{currentClass.teacher || 'TBA'}</span>
              </div>
            </div>
          </div>
        )}

        {(status === 'free' || status === 'busy-soon') && nextClass && (
          <div className="bg-slate-darker/80 rounded-lg p-3 border border-slate-border/50">
            <p className={`text-xs font-bold uppercase tracking-wider mb-2 ${status === 'busy-soon' ? 'text-amber-soon' : 'text-text-muted'}`}>
              Next Up
            </p>
            <h4 className="text-sm font-semibold text-text-primary mb-2 line-clamp-1" title={nextClass.subject}>
              {nextClass.subject}
            </h4>
            <div className="flex flex-col gap-1.5 text-xs text-text-muted">
              <div className="flex items-center gap-2">
                <Clock size={12} className={status === 'busy-soon' ? 'text-amber-soon' : 'text-violet-primary'} />
                <span>{nextClass.start_time} - {nextClass.end_time}</span>
              </div>
              <div className="flex items-center gap-2">
                <User size={12} className={status === 'busy-soon' ? 'text-amber-soon' : 'text-violet-primary'} />
                <span className="truncate">{nextClass.teacher || 'TBA'}</span>
              </div>
            </div>
          </div>
        )}

        {status === 'free' && !nextClass && (
          <div className="bg-emerald-free/5 rounded-lg p-3 border border-emerald-free/10 flex items-center justify-center h-[92px]">
            <p className="text-sm font-medium text-emerald-free/80 text-center">
              Free for the rest of the day 🎉
            </p>
          </div>
        )}
      </div>

      <ScheduleAccordion schedule={fullSchedule} queryTimeInMinutes={queryTimeInMinutes} roomName={name} />
    </div>
  )
}
