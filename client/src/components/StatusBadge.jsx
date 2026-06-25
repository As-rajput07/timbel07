import { CheckCircle, Clock, XCircle } from 'lucide-react'

export default function StatusBadge({ status }) {
  let config = {
    colorClass: 'bg-emerald-free/10 text-emerald-free border-emerald-free/20',
    icon: <CheckCircle size={14} />,
    label: 'Free'
  }

  if (status === 'busy-soon') {
    config = {
      colorClass: 'bg-amber-soon/10 text-amber-soon border-amber-soon/20',
      icon: <Clock size={14} />,
      label: 'Busy Soon'
    }
  } else if (status === 'in-use') {
    config = {
      colorClass: 'bg-red-busy/10 text-red-busy border-red-busy/20',
      icon: <XCircle size={14} />,
      label: 'In Use'
    }
  }

  return (
    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold ${config.colorClass}`}>
      {config.icon}
      <span>{config.label}</span>
    </div>
  )
}
