import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import { Heart, ChevronRight, Plus, X, Clock, MessageCircle, Eye, EyeOff, Star, ArrowRight, Sparkles, Search, LogOut, UserCircle } from 'lucide-react';
import LottieLib from 'lottie-react';

const DEFAULT_BANNER = 'https://res.cloudinary.com/dga14nmzn/image/upload/v1784358679/cosen_banner_wwpfb6.png';
const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

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
  { id: 'anim1', data: anim1, label: 'Handshake' },
  { id: 'anim2', data: anim2, label: 'Working' },
  { id: 'anim3', data: anim3, label: 'Love Pets' },
  { id: 'anim4', data: anim4, label: 'Cute Bear' },
  { id: 'anim5', data: anim5, label: 'Cute Cat' },
  { id: 'anim6', data: anim6, label: 'Team' },
  { id: 'anim7', data: anim7, label: 'Heart' },
  { id: 'anim8', data: anim8, label: 'Friends' },
  { id: 'anim9', data: anim9, label: 'Chill' },
];

const CONNECTION_TYPES = [
  { value: 'Individual', label: 'Individual (1-on-1)', desc: 'Connect privately with a single person for a one-on-one match.', icon: '👤' },
  { value: 'Group', label: 'Group Connection', desc: 'Allow multiple students to join a single shared room/chat.', icon: '👥' },
];

