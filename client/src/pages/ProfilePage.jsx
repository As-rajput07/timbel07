import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import { ArrowLeft, Edit3, Shield, Mail, Users, FileText, CheckCircle, LogOut, Camera, Loader2, X, Save } from 'lucide-react';

const DEFAULT_BANNER = 'https://res.cloudinary.com/dga14nmzn/image/upload/v1784358679/cosen_banner_wwpfb6.png';

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, profile, signOut, setProfile } = useAuth();
  
  const [stats, setStats] = useState({ totalPosts: 0, activeChats: 0 });
  const [loading, setLoading] = useState(true);
  const [showBioModal, setShowBioModal] = useState(false);
  const [bioInput, setBioInput] = useState('');
  const [savingBio, setSavingBio] = useState(false);
  
  const posterInputRef = React.useRef(null);
  const avatarInputRef = React.useRef(null);
  const [uploadingPoster, setUploadingPoster] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const handleFileUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("File is too large. Max 5MB allowed.");
      return;
    }

    const isPoster = type === 'poster';
    if (isPoster) setUploadingPoster(true);
    else setUploadingAvatar(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}_${type}_${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('user_uploads')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('user_uploads')
        .getPublicUrl(fileName);

      const publicUrl = publicUrlData.publicUrl;
      const columnToUpdate = isPoster ? 'poster_url' : 'custom_avatar_url';

      const { error: updateError } = await supabase
        .from('users')
        .update({ [columnToUpdate]: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Update local profile state
      setProfile(prev => ({ ...prev, [columnToUpdate]: publicUrl }));
    } catch (err) {
      console.error(`Error uploading ${type}:`, err);
      alert(`Failed to upload ${type}. Ensure the storage_migration.sql was run.`);
    } finally {
      if (isPoster) setUploadingPoster(false);
      else setUploadingAvatar(false);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    fetchStats();
    // Set default banner if not set
    if (profile && !profile.poster_url) {
      supabase.from('users').update({ poster_url: DEFAULT_BANNER }).eq('id', user.id)
        .then(() => setProfile(prev => ({ ...prev, poster_url: DEFAULT_BANNER })));
    }
  }, [user, navigate]);

  const handleSaveBio = async () => {
    setSavingBio(true);
    try {
      await supabase.from('users').update({ bio: bioInput.trim() }).eq('id', user.id);
      setProfile(prev => ({ ...prev, bio: bioInput.trim() }));
      setShowBioModal(false);
    } catch (e) {
      console.error('Error saving bio:', e);
    } finally {
      setSavingBio(false);
    }
  };

  const fetchStats = async () => {
    setLoading(true);
    try {
      // Fetch total posts created by user
      const { count: postsCount, error: postsError } = await supabase
        .from('sendiyou_posts')
        .select('*', { count: 'exact', head: true })
        .eq('creator_id', user.id);
        
      if (postsError) throw postsError;

      // Fetch active chats (accepted requests) where user is a participant
      const { count: chatsCount, error: chatsError } = await supabase
        .from('sendiyou_chats')
        .select('*', { count: 'exact', head: true })
        .contains('participant_ids', [user.id]);
        
      if (chatsError) throw chatsError;

      setStats({
        totalPosts: postsCount || 0,
        activeChats: chatsCount || 0
      });
    } catch (err) {
      console.error("Error fetching stats:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!profile) {
    return (
      <div className="flex justify-center items-center min-h-[60vh] pt-24">
        <div className="w-12 h-12 animate-spin rounded-full border-t-4 border-violet-primary border-r-4 border-r-transparent"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 pt-24 pb-12 max-w-2xl relative">
      <button onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors mb-6 text-sm font-medium">
        <ArrowLeft size={18} /> Back
      </button>

      {/* Hidden File Inputs */}
      <input type="file" accept="image/*" hidden ref={posterInputRef} onChange={(e) => handleFileUpload(e, 'poster')} />
      <input type="file" accept="image/*" hidden ref={avatarInputRef} onChange={(e) => handleFileUpload(e, 'avatar')} />

      {/* Main Profile Card */}
      <div className="glass-card rounded-3xl overflow-hidden mb-6" style={{ background: '#0F172A', border: '1px solid rgba(51,65,85,0.4)' }}>
        {/* Cover / Header */}
        <div className="h-40 w-full relative group" style={{ 
          background: `url(${profile.poster_url || DEFAULT_BANNER}) center/cover no-repeat`
        }}>
          {/* Edit Cover Button */}
          <button onClick={() => posterInputRef.current?.click()} disabled={uploadingPoster}
            className="absolute top-4 right-4 bg-slate-deeper/80 backdrop-blur-md p-2 rounded-xl text-text-primary hover:bg-violet-primary/80 transition-colors border border-slate-border/50 flex items-center gap-2">
            {uploadingPoster ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
            <span className="text-xs font-bold">{uploadingPoster ? 'Uploading...' : 'Edit Cover'}</span>
          </button>

          <div className="absolute -bottom-12 left-6">
            <div className="w-28 h-28 rounded-full border-4 border-slate-deep overflow-hidden bg-slate-card relative group/avatar cursor-pointer"
                 onClick={() => !uploadingAvatar && avatarInputRef.current?.click()}>
              {uploadingAvatar && (
                <div className="absolute inset-0 bg-slate-deep/80 z-20 flex items-center justify-center">
                  <Loader2 size={24} className="animate-spin text-violet-primary" />
                </div>
              )}
              {profile.custom_avatar_url || user.user_metadata?.avatar_url ? (
                <img src={profile.custom_avatar_url || user.user_metadata.avatar_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-violet-primary"
                  style={{ background: 'rgba(99,91,255,0.1)' }}>
                  {profile.name.charAt(0).toUpperCase()}
                </div>
              )}
              {/* Avatar overlay on hover */}
              <div className="absolute inset-0 bg-black/50 z-10 hidden group-hover/avatar:flex items-center justify-center text-white transition-all">
                <Camera size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Profile Info */}
        <div className="pt-16 pb-6 px-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-2xl font-bold text-text-primary">{profile.name}</h1>
              <p className="text-sm text-text-muted flex items-center gap-1 mt-1">
                <Mail size={14} /> {user.email}
              </p>
              {/* Bio */}
              {profile.bio ? (
                <p className="text-sm text-text-secondary mt-2 max-w-xs leading-relaxed">{profile.bio}</p>
              ) : (
                <p className="text-sm text-text-muted mt-2 italic opacity-60">No bio yet — add one!</p>
              )}
            </div>
            <button onClick={() => { setBioInput(profile.bio || ''); setShowBioModal(true); }}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 border border-slate-border/50 shrink-0">
              <Edit3 size={14} /> Edit Bio
            </button>
          </div>

          {/* Details */}
          <div className="grid grid-cols-2 gap-4 mt-8">
            <div className="bg-slate-deeper p-4 rounded-2xl border border-slate-border/50">
              <span className="text-xs text-text-muted uppercase tracking-wider font-semibold block mb-1">Gender</span>
              <span className="text-text-primary font-medium">{profile.gender}</span>
            </div>
            <div className="bg-slate-deeper p-4 rounded-2xl border border-slate-border/50">
              <span className="text-xs text-text-muted uppercase tracking-wider font-semibold block mb-1">Branch</span>
              <span className="text-text-primary font-medium">{profile.branch}</span>
            </div>
            <div className="bg-slate-deeper p-4 rounded-2xl border border-slate-border/50">
              <span className="text-xs text-text-muted uppercase tracking-wider font-semibold block mb-1">Enrollment No.</span>
              <span className="text-text-primary font-medium flex items-center gap-2">
                {profile.enrollment_number} <Shield size={14} className="text-emerald-free" />
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <h3 className="text-lg font-bold text-text-primary mb-4 px-2">Your SendiYou Stats</h3>
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="glass-card p-5 rounded-2xl border border-slate-border/40 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-full bg-violet-primary/10 flex items-center justify-center text-violet-primary mb-3">
            <FileText size={24} />
          </div>
          <h4 className="text-3xl font-extrabold text-text-primary mb-1">
            {loading ? '-' : stats.totalPosts}
          </h4>
          <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Total Requests</span>
        </div>
        
        <div className="glass-card p-5 rounded-2xl border border-slate-border/40 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-full bg-emerald-free/10 flex items-center justify-center text-emerald-free mb-3">
            <CheckCircle size={24} />
          </div>
          <h4 className="text-3xl font-extrabold text-text-primary mb-1">
            {loading ? '-' : stats.activeChats}
          </h4>
          <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Accepted Requests</span>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="border border-red-500/20 rounded-2xl p-4 bg-red-500/5 flex justify-between items-center">
        <div>
          <h4 className="font-bold text-red-400 text-sm">Sign Out</h4>
          <p className="text-xs text-text-muted">Log out of your account on this device.</p>
        </div>
        <button onClick={() => { signOut(); navigate('/'); }}
          className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl text-sm font-bold transition-colors flex items-center gap-2">
          <LogOut size={16} /> Logout
        </button>
      </div>

      {/* ═══ BIO EDIT MODAL ═══ */}
      {showBioModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowBioModal(false)}>
          <div className="w-full max-w-md bg-slate-card rounded-2xl shadow-2xl border border-slate-border/50 p-6" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-text-primary">Edit Bio</h3>
              <button onClick={() => setShowBioModal(false)} className="text-text-muted hover:text-text-primary transition-colors">
                <X size={20} />
              </button>
            </div>
            <p className="text-xs text-text-muted mb-3">Write a short bio about yourself (max 150 characters). This will be visible on your public SendiYou profile.</p>
            <textarea
              value={bioInput}
              onChange={e => setBioInput(e.target.value.slice(0, 150))}
              placeholder="e.g. CSE student 🎓 | Coffee addict ☕ | Open to study connections"
              rows={3}
              className="w-full bg-slate-deeper border border-slate-border/50 rounded-xl p-3 text-sm text-text-primary placeholder-text-muted resize-none focus:outline-none focus:border-violet-primary transition-colors"
            />
            <p className="text-xs text-text-muted text-right mt-1 mb-4">{bioInput.length}/150</p>
            <div className="flex gap-3">
              <button onClick={() => setShowBioModal(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-text-muted border border-slate-border/50 hover:bg-white/5 transition-colors">
                Cancel
              </button>
              <button onClick={handleSaveBio} disabled={savingBio}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-violet-primary hover:bg-violet-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
                {savingBio ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {savingBio ? 'Saving...' : 'Save Bio'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
