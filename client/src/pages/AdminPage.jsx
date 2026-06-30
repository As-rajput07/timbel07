import { useState, useRef, useEffect } from 'react'
import { Shield, Upload, CheckCircle, AlertCircle, MessageSquare, Check, PlusCircle, ChevronDown, X, Trash2, Search, Edit3, XCircle } from 'lucide-react'
import LottieLib from 'lottie-react'
import ReactMarkdown from 'react-markdown'
import assistantAnimation from '../assets/assistent.json'
import loaderAnimation from '../assets/loder.json'

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
  const [activeTab, setActiveTab] = useState('upload') // 'upload' | 'add-slot' | 'manage-slots' | 'queries'
  const [issues, setIssues] = useState([])
  const [loadingIssues, setLoadingIssues] = useState(false)
  const [aiAnalysis, setAiAnalysis] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [resolvingId, setResolvingId] = useState(null)
  const [clearing, setClearing] = useState(false)
  const [applying, setApplying] = useState(false)

  // Add Slot State
  const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
  const SESSION_TYPES = ['LEC', 'LAB', 'TUT', 'EXAM']
  const emptySlotForm = {
    building: '', room: '', subject: '', teacher: '',
    day: 'MON', start_time: '', end_time: '',
    session_type: 'LEC', class_code: '', section: '',
    program: '', year: ''
  }
  const [slotForm, setSlotForm] = useState(emptySlotForm)
  const [metadata, setMetadata] = useState({ subjects: [], teachers: [], buildings: [], classCodes: [] })
  const [metaLoading, setMetaLoading] = useState(false)
  const [subjectSearch, setSubjectSearch] = useState('')
  const [teacherSearch, setTeacherSearch] = useState('')
  const [showSubjectDrop, setShowSubjectDrop] = useState(false)
  const [showTeacherDrop, setShowTeacherDrop] = useState(false)
  const [showClassCodeDrop, setShowClassCodeDrop] = useState(false)
  const [classCodeSearch, setClassCodeSearch] = useState('')
  const [showBuildingDrop, setShowBuildingDrop] = useState(false)
  const [buildingSearch, setBuildingSearch] = useState('')
  const [showDayDrop, setShowDayDrop] = useState(false)
  const [showSessionDrop, setShowSessionDrop] = useState(false)
  const [addSlotStatus, setAddSlotStatus] = useState(null) // null | 'loading' | 'success' | 'error'
  const [addSlotMsg, setAddSlotMsg] = useState('')
  const [recentSlots, setRecentSlots] = useState([])

  // Manage Slots State
  const [manageSearch, setManageSearch] = useState({ building: '', room: '', day: '' })
  const [manageBuildingSearch, setManageBuildingSearch] = useState('')
  const [showManageBuildingDrop, setShowManageBuildingDrop] = useState(false)
  const [showManageDayDrop, setShowManageDayDrop] = useState(false)
  const [manageResults, setManageResults] = useState([])
  const [manageLoading, setManageLoading] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [editingSlotId, setEditingSlotId] = useState(null)
  const [editSlotData, setEditSlotData] = useState({})
  const [editLoading, setEditLoading] = useState(false)

  useEffect(() => {
    if (token && activeTab === 'queries') fetchIssues()
    if (token && (activeTab === 'add-slot' || activeTab === 'manage-slots') && metadata.subjects.length === 0) fetchMetadata()
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

  const handleDeleteSlot = async (id) => {
    setDeleteLoading(true)
    try {
      const res = await fetch(`/api/admin/slots/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      if (res.ok) {
        setManageResults(prev => prev.filter(s => s.id !== id))
        setDeleteConfirmId(null)
      } else {
        alert(data.error || 'Failed to delete slot')
      }
    } catch (err) { console.error(err) }
    finally { setDeleteLoading(false) }
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

  const handleSlotFormChange = (field, value) => {
    setSlotForm(prev => ({ ...prev, [field]: value }))
  }

  const handleAddSlot = async (e) => {
    e.preventDefault()
    setAddSlotStatus('loading')
    setAddSlotMsg('')
    try {
      const res = await fetch('/api/admin/add-slot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(slotForm)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to add slot')
      setAddSlotStatus('success')
      setAddSlotMsg(`Slot added: ${slotForm.room} | ${slotForm.subject} | ${slotForm.day} ${slotForm.start_time}-${slotForm.end_time}`)
      setRecentSlots(prev => [{ ...slotForm, id: data.slot?.id }, ...prev.slice(0, 4)])
      setSlotForm(emptySlotForm)
      setSubjectSearch('')
      setTeacherSearch('')
      setClassCodeSearch('')
      setBuildingSearch('')
    } catch (err) {
      setAddSlotStatus('error')
      setAddSlotMsg(err.message)
    }
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
            className={`px-5 py-3 font-semibold text-sm transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'add-slot' ? 'border-b-2 border-emerald-free text-emerald-free' : 'text-text-muted hover:text-text-primary'}`}
            onClick={() => setActiveTab('add-slot')}
          >
            <PlusCircle size={15} /> Add Slot
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
              
              <label 
                htmlFor="file-upload"
                className="cursor-pointer flex flex-col items-center gap-4"
              >
                <div className={`w-16 h-16 rounded-full flex items-center justify-center ${file ? 'bg-violet-primary text-white' : 'bg-slate-border/50 text-text-muted'}`}>
                  <Upload size={28} />
                </div>
                
                <div>
                  <p className="text-lg font-medium text-text-primary">
                    {file ? file.name : 'Click to upload Excel file'}
                  </p>
                  <p className="text-sm text-text-muted mt-1">
                    {file ? `${(file.size / 1024).toFixed(2)} KB` : 'Supports .xlsx and .xls formats'}
                  </p>
                </div>
              </label>

              {file && (
                <div className="mt-8">
                  <button
                    onClick={handleUpload}
                    disabled={uploadStatus === 'uploading'}
                    className="px-8 py-3 rounded-full bg-emerald-free hover:bg-[#0EA5E9] hover:bg-emerald-free/90 text-white font-medium transition-colors disabled:opacity-50 flex items-center gap-2 mx-auto"
                  >
                    {uploadStatus === 'uploading' ? (
                      <><Lottie animationData={loaderAnimation} className="w-6 h-6" /> Processing...</>
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

        {/* ══════════ ADD SLOT TAB ══════════ */}
        {activeTab === 'add-slot' && (
          <div className="space-y-6">
            {metaLoading ? (
              <div className="flex justify-center p-12"><Lottie animationData={loaderAnimation} className="w-12 h-12" /></div>
            ) : (
              <form onSubmit={handleAddSlot} className="glass-card p-6 md:p-8 space-y-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-emerald-free/10 flex items-center justify-center">
                    <PlusCircle className="text-emerald-free" size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-text-primary text-lg">Add New Slot</h3>
                    <p className="text-text-muted text-sm">Fill all fields. Data will be live immediately.</p>
                  </div>
                </div>

                {/* Row 1: Building + Room */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Building — Searchable Dropdown */}
                  <div className="relative">
                    <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-wider">Building Type *</label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search building (e.g. B, NB, C)..."
                        value={buildingSearch || slotForm.building}
                        onChange={e => { setBuildingSearch(e.target.value); handleSlotFormChange('building', e.target.value); setShowBuildingDrop(true) }}
                        onFocus={() => setShowBuildingDrop(true)}
                        onBlur={() => setTimeout(() => setShowBuildingDrop(false), 200)}
                        className="w-full px-4 py-3 rounded-xl bg-slate-deeper border border-slate-border text-text-primary placeholder-text-muted focus:outline-none focus:border-emerald-free focus:ring-1 focus:ring-emerald-free transition-colors pr-10"
                        required
                      />
                      <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                    </div>
                    {showBuildingDrop && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-slate-card border border-slate-border rounded-xl shadow-2xl z-50 max-h-48 overflow-y-auto">
                        {(metadata.buildings.length > 0 ? metadata.buildings : ['A','B','C','D','E','F','G','NB','BX','I'])
                          .filter(b => b.toLowerCase().includes((buildingSearch || slotForm.building).toLowerCase()))
                          .map((b, i) => (
                            <div
                              key={i}
                              className="px-4 py-2.5 hover:bg-slate-deeper cursor-pointer text-text-primary text-sm border-b border-slate-border/40 last:border-0 flex items-center gap-3"
                              onMouseDown={() => { handleSlotFormChange('building', b); setBuildingSearch(''); setShowBuildingDrop(false) }}
                            >
                              <span className="w-8 h-8 rounded-lg bg-violet-primary/10 text-violet-primary flex items-center justify-center font-bold text-xs shrink-0">{b}</span>
                              <span>Block {b}</span>
                            </div>
                          ))
                        }
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-wider">Classroom / Room No. *</label>
                    <input
                      type="text"
                      placeholder="e.g. B012, C013, I007"
                      value={slotForm.room}
                      onChange={e => handleSlotFormChange('room', e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-slate-deeper border border-slate-border text-text-primary placeholder-text-muted focus:outline-none focus:border-emerald-free focus:ring-1 focus:ring-emerald-free transition-colors"
                      required
                    />
                  </div>
                </div>

                {/* Row 2: Subject (searchable) */}
                <div className="relative">
                  <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-wider">Subject Name *</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search or type subject name..."
                      value={subjectSearch || slotForm.subject}
                      onChange={e => { setSubjectSearch(e.target.value); handleSlotFormChange('subject', e.target.value); setShowSubjectDrop(true) }}
                      onFocus={() => setShowSubjectDrop(true)}
                      onBlur={() => setTimeout(() => setShowSubjectDrop(false), 200)}
                      className="w-full px-4 py-3 rounded-xl bg-slate-deeper border border-slate-border text-text-primary placeholder-text-muted focus:outline-none focus:border-emerald-free focus:ring-1 focus:ring-emerald-free transition-colors pr-10"
                      required
                    />
                    <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                  </div>
                  {showSubjectDrop && metadata.subjects.filter(s => s.toLowerCase().includes((subjectSearch || slotForm.subject).toLowerCase())).length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-slate-card border border-slate-border rounded-xl shadow-2xl z-50 max-h-52 overflow-y-auto">
                      {metadata.subjects
                        .filter(s => s.toLowerCase().includes((subjectSearch || slotForm.subject).toLowerCase()))
                        .map((s, i) => (
                          <div
                            key={i}
                            className="px-4 py-2.5 hover:bg-slate-deeper cursor-pointer text-text-primary text-sm border-b border-slate-border/40 last:border-0"
                            onMouseDown={() => { handleSlotFormChange('subject', s); setSubjectSearch(''); setShowSubjectDrop(false) }}
                          >
                            {s}
                          </div>
                        ))
                      }
                    </div>
                  )}
                </div>

                {/* Row 3: Teacher (searchable) */}
                <div className="relative">
                  <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-wider">Teacher Name *</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search or type teacher name..."
                      value={teacherSearch || slotForm.teacher}
                      onChange={e => { setTeacherSearch(e.target.value); handleSlotFormChange('teacher', e.target.value); setShowTeacherDrop(true) }}
                      onFocus={() => setShowTeacherDrop(true)}
                      onBlur={() => setTimeout(() => setShowTeacherDrop(false), 200)}
                      className="w-full px-4 py-3 rounded-xl bg-slate-deeper border border-slate-border text-text-primary placeholder-text-muted focus:outline-none focus:border-emerald-free focus:ring-1 focus:ring-emerald-free transition-colors pr-10"
                      required
                    />
                    <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                  </div>
                  {showTeacherDrop && metadata.teachers.filter(t => t.toLowerCase().includes((teacherSearch || slotForm.teacher).toLowerCase())).length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-slate-card border border-slate-border rounded-xl shadow-2xl z-50 max-h-52 overflow-y-auto">
                      {metadata.teachers
                        .filter(t => t.toLowerCase().includes((teacherSearch || slotForm.teacher).toLowerCase()))
                        .map((t, i) => (
                          <div
                            key={i}
                            className="px-4 py-2.5 hover:bg-slate-deeper cursor-pointer text-text-primary text-sm border-b border-slate-border/40 last:border-0"
                            onMouseDown={() => { handleSlotFormChange('teacher', t); setTeacherSearch(''); setShowTeacherDrop(false) }}
                          >
                            {t}
                          </div>
                        ))
                      }
                    </div>
                  )}
                </div>

                {/* Row 4: Day + Session Type */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Day — Searchable Dropdown */}
                  <div className="relative">
                    <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-wider">Day *</label>
                    <div className="relative">
                      <input
                        type="text"
                        readOnly
                        value={slotForm.day}
                        onFocus={() => setShowDayDrop(true)}
                        onBlur={() => setTimeout(() => setShowDayDrop(false), 200)}
                        className="w-full px-4 py-3 rounded-xl bg-slate-deeper border border-slate-border text-text-primary cursor-pointer focus:outline-none focus:border-emerald-free focus:ring-1 focus:ring-emerald-free transition-colors pr-10"
                        required
                      />
                      <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                    </div>
                    {showDayDrop && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-slate-card border border-slate-border rounded-xl shadow-2xl z-50 overflow-hidden">
                        {DAYS.map((d, i) => (
                          <div
                            key={i}
                            className={`px-4 py-2.5 cursor-pointer text-sm border-b border-slate-border/40 last:border-0 flex items-center gap-3 transition-colors ${
                              slotForm.day === d ? 'bg-emerald-free/10 text-emerald-free font-semibold' : 'hover:bg-slate-deeper text-text-primary'
                            }`}
                            onMouseDown={() => { handleSlotFormChange('day', d); setShowDayDrop(false) }}
                          >
                            {d}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Session Type — Searchable Dropdown */}
                  <div className="relative">
                    <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-wider">Session Type</label>
                    <div className="relative">
                      <input
                        type="text"
                        readOnly
                        value={slotForm.session_type}
                        onFocus={() => setShowSessionDrop(true)}
                        onBlur={() => setTimeout(() => setShowSessionDrop(false), 200)}
                        className="w-full px-4 py-3 rounded-xl bg-slate-deeper border border-slate-border text-text-primary cursor-pointer focus:outline-none focus:border-emerald-free focus:ring-1 focus:ring-emerald-free transition-colors pr-10"
                      />
                      <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                    </div>
                    {showSessionDrop && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-slate-card border border-slate-border rounded-xl shadow-2xl z-50 overflow-hidden">
                        {SESSION_TYPES.map((s, i) => (
                          <div
                            key={i}
                            className={`px-4 py-2.5 cursor-pointer text-sm border-b border-slate-border/40 last:border-0 transition-colors ${
                              slotForm.session_type === s ? 'bg-emerald-free/10 text-emerald-free font-semibold' : 'hover:bg-slate-deeper text-text-primary'
                            }`}
                            onMouseDown={() => { handleSlotFormChange('session_type', s); setShowSessionDrop(false) }}
                          >
                            {s}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Row 5: Start Time + End Time */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-wider">Start Time *</label>
                    <input
                      type="time"
                      value={slotForm.start_time}
                      onChange={e => handleSlotFormChange('start_time', e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-slate-deeper border border-slate-border text-text-primary focus:outline-none focus:border-emerald-free transition-colors"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-wider">End Time *</label>
                    <input
                      type="time"
                      value={slotForm.end_time}
                      onChange={e => handleSlotFormChange('end_time', e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-slate-deeper border border-slate-border text-text-primary focus:outline-none focus:border-emerald-free transition-colors"
                      required
                    />
                  </div>
                </div>

                {/* Row 6: Class Code + Section */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Class Code — Searchable Dropdown */}
                  <div className="relative">
                    <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-wider">Class Code</label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="e.g. BE-CS, BCA-A"
                        value={classCodeSearch || slotForm.class_code}
                        onChange={e => { setClassCodeSearch(e.target.value); handleSlotFormChange('class_code', e.target.value); setShowClassCodeDrop(true) }}
                        onFocus={() => setShowClassCodeDrop(true)}
                        onBlur={() => setTimeout(() => setShowClassCodeDrop(false), 200)}
                        className="w-full px-4 py-3 rounded-xl bg-slate-deeper border border-slate-border text-text-primary placeholder-text-muted focus:outline-none focus:border-emerald-free focus:ring-1 focus:ring-emerald-free transition-colors pr-10"
                      />
                      <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                    </div>
                    {showClassCodeDrop && metadata.classCodes.filter(c => c.toLowerCase().includes((classCodeSearch || slotForm.class_code).toLowerCase())).length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-slate-card border border-slate-border rounded-xl shadow-2xl z-50 max-h-48 overflow-y-auto">
                        {metadata.classCodes
                          .filter(c => c.toLowerCase().includes((classCodeSearch || slotForm.class_code).toLowerCase()))
                          .map((c, i) => (
                            <div
                              key={i}
                              className="px-4 py-2.5 hover:bg-slate-deeper cursor-pointer text-text-primary text-sm border-b border-slate-border/40 last:border-0"
                              onMouseDown={() => { handleSlotFormChange('class_code', c); setClassCodeSearch(''); setShowClassCodeDrop(false) }}
                            >
                              {c}
                            </div>
                          ))
                        }
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-wider">Section</label>
                    <input
                      type="text"
                      placeholder="e.g. A, B, C"
                      value={slotForm.section}
                      onChange={e => handleSlotFormChange('section', e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-slate-deeper border border-slate-border text-text-primary placeholder-text-muted focus:outline-none focus:border-emerald-free transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-wider">Year</label>
                    <input
                      type="number"
                      min="1" max="4"
                      placeholder="1-4"
                      value={slotForm.year}
                      onChange={e => handleSlotFormChange('year', e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-slate-deeper border border-slate-border text-text-primary placeholder-text-muted focus:outline-none focus:border-emerald-free transition-colors"
                    />
                  </div>
                </div>

                {/* Row 7: Program */}
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-wider">Program</label>
                  <input
                    type="text"
                    placeholder="e.g. BE, BCA, MCA"
                    value={slotForm.program}
                    onChange={e => handleSlotFormChange('program', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-deeper border border-slate-border text-text-primary placeholder-text-muted focus:outline-none focus:border-emerald-free transition-colors"
                  />
                </div>

                {/* Status Messages */}
                {addSlotStatus === 'success' && (
                  <div className="p-4 rounded-xl bg-emerald-free/10 border border-emerald-free/30 flex items-start gap-3">
                    <CheckCircle className="text-emerald-free shrink-0 mt-0.5" size={18} />
                    <div>
                      <p className="text-emerald-free font-semibold text-sm">Slot Added Successfully!</p>
                      <p className="text-emerald-free/70 text-xs mt-0.5">{addSlotMsg}</p>
                    </div>
                  </div>
                )}
                {addSlotStatus === 'error' && (
                  <div className="p-4 rounded-xl bg-red-busy/10 border border-red-busy/30 flex items-start gap-3">
                    <AlertCircle className="text-red-busy shrink-0 mt-0.5" size={18} />
                    <div>
                      <p className="text-red-busy font-semibold text-sm">Failed to Add Slot</p>
                      <p className="text-red-busy/70 text-xs mt-0.5">{addSlotMsg}</p>
                    </div>
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={addSlotStatus === 'loading'}
                  className="w-full py-3.5 rounded-full bg-emerald-free hover:bg-emerald-free/90 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  {addSlotStatus === 'loading'
                    ? <><Lottie animationData={loaderAnimation} className="w-6 h-6" /> Adding Slot...</>
                    : <><PlusCircle size={18} /> Add This Slot to Database</>
                  }
                </button>
              </form>
            )}

            {/* Recently Added Slots */}
            {recentSlots.length > 0 && (
              <div className="glass-card p-5">
                <h4 className="text-sm font-bold text-text-secondary uppercase tracking-wider mb-3">Recently Added This Session</h4>
                <div className="space-y-2">
                  {recentSlots.map((s, i) => (
                    <div key={i} className="flex items-center justify-between bg-slate-deeper px-4 py-2.5 rounded-xl border border-slate-border">
                      <div className="flex items-center gap-3 text-sm">
                        <span className="text-emerald-free font-bold">{s.room}</span>
                        <span className="text-text-muted">•</span>
                        <span className="text-text-primary">{s.subject}</span>
                        <span className="text-text-muted">•</span>
                        <span className="text-text-muted">{s.day} {s.start_time}–{s.end_time}</span>
                      </div>
                      <span className="text-xs bg-emerald-free/20 text-emerald-free px-2 py-0.5 rounded-full font-semibold">Live</span>
                    </div>
                  ))}
                </div>
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
                      {DAYS.map((d, i) => (
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
                                {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
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
                            <div className="col-span-2 sm:col-span-2">
                              <label className="block text-[10px] text-text-muted uppercase mb-1">Subject</label>
                              <input type="text" value={editSlotData.subject || ''} onChange={e => setEditSlotData(p => ({ ...p, subject: e.target.value }))} className="w-full bg-slate-card border border-slate-border rounded-lg px-3 py-1.5 text-text-primary focus:border-violet-primary focus:outline-none" />
                            </div>
                            <div className="col-span-2 sm:col-span-2">
                              <label className="block text-[10px] text-text-muted uppercase mb-1">Teacher</label>
                              <input type="text" value={editSlotData.teacher || ''} onChange={e => setEditSlotData(p => ({ ...p, teacher: e.target.value }))} className="w-full bg-slate-card border border-slate-border rounded-lg px-3 py-1.5 text-text-primary focus:border-violet-primary focus:outline-none" />
                            </div>
                            <div>
                              <label className="block text-[10px] text-text-muted uppercase mb-1">Class Code</label>
                              <input type="text" value={editSlotData.class_code || ''} onChange={e => setEditSlotData(p => ({ ...p, class_code: e.target.value }))} className="w-full bg-slate-card border border-slate-border rounded-lg px-3 py-1.5 text-text-primary focus:border-violet-primary focus:outline-none" />
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

        {activeTab === 'queries' && (
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
      </div>
    </div>
  )
}