const SendiYouPage = () => {
  const navigate = useNavigate();
  const { user, profile, loading, signInWithGoogle, signOut, setProfile } = useAuth();

  // Feed states
  const [posts, setPosts] = useState([]);
  const [fetchingPosts, setFetchingPosts] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [selectedUserProfile, setSelectedUserProfile] = useState(null);
  const [modalStats, setModalStats] = useState(null);
  const [loadingModalStats, setLoadingModalStats] = useState(false);

  // Create post modal states
  const [showModal, setShowModal] = useState(false);
  const [step, setStep] = useState(1); // multi-step form
  const [newPost, setNewPost] = useState({
    display_name: '',
    title: '',
    description: '',
    connection_type: 'Individual',
    preferred_gender: 'Any',
    is_anonymous: true,
    selected_animation: 'anim7',
    tags: [],
  });
  const [tagInput, setTagInput] = useState('');
  const [creating, setCreating] = useState(false);

  // Onboarding states
  const [formData, setFormData] = useState({
    name: '',
    branch: '',
    enrollment_number: '',
    gender: 'Male'
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // ALL HOOKS BEFORE EARLY RETURNS
  useEffect(() => {
    if (profile) {
      fetchPosts();
    }
  }, [profile]);

  useEffect(() => {
    if (user) {
      const email = user.email || '';
      let autoEnrollment = '';
      if (email.includes('@')) {
        autoEnrollment = email.split('@')[0].toUpperCase();
      }
      setFormData(prev => ({ 
        ...prev, 
        name: user.user_metadata?.full_name || '',
        enrollment_number: autoEnrollment
      }));
    }
  }, [user]);

  // Auto-populate avatar + default banner for existing users if missing
  useEffect(() => {
    if (user && profile) {
      const updates = {};
      if (!profile.custom_avatar_url && user.user_metadata?.avatar_url)
        updates.custom_avatar_url = user.user_metadata.avatar_url;
      if (!profile.poster_url)
        updates.poster_url = DEFAULT_BANNER;
      if (Object.keys(updates).length > 0) {
        supabase.from('users').update(updates).eq('id', user.id);
        setProfile(prev => ({ ...prev, ...updates }));
      }
    }
  }, [user, profile, setProfile]);

  // Fetch stats when a user profile modal is opened
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

  const fetchPosts = async () => {
    setFetchingPosts(true);
    try {
      const { data, error } = await supabase
        .from('sendiyou_posts')
        .select(`*, users ( id, name, gender, branch, custom_avatar_url, bio, email )`)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setPosts(data || []);
    } catch (err) {
      console.error('Error fetching posts:', err);
    } finally {
      setFetchingPosts(false);
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const { error } = await supabase
        .from('sendiyou_posts')
        .insert([{
          creator_id: user.id,
          title: newPost.title || newPost.display_name,
          description: newPost.description,
          connection_type: newPost.connection_type,
          preferred_gender: newPost.preferred_gender,
          is_anonymous: newPost.is_anonymous,
          display_name: newPost.display_name,
          selected_animation: newPost.selected_animation,
          tags: newPost.tags
        }])
        .select();
      if (error) throw error;
      setShowModal(false);
      setStep(1);
      setNewPost({
        display_name: '', title: '', description: '', connection_type: 'Individual',
        preferred_gender: 'Any', is_anonymous: true, selected_animation: 'anim7', tags: [],
      });
      setTagInput('');
      fetchPosts();
    } catch (err) {
      console.error('Error creating post:', err);
      alert("Failed to create post. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  const handleStartChat = async (post) => {
    if (post.creator_id === user.id) {
      alert('This is your own post!');
      return;
    }
    if (post.preferred_gender !== 'Any' && post.preferred_gender !== profile?.gender) {
      alert(`This request is specifically looking for a ${post.preferred_gender}.`);
      return;
    }

    try {
      // ── GROUP posts: backend assigns alias atomically ──────
      if (post.connection_type === 'Group') {
        const res = await fetch(`${API_BASE}/api/sendiyou/join-group`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ post_id: post.id, user_id: user.id }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to join group.');
        navigate(`/chat/${data.chat_id}`);
        return;
      }

      // ── INDIVIDUAL posts: original 1-on-1 flow ─────────────
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
        .insert([{ post_id: post.id, participant_ids: [user.id, post.creator_id], is_group: false }])
        .select().single();
      if (createError) throw createError;
      navigate(`/chat/${newChat.id}`);
    } catch (err) {
      console.error('Error starting chat:', err);
      alert(err.message || 'Failed to start chat.');
    }
  };

  const handleOnboardingSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const { data, error: dbError } = await supabase
        .from('users')
        .insert([{ 
          id: user.id, 
          email: user.email, 
          name: formData.name, 
          branch: formData.branch, 
          enrollment_number: formData.enrollment_number, 
          gender: formData.gender,
          custom_avatar_url: user.user_metadata?.avatar_url || null,
          poster_url: DEFAULT_BANNER
        }])
        .select().single();
      if (dbError) throw dbError;
      setProfile(data);
    } catch (err) {
      console.error(err);
      setError(err.code === '23505' ? 'Enrollment number already registered.' : 'Failed to save profile. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && newPost.tags.length < 8 && !newPost.tags.includes(tag)) {
      setNewPost({ ...newPost, tags: [...newPost.tags, tag] });
      setTagInput('');
    }
  };

  const getAnimData = (id) => ANIMATIONS.find(a => a.id === id)?.data || anim7;

  const filteredPosts = posts.filter(p => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (p.title?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q) || p.connection_type?.toLowerCase().includes(q));
  });

  // ─── LOADING STATE ───
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 animate-spin rounded-full border-t-4 border-violet-primary border-r-4 border-r-transparent"></div>
      </div>
    );
  }

  // ─── 1. NOT AUTHENTICATED ───
  if (!user) {
    return (
      <div className="min-h-screen bg-[var(--color-cream)] flex items-center justify-center px-4 pt-24 pb-12">
        <div className="w-full max-w-md">
          <div className="relative overflow-hidden lovable-card p-10 text-center">
            {/* Animated heart */}
            <div className="w-24 h-24 mx-auto mb-6">
              <Lottie animationData={anim7} loop={true} />
            </div>
            
            <h1 className="text-4xl font-semibold mb-2 tracking-tight text-[var(--color-charcoal)]">
              SendiYou 💌
            </h1>
            <p className="text-[var(--color-muted-gray)] mb-8 text-sm leading-relaxed">
              Connect anonymously with your campus peers.<br/>Post requests, find study partners, or send that secret message.
            </p>
            
            <button
              onClick={signInWithGoogle}
              className="w-full lovable-button-ghost py-4 flex items-center justify-center gap-3 font-medium text-base"
            >
              <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="Google" />
              Continue with Google
            </button>
            
            <p className="text-[var(--color-muted-gray)] text-[11px] mt-4 opacity-70">Your identity stays anonymous until you choose to reveal it.</p>
          </div>
        </div>
      </div>
    );
  }

  // ─── 2. ONBOARDING ───
  if (!profile) {
    return (
      <div className="min-h-screen bg-[var(--color-cream)] flex items-center justify-center px-4 pt-24 pb-12">
        <div className="w-full max-w-lg">
          <div className="lovable-card">
            <div className="p-8">
              <div className="flex items-center gap-3 mb-2">
                <Heart className="text-pink-400" size={22} />
                <h2 className="text-2xl font-semibold tracking-tight text-[var(--color-charcoal)]">SendiYou Connection Details</h2>
              </div>
              <p className="text-[var(--color-muted-gray)] text-sm mb-8">Set up your anonymous campus connection request. Your real identity can optionally be hidden.</p>

              {error && (
                <div className="bg-red-50 text-red-600 border border-red-200 p-3 rounded-md text-sm mb-6">{error}</div>
              )}

              <form onSubmit={handleOnboardingSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-[var(--color-charcoal)] mb-2">Full Name <span className="text-pink-500">*</span></label>
                  <input type="text" required readOnly
                    className="w-full lovable-input cursor-not-allowed opacity-70"
                    value={formData.name}
                    placeholder="Auto-captured from Google Account" />
                  <p className="text-[var(--color-muted-gray)] text-xs mt-1.5">This name is securely verified via your Google Account.</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[var(--color-charcoal)] mb-2">Branch/Program <span className="text-pink-500">*</span></label>
                  <input type="text" required
                    className="w-full lovable-input"
                    value={formData.branch} onChange={(e) => setFormData({...formData, branch: e.target.value})}
                    placeholder="e.g., Computer Science" />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[var(--color-charcoal)] mb-2">Enrollment Number <span className="text-pink-500">*</span></label>
                  <input type="text" required readOnly
                    className="w-full lovable-input cursor-not-allowed opacity-70"
                    value={formData.enrollment_number}
                    placeholder="Auto-extracted from email" />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[var(--color-charcoal)] mb-3">Gender</label>
                  <div className="flex gap-3">
                    {['Male', 'Female', 'Other'].map(g => (
                      <button key={g} type="button"
                        onClick={() => setFormData({...formData, gender: g})}
                        className={`flex-1 py-3 rounded-md text-sm font-medium transition-all border ${
                          formData.gender === g
                            ? 'bg-[var(--color-charcoal)] text-[var(--color-off-white)] border-[var(--color-charcoal)] shadow-[rgba(255,255,255,0.2)_0px_0.5px_0px_0px_inset,rgba(0,0,0,0.2)_0px_0px_0px_0.5px_inset,rgba(0,0,0,0.05)_0px_1px_2px_0px]'
                            : 'bg-transparent border-[var(--color-border-passive)] text-[var(--color-charcoal)] hover:border-[rgba(28,28,28,0.4)]'
                        }`}>
                        {g === 'Male' ? '👨' : g === 'Female' ? '👩' : '🌈'} {g}
                      </button>
                    ))}
                  </div>
                </div>

                <button type="submit" disabled={submitting}
                  className="w-full mt-4 lovable-button-primary py-4 font-semibold text-base w-full">
                  {submitting ? 'Saving...' : 'Enter SendiYou 💌'}
                  {!submitting && <ChevronRight size={18} />}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── 3. MAIN FEED ───
  return (
    <div className="min-h-screen bg-[var(--color-cream)] text-[var(--color-charcoal)]">
      <div className="container mx-auto px-4 pt-24 pb-12 max-w-5xl relative">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-semibold flex items-center gap-2 text-[var(--color-charcoal)]">
              💌 SendiYou
            </h1>
            <p className="text-[var(--color-muted-gray)] text-sm mt-1">{filteredPosts.length} service{filteredPosts.length !== 1 ? 's' : ''} found</p>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            {/* Search */}
            <div className="relative flex-1 md:w-64">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted-gray)]" />
              <input type="text" placeholder="Search posts..." value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full lovable-input pl-9" />
            </div>
            <button onClick={() => { setShowModal(true); setStep(1); }}
              className="lovable-button-primary shrink-0">
              <Sparkles size={16} /> Post Service
            </button>
            {/* Profile with Dropdown */}
            <div className="relative">
              <button onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="w-10 h-10 rounded-full overflow-hidden border border-[var(--color-border-passive)] shrink-0 cursor-pointer hover:border-[rgba(28,28,28,0.4)] transition-all">
                {profile.custom_avatar_url || user.user_metadata?.avatar_url
                  ? <img src={profile.custom_avatar_url || user.user_metadata.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                  : <div className="w-full h-full bg-transparent flex items-center justify-center text-[var(--color-charcoal)] font-semibold text-sm">{profile.name.charAt(0).toUpperCase()}</div>
                }
              </button>
              {showProfileMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)} />
                  <div className="absolute right-0 top-12 z-50 w-64 lovable-card overflow-hidden shadow-[0_4px_12px_rgba(0,0,0,0.1)]">
                    <div className="p-4 flex items-center gap-3 border-b border-[var(--color-border-passive)] bg-transparent">
                      <div className="w-10 h-10 rounded-full overflow-hidden border border-[var(--color-border-passive)] shrink-0">
                        {profile.custom_avatar_url || user.user_metadata?.avatar_url
                          ? <img src={profile.custom_avatar_url || user.user_metadata.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                          : <div className="w-full h-full bg-transparent flex items-center justify-center text-[var(--color-charcoal)] font-semibold text-sm">{profile.name.charAt(0).toUpperCase()}</div>
                        }
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[var(--color-charcoal)] truncate">{profile.name}</p>
                        <p className="text-[11px] text-[var(--color-muted-gray)] truncate">{user.email}</p>
                      </div>
                    </div>
                    <div className="p-2 space-y-1">
                      <div className="px-3 py-2 text-xs text-[var(--color-muted-gray)] mb-2">
                        <span className="font-semibold text-[var(--color-charcoal)]">{profile.branch}</span> · {profile.gender}
                      </div>
                      <button onClick={() => { setShowProfileMenu(false); navigate('/profile'); }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-[var(--color-charcoal)] hover:bg-[rgba(28,28,28,0.04)] transition-colors">
                        <UserCircle size={16} /> View Profile
                      </button>
                      <button onClick={() => { setShowProfileMenu(false); signOut(); }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-red-600 hover:bg-red-50 transition-colors">
                        <LogOut size={16} /> Logout
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Feed */}
        {fetchingPosts ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-12 h-12 animate-spin rounded-full border-t-4 border-[var(--color-charcoal)] border-r-4 border-r-transparent"></div>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-32 h-32 mx-auto mb-6 opacity-60"><Lottie animationData={anim9} loop={true} /></div>
            <h2 className="text-2xl font-semibold text-[var(--color-charcoal)] mb-2">{searchQuery ? 'No results found' : 'Feed is Empty'}</h2>
            <p className="text-[var(--color-muted-gray)] mb-6">{searchQuery ? 'Try a different search term.' : 'Be the first to post a connection request!'}</p>
            {!searchQuery && (
              <button onClick={() => { setShowModal(true); setStep(1); }}
                className="lovable-button-primary">
                Create a Post
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPosts.map((post) => {
              const animId = ANIMATIONS.find(a => a.id === post.selected_animation) || ANIMATIONS[6]; // fallback to anim7
              const postDisplayName = post.is_anonymous ? (post.display_name || 'Anonymous') : (post.display_name || post.users?.name || 'Unknown');
              const canConnect = post.preferred_gender === 'Any' || post.preferred_gender === profile?.gender;
              
              return (
                <div key={post.id} 
                  onClick={() => navigate(`/sendiyou/post/${post.id}`)}
                  className="lovable-card cursor-pointer group hover:border-[rgba(28,28,28,0.4)] transition-all overflow-hidden relative">
                  {/* Card top - subtle wash */}
                  <div className="relative h-44 flex items-center justify-center overflow-hidden bg-[rgba(28,28,28,0.03)] border-b border-[var(--color-border-passive)]">
                    <span className="absolute top-3 left-3 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider rounded-md text-[var(--color-charcoal)] bg-white border border-[var(--color-border-passive)] shadow-sm">
                      SendiYou
                    </span>
                    <div className="w-28 h-28">
                      <Lottie animationData={animId.data} loop={true} />
                    </div>
                  </div>

                  {/* Card body */}
                  <div className="p-5">
                    {/* User info */}
                    <div className="flex items-center gap-2.5 mb-3">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!post.is_anonymous && post.users) setSelectedUserProfile(post.users);
                        }}
                        disabled={post.is_anonymous}
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 bg-white border border-[var(--color-border-passive)] text-[var(--color-charcoal)] overflow-hidden ${!post.is_anonymous ? 'cursor-pointer hover:border-[rgba(28,28,28,0.4)]' : ''}`}>
                        {post.is_anonymous ? (
                          !post.display_name ? '?' : postDisplayName.charAt(0).toUpperCase()
                        ) : post.users?.custom_avatar_url ? (
                          <img src={post.users.custom_avatar_url} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                          postDisplayName.charAt(0).toUpperCase()
                        )}
                      </button>
                      <div>
                        <p className="text-sm font-semibold text-[var(--color-charcoal)] leading-tight">
                          {postDisplayName}
                        </p>
                        <p className="text-[11px] text-[var(--color-muted-gray)]">{post.users?.branch || 'campus'}</p>
                      </div>
                    </div>

                    {/* Badges */}
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-[rgba(28,28,28,0.04)] text-[var(--color-muted-gray)] border border-[var(--color-border-passive)]">
                        ★ Preferred: {post.preferred_gender}
                      </span>
                      {post.is_anonymous && (
                        <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-[rgba(28,28,28,0.04)] text-[var(--color-muted-gray)] border border-[var(--color-border-passive)]">
                          🔒 Incognito
                        </span>
                      )}
                      <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-[rgba(28,28,28,0.04)] text-[var(--color-muted-gray)] border border-[var(--color-border-passive)]">
                        {post.connection_type}
                      </span>
                    </div>

                    {/* Title & Description */}
                    <h3 className="font-semibold text-[var(--color-charcoal)] mb-1.5 text-[15px] leading-snug line-clamp-1">{post.title}</h3>
                    <p className="text-[var(--color-muted-gray)] text-xs mb-4 line-clamp-2 leading-relaxed">{post.description}</p>

                    {/* Footer */}
                    <div className="flex items-center justify-end pt-3 border-t border-[var(--color-border-passive)]">
                      <button onClick={(e) => { e.stopPropagation(); if (canConnect) handleStartChat(post); }}
                        className={`text-sm font-medium flex items-center gap-1.5 transition-all ${canConnect ? 'text-[var(--color-charcoal)] hover:opacity-70' : 'text-[var(--color-muted-gray)] cursor-not-allowed opacity-50'}`}>
                        {canConnect ? 'Connect' : 'Locked'} <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ═══ CREATE POST MODAL ═══ */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[rgba(28,28,28,0.4)] backdrop-blur-sm">
          <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto lovable-card shadow-2xl">

            {/* Modal Header */}
            <div className="sticky top-0 z-10 flex justify-between items-center p-6 pb-4 rounded-t-xl bg-[var(--color-cream)] border-b border-[var(--color-border-passive)]">
              <h2 className="text-xl font-semibold flex items-center gap-2 text-[var(--color-charcoal)]">
                💌 SendiYou Connection Details
              </h2>
              <button onClick={() => setShowModal(false)} className="text-[var(--color-muted-gray)] hover:text-[var(--color-charcoal)] transition-colors p-1">
                <X size={22} />
              </button>
            </div>

            <div className="px-6 pb-6 pt-6">
              <p className="text-[var(--color-muted-gray)] text-sm mb-6">Set up your anonymous campus connection request. Your real identity can optionally be hidden.</p>

              {/* Step Indicator */}
              <div className="flex gap-2 mb-8">
                {[1, 2, 3].map(s => (
                  <div key={s} className="flex-1 h-1 rounded-full transition-all" style={{ background: s <= step ? 'var(--color-charcoal)' : 'var(--color-border-passive)' }} />
                ))}
              </div>

              {/* ─── STEP 1: Connection Details ─── */}
              {step === 1 && (
                <div className="space-y-6">
                  {/* Display Name */}
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-charcoal)] mb-2">Your Display Name <span className="text-red-500">*</span></label>
                    <input type="text" required maxLength={30}
                      className="w-full lovable-input"
                      value={newPost.display_name} onChange={(e) => setNewPost({...newPost, display_name: e.target.value})}
                      placeholder="e.g. Stargazer, Campus Foodie, Night Owl..." />
                    <p className="text-[var(--color-muted-gray)] text-xs mt-1.5">This is the name shown publicly (not your real name unless you want).</p>
                  </div>

                  {/* Gender Preference */}
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-charcoal)] mb-3">I want to connect with a...</label>
                    <div className="flex gap-3">
                      {[{ v: 'Male', icon: '👨' }, { v: 'Female', icon: '👩' }, { v: 'Any', icon: '🌈' }].map(g => (
                        <button key={g.v} type="button"
                          onClick={() => setNewPost({...newPost, preferred_gender: g.v})}
                          className={`flex-1 py-3 rounded-md text-sm font-medium transition-all border ${
                            newPost.preferred_gender === g.v
                              ? 'bg-[rgba(28,28,28,0.04)] border-[rgba(28,28,28,0.4)] text-[var(--color-charcoal)] shadow-[0_0_0_1px_rgba(28,28,28,0.1)]'
                              : 'bg-transparent border-[var(--color-border-passive)] text-[var(--color-muted-gray)] hover:border-[rgba(28,28,28,0.2)]'
                          }`}>
                          {g.icon} {g.v === 'Any' ? 'Any Gender' : g.v}
                        </button>
                      ))}
                    </div>
                    <p className="text-[var(--color-muted-gray)] text-xs mt-1.5">Only users of the selected gender can accept your connection request.</p>
                  </div>

                  {/* Connection Type */}
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-charcoal)] mb-3">Connection Type <span className="text-red-500">*</span></label>
                    <div className="grid grid-cols-2 gap-3">
                      {CONNECTION_TYPES.map(ct => (
                        <button key={ct.value} type="button"
                          onClick={() => setNewPost({...newPost, connection_type: ct.value})}
                          className={`p-4 rounded-xl text-left transition-all border ${
                            newPost.connection_type === ct.value
                              ? 'bg-[rgba(28,28,28,0.04)] border-[rgba(28,28,28,0.4)] shadow-[0_0_0_1px_rgba(28,28,28,0.1)]'
                              : 'bg-transparent border-[var(--color-border-passive)] hover:border-[rgba(28,28,28,0.2)]'
                          }`}>
                          <div className="text-2xl mb-2">{ct.icon}</div>
                          <p className={`text-sm font-semibold mb-1 ${newPost.connection_type === ct.value ? 'text-[var(--color-charcoal)]' : 'text-[var(--color-charcoal)]'}`}>{ct.label}</p>
                          <p className="text-[11px] text-[var(--color-muted-gray)] leading-relaxed">{ct.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Anonymous Toggle */}
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-charcoal)] mb-3">Hide my identity on the platform?</label>
                    <div className="flex gap-3">
                      <button type="button" onClick={() => setNewPost({...newPost, is_anonymous: true})}
                        className={`flex-1 py-3.5 rounded-md text-sm font-medium flex items-center justify-center gap-2 transition-all border ${
                          newPost.is_anonymous
                            ? 'bg-[rgba(28,28,28,0.04)] border-[rgba(28,28,28,0.4)] text-[var(--color-charcoal)] shadow-[0_0_0_1px_rgba(28,28,28,0.1)]'
                            : 'bg-transparent border-[var(--color-border-passive)] text-[var(--color-muted-gray)]'
                        }`}>
                        <EyeOff size={16} /> Yes, stay anonymous
                      </button>
                      <button type="button" onClick={() => setNewPost({...newPost, is_anonymous: false})}
                        className={`flex-1 py-3.5 rounded-md text-sm font-medium flex items-center justify-center gap-2 transition-all border ${
                          !newPost.is_anonymous
                            ? 'bg-[rgba(28,28,28,0.04)] border-[rgba(28,28,28,0.4)] text-[var(--color-charcoal)] shadow-[0_0_0_1px_rgba(28,28,28,0.1)]'
                            : 'bg-transparent border-[var(--color-border-passive)] text-[var(--color-muted-gray)]'
                        }`}>
                        <Eye size={16} /> No, show my profile
                      </button>
                    </div>
                  </div>

                  <button onClick={() => { if (newPost.display_name.trim()) setStep(2); else alert('Please enter a display name.'); }}
                    className="w-full lovable-button-primary py-4 font-semibold text-base flex justify-center">
                    Next: Description <ChevronRight size={18} />
                  </button>
                </div>
              )}

              {/* ─── STEP 2: Description & Tags ─── */}
              {step === 2 && (
                <div className="space-y-6">
                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-charcoal)] mb-2">📌 Title <span className="text-red-500">*</span></label>
                    <input type="text" required maxLength={60}
                      className="w-full lovable-input"
                      value={newPost.title} onChange={(e) => setNewPost({...newPost, title: e.target.value})}
                      placeholder="e.g., Looking for a study partner" />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-charcoal)] mb-2">📝 Description <span className="text-red-500">*</span></label>
                    <textarea required maxLength={2000} rows={4}
                      className="w-full lovable-input resize-none py-3"
                      value={newPost.description} onChange={(e) => setNewPost({...newPost, description: e.target.value})}
                      placeholder="Describe your request in detail — what you're looking for, your interests, tools/methods you use..." />
                    <div className="flex justify-between mt-1.5 text-xs text-[var(--color-muted-gray)]">
                      <span>Min 30 characters — be thorough to attract connections.</span>
                      <span>{newPost.description.length}/2000</span>
                    </div>
                  </div>

                  {/* Tags */}
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-charcoal)] mb-2">⚡ Tags <span className="text-[var(--color-muted-gray)]">(optional, max 8)</span></label>
                    <div className="flex gap-2">
                      <input type="text" maxLength={20}
                        className="flex-1 lovable-input"
                        value={tagInput} onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(); } }}
                        placeholder="python, react, calculus... (press Enter or comma)" />
                      <button type="button" onClick={addTag}
                        className="w-12 h-12 rounded-md lovable-button-ghost flex items-center justify-center">
                        <Plus size={18} />
                      </button>
                    </div>
                    <p className="text-[var(--color-muted-gray)] text-xs mt-1.5">Tags help students find your service faster.</p>
                    {newPost.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {newPost.tags.map(tag => (
                          <span key={tag} className="px-3 py-1 rounded-md text-xs font-medium bg-[rgba(28,28,28,0.04)] border border-[var(--color-border-passive)] flex items-center gap-1.5">
                            #{tag}
                            <button onClick={() => setNewPost({...newPost, tags: newPost.tags.filter(t => t !== tag)})} className="hover:text-red-500 transition-colors">
                              <X size={12} />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Live Preview */}
                  <div className="rounded-xl overflow-hidden lovable-card">
                    <div className="px-4 py-2 text-[10px] font-semibold uppercase tracking-widest text-[var(--color-muted-gray)] bg-[rgba(28,28,28,0.03)] border-b border-[var(--color-border-passive)]">
                      LIVE PREVIEW
                    </div>
                    <div className="p-4 bg-[var(--color-cream)]">
                      <span className="px-2 py-0.5 text-[10px] font-semibold rounded-md text-[var(--color-charcoal)] border border-[var(--color-border-passive)] bg-white">SendiYou</span>
                      <h4 className="font-semibold text-[var(--color-charcoal)] mt-2 text-sm">{newPost.title || 'Your service title will appear here'}</h4>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold text-white bg-[var(--color-charcoal)]">
                          {(newPost.display_name || profile.name).charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-[var(--color-charcoal)]">{newPost.display_name || profile.name}</p>
                          <p className="text-[10px] text-[var(--color-muted-gray)]">{profile.branch}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button onClick={() => setStep(1)} className="flex-1 lovable-button-ghost py-4 font-semibold text-base">
                      Back
                    </button>
                    <button onClick={() => { if (newPost.title.trim() && newPost.description.trim()) setStep(3); else alert('Please fill in title and description.'); }}
                      className="flex-1 lovable-button-primary py-4 font-semibold text-base flex justify-center">
                      Next: Animation <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              )}

              {/* ─── STEP 3: Select Animation ─── */}
              {step === 3 && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-charcoal)] mb-2 flex items-center gap-2">
                      <Heart size={16} /> Select Animation <span className="text-red-500">*</span>
                    </label>
                    <p className="text-[var(--color-muted-gray)] text-sm mb-4">Choose an animation to represent your anonymous message.</p>
                    
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                      {ANIMATIONS.map(anim => (
                        <button key={anim.id} type="button"
                          onClick={() => setNewPost({...newPost, selected_animation: anim.id})}
                          className={`aspect-square rounded-xl flex items-center justify-center p-2 transition-all border ${
                            newPost.selected_animation === anim.id
                              ? 'border-[rgba(28,28,28,0.4)] bg-[rgba(28,28,28,0.04)] scale-105 shadow-[0_4px_12px_rgba(0,0,0,0.1)]'
                              : 'border-[var(--color-border-passive)] bg-transparent hover:border-[rgba(28,28,28,0.2)] hover:bg-[rgba(28,28,28,0.02)]'
                          }`}>
                          <Lottie animationData={anim.data} loop={true} style={{ width: '100%', height: '100%' }} />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Final Preview */}
                  <div className="rounded-xl overflow-hidden lovable-card">
                    <div className="px-4 py-2 text-[10px] font-semibold uppercase tracking-widest text-[var(--color-muted-gray)] bg-[rgba(28,28,28,0.03)] border-b border-[var(--color-border-passive)]">
                      FINAL PREVIEW
                    </div>
                    <div className="p-5 bg-[var(--color-cream)]">
                      <span className="px-2.5 py-0.5 text-[10px] font-semibold rounded-md text-[var(--color-charcoal)] bg-white border border-[var(--color-border-passive)]">SendiYou</span>
                      <div className="w-24 h-24 mx-auto my-4">
                        <Lottie animationData={getAnimData(newPost.selected_animation)} loop={true} />
                      </div>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white bg-[var(--color-charcoal)]">
                          {(newPost.display_name || profile.name).charAt(0).toUpperCase()}
                        </div>
                        <p className="text-sm font-semibold text-[var(--color-charcoal)]">{newPost.display_name || profile.name}</p>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-[rgba(28,28,28,0.04)] text-[var(--color-muted-gray)] border border-[var(--color-border-passive)]">★ Preferred: {newPost.preferred_gender}</span>
                        {newPost.is_anonymous && <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-[rgba(28,28,28,0.04)] text-[var(--color-muted-gray)] border border-[var(--color-border-passive)]">🔒 Incognito</span>}
                      </div>
                      <p className="text-[var(--color-muted-gray)] text-xs line-clamp-2">{newPost.description}</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button onClick={() => setStep(2)} className="lovable-button-ghost py-4 font-semibold text-base px-6">
                      Back
                    </button>
                    <button onClick={handleCreatePost} disabled={creating}
                      className="flex-1 lovable-button-primary py-4 font-semibold text-base flex justify-center disabled:opacity-50">
                      {creating ? 'Posting...' : <><Sparkles size={16} /> Post Service</>}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* ═══ USER PROFILE MODAL ═══ */}
      {selectedUserProfile && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[rgba(28,28,28,0.4)] backdrop-blur-sm" onClick={() => setSelectedUserProfile(null)}>
          <div className="w-full max-w-sm bg-[var(--color-cream)] rounded-2xl shadow-2xl overflow-hidden relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedUserProfile(null)} className="absolute top-4 right-4 z-10 text-[var(--color-muted-gray)] hover:text-[var(--color-charcoal)] transition-colors p-1 bg-white/50 rounded-full backdrop-blur-md">
              <X size={20} />
            </button>
            {/* Banner */}
            <div className="h-28 w-full" style={{ background: `url(${DEFAULT_BANNER}) center/cover no-repeat` }}></div>

            {/* Avatar + Info */}
            <div className="px-6 pb-6 pt-0 text-center relative -top-10">
              <div className="w-20 h-20 mx-auto rounded-full border-4 border-[var(--color-cream)] overflow-hidden bg-white flex items-center justify-center text-2xl font-bold text-[var(--color-charcoal)] mb-2">
                {selectedUserProfile.custom_avatar_url ? (
                  <img src={selectedUserProfile.custom_avatar_url} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  selectedUserProfile.name?.charAt(0).toUpperCase() || '?'
                )}
              </div>
              <h3 className="text-lg font-bold text-[var(--color-charcoal)] mb-0.5">{selectedUserProfile.name}</h3>
              <p className="text-[var(--color-muted-gray)] text-xs mb-1">{selectedUserProfile.branch || 'Campus Student'}</p>
              {selectedUserProfile.email && (
                <p className="text-[var(--color-muted-gray)] text-xs mb-2 flex items-center justify-center gap-1">
                  <span>✉️</span> {selectedUserProfile.email}
                </p>
              )}

              {/* Bio */}
              {selectedUserProfile.bio && (
                <p className="text-[var(--color-charcoal)] text-sm mb-3 px-2 leading-relaxed italic opacity-80">&ldquo;{selectedUserProfile.bio}&rdquo;</p>
              )}

              {/* Gender Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[rgba(28,28,28,0.04)] rounded-full text-xs font-medium text-[var(--color-charcoal)] border border-[var(--color-border-passive)] mb-4">
                {selectedUserProfile.gender === 'Male' ? '👨' : selectedUserProfile.gender === 'Female' ? '👩' : '🌈'} {selectedUserProfile.gender}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3 border-t border-[var(--color-border-passive)] pt-4">
                <div className="text-center">
                  <p className="text-xl font-extrabold text-[var(--color-charcoal)]">
                    {loadingModalStats ? '—' : modalStats?.posts ?? '—'}
                  </p>
                  <p className="text-[10px] font-semibold text-[var(--color-muted-gray)] uppercase tracking-wider">Posts</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-extrabold text-[var(--color-charcoal)]">
                    {loadingModalStats ? '—' : modalStats?.chats ?? '—'}
                  </p>
                  <p className="text-[10px] font-semibold text-[var(--color-muted-gray)] uppercase tracking-wider">Conversations</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SendiYouPage;
