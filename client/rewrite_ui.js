const fs = require('fs');

const filePath = 'client/src/pages/AdminPage.jsx';
let content = fs.readFileSync(filePath, 'utf8');

// Replace state block
content = content.replace(
  /\/\/ AI Resolve Queries State([\s\S]*?)\/\/ Manage Slots State([\s\S]*?)\/\/ Delete Class Timetable State([\s\S]*?)useEffect\(\(\) => \{/m,
  `// AI Resolve Queries State
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

  useEffect(() => {`
);

// Fix useEffect line 89
content = content.replace(
  /if \(token && \(activeTab === 'add-slot' \|\| activeTab === 'manage-slots' \|\| activeTab === 'delete-class'\) && metadata\.subjects\.length === 0\) fetchMetadata\(\)/g,
  `if (token && activeTab === 'class-timetables' && metadata.subjects.length === 0) fetchMetadata()`
);

// Replace handlers
content = content.replace(
  /const handleManageSearch = async \(\w+\) => \{([\s\S]*?)const fetchIssues = async/m,
  `const fetchClassSchedule = async (classCode) => {
    if (!classCode) { setScheduleData(null); return; }
    setLoadingSchedule(true)
    try {
      const res = await fetch(\`/api/timetable/classes/\${encodeURIComponent(classCode)}\`)
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

  const handleSlotFormChange = (field, value) => setSlotForm(prev => ({ ...prev, [field]: value }))

  const handleSaveSlot = async (e) => {
    e.preventDefault()
    setActionLoading(true)
    const isEdit = !!slotForm.id
    const url = isEdit ? \`/api/admin/slots/\${slotForm.id}\` : '/api/admin/add-slot'
    const method = isEdit ? 'PUT' : 'POST'
    
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': \`Bearer \${token}\` },
        body: JSON.stringify(slotForm)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save slot')
      
      setShowAddModal(false)
      setShowEditModal(false)
      if (selectedClass) fetchClassSchedule(selectedClass)
    } catch (err) {
      alert(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeleteSlot = async (id) => {
    setActionLoading(true)
    try {
      const res = await fetch(\`/api/admin/slots/\${id}\`, {
        method: 'DELETE',
        headers: { 'Authorization': \`Bearer \${token}\` }
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
      const res = await fetch(\`/api/admin/class-timetable/\${encodeURIComponent(selectedClass)}\`, {
        method: 'DELETE',
        headers: { 'Authorization': \`Bearer \${token}\` }
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

  const fetchIssues = async`
);

// Now for the massive UI block.
// We are replacing from <button className={\`px-5 py-3... activeTab === 'add-slot'
// All the way up to {activeTab === 'queries' && (

// Let's just find the indexes
const startTabsUIStr = \`<button
            className={\\\`px-5 py-3 font-semibold text-sm transition-colors flex items-center gap-2 whitespace-nowrap \${activeTab === 'add-slot'\`;

const endTabsUIStr = \`{activeTab === 'queries' && (\`;

const startIndex = content.indexOf(startTabsUIStr);
const endIndex = content.indexOf(endTabsUIStr);

if (startIndex === -1 || endIndex === -1) {
  console.log("Could not find boundaries for UI replacement");
  process.exit(1);
}

const newUI = \`<button
            className={\\\`px-5 py-3 font-semibold text-sm transition-colors flex items-center gap-2 whitespace-nowrap \${activeTab === 'class-timetables' ? 'border-b-2 border-emerald-free text-emerald-free' : 'text-text-muted hover:text-text-primary'}\\\`}
            onClick={() => setActiveTab('class-timetables')}
          >
            <Edit3 size={15} /> Class Timetables
          </button>
          <button
            className={\\\`px-5 py-3 font-semibold text-sm transition-colors flex items-center gap-2 whitespace-nowrap \${activeTab === 'queries' ? 'border-b-2 border-violet-primary text-violet-primary' : 'text-text-muted hover:text-text-primary'}\\\`}
            onClick={() => setActiveTab('queries')}
          >
            Resolve Queries <span className="bg-red-busy text-white text-[10px] px-2 py-0.5 rounded-full">{issues.length > 0 ? issues.length : 0}</span>
          </button>
        </div>

        {activeTab === 'upload' && (
          <div className="glass-card p-8">
            <div 
              className={\\\`border-2 border-dashed rounded-xl p-12 text-center transition-colors \${
                file ? 'border-violet-primary/50 bg-violet-primary/5' : 'border-slate-border hover:border-violet-primary/30'
              }\\\`}
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
            <div className="glass-card p-6 flex flex-col md:flex-row items-center justify-between gap-4 border-emerald-free/20">
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
                    className={\\\`px-4 py-2 rounded-full text-xs font-semibold transition-all duration-200 \${
                      selectedDay === 'ALL' ? 'bg-emerald-free text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'bg-slate-800 text-text-muted hover:bg-slate-700'
                    }\\\`}
                  >
                    All Week
                  </button>
                  {DAYS_OF_WEEK.map(day => (
                    <button
                      key={day}
                      onClick={() => setSelectedDay(day)}
                      className={\\\`px-4 py-2 rounded-full text-xs font-semibold transition-all duration-200 \${
                        selectedDay === day ? 'bg-violet-primary text-white shadow-[0_0_15px_rgba(99,91,255,0.4)]' : 'bg-slate-800 text-text-muted hover:bg-slate-700'
                      }\\\`}
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
                              <div key={idx} className="glass-card p-4 border border-slate-border/50 hover:border-violet-primary/50 group relative overflow-hidden">
                                
                                {/* Admin Actions Overlay */}
                                <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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

                                <div className="flex justify-between items-start mb-3">
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-deeper text-text-secondary border border-slate-border">
                                    {slot.start_time} - {slot.end_time}
                                  </span>
                                  <span className="text-[10px] font-semibold text-emerald-free bg-emerald-free/10 border border-emerald-free/20 px-2 py-0.5 rounded">
                                    {slot.session_type}
                                  </span>
                                </div>
                                
                                <h3 className="text-sm font-bold text-text-primary mb-2 line-clamp-2 pr-12">
                                  {slot.subject}
                                </h3>
                                
                                <div className="flex items-center gap-3 text-xs text-text-muted mt-2">
                                  <span className="font-medium bg-slate-800 px-2 py-1 rounded text-white">{slot.room}</span>
                                  <span className="truncate">{slot.teacher}</span>
                                </div>
                                {slot.section && (
                                  <div className="absolute bottom-3 right-3 text-[10px] font-bold text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                                    Sec {slot.section}
                                  </div>
                                )}
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
                <button type="submit" form="slot-form" disabled={actionLoading} className={\\\`px-6 py-2.5 rounded-full text-sm font-bold text-white transition-colors flex items-center gap-2 disabled:opacity-50 \${showEditModal ? 'bg-violet-primary hover:bg-violet-hover' : 'bg-emerald-free hover:bg-emerald-free/90'}\\\`}>
                  {actionLoading ? <><Lottie animationData={loaderAnimation} className="w-5 h-5" /> Saving...</> : 'Save Slot'}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'queries' && (\`;

content = content.replace(content.substring(startIndex, endIndex), newUI);

fs.writeFileSync(filePath, content);
console.log("Successfully replaced file chunks");
