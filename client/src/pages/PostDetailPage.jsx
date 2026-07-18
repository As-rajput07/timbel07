import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import { ArrowLeft, MessageCircle, ArrowRight, Star, Clock, Eye, EyeOff, Shield, Users, User, Share2, Trash2, X } from 'lucide-react';
import LottieLib from 'lottie-react';

const DEFAULT_BANNER = 'https://res.cloudinary.com/dga14nmzn/image/upload/v1784358679/cosen_banner_wwpfb6.png';

const Lottie = LottieLib.default || LottieLib;

// Import all sendiyu lottie animations
import anim1 from '../assets/sendiyu_lottie/108f4fb6-1181-11ee-b065-4fd3e1c5a442.json';
import anim2 from '../assets/sendiyu_lottie/3b769c46-d4b5-11ee-9229-afbfa1f82773.json';
import anim3 from '../assets/sendiyu_lottie/5a40df34-117d-11ee-a1af-5fe2367006a3.json';
import anim4 from '../assets/sendiyu_lottie/9b7c7972-1187-11ee-96bf-af3ccc7d6968.json';
import anim5 from '../assets/sendiyu_lottie/a09ad288-1177-11ee-be96-53b4df923e7f.json';
import anim6 from '../assets/sendiyu_lottie/bf8f2232-1179-11ee-8f33-db8fe91f3c3c.json';
import anim7 from '../assets/sendiyu_lottie/c635fef8-d248-11ef-8418-db17c1b97f7f.json';
import anim8 from '../assets/sendiyu_lottie/ca9bbdae-1186-11ee-b5ca-b3d847f28449.json';
import anim9 from '../assets/sendiyu_lottie/cc26d92c-116a-11ee-9b51-1fe8e93a38e8.json';

const ANIMATIONS = [
  { id: 'anim1', data: anim1 }, { id: 'anim2', data: anim2 }, { id: 'anim3', data: anim3 },
  { id: 'anim4', data: anim4 }, { id: 'anim5', data: anim5 }, { id: 'anim6', data: anim6 },
  { id: 'anim7', data: anim7 }, { id: 'anim8', data: anim8 }, { id: 'anim9', data: anim9 },
];

