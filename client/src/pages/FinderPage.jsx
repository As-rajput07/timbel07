import { useState, useEffect } from 'react'
import { Search, MapPin, AlertCircle } from 'lucide-react'
import LottieLib from 'lottie-react'
import loaderAnimation from '../assets/loder.json'

const Lottie = LottieLib.default || LottieLib;
import BuildingSelector from '../components/BuildingSelector'
import DaySelector from '../components/DaySelector'
import TimeSelector from '../components/TimeSelector'
import RoomCard from '../components/RoomCard'

export default function FinderPage() {
  const [buildings, setBuildings] = useState([])
  const [selectedBuilding, setSelectedBuilding] = useState('')
  
  const [selectedDay, setSelectedDay] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  
  const [roomsData, setRoomsData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Initialization: Fetch buildings and set current day/time
  useEffect(() => {
    fetchBuildings()
    syncCurrentTime()
  }, [])

  // Refetch rooms when inputs change
  useEffect(() => {
    if (selectedBuilding && selectedDay && selectedTime) {
      fetchRooms()
    }
  }, [selectedBuilding, selectedDay, selectedTime])

  const fetchBuildings = async () => {
    try {
      const res = await fetch('/api/timetable/buildings')
      if (!res.ok) throw new Error('Failed to fetch buildings')
      const data = await res.json()
      setBuildings(data.buildings || [])
      
      // Auto-select first building if available
      if (data.buildings && data.buildings.length > 0) {
        setSelectedBuilding(data.buildings[0])
      }
    } catch (err) {
      console.error(err)
      setError('Could not load campus buildings. Please try again later.')
    }
  }

  const syncCurrentTime = () => {
    const now = new Date()
    // Set Day (MON-SAT, fallback to MON if Sunday)
    const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
    let currentDay = days[now.getDay()]
    if (currentDay === 'SUN') currentDay = 'MON'
    setSelectedDay(currentDay)

    // Set Time (HH:MM)
    const hours = String(now.getHours()).padStart(2, '0')
    const minutes = String(now.getMinutes()).padStart(2, '0')
    setSelectedTime(`${hours}:${minutes}`)
  }

  const fetchRooms = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/timetable/rooms?building=${selectedBuilding}&day=${selectedDay}&time=${selectedTime}`)
      if (!res.ok) throw new Error('Failed to fetch room status')
      const data = await res.json()
      setRoomsData(data)
    } catch (err) {
      console.error(err)
      setError('Could not load room statuses. Make sure the backend is running.')
      setRoomsData(null)
    } finally {
      setLoading(false)
    }
  }

  // Convert "HH:MM" to minutes for the RoomCards
  const queryTimeInMinutes = () => {
    if (!selectedTime) return 0
    const [h, m] = selectedTime.split(':')
    return parseInt(h, 10) * 60 + parseInt(m, 10)
  }

  return (
    <div className="min-h-screen pt-24 px-4 pb-16">
      <div className="max-w-7xl mx-auto">
        
        {/* Header & Controls Card */}
        <div className="glass-card p-6 md:p-8 mb-8">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-8">
            
            <div className="flex-1 space-y-6">
              <div>
                <h1 className="text-3xl font-bold font-heading text-text-primary mb-2 flex items-center gap-3">
                  <MapPin className="text-violet-primary" />
                  Room Finder
                </h1>
                <p className="text-text-muted">Find an empty spot to study, hang out, or take a call.</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <BuildingSelector 
                  buildings={buildings} 
                  selectedBuilding={selectedBuilding} 
                  onSelect={setSelectedBuilding} 
                />
                <TimeSelector 
                  selectedTime={selectedTime}
                  onSelect={setSelectedTime}
                  onSyncNow={syncCurrentTime}
                />
              </div>
            </div>

            <div className="md:border-l border-slate-border/50 md:pl-8">
              <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider mb-4">Select Day</h3>
              <DaySelector 
                selectedDay={selectedDay}
                onSelect={setSelectedDay}
              />
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="p-4 mb-8 bg-red-busy/10 border border-red-busy/20 rounded-xl flex items-start gap-3">
            <AlertCircle className="text-red-busy shrink-0 mt-0.5" />
            <p className="text-red-busy/90">{error}</p>
          </div>
        )}

        {/* Main Content Area */}
        {!error && (
          <>
            {/* Summary Bar */}
            {roomsData && !loading && (
              <div className="flex flex-wrap items-center gap-4 mb-8">
                <h2 className="text-xl font-bold font-heading text-text-primary mr-auto">
                  Building {selectedBuilding} Rooms
                </h2>
                
                <div className="flex items-center gap-4 text-sm font-medium bg-slate-darker border border-slate-border px-4 py-2 rounded-xl">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-free" />
                    <span className="text-text-primary">{roomsData.summary.free} Free</span>
                  </div>
                  <div className="w-px h-4 bg-slate-border" />
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-amber-soon" />
                    <span className="text-text-primary">{roomsData.summary.busySoon} Busy Soon</span>
                  </div>
                  <div className="w-px h-4 bg-slate-border" />
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-busy" />
                    <span className="text-text-primary">{roomsData.summary.inUse} In Use</span>
                  </div>
                </div>
              </div>
            )}

            {/* Loading State */}
            {loading && (
              <div className="flex flex-col items-center justify-center py-20">
                <Lottie animationData={loaderAnimation} className="w-16 h-16 mb-4" />
                <p className="text-text-muted">Scanning timetable...</p>
              </div>
            )}

            {/* Results Grid */}
            {!loading && roomsData && (
              roomsData.rooms.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
                  {roomsData.rooms.map((room) => (
                    <RoomCard 
                      key={room.name} 
                      room={room} 
                      queryTimeInMinutes={queryTimeInMinutes()} 
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 glass-card">
                  <Search className="w-12 h-12 text-text-muted mx-auto mb-4 opacity-50" />
                  <h3 className="text-xl font-semibold text-text-primary mb-2">No Rooms Found</h3>
                  <p className="text-text-muted">There are no schedule entries for Building {selectedBuilding} on {selectedDay}.</p>
                </div>
              )
            )}
          </>
        )}
      </div>
    </div>
  )
}
