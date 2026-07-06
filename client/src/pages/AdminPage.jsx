import { useState, useRef, useEffect } from 'react'
import { Shield, Upload, CheckCircle, AlertCircle, AlertTriangle, MessageSquare, Check, PlusCircle, ChevronDown, X, Trash2, Search, Edit3, XCircle, Bell } from 'lucide-react'
import LottieLib from 'lottie-react'
import ReactMarkdown from 'react-markdown'
import assistantAnimation from '../assets/assistent.json'
import loaderAnimation from '../assets/loder.json'
import SendiyouAdminTab from '../components/SendiyouAdminTab'

const Lottie = LottieLib.default || LottieLib;

export default function AdminPage() {
  const [password, setPassword] = useState('')
  const [token, setToken] = useState(sessionStorage.getItem('adminToken') || null)
  const [authError, setAuthError] = useState('')
  const [loading, setLoading] = useState(false)
  
  const [file, setFile] = useState(null)
  const [uploadStatus, setUploadStatus] = useState(null) // 'idle', 'uploading', 'success', 'error'
  const [uploadMessage, setUploadMessage] = useState('')
  const fileInputRef = useRef(null)

  // AI Resolve Queries State
  const [activeTab, setActiveTab] = useState('upload') // 'upload' | 'class-timetables' | 'queries'
  const [issues, setIssues] = useState([])
  const [loadingIssues, setLoadingIssues] = useState(false)
  const [aiAnalysis, setAiAnalysis] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [resolvingId, setResolvingId] = useState(null)
  const [clearing, setClearing] = useState(false)
  const [applying, setApplying] = useState(false)

  // Unified Class Timetable State
  const DAYS_OF_WEEK = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
  const SESSION_TYPES = ['Lecture', 'Lab', 'Tutorial', 'Exam']
  const emptySlotForm = {
    building: '', room: '', subject: '', teacher: '',
    day: 'MON', start_time: '', end_time: '',
    session_type: 'Lecture', class_code: '', section: '',
    program: '', year: ''
  }
  
  const [metadata, setMetadata] = useState({ subjects: [], teachers: [], buildings: [], classCodes: [] })
  const [metaLoading, setMetaLoading] = useState(false)
  
  const [selectedClass, setSelectedClass] = useState('')
  const [classSearch, setClassSearch] = useState('')
  const [showClassDrop, setShowClassDrop] = useState(false)
  const [scheduleData, setScheduleData] = useState(null)
  const [loadingSchedule, setLoadingSchedule] = useState(false)
  const [selectedDay, setSelectedDay] = useState('ALL')
  
  // Action Modals State
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [slotForm, setSlotForm] = useState(emptySlotForm)
  const [actionLoading, setActionLoading] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState(null)
  const [classDeleteConfirm, setClassDeleteConfirm] = useState(false)
  
  // Dropdowns for Modals
  const [subjectSearch, setSubjectSearch] = useState('')
  const [teacherSearch, setTeacherSearch] = useState('')
  const [buildingSearch, setBuildingSearch] = useState('')
  const [showSubjectDrop, setShowSubjectDrop] = useState(false)
  const [showTeacherDrop, setShowTeacherDrop] = useState(false)
  const [showBuildingDrop, setShowBuildingDrop] = useState(false)

  // Manage Slots State
  const [manageSearch, setManageSearch] = useState({ building: '', room: '', day: '' })
  const [manageBuildingSearch, setManageBuildingSearch] = useState('')
  const [showManageBuildingDrop, setShowManageBuildingDrop] = useState(false)
  const [showManageDayDrop, setShowManageDayDrop] = useState(false)
  const [manageResults, setManageResults] = useState([])
  const [manageLoading, setManageLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [editingSlotId, setEditingSlotId] = useState(null)
  const [editSlotData, setEditSlotData] = useState({})
  const [editLoading, setEditLoading] = useState(false)
  const [editSubjectSearch, setEditSubjectSearch] = useState('')
  const [editTeacherSearch, setEditTeacherSearch] = useState('')
  const [editClassCodeSearch, setEditClassCodeSearch] = useState('')
  const [showEditSubjectDrop, setShowEditSubjectDrop] = useState(false)
  const [showEditTeacherDrop, setShowEditTeacherDrop] = useState(false)
  const [showEditClassCodeDrop, setShowEditClassCodeDrop] = useState(false)

  useEffect(() => {
    if (token && activeTab === 'queries') fetchIssues()
    if (token && (activeTab === 'class-timetables' || activeTab === 'manage-slots') && metadata.subjects.length === 0) fetchMetadata()
  }, [token, activeTab])

  const fetchMetadata = async () => {
    setMetaLoading(true)
    try {
      const res = await fetch('/api/admin/slot-metadata', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      if (res.ok) setMetadata(data)
    } catch (err) { console.error(err) }
    finally { setMetaLoading(false) }
  }

  const fetchClassSchedule = async (classCode) => {
    if (!classCode) { setScheduleData(null); return; }
    setLoadingSchedule(true)
    try {
      const res = await fetch('/api/timetable/classes/' + encodeURIComponent(classCode))
      const data = await res.json()
      if (res.ok && data.schedule) {
        const grouped = {}
        DAYS_OF_WEEK.forEach(day => grouped[day] = [])
        data.schedule.forEach(slot => {
          const dayKey = slot.day.toUpperCase().substring(0, 3)
          if (grouped[dayKey]) grouped[dayKey].push(slot)
        })
        setScheduleData(grouped)
      } else {
        setScheduleData(null)
      }
    } catch (err) { console.error(err) }
    finally { setLoadingSchedule(false) }
  }

  useEffect(() => {
    if (activeTab === 'class-timetables' && selectedClass) {
      fetchClassSchedule(selectedClass)
    }
  }, [selectedClass, activeTab])

  const handleManageSearch = async (e) => {
    if (e) e.preventDefault()
    setManageLoading(true)
    setManageResults([])
    setDeleteConfirmId(null)
    try {
      const params = new URLSearchParams()
      if (manageSearch.building) params.append('building', manageSearch.building)
      if (manageSearch.room) params.append('room', manageSearch.room)
      if (manageSearch.day) params.append('day', manageSearch.day)

      const res = await fetch(`/api/admin/search-slots?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      if (res.ok) setManageResults(data.slots)
    } catch (err) { console.error(err) }
    finally { setManageLoading(false) }
  }

  const handleEditSlot = async (id) => {
    setEditLoading(true)
    try {
      const res = await fetch(`/api/admin/slots/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editSlotData)
      })
      const data = await res.json()
      if (res.ok) {
        setManageResults(prev => prev.map(s => s.id === id ? data.slot : s))
        setEditingSlotId(null)
      } else {
        alert(data.error || 'Failed to update slot')
      }
    } catch (err) { console.error(err) }
    finally { setEditLoading(false) }
  }

  const handleSlotFormChange = (field, value) => setSlotForm(prev => ({ ...prev, [field]: value }))

  const handleSaveSlot = async (e) => {
    e.preventDefault()
    setActionLoading(true)
    const isEdit = !!slotForm.id
    const url = isEdit ? '/api/admin/slots/' + slotForm.id : '/api/admin/add-slot'
    const method = isEdit ? 'PUT' : 'POST'
    
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify(slotForm)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save slot')
      
      setShowAddModal(false)
      setShowEditModal(false)
      if (selectedClass) fetchClassSchedule(selectedClass);
        if (typeof setManageResults === "function") setManageResults(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      alert(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeleteSlot = async (id) => {
    setActionLoading(true)
    try {
      const res = await fetch('/api/admin/slots/' + id, {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer ' + token }
      })
      const data = await res.json()
      if (res.ok) {
        setDeleteConfirmId(null)
        if (selectedClass) fetchClassSchedule(selectedClass)
      } else {
        alert(data.error || 'Failed to delete slot')
      }
    } catch (err) { console.error(err) }
    finally { setActionLoading(false) }
  }

  const handleDeleteClass = async () => {
    setActionLoading(true)
    try {
      const res = await fetch('/api/admin/class-timetable/' + encodeURIComponent(selectedClass), {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer ' + token }
      })
      const data = await res.json()
      if (res.ok) {
        setClassDeleteConfirm(false)
        setSelectedClass('')
        setScheduleData(null)
        alert('Class deleted successfully')
      } else {
        alert(data.error || 'Failed to delete class')
      }
    } catch (err) { console.error(err) }
    finally { setActionLoading(false) }
  }

  const fetchIssues = async () => {
    setLoadingIssues(true)
    try {
      const res = await fetch('/api/admin/issues', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      if (res.ok) setIssues(data.issues || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingIssues(false)
    }
  }

  const handleAnalyze = async () => {
    setAnalyzing(true)
    setAiAnalysis('')
    try {
      const res = await fetch('/api/admin/analyze-issues', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      if (res.ok) setAiAnalysis(data.analysis)
    } catch (err) {
      console.error(err)
      setAiAnalysis('Error analyzing issues.')
    } finally {
      setAnalyzing(false)
    }
  }

  const handleApplyChanges = async () => {
    setApplying(true)
    try {
      const res = await fetch('/api/admin/apply-ai-changes', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      if (res.ok) {
        alert(`Successfully applied AI changes to ${data.changesApplied} slots. All pending queries are now resolved.`)
        setAiAnalysis('')
        fetchIssues()
      } else {
        alert(data.error || 'Failed to apply changes')
      }
    } catch (err) {
      console.error(err)
      alert('Error applying changes.')
    } finally {
      setApplying(false)
    }
  }

  const handleResolve = async (id) => {
    setResolvingId(id)
    try {
      const res = await fetch('/api/admin/issues/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ id })
      })
      if (res.ok) {
        fetchIssues()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setResolvingId(null)
    }
  }

  const handleClearResolved = async () => {
    if (!window.confirm('Are you sure you want to clear all resolved queries? This action cannot be undone.')) return;
    setClearing(true);
    try {
      const res = await fetch('/api/admin/issues/clear-resolved', {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchIssues();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setClearing(false);
    }
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setAuthError('')
    setLoading(true)

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Login failed')

      sessionStorage.setItem('adminToken', data.token)
      setToken(data.token)
    } catch (err) {
      setAuthError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setUploadStatus('idle')
      setUploadMessage('')
    }
  }

  const handleUpload = async () => {
    if (!file) return

    setUploadStatus('uploading')
    setUploadMessage('')

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })

      const data = await res.json()

      if (!res.ok) {
        if (res.status === 401) {
          sessionStorage.removeItem('adminToken')
          setToken(null)
          throw new Error('Session expired. Please log in again.')
        }
        throw new Error(data.error || 'Upload failed')
      }

      setUploadStatus('success')
      setUploadMessage(`Successfully uploaded ${data.rowCount} time slots.`)
      setFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (err) {
      setUploadStatus('error')
      setUploadMessage(err.message)
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen pt-32 px-4 flex justify-center">
        <div className="w-full max-w-md glass-card p-8 shadow-xl border border-slate-border/50">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-full bg-violet-primary/10 flex items-center justify-center mb-4">
              <Shield className="w-8 h-8 text-violet-primary" />
            </div>
            <h1 className="text-2xl font-bold font-heading text-text-primary">Admin Access</h1>
            <p className="text-sm text-text-muted mt-2 text-center">
              Enter the admin password to upload new timetables.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input
                type="password"
                placeholder="Admin Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-slate-darker border border-slate-border text-text-primary focus:outline-none focus:border-violet-primary focus:ring-1 focus:ring-violet-primary transition-colors"
                required
              />
            </div>
            
            {authError && (
              <div className="flex items-center gap-2 text-red-busy text-sm p-3 bg-red-busy/10 rounded-lg border border-red-busy/20">
                <AlertCircle size={16} />
                {authError}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-6 rounded-full bg-violet-primary hover:bg-violet-hover text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
            >
              {loading ? <Lottie animationData={loaderAnimation} className="w-6 h-6" /> : 'Authenticate'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-24 px-4 pb-12">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold font-heading text-text-primary">Timetable Management</h1>
            <p className="text-text-muted mt-1">Upload the master Excel file to update room schedules.</p>
          </div>
          <button
            onClick={() => {
              sessionStorage.removeItem('adminToken')
              setToken(null)
            }}
            className="text-sm text-text-muted hover:text-white px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
          >
            Sign Out
          </button>
        </div>

        <div className="flex border-b border-slate-border mb-6 overflow-x-auto">
          <button
            className={`px-5 py-3 font-semibold text-sm transition-colors whitespace-nowrap ${activeTab === 'upload' ? 'border-b-2 border-violet-primary text-violet-primary' : 'text-text-muted hover:text-text-primary'}`}
            onClick={() => setActiveTab('upload')}
          >
            Upload Data
          </button>
          <button
            className={`px-5 py-3 font-semibold text-sm transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'class-timetables' ? 'border-b-2 border-emerald-free text-emerald-free' : 'text-text-muted hover:text-text-primary'}`}
            onClick={() => setActiveTab('class-timetables')}
          >
            <Edit3 size={15} /> Class Timetables
          </button>
          <button
            className={`px-5 py-3 font-semibold text-sm transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'manage-slots' ? 'border-b-2 border-red-busy text-red-busy' : 'text-text-muted hover:text-text-primary'}`}
            onClick={() => setActiveTab('manage-slots')}
          >
            <Trash2 size={15} /> Manage Slots
          </button>
          <button
            className={`px-5 py-3 font-semibold text-sm transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'queries' ? 'border-b-2 border-violet-primary text-violet-primary' : 'text-text-muted hover:text-text-primary'}`}
            onClick={() => setActiveTab('queries')}
          >
            Resolve Queries <span className="bg-red-busy text-white text-[10px] px-2 py-0.5 rounded-full">{issues.length > 0 ? issues.length : 0}</span>
          </button>
          <button
            className={`px-5 py-3 font-semibold text-sm transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'sendiyou' ? 'border-b-2 border-emerald-free text-emerald-free' : 'text-text-muted hover:text-text-primary'}`}
            onClick={() => setActiveTab('sendiyou')}
          >
            SendiYou Moderation
          </button>
          <button
            className={`px-5 py-3 font-semibold text-sm transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'notifications' ? 'border-b-2 border-violet-primary text-violet-primary' : 'text-text-muted hover:text-text-primary'}`}
            onClick={() => setActiveTab('notifications')}
          >
            <Bell size={15} /> Notifications
          </button>
        </div>

        {activeTab === 'upload' && (
          <div className="glass-card p-8">
            <div 
              className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
                file ? 'border-violet-primary/50 bg-violet-primary/5' : 'border-slate-border hover:border-violet-primary/30'
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".xlsx,.xls"
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
                <div className="w-16 h-16 rounded-2xl bg-violet-primary/10 flex items-center justify-center mb-4">
                  <Upload className="w-8 h-8 text-violet-primary" />
                </div>
                <h3 className="text-xl font-bold font-heading text-text-primary mb-2">
                  {file ? file.name : 'Drag & Drop Timetable Excel'}
                </h3>
                <p className="text-sm text-text-muted">
                  {file ? 'Click to select a different file' : 'or click to browse from your computer'}
                </p>
              </label>
              
              {file && (
                <div className="mt-8 flex justify-center">
                  <button
                    onClick={handleUpload}
                    disabled={uploadStatus === 'uploading'}
                    className="px-8 py-3 rounded-full bg-violet-primary hover:bg-violet-hover text-white font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {uploadStatus === 'uploading' ? (
                      <><Lottie animationData={loaderAnimation} className="w-5 h-5" /> Uploading...</>
                    ) : (
                      <><Upload className="w-5 h-5" /> Sync to Database</>
                    )}
                  </button>
                </div>
              )}
            </div>

            {uploadStatus === 'success' && (
              <div className="mt-6 p-4 rounded-lg bg-emerald-free/10 border border-emerald-free/20 flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-free shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-emerald-free">Upload Successful</h4>
                  <p className="text-sm text-emerald-free/80 mt-1">{uploadMessage}</p>
                </div>
              </div>
            )}

            {uploadStatus === 'error' && (
              <div className="mt-6 p-4 rounded-lg bg-red-busy/10 border border-red-busy/20 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-busy shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-red-busy">Upload Failed</h4>
                  <p className="text-sm text-red-busy/80 mt-1">{uploadMessage}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══════════ CLASS TIMETABLES TAB ══════════ */}
        {activeTab === 'class-timetables' && (
          <div className="space-y-6">
            
            {/* Class Selector Header */}
            <div className="glass-card p-6 flex flex-col md:flex-row items-center justify-between gap-4 border-emerald-free/20 relative z-50">
              <div className="w-full md:w-1/2 relative">
                <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-wider">Select Class to Manage</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search or select a class code (e.g. MLAI3C)..."
                    value={classSearch || selectedClass}
                    onChange={e => { setClassSearch(e.target.value); setSelectedClass(e.target.value.toUpperCase()); setShowClassDrop(true); }}
                    onFocus={() => setShowClassDrop(true)}
                    onBlur={() => setTimeout(() => setShowClassDrop(false), 200)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-deeper border border-slate-border text-text-primary placeholder-text-muted focus:outline-none focus:border-emerald-free focus:ring-1 focus:ring-emerald-free transition-colors pr-10"
                  />
                  <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                </div>
                {showClassDrop && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-slate-card border border-slate-border rounded-xl shadow-2xl z-50 max-h-52 overflow-y-auto">
                    {metadata.classCodes
                      .filter(c => c.toLowerCase().includes((classSearch || selectedClass).toLowerCase()))
                      .map((c, i) => (
                        <div key={i}
                          className="px-4 py-2.5 hover:bg-slate-deeper cursor-pointer text-text-primary text-sm border-b border-slate-border/40 last:border-0"
                          onMouseDown={() => { setSelectedClass(c); setClassSearch(''); setShowClassDrop(false); }}
                        >{c}</div>
                      ))
                    }
                  </div>
                )}
              </div>

              {selectedClass && scheduleData && !classDeleteConfirm && (
                <button
                  onClick={() => setClassDeleteConfirm(true)}
                  className="px-5 py-3 rounded-full bg-red-busy/10 text-red-busy hover:bg-red-busy/20 text-sm font-bold flex items-center gap-2 border border-red-busy/30 transition-colors shrink-0"
                >
                  <Trash2 size={16} /> Delete Entire Class
                </button>
              )}
              
              {classDeleteConfirm && (
                <div className="flex items-center gap-2 p-3 bg-red-busy/10 border border-red-busy/30 rounded-xl">
                  <span className="text-xs font-bold text-red-busy">Delete all {selectedClass} slots?</span>
                  <button onClick={() => setClassDeleteConfirm(false)} className="px-3 py-1.5 rounded-full bg-slate-border text-text-primary text-xs font-semibold hover:bg-slate-border/80 transition-colors">Cancel</button>
                  <button 
                    onClick={handleDeleteClass} disabled={actionLoading}
                    className="px-3 py-1.5 rounded-full bg-red-busy text-white text-xs font-bold hover:bg-red-busy/90 transition-colors"
                  >
                    {actionLoading ? 'Deleting...' : 'Confirm'}
                  </button>
                </div>
              )}
            </div>

            {loadingSchedule ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Lottie animationData={loaderAnimation} className="w-20 h-20 mb-4" />
                <p className="text-text-muted animate-pulse">Loading schedule...</p>
              </div>
            ) : selectedClass && scheduleData ? (
              <div className="animation-fade-up">
                
                {/* Day Filter Pills */}
                <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
                  <button
                    onClick={() => setSelectedDay('ALL')}
                    className={`px-4 py-2 rounded-full text-xs font-semibold transition-all duration-200 ${
                      selectedDay === 'ALL' ? 'bg-emerald-free text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'bg-slate-800 text-text-muted hover:bg-slate-700'
                    }`}
                  >
                    All Week
                  </button>
                  {DAYS_OF_WEEK.map(day => (
                    <button
                      key={day}
                      onClick={() => setSelectedDay(day)}
                      className={`px-4 py-2 rounded-full text-xs font-semibold transition-all duration-200 ${
                        selectedDay === day ? 'bg-violet-primary text-white shadow-[0_0_15px_rgba(99,91,255,0.4)]' : 'bg-slate-800 text-text-muted hover:bg-slate-700'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>

                <div className="space-y-10">
                  {DAYS_OF_WEEK.filter(d => selectedDay === 'ALL' || d === selectedDay).map(day => {
                    const slots = scheduleData[day] || []
                    
                    return (
                      <div key={day} className="relative">
                        <div className="sticky top-20 z-30 bg-slate-darker/90 backdrop-blur-md py-3 mb-4 border-b border-slate-border/50 flex justify-between items-center">
                          <h2 className="text-xl font-bold text-text-primary">
                            {day === 'MON' ? 'Monday' : day === 'TUE' ? 'Tuesday' : day === 'WED' ? 'Wednesday' : day === 'THU' ? 'Thursday' : day === 'FRI' ? 'Friday' : 'Saturday'}
                          </h2>
                          <button 
                            onClick={() => { setSlotForm({ ...emptySlotForm, class_code: selectedClass, day }); setShowAddModal(true); }}
                            className="text-xs font-bold bg-emerald-free/10 text-emerald-free px-3 py-1.5 rounded-full hover:bg-emerald-free/20 border border-emerald-free/30 transition-colors flex items-center gap-1"
                          >
                            <PlusCircle size={14} /> Add Slot
                          </button>
                        </div>

                        {slots.length === 0 ? (
                          <div className="p-6 text-center border-2 border-dashed border-slate-border rounded-2xl text-text-muted text-sm">
                            No slots on this day.
                          </div>
                        ) : (
                          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {slots.map((slot, idx) => (
                              <div key={idx} className="glass-card p-4 border border-slate-border/50 hover:border-violet-primary/50 group relative overflow-hidden flex flex-col h-full">
                                
                                <div className="flex justify-between items-start mb-3">
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-deeper text-text-secondary border border-slate-border">
                                    {slot.start_time} - {slot.end_time}
                                  </span>
                                  <span className="text-[10px] font-semibold text-emerald-free bg-emerald-free/10 border border-emerald-free/20 px-2 py-0.5 rounded">
                                    {slot.session_type}
                                  </span>
                                </div>
                                
                                <h3 className="text-sm font-bold text-text-primary mb-2 line-clamp-2">
                                  {slot.subject}
                                </h3>
                                
                                <div className="flex items-center gap-3 text-xs text-text-muted mt-1 mb-4">
                                  <span className="font-medium bg-slate-800 px-2 py-1 rounded text-white">{slot.room}</span>
                                  <span className="truncate">{slot.teacher}</span>
                                </div>

                                <div className="mt-auto pt-3 border-t border-slate-border/30 flex items-center justify-between">
                                  <div>
                                    {slot.section && (
                                      <div className="text-[10px] font-bold text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                                        Sec {slot.section}
                                      </div>
                                    )}
                                  </div>

                                  {/* Admin Actions */}
                                  <div className="flex items-center gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                                    {deleteConfirmId === slot.id ? (
                                      <div className="bg-slate-deeper p-1.5 rounded-lg flex items-center gap-2 border border-red-busy/50 shadow-lg">
                                        <button onClick={() => handleDeleteSlot(slot.id)} className="text-[10px] bg-red-busy text-white px-2 py-1 rounded font-bold">Sure?</button>
                                        <button onClick={() => setDeleteConfirmId(null)} className="text-[10px] bg-slate-border text-white px-2 py-1 rounded font-bold">No</button>
                                      </div>
                                    ) : (
                                      <>
                                        <button onClick={() => { setSlotForm(slot); setShowEditModal(true); }} className="p-1.5 bg-violet-primary/80 hover:bg-violet-primary text-white rounded-md shadow-md transition-colors"><Edit3 size={14} /></button>
                                        <button onClick={() => setDeleteConfirmId(slot.id)} className="p-1.5 bg-red-busy/80 hover:bg-red-busy text-white rounded-md shadow-md transition-colors"><Trash2 size={14} /></button>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : (
              <div className="glass-card p-12 text-center">
                <Search className="w-12 h-12 text-slate-border mx-auto mb-4" />
                <p className="text-text-secondary">Search or select a class code above to manage its timetable.</p>
              </div>
            )}
          </div>
        )}

        {/* ══════════ MANAGE SLOTS TAB ══════════ */}
        {activeTab === 'manage-slots' && (
          <div className="space-y-6">
            {/* Filter Section */}
            <form onSubmit={handleManageSearch} className="glass-card p-6 relative z-50">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-red-busy/10 flex items-center justify-center">
                  <Search className="text-red-busy" size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-text-primary text-lg">Search & Delete Slots</h3>
                  <p className="text-text-muted text-sm">Find specific slots to remove from the database.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4 relative z-50">
                {/* Search Building */}
                <div className="relative z-50">
                  <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-wider">Building</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="e.g. B, NB"
                      value={manageBuildingSearch || manageSearch.building}
                      onChange={e => { setManageBuildingSearch(e.target.value); setManageSearch(p => ({ ...p, building: e.target.value })); setShowManageBuildingDrop(true) }}
                      onFocus={() => setShowManageBuildingDrop(true)}
                      onBlur={() => setTimeout(() => setShowManageBuildingDrop(false), 200)}
                      className="w-full px-4 py-3 rounded-xl bg-slate-deeper border border-slate-border text-text-primary placeholder-text-muted focus:outline-none focus:border-red-busy focus:ring-1 focus:ring-red-busy transition-colors pr-10"
                    />
                    <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                  </div>
                  {showManageBuildingDrop && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-slate-card border border-slate-border rounded-xl shadow-2xl z-50 max-h-48 overflow-y-auto">
                      {(metadata.buildings.length > 0 ? metadata.buildings : ['A','B','C','D','E','F','G','NB','BX','I'])
                        .filter(b => b.toLowerCase().includes((manageBuildingSearch || manageSearch.building).toLowerCase()))
                        .map((b, i) => (
                          <div
                            key={i}
                            className="px-4 py-2.5 hover:bg-slate-deeper cursor-pointer text-text-primary text-sm border-b border-slate-border/40 last:border-0"
                            onMouseDown={() => { setManageSearch(p => ({ ...p, building: b })); setManageBuildingSearch(''); setShowManageBuildingDrop(false) }}
                          >
                            Block {b}
                          </div>
                        ))
                      }
                    </div>
                  )}
                </div>

                {/* Search Room */}
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-wider">Room</label>
                  <input
                    type="text"
                    placeholder="e.g. B012"
                    value={manageSearch.room}
                    onChange={e => setManageSearch(p => ({ ...p, room: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl bg-slate-deeper border border-slate-border text-text-primary placeholder-text-muted focus:outline-none focus:border-red-busy transition-colors"
                  />
                </div>

                {/* Search Day */}
                <div className="relative z-40">
                  <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-wider">Day</label>
                  <div className="relative">
                    <input
                      type="text"
                      readOnly
                      placeholder="Any Day"
                      value={manageSearch.day}
                      onFocus={() => setShowManageDayDrop(true)}
                      onBlur={() => setTimeout(() => setShowManageDayDrop(false), 200)}
                      className="w-full px-4 py-3 rounded-xl bg-slate-deeper border border-slate-border text-text-primary cursor-pointer focus:outline-none focus:border-red-busy transition-colors pr-10"
                    />
                    {manageSearch.day && (
                      <X size={14} className="absolute right-8 top-1/2 -translate-y-1/2 text-text-muted cursor-pointer hover:text-white" onMouseDown={() => setManageSearch(p => ({ ...p, day: '' }))} />
                    )}
                    <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                  </div>
                  {showManageDayDrop && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-slate-card border border-slate-border rounded-xl shadow-2xl z-50 overflow-hidden">
                      <div className="px-4 py-2.5 cursor-pointer text-sm border-b border-slate-border/40 hover:bg-slate-deeper text-text-primary" onMouseDown={() => { setManageSearch(p => ({ ...p, day: '' })); setShowManageDayDrop(false) }}>Any Day</div>
                      {DAYS_OF_WEEK.map((d, i) => (
                        <div
                          key={i}
                          className="px-4 py-2.5 cursor-pointer text-sm border-b border-slate-border/40 hover:bg-slate-deeper text-text-primary"
                          onMouseDown={() => { setManageSearch(p => ({ ...p, day: d })); setShowManageDayDrop(false) }}
                        >
                          {d}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={manageLoading}
                className="w-full py-3 rounded-full bg-red-busy hover:bg-red-busy/90 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                {manageLoading ? <><Lottie animationData={loaderAnimation} className="w-5 h-5" /> Searching...</> : <><Search size={16} /> Search Slots</>}
              </button>
            </form>

            {/* Results Section */}
            {manageResults.length > 0 && (
              <div className="glass-card p-6">
                <h4 className="text-sm font-bold text-text-secondary uppercase tracking-wider mb-4 flex items-center gap-2">
                  <span className="bg-red-busy/20 text-red-busy px-2 py-0.5 rounded-md">{manageResults.length}</span> Slots Found
                </h4>
                
                <div className="space-y-3">
                  {manageResults.map(slot => (
                    <div key={slot.id} className={`p-4 rounded-xl border transition-colors ${deleteConfirmId === slot.id ? 'bg-red-busy/5 border-red-busy/50' : editingSlotId === slot.id ? 'bg-slate-deeper/80 border-violet-primary/50' : 'bg-slate-deeper border-slate-border hover:border-slate-border/80'}`}>
                      {editingSlotId === slot.id ? (
                        /* Inline Edit Form */
                        <div className="space-y-3 animate-fade-in">
                          <div className="flex justify-between items-center mb-2 border-b border-slate-border/50 pb-2">
                            <h5 className="text-sm font-bold text-violet-primary">Editing Slot</h5>
                            <button onClick={() => setEditingSlotId(null)} className="text-text-muted hover:text-white transition-colors"><XCircle size={18} /></button>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                            <div>
                              <label className="block text-[10px] text-text-muted uppercase mb-1">Room</label>
                              <input type="text" value={editSlotData.room || ''} onChange={e => setEditSlotData(p => ({ ...p, room: e.target.value.toUpperCase() }))} className="w-full bg-slate-card border border-slate-border rounded-lg px-3 py-1.5 text-text-primary focus:border-violet-primary focus:outline-none" />
                            </div>
                            <div>
                              <label className="block text-[10px] text-text-muted uppercase mb-1">Day</label>
                              <select value={editSlotData.day || ''} onChange={e => setEditSlotData(p => ({ ...p, day: e.target.value }))} className="w-full bg-slate-card border border-slate-border rounded-lg px-3 py-1.5 text-text-primary focus:border-violet-primary focus:outline-none">
                                {DAYS_OF_WEEK.map(d => <option key={d} value={d}>{d}</option>)}
                              </select>
                            </div>
                            <div>
                              <label className="block text-[10px] text-text-muted uppercase mb-1">Start (HH:MM)</label>
                              <input type="time" value={editSlotData.start_time || ''} onChange={e => setEditSlotData(p => ({ ...p, start_time: e.target.value }))} className="w-full bg-slate-card border border-slate-border rounded-lg px-3 py-1.5 text-text-primary focus:border-violet-primary focus:outline-none" />
                            </div>
                            <div>
                              <label className="block text-[10px] text-text-muted uppercase mb-1">End (HH:MM)</label>
                              <input type="time" value={editSlotData.end_time || ''} onChange={e => setEditSlotData(p => ({ ...p, end_time: e.target.value }))} className="w-full bg-slate-card border border-slate-border rounded-lg px-3 py-1.5 text-text-primary focus:border-violet-primary focus:outline-none" />
                            </div>
                            <div className="col-span-2 sm:col-span-2 relative">
                              <label className="block text-[10px] text-text-muted uppercase mb-1">Subject</label>
                              <div className="relative">
                                <input 
                                  type="text" 
                                  value={editSubjectSearch || editSlotData.subject || ''} 
                                  onChange={e => { setEditSubjectSearch(e.target.value); setEditSlotData(p => ({ ...p, subject: e.target.value })); setShowEditSubjectDrop(true) }} 
                                  onFocus={() => setShowEditSubjectDrop(true)}
                                  onBlur={() => setTimeout(() => setShowEditSubjectDrop(false), 200)}
                                  className="w-full bg-slate-card border border-slate-border rounded-lg px-3 py-1.5 text-text-primary focus:border-violet-primary focus:outline-none pr-7" 
                                />
                                <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                              </div>
                              {showEditSubjectDrop && metadata.subjects.filter(s => s.toLowerCase().includes((editSubjectSearch || editSlotData.subject || '').toLowerCase())).length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-slate-card border border-slate-border rounded-xl shadow-2xl z-50 max-h-40 overflow-y-auto">
                                  {metadata.subjects
                                    .filter(s => s.toLowerCase().includes((editSubjectSearch || editSlotData.subject || '').toLowerCase()))
                                    .map((s, i) => (
                                      <div key={i} className="px-3 py-2 hover:bg-slate-deeper cursor-pointer text-text-primary text-xs border-b border-slate-border/40 last:border-0"
                                        onMouseDown={() => { setEditSlotData(p => ({ ...p, subject: s })); setEditSubjectSearch(''); setShowEditSubjectDrop(false) }}>
                                        {s}
                                      </div>
                                    ))}
                                </div>
                              )}
                            </div>
                            <div className="col-span-2 sm:col-span-2 relative">
                              <label className="block text-[10px] text-text-muted uppercase mb-1">Teacher</label>
                              <div className="relative">
                                <input 
                                  type="text" 
                                  value={editTeacherSearch || editSlotData.teacher || ''} 
                                  onChange={e => { setEditTeacherSearch(e.target.value); setEditSlotData(p => ({ ...p, teacher: e.target.value })); setShowEditTeacherDrop(true) }} 
                                  onFocus={() => setShowEditTeacherDrop(true)}
                                  onBlur={() => setTimeout(() => setShowEditTeacherDrop(false), 200)}
                                  className="w-full bg-slate-card border border-slate-border rounded-lg px-3 py-1.5 text-text-primary focus:border-violet-primary focus:outline-none pr-7" 
                                />
                                <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                              </div>
                              {showEditTeacherDrop && metadata.teachers.filter(t => t.toLowerCase().includes((editTeacherSearch || editSlotData.teacher || '').toLowerCase())).length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-slate-card border border-slate-border rounded-xl shadow-2xl z-50 max-h-40 overflow-y-auto">
                                  {metadata.teachers
                                    .filter(t => t.toLowerCase().includes((editTeacherSearch || editSlotData.teacher || '').toLowerCase()))
                                    .map((t, i) => (
                                      <div key={i} className="px-3 py-2 hover:bg-slate-deeper cursor-pointer text-text-primary text-xs border-b border-slate-border/40 last:border-0"
                                        onMouseDown={() => { setEditSlotData(p => ({ ...p, teacher: t })); setEditTeacherSearch(''); setShowEditTeacherDrop(false) }}>
                                        {t}
                                      </div>
                                    ))}
                                </div>
                              )}
                            </div>
                            <div className="relative">
                              <label className="block text-[10px] text-text-muted uppercase mb-1">Class Code</label>
                              <div className="relative">
                                <input 
                                  type="text" 
                                  value={editClassCodeSearch || editSlotData.class_code || ''} 
                                  onChange={e => { setEditClassCodeSearch(e.target.value); setEditSlotData(p => ({ ...p, class_code: e.target.value })); setShowEditClassCodeDrop(true) }} 
                                  onFocus={() => setShowEditClassCodeDrop(true)}
                                  onBlur={() => setTimeout(() => setShowEditClassCodeDrop(false), 200)}
                                  className="w-full bg-slate-card border border-slate-border rounded-lg px-3 py-1.5 text-text-primary focus:border-violet-primary focus:outline-none pr-7" 
                                />
                                <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                              </div>
                              {showEditClassCodeDrop && metadata.classCodes.filter(c => c.toLowerCase().includes((editClassCodeSearch || editSlotData.class_code || '').toLowerCase())).length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-slate-card border border-slate-border rounded-xl shadow-2xl z-50 max-h-40 overflow-y-auto">
                                  {metadata.classCodes
                                    .filter(c => c.toLowerCase().includes((editClassCodeSearch || editSlotData.class_code || '').toLowerCase()))
                                    .map((c, i) => (
                                      <div key={i} className="px-3 py-2 hover:bg-slate-deeper cursor-pointer text-text-primary text-xs border-b border-slate-border/40 last:border-0"
                                        onMouseDown={() => { setEditSlotData(p => ({ ...p, class_code: c })); setEditClassCodeSearch(''); setShowEditClassCodeDrop(false) }}>
                                        {c}
                                      </div>
                                    ))}
                                </div>
                              )}
                            </div>
                            <div>
                              <label className="block text-[10px] text-text-muted uppercase mb-1">Section</label>
                              <input type="text" value={editSlotData.section || ''} onChange={e => setEditSlotData(p => ({ ...p, section: e.target.value }))} className="w-full bg-slate-card border border-slate-border rounded-lg px-3 py-1.5 text-text-primary focus:border-violet-primary focus:outline-none" />
                            </div>
                            <div>
                              <label className="block text-[10px] text-text-muted uppercase mb-1">Type</label>
                              <select value={editSlotData.session_type || ''} onChange={e => setEditSlotData(p => ({ ...p, session_type: e.target.value }))} className="w-full bg-slate-card border border-slate-border rounded-lg px-3 py-1.5 text-text-primary focus:border-violet-primary focus:outline-none">
                                {SESSION_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
                              </select>
                            </div>
                          </div>
                          <div className="flex justify-end pt-2">
                            <button
                              onClick={() => handleEditSlot(slot.id)}
                              disabled={editLoading}
                              className="px-4 py-2 bg-violet-primary hover:bg-violet-hover text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                            >
                              {editLoading ? 'Saving...' : 'Save Changes'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* Read Only View */
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <span className="text-text-primary font-bold">{slot.room}</span>
                              <span className="text-text-muted text-xs">•</span>
                              <span className="text-text-secondary text-sm font-semibold">{slot.day}</span>
                              <span className="text-text-muted text-xs">•</span>
                              <span className="text-text-secondary text-sm">{slot.start_time} - {slot.end_time}</span>
                              {slot.session_type && (
                                <span className="bg-slate-border text-text-primary text-[10px] px-2 py-0.5 rounded-full ml-1">{slot.session_type}</span>
                              )}
                            </div>
                            
                            <div className="flex flex-col sm:flex-row sm:items-center gap-x-3 gap-y-1 text-sm">
                              <span className="text-emerald-free/90 font-medium truncate max-w-[200px]">{slot.subject}</span>
                              <span className="hidden sm:inline text-text-muted">•</span>
                              <span className="text-text-muted truncate max-w-[150px]">{slot.teacher}</span>
                              {(slot.class_code || slot.section) && (
                                <>
                                  <span className="hidden sm:inline text-text-muted">•</span>
                                  <span className="text-text-muted/70 text-xs">{slot.class_code} {slot.section && `(${slot.section})`}</span>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="shrink-0 flex items-center justify-end">
                            {deleteConfirmId === slot.id ? (
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => setDeleteConfirmId(null)}
                                  className="px-3 py-1.5 rounded-md bg-slate-border hover:bg-slate-border/80 text-text-primary text-xs font-semibold transition-colors"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() => handleDeleteSlot(slot.id)}
                                  disabled={deleteLoading}
                                  className="px-3 py-1.5 rounded-md bg-red-busy hover:bg-red-busy/90 text-white text-xs font-semibold flex items-center gap-1 transition-colors disabled:opacity-50"
                                >
                                  {deleteLoading ? 'Deleting...' : 'Confirm Delete'}
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => { setEditingSlotId(slot.id); setEditSlotData({ ...slot }); }}
                                  className="p-2 rounded-lg bg-violet-primary/10 text-violet-primary hover:bg-violet-primary/20 transition-colors"
                                  title="Edit this slot"
                                >
                                  <Edit3 size={18} />
                                </button>
                                <button
                                  onClick={() => setDeleteConfirmId(slot.id)}
                                  className="p-2 rounded-lg bg-red-busy/10 text-red-busy hover:bg-red-busy/20 transition-colors"
                                  title="Delete this slot"
                                >
                                  <Trash2 size={18} />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {manageResults.length === 0 && (manageSearch.room || manageSearch.building || manageSearch.day) && !manageLoading && (
              <div className="glass-card p-12 text-center">
                <Search className="w-12 h-12 text-slate-border mx-auto mb-4" />
                <p className="text-text-secondary">No slots found matching your criteria.</p>
              </div>
            )}
          </div>
        )}
        {/* ══════════ SLOT MODAL (Add / Edit) ══════════ */}
        {(showAddModal || showEditModal) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-darker/80 backdrop-blur-sm">
            <div className="glass-card w-full max-w-2xl border-emerald-free/30 shadow-[0_0_40px_rgba(0,0,0,0.3)] flex flex-col max-h-[90vh]">
              
              <div className="p-5 border-b border-slate-border flex justify-between items-center bg-slate-deeper/50 rounded-t-2xl">
                <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
                  {showEditModal ? <><Edit3 size={18} className="text-violet-primary"/> Edit Slot</> : <><PlusCircle size={18} className="text-emerald-free"/> Add Slot to {slotForm.class_code}</>}
                </h3>
                <button onClick={() => { setShowAddModal(false); setShowEditModal(false); }} className="p-2 text-text-muted hover:text-white rounded-full hover:bg-white/10 transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto custom-scrollbar">
                <form id="slot-form" onSubmit={handleSaveSlot} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Class Code */}
                    <div>
                      <label className="block text-[10px] font-semibold text-text-secondary mb-1 uppercase tracking-wider">Class Code *</label>
                      <input type="text" required value={slotForm.class_code} onChange={e => handleSlotFormChange('class_code', e.target.value.toUpperCase())} className="w-full bg-slate-deeper border border-slate-border rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:border-emerald-free focus:ring-1 focus:ring-emerald-free" />
                    </div>
                    {/* Section */}
                    <div>
                      <label className="block text-[10px] font-semibold text-text-secondary mb-1 uppercase tracking-wider">Section</label>
                      <input type="text" placeholder="e.g. A, B" value={slotForm.section} onChange={e => handleSlotFormChange('section', e.target.value.toUpperCase())} className="w-full bg-slate-deeper border border-slate-border rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:border-emerald-free focus:ring-1 focus:ring-emerald-free" />
                    </div>
                    
                    {/* Building */}
                    <div className="relative">
                      <label className="block text-[10px] font-semibold text-text-secondary mb-1 uppercase tracking-wider">Building *</label>
                      <input type="text" required value={buildingSearch || slotForm.building} onChange={e => { setBuildingSearch(e.target.value); handleSlotFormChange('building', e.target.value); setShowBuildingDrop(true); }} onFocus={() => setShowBuildingDrop(true)} onBlur={() => setTimeout(() => setShowBuildingDrop(false), 200)} className="w-full bg-slate-deeper border border-slate-border rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:border-emerald-free focus:ring-1 focus:ring-emerald-free" />
                      {showBuildingDrop && (
                        <div className="absolute z-10 w-full mt-1 bg-slate-card border border-slate-border rounded-lg shadow-lg max-h-40 overflow-y-auto">
                          {metadata.buildings.filter(b => b.toLowerCase().includes((buildingSearch || slotForm.building).toLowerCase())).map(b => (
                            <div key={b} className="px-3 py-2 hover:bg-slate-deeper cursor-pointer text-sm" onMouseDown={() => { handleSlotFormChange('building', b); setBuildingSearch(''); setShowBuildingDrop(false); }}>{b}</div>
                          ))}
                        </div>
                      )}
                    </div>
                    {/* Room */}
                    <div>
                      <label className="block text-[10px] font-semibold text-text-secondary mb-1 uppercase tracking-wider">Room *</label>
                      <input type="text" required value={slotForm.room} onChange={e => handleSlotFormChange('room', e.target.value.toUpperCase())} className="w-full bg-slate-deeper border border-slate-border rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:border-emerald-free focus:ring-1 focus:ring-emerald-free" />
                    </div>

                    {/* Subject */}
                    <div className="relative sm:col-span-2">
                      <label className="block text-[10px] font-semibold text-text-secondary mb-1 uppercase tracking-wider">Subject *</label>
                      <input type="text" required value={subjectSearch || slotForm.subject} onChange={e => { setSubjectSearch(e.target.value); handleSlotFormChange('subject', e.target.value); setShowSubjectDrop(true); }} onFocus={() => setShowSubjectDrop(true)} onBlur={() => setTimeout(() => setShowSubjectDrop(false), 200)} className="w-full bg-slate-deeper border border-slate-border rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:border-emerald-free focus:ring-1 focus:ring-emerald-free" />
                      {showSubjectDrop && (
                        <div className="absolute z-10 w-full mt-1 bg-slate-card border border-slate-border rounded-lg shadow-lg max-h-40 overflow-y-auto">
                          {metadata.subjects.filter(s => s.toLowerCase().includes((subjectSearch || slotForm.subject).toLowerCase())).map(s => (
                            <div key={s} className="px-3 py-2 hover:bg-slate-deeper cursor-pointer text-sm" onMouseDown={() => { handleSlotFormChange('subject', s); setSubjectSearch(''); setShowSubjectDrop(false); }}>{s}</div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Teacher */}
                    <div className="relative sm:col-span-2">
                      <label className="block text-[10px] font-semibold text-text-secondary mb-1 uppercase tracking-wider">Teacher *</label>
                      <input type="text" required value={teacherSearch || slotForm.teacher} onChange={e => { setTeacherSearch(e.target.value); handleSlotFormChange('teacher', e.target.value); setShowTeacherDrop(true); }} onFocus={() => setShowTeacherDrop(true)} onBlur={() => setTimeout(() => setShowTeacherDrop(false), 200)} className="w-full bg-slate-deeper border border-slate-border rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:border-emerald-free focus:ring-1 focus:ring-emerald-free" />
                      {showTeacherDrop && (
                        <div className="absolute z-10 w-full mt-1 bg-slate-card border border-slate-border rounded-lg shadow-lg max-h-40 overflow-y-auto">
                          {metadata.teachers.filter(t => t.toLowerCase().includes((teacherSearch || slotForm.teacher).toLowerCase())).map(t => (
                            <div key={t} className="px-3 py-2 hover:bg-slate-deeper cursor-pointer text-sm" onMouseDown={() => { handleSlotFormChange('teacher', t); setTeacherSearch(''); setShowTeacherDrop(false); }}>{t}</div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Day */}
                    <div>
                      <label className="block text-[10px] font-semibold text-text-secondary mb-1 uppercase tracking-wider">Day *</label>
                      <select required value={slotForm.day} onChange={e => handleSlotFormChange('day', e.target.value)} className="w-full bg-slate-deeper border border-slate-border rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:border-emerald-free focus:ring-1 focus:ring-emerald-free">
                        {DAYS_OF_WEEK.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                    {/* Session Type */}
                    <div>
                      <label className="block text-[10px] font-semibold text-text-secondary mb-1 uppercase tracking-wider">Type *</label>
                      <select required value={slotForm.session_type} onChange={e => handleSlotFormChange('session_type', e.target.value)} className="w-full bg-slate-deeper border border-slate-border rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:border-emerald-free focus:ring-1 focus:ring-emerald-free">
                        {SESSION_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>

                    {/* Start Time */}
                    <div>
                      <label className="block text-[10px] font-semibold text-text-secondary mb-1 uppercase tracking-wider">Start Time *</label>
                      <input type="time" required value={slotForm.start_time} onChange={e => handleSlotFormChange('start_time', e.target.value)} className="w-full bg-slate-deeper border border-slate-border rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:border-emerald-free focus:ring-1 focus:ring-emerald-free" />
                    </div>
                    {/* End Time */}
                    <div>
                      <label className="block text-[10px] font-semibold text-text-secondary mb-1 uppercase tracking-wider">End Time *</label>
                      <input type="time" required value={slotForm.end_time} onChange={e => handleSlotFormChange('end_time', e.target.value)} className="w-full bg-slate-deeper border border-slate-border rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:border-emerald-free focus:ring-1 focus:ring-emerald-free" />
                    </div>
                    
                    {/* Program */}
                    <div>
                      <label className="block text-[10px] font-semibold text-text-secondary mb-1 uppercase tracking-wider">Program</label>
                      <input type="text" value={slotForm.program || ''} onChange={e => handleSlotFormChange('program', e.target.value.toUpperCase())} className="w-full bg-slate-deeper border border-slate-border rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:border-emerald-free focus:ring-1 focus:ring-emerald-free" />
                    </div>
                    {/* Year */}
                    <div>
                      <label className="block text-[10px] font-semibold text-text-secondary mb-1 uppercase tracking-wider">Year</label>
                      <input type="number" min="1" max="4" value={slotForm.year || ''} onChange={e => handleSlotFormChange('year', e.target.value)} className="w-full bg-slate-deeper border border-slate-border rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:border-emerald-free focus:ring-1 focus:ring-emerald-free" />
                    </div>

                  </div>
                </form>
              </div>

              <div className="p-5 border-t border-slate-border bg-slate-deeper/50 rounded-b-2xl flex justify-end gap-3">
                <button type="button" onClick={() => { setShowAddModal(false); setShowEditModal(false); }} className="px-5 py-2.5 rounded-full text-sm font-semibold bg-slate-border text-text-primary hover:bg-slate-border/80 transition-colors">
                  Cancel
                </button>
                <button type="submit" form="slot-form" disabled={actionLoading} className={`px-6 py-2.5 rounded-full text-sm font-bold text-white transition-colors flex items-center gap-2 disabled:opacity-50 ${showEditModal ? 'bg-violet-primary hover:bg-violet-hover' : 'bg-emerald-free hover:bg-emerald-free/90'}`}>
                  {actionLoading ? <><Lottie animationData={loaderAnimation} className="w-5 h-5" /> Saving...</> : 'Save Slot'}
                </button>
              </div>
            </div>
          </div>
        )}
\n        {activeTab === 'queries' && (
          <div className="space-y-6">
            <div className="glass-card p-6 flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-text-primary">AI Analysis</h3>
                <p className="text-sm text-text-muted">Let AI read all pending complaints and suggest a final decision.</p>
              </div>
              <button
                onClick={handleAnalyze}
                disabled={analyzing || issues.filter(i => i.status === 'pending').length === 0}
                className="px-8 py-3 rounded-full bg-violet-primary hover:bg-violet-600 text-white font-medium transition-colors disabled:opacity-50 flex items-center gap-2 shrink-0"
              >
                {analyzing ? <Lottie animationData={loaderAnimation} className="w-6 h-6" /> : <Lottie animationData={assistantAnimation} className="w-6 h-6" />}
                Analyze Queries
              </button>
            </div>

            {aiAnalysis && (
              <div className="glass-card p-6 border-violet-primary/30 bg-violet-primary/5">
                <h3 className="text-md font-bold text-violet-primary mb-3 flex items-center gap-2">
                  <Lottie animationData={assistantAnimation} className="w-6 h-6" /> AI Decision Suggestion
                </h3>
                <div className="text-text-primary text-sm leading-relaxed">
                  <ReactMarkdown
                    components={{
                      h1: ({node, ...props}) => <h1 className="text-xl font-bold text-violet-primary mt-6 mb-3" {...props} />,
                      h2: ({node, ...props}) => <h2 className="text-lg font-bold text-violet-primary mt-5 mb-2" {...props} />,
                      h3: ({node, ...props}) => <h3 className="text-md font-bold text-emerald-free mt-4 mb-2" {...props} />,
                      p: ({node, ...props}) => <p className="mb-3" {...props} />,
                      ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-4 space-y-1" {...props} />,
                      ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-4 space-y-1" {...props} />,
                      li: ({node, ...props}) => <li className="text-text-secondary" {...props} />,
                      strong: ({node, ...props}) => <strong className="font-bold text-text-primary" {...props} />,
                      hr: ({node, ...props}) => <hr className="border-slate-border my-4" {...props} />,
                    }}
                  >
                    {aiAnalysis}
                  </ReactMarkdown>
                </div>
                <div className="mt-4 flex justify-end">
                  <button 
                    onClick={handleApplyChanges}
                    disabled={applying}
                    className="px-4 py-2 bg-emerald-free text-white rounded-lg text-sm font-semibold hover:bg-emerald-free/90 transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {applying && <Lottie animationData={loaderAnimation} className="w-4 h-4" />}
                    Approve & Apply Changes
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-text-secondary text-sm uppercase tracking-wider">Reported Queries</h3>
                <button
                  onClick={handleClearResolved}
                  disabled={clearing || issues.filter(i => i.status === 'resolved').length === 0}
                  className="px-4 py-2 bg-red-busy/10 text-red-busy hover:bg-red-busy/20 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {clearing && <Lottie animationData={loaderAnimation} className="w-4 h-4" />}
                  Clear Past Analyzed Data
                </button>
              </div>
              {loadingIssues ? (
                <div className="flex justify-center p-8"><Lottie animationData={loaderAnimation} className="w-12 h-12" /></div>
              ) : issues.length === 0 ? (
                <div className="glass-card p-8 text-center text-text-muted">No pending queries.</div>
              ) : (
                Object.entries(
                  issues.reduce((acc, issue) => {
                    const b = issue.building || 'General/Unknown';
                    if (!acc[b]) acc[b] = [];
                    acc[b].push(issue);
                    return acc;
                  }, {})
                ).map(([buildingName, buildingIssues]) => (
                  <div key={buildingName} className="mb-6">
                    <h4 className="text-md font-bold text-violet-primary mb-3 border-b border-violet-primary/20 pb-2">{buildingName}</h4>
                    <div className="space-y-3">
                      {buildingIssues.map(issue => (
                        <div key={issue.id} className="glass-card p-4 flex flex-col sm:flex-row justify-between gap-4 border-l-4 border-l-violet-primary/50">
                          <div>
                            <div className="text-[10px] uppercase font-bold mb-2 flex items-center gap-2 flex-wrap">
                              <span className="text-text-muted">{new Date(issue.reported_at).toLocaleString()}</span>
                              {issue.issue_type && <span className="bg-red-busy/20 text-red-busy px-2 py-0.5 rounded flex items-center gap-1 border border-red-busy/30"><AlertTriangle size={12} /> {issue.issue_type}</span>}
                              {issue.room && <span className="bg-violet-primary/20 text-violet-primary px-2 py-0.5 rounded border border-violet-primary/30">Room {issue.room}</span>}
                              {issue.slot_time && <span className="bg-emerald-free/20 text-emerald-free px-2 py-0.5 rounded border border-emerald-free/30">{issue.slot_time}</span>}
                            </div>
                            <div className="text-text-primary text-sm bg-slate-deeper p-3 rounded-lg border border-slate-border/50">{issue.query_text}</div>
                            <div className="mt-2 inline-block px-2 py-1 bg-slate-border text-text-secondary text-[10px] rounded-md font-bold uppercase tracking-wider">
                              {issue.status}
                            </div>
                          </div>
                          <div className="shrink-0 flex items-center">
                            <button
                              onClick={() => handleResolve(issue.id)}
                              disabled={resolvingId === issue.id || issue.status === 'resolved'}
                              className="p-2 rounded-lg bg-slate-darker border border-slate-border text-emerald-free hover:bg-emerald-free/10 transition-colors disabled:opacity-50"
                              title="Mark as Resolved"
                            >
                              {resolvingId === issue.id ? <Lottie animationData={loaderAnimation} className="w-6 h-6" /> : <Check className="w-5 h-5" />}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
        
        {/* ══════════ SENDIYOU MODERATION TAB ══════════ */}
        {activeTab === 'sendiyou' && (
          <SendiyouAdminTab token={token} />
        )}

        {/* ══════════ PUSH NOTIFICATIONS TAB ══════════ */}
        {activeTab === 'notifications' && (
          <div className="glass-card p-6 border-violet-primary/30 bg-violet-primary/5">
            <h3 className="text-xl font-bold text-violet-primary mb-2">Send Push Notification</h3>
            <p className="text-sm text-text-muted mb-6">Broadcast a message to all users who have subscribed to timetable alerts.</p>
            
            <form onSubmit={async (e) => {
              e.preventDefault();
              const title = e.target.title.value;
              const body = e.target.body.value;
              
              const btn = e.target.submitBtn;
              const originalText = btn.innerHTML;
              btn.innerHTML = 'Sending...';
              btn.disabled = true;

              try {
                const res = await fetch('/api/notifications/broadcast', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                  },
                  body: JSON.stringify({ title, body })
                });
                const data = await res.json();
                if (res.ok) {
                  alert(data.message);
                  e.target.reset();
                } else {
                  alert(data.error || 'Failed to send broadcast');
                }
              } catch(err) {
                alert(err.message);
              } finally {
                btn.innerHTML = originalText;
                btn.disabled = false;
              }
            }} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1 uppercase tracking-wider">Notification Title</label>
                <input name="title" required placeholder="e.g. Timetable Updated!" className="w-full bg-slate-deeper border border-slate-border rounded-lg px-4 py-3 text-text-primary focus:outline-none focus:border-violet-primary focus:ring-1 focus:ring-violet-primary" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1 uppercase tracking-wider">Notification Body</label>
                <textarea name="body" required placeholder="e.g. The latest master timetable has been synced." rows="3" className="w-full bg-slate-deeper border border-slate-border rounded-lg px-4 py-3 text-text-primary focus:outline-none focus:border-violet-primary focus:ring-1 focus:ring-violet-primary resize-none"></textarea>
              </div>
              
              <div className="flex justify-end pt-2">
                <button type="submit" name="submitBtn" className="px-6 py-3 rounded-full bg-violet-primary text-white font-bold hover:bg-violet-hover transition-colors flex items-center gap-2 disabled:opacity-50">
                  <Bell size={18} /> Broadcast Now
                </button>
              </div>
            </form>
          </div>
        )}

      </div>
    </div>
  )
}
