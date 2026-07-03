import { useState, useEffect } from 'react'
import { Search, Trash2, ShieldAlert, ShieldCheck, User, MessageSquare, AlertCircle, UserMinus, ChevronDown, ChevronUp } from 'lucide-react'

export default function SendiyouAdminTab({ token }) {
  const [activeSubTab, setActiveSubTab] = useState('users') // 'users', 'posts'
  
  const [users, setUsers] = useState([])
  const [posts, setPosts] = useState([])
  const [expandedPostId, setExpandedPostId] = useState(null)
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (token) {
      if (activeSubTab === 'users') fetchUsers()
      if (activeSubTab === 'posts') fetchPosts()
    }
  }, [token, activeSubTab])

  const fetchUsers = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/sendiyou/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Failed to fetch users. Is the backend server running?')
      const data = await res.json()
      setUsers(data.users || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchPosts = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/sendiyou/posts', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Failed to fetch posts. Is the backend server running?')
      const data = await res.json()
      setPosts(data.posts || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSuspendToggle = async (userId, currentStatus) => {
    if (!window.confirm(`Are you sure you want to ${currentStatus ? 'unsuspend' : 'suspend'} this user?`)) return
    
    try {
      const res = await fetch(`/api/admin/sendiyou/users/${userId}/suspend`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ is_suspended: !currentStatus })
      })
      if (!res.ok) throw new Error('Failed to update suspension status')
      
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_suspended: !currentStatus } : u))
    } catch (err) {
      alert(err.message)
    }
  }

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('WARNING: This will permanently delete the user from the database, along with all their posts, chats, and messages. This action cannot be undone. Proceed?')) return
    
    try {
      const res = await fetch(`/api/admin/sendiyou/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Failed to delete user')
      
      setUsers(prev => prev.filter(u => u.id !== userId))
    } catch (err) {
      alert(err.message)
    }
  }

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Are you sure you want to permanently delete this post and all associated chats?')) return
    
    try {
      const res = await fetch(`/api/admin/sendiyou/posts/${postId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Failed to delete post')
      
      setPosts(prev => prev.filter(p => p.id !== postId))
    } catch (err) {
      alert(err.message)
    }
  }

  const togglePostExpand = (postId) => {
    setExpandedPostId(expandedPostId === postId ? null : postId)
  }

  return (
    <div className="space-y-6">
      {/* Header and Sub-tabs */}
      <div className="glass-card p-6 flex flex-col md:flex-row items-center justify-between gap-4 border-violet-primary/20">
        <div>
          <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
            <ShieldAlert className="text-violet-primary" size={24} />
            SendiYou Moderation
          </h2>
          <p className="text-sm text-text-muted mt-1">Monitor activity, suspend or delete users, and moderate content.</p>
        </div>
        
        <div className="flex bg-slate-deeper rounded-xl p-1 border border-slate-border">
          <button 
            onClick={() => setActiveSubTab('users')}
            className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${activeSubTab === 'users' ? 'bg-violet-primary text-white shadow-lg' : 'text-text-muted hover:text-text-primary hover:bg-white/5'}`}
          >
            Users
          </button>
          <button 
            onClick={() => setActiveSubTab('posts')}
            className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${activeSubTab === 'posts' ? 'bg-violet-primary text-white shadow-lg' : 'text-text-muted hover:text-text-primary hover:bg-white/5'}`}
          >
            Posts & Chats
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl text-sm flex items-center gap-3">
          <AlertCircle size={18} /> {error}
        </div>
      )}

      {/* Content Area */}
      <div className="glass-card p-6 border-slate-border/50 min-h-[400px]">
        {loading ? (
          <div className="flex justify-center items-center h-48">
            <div className="w-8 h-8 border-4 border-violet-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            {/* USERS TAB */}
            {activeSubTab === 'users' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-text-secondary">
                  <thead className="text-xs uppercase bg-slate-deeper text-text-muted">
                    <tr>
                      <th className="px-4 py-3 rounded-tl-lg">Name</th>
                      <th className="px-4 py-3">Enrollment</th>
                      <th className="px-4 py-3">Email</th>
                      <th className="px-4 py-3">Branch</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 rounded-tr-lg text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id} className="border-b border-slate-border/50 hover:bg-white/5 transition-colors">
                        <td className="px-4 py-4 font-semibold text-text-primary">{u.name}</td>
                        <td className="px-4 py-4">{u.enrollment_number}</td>
                        <td className="px-4 py-4">{u.email}</td>
                        <td className="px-4 py-4">{u.branch}</td>
                        <td className="px-4 py-4">
                          {u.is_suspended ? (
                            <span className="px-2.5 py-1 bg-amber-soon/20 text-amber-soon rounded-full text-[10px] font-bold uppercase tracking-wide">Suspended</span>
                          ) : (
                            <span className="px-2.5 py-1 bg-emerald-free/20 text-emerald-free rounded-full text-[10px] font-bold uppercase tracking-wide">Active</span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex justify-end gap-2">
                            <button 
                              onClick={() => handleSuspendToggle(u.id, u.is_suspended)}
                              className={`p-2 rounded-lg text-xs font-bold transition-colors ${u.is_suspended ? 'bg-emerald-free/10 text-emerald-free hover:bg-emerald-free' : 'bg-amber-soon/10 text-amber-soon hover:bg-amber-soon'} hover:text-white`}
                              title={u.is_suspended ? 'Unsuspend User' : 'Suspend User'}
                            >
                              {u.is_suspended ? <ShieldCheck size={16} /> : <ShieldAlert size={16} />}
                            </button>
                            <button 
                              onClick={() => handleDeleteUser(u.id)}
                              className="p-2 rounded-lg text-xs font-bold transition-colors bg-red-busy/10 text-red-busy hover:bg-red-busy hover:text-white"
                              title="Delete User from Database"
                            >
                              <UserMinus size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {users.length === 0 && (
                      <tr>
                        <td colSpan="6" className="px-4 py-8 text-center text-text-muted">No users found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* POSTS TAB */}
            {activeSubTab === 'posts' && (
              <div className="grid grid-cols-1 gap-4">
                {posts.map(post => (
                  <div key={post.id} className="bg-slate-deeper/50 rounded-xl border border-slate-border overflow-hidden transition-all">
                    
                    {/* Post Header (Clickable) */}
                    <div 
                      className="p-4 cursor-pointer hover:bg-white/5 flex items-start gap-4"
                      onClick={() => togglePostExpand(post.id)}
                    >
                      <div className="flex-1 min-w-0 pr-4">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-lg font-bold text-text-primary">{post.title}</h4>
                          <span className="px-2 py-0.5 bg-violet-primary/20 text-violet-primary rounded text-[10px] font-semibold uppercase tracking-wider">
                            {post.connection_type}
                          </span>
                        </div>
                        <p className="text-sm text-text-secondary truncate">{post.description}</p>
                      </div>
                      
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-xs text-text-muted flex items-center gap-1 bg-slate-card px-2 py-1 rounded border border-slate-border">
                          <MessageSquare size={12} /> {post.chats?.length || 0} Chats
                        </div>
                        {expandedPostId === post.id ? <ChevronUp size={20} className="text-text-muted" /> : <ChevronDown size={20} className="text-text-muted" />}
                      </div>
                    </div>

                    {/* Expanded Post Details */}
                    {expandedPostId === post.id && (
                      <div className="p-4 border-t border-slate-border/50 bg-slate-card/30">
                        <div className="mb-4">
                          <h5 className="text-xs font-bold text-text-muted uppercase mb-1">Full Description</h5>
                          <p className="text-sm text-text-primary whitespace-pre-wrap">{post.description}</p>
                        </div>
                        
                        <div className="flex items-center justify-between mb-6">
                          <div className="text-xs text-text-secondary flex items-center gap-2">
                            <User size={14} className="text-violet-primary" />
                            <span>
                              Created by: <strong className="text-text-primary">{post.creator?.name}</strong> ({post.creator?.enrollment_number})
                            </span>
                            {post.creator?.is_suspended && <span className="px-1.5 bg-red-busy/20 text-red-busy rounded text-[10px] font-bold">SUSPENDED</span>}
                          </div>
                          
                          <button 
                            onClick={() => handleDeletePost(post.id)}
                            className="px-3 py-1.5 bg-red-busy/10 text-red-busy rounded-lg text-xs font-bold hover:bg-red-busy hover:text-white transition-colors flex items-center gap-1.5"
                          >
                            <Trash2 size={14} /> Delete Entire Post
                          </button>
                        </div>

                        {/* Associated Chats */}
                        <div>
                          <h5 className="text-xs font-bold text-text-muted uppercase mb-3 flex items-center gap-2">
                            <MessageSquare size={14} /> Active Chat Rooms
                          </h5>
                          
                          {post.chats?.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {post.chats.map(chat => (
                                <div key={chat.id} className="p-3 bg-slate-deeper rounded-lg border border-slate-border flex items-center justify-between">
                                  <div>
                                    <div className="text-sm font-semibold text-text-primary">Chat Room</div>
                                    <div className="text-xs text-text-muted mt-0.5">{chat.participant_ids?.length || 0} Participants joined</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-sm text-text-muted bg-slate-deeper p-3 rounded-lg border border-slate-border text-center">
                              No chats have been started for this post yet.
                            </div>
                          )}
                        </div>

                      </div>
                    )}
                  </div>
                ))}
                
                {posts.length === 0 && (
                  <div className="py-8 text-center text-text-muted">No active posts found.</div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
