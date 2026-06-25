import { useState, useRef, useEffect } from 'react'
import { Shield, Upload, CheckCircle, AlertCircle, MessageSquare, Check } from 'lucide-react'
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
  const [activeTab, setActiveTab] = useState('upload') // 'upload' | 'queries'
  const [issues, setIssues] = useState([])
  const [loadingIssues, setLoadingIssues] = useState(false)
  const [aiAnalysis, setAiAnalysis] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [resolvingId, setResolvingId] = useState(null)
  const [clearing, setClearing] = useState(false)
  const [applying, setApplying] = useState(false)

  useEffect(() => {
    if (token && activeTab === 'queries') {
      fetchIssues()
    }
  }, [token, activeTab])

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
              className="w-full py-3 px-4 rounded-lg bg-violet-primary hover:bg-violet-hover text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
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

        <div className="flex border-b border-slate-border mb-6">
          <button
            className={`px-6 py-3 font-semibold text-sm transition-colors ${activeTab === 'upload' ? 'border-b-2 border-violet-primary text-violet-primary' : 'text-text-muted hover:text-text-primary'}`}
            onClick={() => setActiveTab('upload')}
          >
            Upload Data
          </button>
          <button
            className={`px-6 py-3 font-semibold text-sm transition-colors flex items-center gap-2 ${activeTab === 'queries' ? 'border-b-2 border-violet-primary text-violet-primary' : 'text-text-muted hover:text-text-primary'}`}
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
                    className="px-8 py-3 rounded-lg bg-emerald-free hover:bg-[#0EA5E9] hover:bg-emerald-free/90 text-white font-medium transition-colors disabled:opacity-50 flex items-center gap-2 mx-auto"
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
                className="px-6 py-3 rounded-xl bg-violet-primary hover:bg-violet-600 text-white font-medium transition-colors disabled:opacity-50 flex items-center gap-2 shrink-0"
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
                            <div className="text-[10px] uppercase font-bold text-text-muted mb-1 flex items-center gap-2 flex-wrap">
                              <span>{new Date(issue.reported_at).toLocaleString()}</span>
                              {issue.room && <span className="bg-slate-border px-1.5 py-0.5 rounded text-text-primary">Room: {issue.room}</span>}
                              {issue.slot_time && <span className="bg-slate-border px-1.5 py-0.5 rounded text-text-primary">{issue.slot_time}</span>}
                              {issue.issue_type && <span className="bg-amber-soon/20 text-amber-soon px-1.5 py-0.5 rounded">{issue.issue_type}</span>}
                            </div>
                            <div className="text-text-primary text-sm mt-2">{issue.query_text}</div>
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
