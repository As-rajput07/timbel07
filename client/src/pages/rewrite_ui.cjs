const fs = require('fs');
const filePath = 'AdminPage.jsx';
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
  "if (token && activeTab === 'class-timetables' && metadata.subjects.length === 0) fetchMetadata()"
);

// Replace handlers
content = content.replace(
  /const handleManageSearch = async \(\w+\) => \{([\s\S]*?)const fetchIssues = async/m,
  `const fetchClassSchedule = async (classCode) => {
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

  const fetchIssues = async`
);

// We replace everything between these two tags
const startTabsUIStr = "<button\\n            className={`px-5 py-3 font-semibold text-sm transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'add-slot'";
const endTabsUIStr = "{activeTab === 'queries' && (";

// Since backticks in regex are safe, we just use a regex replace
const uiRegex = new RegExp("<button\\n\\s*className=\\{`px-5 py-3 font-semibold text-sm transition-colors flex items-center gap-2 whitespace-nowrap \\$\\{activeTab === 'add-slot'[\\s\\S]*?\\{activeTab === 'queries' && \\(", 'm');

const newUI = fs.readFileSync('newUI.jsx', 'utf8');

content = content.replace(uiRegex, newUI + "\\n        {activeTab === 'queries' && (");

fs.writeFileSync(filePath, content);
console.log("Successfully replaced file chunks");
