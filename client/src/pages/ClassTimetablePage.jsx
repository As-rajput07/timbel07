import { useState, useEffect } from 'react'
import { Calendar, Clock, User, MapPin, Search } from 'lucide-react'
import QuantumBackground from '../components/QuantumBackground'
import LottieLib from 'lottie-react'
import loaderAnimation from '../assets/loder.json'

const Lottie = LottieLib.default || LottieLib;

const DAYS_OF_WEEK = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

export default function ClassTimetablePage() {
  const [classes, setClasses] = useState([])
  const [selectedClass, setSelectedClass] = useState('')
  const [scheduleData, setScheduleData] = useState(null)
  const [loadingClasses, setLoadingClasses] = useState(true)
  const [loadingSchedule, setLoadingSchedule] = useState(false)
  const [error, setError] = useState('')

  const [selectedDay, setSelectedDay] = useState('ALL')

  useEffect(() => {
    fetch('/api/timetable/classes')
      .then(res => res.json())
      .then(data => {
        if (data.classes) setClasses(data.classes)
        setLoadingClasses(false)
      })
      .catch(err => {
        console.error(err)
        setError('Failed to load classes')
        setLoadingClasses(false)
      })
  }, [])

  useEffect(() => {
    if (!selectedClass) {
      setScheduleData(null)
      return
    }

    setLoadingSchedule(true)
    fetch(`/api/timetable/classes/${encodeURIComponent(selectedClass)}`)
      .then(res => res.json())
      .then(data => {
        if (data.schedule) {
          // Group by day
          const grouped = {}
          DAYS_OF_WEEK.forEach(day => grouped[day] = [])
          
          data.schedule.forEach(slot => {
            const dayKey = slot.day.toUpperCase().substring(0, 3) // Ensure MON, TUE etc.
            if (grouped[dayKey]) {
              grouped[dayKey].push(slot)
            }
          })
          setScheduleData(grouped)
        }
        setLoadingSchedule(false)
      })
      .catch(err => {
        console.error(err)
        setError('Failed to load schedule')
        setLoadingSchedule(false)
      })
  }, [selectedClass])

  return (
    <div className="min-h-screen pb-20 relative overflow-x-hidden bg-transparent">
      <QuantumBackground />
      {/* Dark overlay to ensure text readability over bright bloom */}
      <div className="fixed inset-0 bg-slate-darker/50 z-0 pointer-events-none" />
      
      {/* Background glow */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-violet-primary/20 rounded-full blur-[120px] pointer-events-none z-0" />
      
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-16 relative z-10 flex flex-col items-center">
        <div className="text-center mb-12 glass-card px-10 py-8 rounded-3xl border-violet-primary/20 shadow-[0_0_40px_rgba(0,0,0,0.5)] max-w-2xl">
          <p className="text-violet-primary text-sm font-bold tracking-[0.2em] uppercase mb-4 drop-shadow-md">
            Weekly Schedule
          </p>
          <h1 className="text-4xl sm:text-5xl font-heading font-extrabold text-text-primary mb-6 drop-shadow-lg">
            Class <span className="gradient-text">Timetables</span>
          </h1>
          <p className="text-text-muted text-lg leading-relaxed drop-shadow">
            Select your class code below to instantly view your entire weekly schedule, including subjects, rooms, and teachers.
          </p>
        </div>

        {/* Dropdown Section */}
        <div className="max-w-md mx-auto glass-card p-6 mb-12 shadow-2xl relative z-20 border border-violet-primary/20">
          <label className="block text-sm font-semibold text-text-secondary mb-3">
            Select Your Class
          </label>
          <div className="relative">
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              disabled={loadingClasses}
              className="w-full appearance-none bg-slate-deep border border-slate-border text-text-primary rounded-xl pl-5 pr-12 py-4 focus:outline-none focus:border-violet-primary focus:ring-1 focus:ring-violet-primary transition-all duration-200 cursor-pointer"
            >
              <option value="">Select a class...</option>
              {classes.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
            </div>
          </div>
          {error && <p className="text-red-busy mt-3 text-sm">{error}</p>}
        </div>

        {/* Loading State */}
        {loadingSchedule && (
          <div className="flex flex-col items-center justify-center py-20">
            <Lottie animationData={loaderAnimation} className="w-20 h-20 mb-4" />
            <p className="text-text-muted animate-pulse">Loading schedule...</p>
          </div>
        )}

        {/* Schedule Display */}
        {!loadingSchedule && scheduleData && (
          <div className="animation-fade-up">
            
            {/* Day Filter Pills */}
            <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
              <button
                onClick={() => setSelectedDay('ALL')}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                  selectedDay === 'ALL' 
                    ? 'bg-violet-primary text-white shadow-[0_0_15px_rgba(99,91,255,0.4)]' 
                    : 'bg-slate-800 text-text-muted hover:bg-slate-700 hover:text-text-primary'
                }`}
              >
                All Week
              </button>
              {DAYS_OF_WEEK.map(day => (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                    selectedDay === day 
                      ? 'bg-emerald-free text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]' 
                      : 'bg-slate-800 text-text-muted hover:bg-slate-700 hover:text-text-primary'
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>

            <div className="space-y-12">
              {DAYS_OF_WEEK.filter(d => selectedDay === 'ALL' || d === selectedDay).map(day => {
                const slots = scheduleData[day]
                if (!slots || slots.length === 0) return null

              return (
                <div key={day} className="relative">
                  <div className="sticky top-20 z-30 bg-slate-darker/90 backdrop-blur-md py-4 mb-6 border-b border-slate-border/50">
                    <h2 className="text-2xl font-bold text-text-primary flex items-center gap-3">
                      <Calendar className="text-emerald-free" size={24} />
                      {day === 'MON' ? 'Monday' : 
                       day === 'TUE' ? 'Tuesday' : 
                       day === 'WED' ? 'Wednesday' : 
                       day === 'THU' ? 'Thursday' : 
                       day === 'FRI' ? 'Friday' : 'Saturday'}
                    </h2>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {slots.map((slot, idx) => (
                      <div key={idx} className="glass-card p-5 hover-lift border border-slate-border/50 hover:border-violet-primary/30 group">
                        <div className="flex justify-between items-start mb-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-violet-primary/10 text-violet-primary text-xs font-bold font-heading">
                            <Clock size={12} /> {slot.start_time} - {slot.end_time}
                          </span>
                          <span className="text-xs font-semibold text-slate-400 bg-slate-800 px-2 py-1 rounded">
                            {slot.session_type}
                          </span>
                        </div>
                        
                        <h3 className="text-lg font-bold text-text-primary mb-3 leading-tight group-hover:text-emerald-free transition-colors">
                          {slot.subject}
                        </h3>
                        
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-text-muted">
                            <MapPin size={14} className="text-violet-primary/70" />
                            <span className="font-medium">{slot.room}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-text-muted">
                            <User size={14} className="text-emerald-free/70" />
                            <span>{slot.teacher}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
            </div>
          </div>
        )}

        {/* Empty State when a class is selected but has no slots at all (rare) */}
        {!loadingSchedule && scheduleData && Object.values(scheduleData).every(arr => arr.length === 0) && (
          <div className="text-center py-20 glass-card">
            <p className="text-xl text-text-muted">No schedule found for this class.</p>
          </div>
        )}

      </div>
    </div>
  )
}
