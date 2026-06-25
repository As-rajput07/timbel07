export default function DaySelector({ selectedDay, onSelect }) {
  const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

  return (
    <div className="flex flex-wrap gap-2">
      {days.map((day) => {
        const isSelected = selectedDay === day
        return (
          <button
            key={day}
            onClick={() => onSelect(day)}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${
              isSelected
                ? 'bg-violet-primary text-white shadow-lg shadow-violet-primary/20 scale-105'
                : 'bg-slate-darker border border-slate-border text-text-muted hover:text-text-primary hover:border-violet-primary/50'
            }`}
          >
            {day}
          </button>
        )
      })}
    </div>
  )
}