const PostDetailPage = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [selectedUserProfile, setSelectedUserProfile] = useState(null);
  const [modalStats, setModalStats] = useState(null);
  const [loadingModalStats, setLoadingModalStats] = useState(false);

  useEffect(() => {
    fetchPost();
  }, [postId]);

  // Fetch stats when profile modal opens
  useEffect(() => {
    if (!selectedUserProfile?.id) { setModalStats(null); return; }
    setLoadingModalStats(true);
    setModalStats(null);
    Promise.all([
      supabase.from('sendiyou_posts').select('*', { count: 'exact', head: true }).eq('creator_id', selectedUserProfile.id),
      supabase.from('sendiyou_chats').select('*', { count: 'exact', head: true }).contains('participant_ids', [selectedUserProfile.id])
    ]).then(([postsRes, chatsRes]) => {
      setModalStats({ posts: postsRes.count || 0, chats: chatsRes.count || 0 });
    }).finally(() => setLoadingModalStats(false));
  }, [selectedUserProfile]);

  const fetchPost = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('sendiyou_posts')
        .select(`*, users ( id, name, gender, branch, custom_avatar_url, bio, email )`)
        .eq('id', postId)
        .single();
      if (error) throw error;
      setPost(data);
    } catch (err) {
      console.error('Error fetching post:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    if (!user || !profile) {
      navigate('/sendiyou');
      return;
    }
    if (post.creator_id === user.id) {
      alert("This is your own post!");
      return;
    }
    if (post.preferred_gender !== 'Any' && post.preferred_gender !== profile?.gender) {
      alert(`This request is specifically looking for a ${post.preferred_gender}.`);
      return;
    }
    setConnecting(true);
    try {
      const { data: existingChats, error: searchError } = await supabase
        .from('sendiyou_chats').select('id')
        .eq('post_id', post.id)
        .contains('participant_ids', [user.id, post.creator_id]);
      if (searchError) throw searchError;
      if (existingChats && existingChats.length > 0) {
        navigate(`/chat/${existingChats[0].id}`);
        return;
      }
      const { data: newChat, error: createError } = await supabase
        .from('sendiyou_chats')
        .insert([{ post_id: post.id, participant_ids: [user.id, post.creator_id] }])
        .select().single();
      if (createError) throw createError;
      navigate(`/chat/${newChat.id}`);
    } catch (err) {
      console.error("Error starting chat:", err);
      alert("Failed to start chat.");
    } finally {
      setConnecting(false);
    }
  };

  const handleDeletePost = async () => {
    if (!window.confirm("Are you sure you want to permanently delete this post?")) return;
    setDeleting(true);
    try {
      const { error } = await supabase.from('sendiyou_posts').delete().eq('id', post.id);
      if (error) throw error;
      navigate('/sendiyou');
    } catch (err) {
      console.error('Error deleting post:', err);
      alert("Failed to delete post.");
      setDeleting(false);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    alert('Link copied to clipboard!');
  };

  const getTimeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="w-12 h-12 animate-spin rounded-full border-t-4 border-violet-primary border-r-4 border-r-transparent"></div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="container mx-auto px-4 py-20 text-center max-w-lg">
        <h2 className="text-2xl font-bold text-text-primary mb-2">Post Not Found</h2>
        <p className="text-text-secondary mb-6">This post may have been deleted or doesn't exist.</p>
        <button onClick={() => navigate('/sendiyou')} className="px-6 py-3 rounded-xl font-bold text-white text-sm" style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)' }}>
          Back to Feed
        </button>
      </div>
    );
  }

  // Pick the user's selected animation
  const animData = ANIMATIONS.find(a => a.id === post.selected_animation)?.data || ANIMATIONS[6].data;

  const isOwner = user && post.creator_id === user.id;
  
  // Use display_name if set, otherwise fallback
  const displayName = post.is_anonymous 
    ? (post.display_name || 'Anonymous') 
    : (post.display_name || post.users?.name || 'Unknown');
    
  const displayBranch = post.users?.branch || 'Campus';
  const displayGender = post.users?.gender || '';

  return (
    <div className="container mx-auto px-4 pt-24 pb-8 max-w-4xl">
      {/* Back Button */}
      <button onClick={() => navigate('/sendiyou')}
        className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors mb-6 text-sm font-medium">
        <ArrowLeft size={18} /> Back to Feed
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* ─── LEFT: Main Content (3 cols) ─── */}
        <div className="lg:col-span-3 space-y-6">
          {/* Hero Card with Animation */}
          <div className="rounded-3xl overflow-hidden" style={{ background: '#0F172A', border: '1px solid rgba(51,65,85,0.4)' }}>
            <div className="relative h-56 flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, rgba(236,72,153,0.1), rgba(168,85,247,0.1))' }}>
              <span className="absolute top-4 left-4 px-3 py-1 text-[11px] font-bold uppercase tracking-wider rounded-full text-pink-400"
                style={{ background: 'rgba(236,72,153,0.15)', border: '1px solid rgba(236,72,153,0.25)' }}>
                SendiYou
              </span>
              <span className="absolute top-4 right-4 text-xs text-text-muted flex items-center gap-1">
                <Clock size={13} /> {getTimeAgo(post.created_at)}
              </span>
              <div className="w-36 h-36">
                <Lottie animationData={animData} loop={true} />
              </div>
            </div>

            <div className="p-6">
              {/* Title */}
              <h1 className="text-2xl font-extrabold text-text-primary mb-4 leading-tight">{post.title}</h1>

              {/* Badges */}
              <div className="flex flex-wrap gap-2 mb-5">
                <span className="px-3 py-1 text-[11px] font-bold rounded-full bg-pink-500/10 text-pink-400 border border-pink-500/20 flex items-center gap-1">
                  <Star size={11} /> Preferred: {post.preferred_gender}
                </span>
                {post.is_anonymous && (
                  <span className="px-3 py-1 text-[11px] font-bold rounded-full bg-violet-primary/10 text-violet-primary border border-violet-primary/20 flex items-center gap-1">
                    <EyeOff size={11} /> Incognito
                  </span>
                )}
                <span className="px-3 py-1 text-[11px] font-bold rounded-full bg-emerald-free/10 text-emerald-free border border-emerald-free/20 flex items-center gap-1">
                  {post.connection_type === 'Group' ? <Users size={11} /> : <User size={11} />}
                  {post.connection_type}
                </span>
              </div>

              {/* Description */}
              <div className="rounded-2xl p-5 mb-5" style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(51,65,85,0.3)' }}>
                <h3 className="text-xs font-bold uppercase tracking-widest text-text-muted mb-3">Description</h3>
                <p className="text-text-secondary text-sm leading-relaxed whitespace-pre-wrap">
                  {post.description || 'No description provided.'}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                {!isOwner ? (() => {
                  const canConnect = post.preferred_gender === 'Any' || post.preferred_gender === profile?.gender;
                  return (
                    <button onClick={handleConnect} disabled={connecting || !canConnect}
                      className={`flex-1 py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-2 transition-all ${canConnect ? 'hover:scale-[1.01] active:scale-[0.99]' : 'opacity-60 cursor-not-allowed'} disabled:opacity-50`}
                      style={{ background: canConnect ? 'linear-gradient(135deg, #ec4899, #a855f7)' : '#334155', boxShadow: canConnect ? '0 0 25px rgba(236,72,153,0.2)' : 'none' }}>
                      {connecting ? 'Connecting...' : !canConnect ? 'Locked (Gender Restricted)' : <><MessageCircle size={18} /> Connect & Chat</>}
                    </button>
                  );
                })() : (
                  <>
                    <div className="flex-1 py-4 rounded-2xl font-bold text-text-muted flex items-center justify-center gap-2 border border-slate-border/30 bg-slate-deeper/50">
                      <Eye size={18} /> This is your post
                    </div>
                    <button onClick={handleDeletePost} disabled={deleting} title="Delete Post"
                      className="px-5 py-4 rounded-2xl font-bold text-red-400 border border-red-500/30 hover:bg-red-500/10 transition-colors flex items-center gap-2 disabled:opacity-50">
                      <Trash2 size={18} />
                    </button>
                  </>
                )}
                <button onClick={handleShare}
                  className="px-5 py-4 rounded-2xl font-bold text-text-secondary border border-slate-border/30 hover:bg-white/5 transition-colors flex items-center gap-2">
                  <Share2 size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ─── RIGHT: Sidebar (2 cols) ─── */}
        <div className="lg:col-span-2 space-y-6">
          {/* Posted By Card */}
          <div className="rounded-2xl p-5" style={{ background: '#0F172A', border: '1px solid rgba(51,65,85,0.4)' }}>
            <h3 className="text-xs font-bold uppercase tracking-widest text-text-muted mb-4">Posted By</h3>
            <div className="flex items-center gap-3 mb-4">
              <button 
                onClick={() => {
                  if (!post.is_anonymous && post.users) setSelectedUserProfile(post.users);
                }}
                disabled={post.is_anonymous}
                className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold shrink-0 overflow-hidden ${!post.is_anonymous ? 'cursor-pointer hover:opacity-80' : ''}`}
                style={{ background: 'linear-gradient(135deg, #ec4899, #8b5cf6)', color: 'white' }}>
                {post.is_anonymous ? '?' : post.users?.custom_avatar_url ? (
                  <img src={post.users.custom_avatar_url} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  displayName.charAt(0).toUpperCase()
                )}
              </button>
              <div>
                <p className="font-bold text-text-primary">{displayName}</p>
                <p className="text-xs text-text-muted">{post.is_anonymous ? displayGender : displayBranch}</p>
              </div>
            </div>
            {post.is_anonymous && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs text-violet-primary bg-violet-primary/5 border border-violet-primary/15">
                <Shield size={14} />
                <span>Identity hidden until they choose to reveal</span>
              </div>
            )}
            {!post.is_anonymous && (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between py-2 border-b border-slate-border/20">
                  <span className="text-text-muted">Branch</span>
                  <span className="text-text-primary font-medium">{displayBranch}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-text-muted">Gender</span>
                  <span className="text-text-primary font-medium">{displayGender}</span>
                </div>
              </div>
            )}
          </div>

          {/* Connection Details Card */}
          <div className="rounded-2xl p-5" style={{ background: '#0F172A', border: '1px solid rgba(51,65,85,0.4)' }}>
            <h3 className="text-xs font-bold uppercase tracking-widest text-text-muted mb-4">Connection Details</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-slate-border/20">
                <span className="text-sm text-text-muted">Type</span>
                <span className="text-sm text-text-primary font-semibold flex items-center gap-1.5">
                  {post.connection_type === 'Group' ? <Users size={14} /> : <User size={14} />}
                  {post.connection_type}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-border/20">
                <span className="text-sm text-text-muted">Looking for</span>
                <span className="text-sm text-text-primary font-semibold">{post.preferred_gender}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-border/20">
                <span className="text-sm text-text-muted">Visibility</span>
                <span className={`text-sm font-semibold flex items-center gap-1.5 ${post.is_anonymous ? 'text-violet-primary' : 'text-emerald-free'}`}>
                  {post.is_anonymous ? <><EyeOff size={14} /> Anonymous</> : <><Eye size={14} /> Public</>}
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-text-muted">Posted</span>
                <span className="text-sm text-text-primary font-semibold">{new Date(post.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              </div>
            </div>
          </div>

          {/* Safety Notice */}
          <div className="rounded-2xl p-4 flex items-start gap-3 text-xs text-text-muted leading-relaxed"
            style={{ background: 'rgba(16,185,129,0.04)', border: '1px solid rgba(16,185,129,0.12)' }}>
            <Shield size={16} className="text-emerald-free shrink-0 mt-0.5" />
            <span>All chats are anonymous by default. Identities are only revealed when a user explicitly clicks "Reveal Identity" inside the chat.</span>
          </div>
          {/* ═══ USER PROFILE MODAL ═══ */}
          {selectedUserProfile && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[rgba(15,23,42,0.8)] backdrop-blur-sm" onClick={() => setSelectedUserProfile(null)}>
              <div className="w-full max-w-sm bg-slate-card rounded-2xl shadow-2xl overflow-hidden relative border border-slate-border/50" onClick={e => e.stopPropagation()}>
                <button onClick={() => setSelectedUserProfile(null)} className="absolute top-4 right-4 z-10 text-text-muted hover:text-text-primary transition-colors p-1 bg-white/10 rounded-full backdrop-blur-md">
                  <X size={20} />
                </button>
                {/* Banner */}
                <div className="h-28 w-full" style={{ background: `url(${DEFAULT_BANNER}) center/cover no-repeat` }}></div>
                <div className="px-6 pb-6 pt-0 text-center relative -top-10">
                  <div className="w-20 h-20 mx-auto rounded-full border-4 border-slate-card overflow-hidden bg-slate-deeper flex items-center justify-center text-2xl font-bold text-text-primary mb-2">
                    {selectedUserProfile.custom_avatar_url ? (
                      <img src={selectedUserProfile.custom_avatar_url} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      selectedUserProfile.name?.charAt(0).toUpperCase() || '?'
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-text-primary mb-0.5">{selectedUserProfile.name}</h3>
                  <p className="text-text-secondary text-xs mb-1">{selectedUserProfile.branch || 'Campus Student'}</p>
                  {selectedUserProfile.email && (
                    <p className="text-text-muted text-xs mb-2 flex items-center justify-center gap-1">
                      <span>✉️</span> {selectedUserProfile.email}
                    </p>
                  )}

                  {/* Bio */}
                  {selectedUserProfile.bio && (
                    <p className="text-text-muted text-sm mb-3 px-2 leading-relaxed italic">&ldquo;{selectedUserProfile.bio}&rdquo;</p>
                  )}

                  {/* Gender Badge */}
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-deeper/50 rounded-full text-xs font-medium text-text-primary border border-slate-border/30 mb-4">
                    {selectedUserProfile.gender === 'Male' ? '👨' : selectedUserProfile.gender === 'Female' ? '👩' : '🌈'} {selectedUserProfile.gender}
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3 border-t border-slate-border/30 pt-4">
                    <div className="text-center">
                      <p className="text-xl font-extrabold text-text-primary">
                        {loadingModalStats ? '—' : modalStats?.posts ?? '—'}
                      </p>
                      <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">Posts</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-extrabold text-text-primary">
                        {loadingModalStats ? '—' : modalStats?.chats ?? '—'}
                      </p>
                      <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">Conversations</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PostDetailPage;
