import { ChevronDown, Building2 } from 'lucide-react'

export default function BuildingSelector({ buildings, selectedBuilding, onSelect }) {
  return (
    <div className="relative w-full sm:w-48">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Building2 className="h-5 w-5 text-violet-primary" />
      </div>
      <select
        value={selectedBuilding}
        onChange={(e) => onSelect(e.target.value)}
        className="w-full pl-10 pr-10 py-3 bg-slate-darker border border-slate-border text-text-primary rounded-xl appearance-none focus:outline-none focus:border-violet-primary focus:ring-1 focus:ring-violet-primary transition-colors cursor-pointer"
      >
        <option value="" disabled>Select Building</option>
        {buildings.map((b) => (
          <option key={b} value={b}>
            Building {b}
          </option>
        ))}
      </select>
      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
        <ChevronDown className="h-5 w-5 text-text-muted" />
      </div>
    </div>
  )
}
