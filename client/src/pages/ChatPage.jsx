import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import {
  ArrowLeft, Send, Eye, ShieldAlert, Users, Lock,
  Crown, Sparkles, X, ChevronRight, EyeOff, UserCheck,
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';
const DEFAULT_BANNER = 'https://res.cloudinary.com/dga14nmzn/image/upload/v1784358679/cosen_banner_wwpfb6.png';

// ── Avatar circle helper ─────────────────────────────────────────────────────
const AvatarCircle = ({ user: u, size = 10, textSize = 'text-sm' }) => {
  if (u?.custom_avatar_url) {
    return (
      <img
        src={u.custom_avatar_url}
        alt={u.name}
        className={`w-${size} h-${size} rounded-full object-cover shrink-0`}
      />
    );
  }
  const initial = u?.name?.charAt(0).toUpperCase() || '?';
  return (
    <div
      className={`w-${size} h-${size} rounded-full shrink-0 flex items-center justify-center font-bold ${textSize} text-white`}
      style={{ background: 'linear-gradient(135deg, #635bff, #10b981)' }}
    >
      {initial}
    </div>
  );
};

// ── Anonymous avatar placeholder ─────────────────────────────────────────────
const AnonCircle = ({ alias, size = 10, textSize = 'text-sm' }) => (
  <div
    className={`w-${size} h-${size} rounded-full shrink-0 flex items-center justify-center font-bold ${textSize} text-white`}
    style={{ background: 'linear-gradient(135deg, #6b7280, #374151)' }}
  >
    ?
  </div>
);

const ChatPage = () => {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const [chatInfo, setChatInfo]     = useState(null);
  const [messages, setMessages]     = useState([]);
  const [members, setMembers]       = useState([]); // [{ user_id, alias, is_revealed, users:{...} }]
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading]       = useState(true);
  const [revealing, setRevealing]   = useState(false);
  const [myAlias, setMyAlias]       = useState(null);

  // Panel / modal states
  const [showMembersPanel, setShowMembersPanel]       = useState(false);
  const [selectedMember, setSelectedMember]           = useState(null); // profile card

  const messagesEndRef = useRef(null);
  const inputRef       = useRef(null);

  const isGroup = chatInfo?.is_group === true;

  // ── helpers ─────────────────────────────────────────────────────────────────
  const getMember = useCallback(
    (senderId) => members.find(m => m.user_id === senderId),
    [members]
  );
  const getAliasFor    = useCallback((id) => getMember(id)?.alias || 'Anonymous', [getMember]);
  const isRevealedFor  = useCallback(
    (id) => getMember(id)?.is_revealed || chatInfo?.revealed_ids?.includes(id) || false,
    [getMember, chatInfo]
  );

  // ── fetch all data ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user || !profile) return;

    const fetchChatData = async () => {
      try {
        const { data: chatData, error: chatError } = await supabase
          .from('sendiyou_chats')
          .select(`
            *,
            sendiyou_posts (
              title, creator_id, is_anonymous, connection_type,
              users ( name, gender, branch, custom_avatar_url )
            )
          `)
          .eq('id', chatId)
          .single();

        if (chatError) throw chatError;
        if (!chatData.participant_ids.includes(user.id)) { navigate('/sendiyou'); return; }
        setChatInfo(chatData);

        // messages
        const { data: msgData } = await supabase
          .from('messages')
          .select('*, users(name, custom_avatar_url)')
          .eq('chat_id', chatId)
          .order('created_at', { ascending: true });
        setMessages(msgData || []);

        // group members (from backend – includes users join)
        if (chatData.is_group) {
          const res = await fetch(`${API_BASE}/api/sendiyou/group-members/${chatId}`);
          if (res.ok) {
            const data = await res.json();
            setMembers(data);
            const me = data.find(m => m.user_id === user.id);
            if (me) setMyAlias(me.alias);
          }
        }
      } catch (err) {
        console.error('Error fetching chat:', err);
        navigate('/sendiyou');
      } finally {
        setLoading(false);
      }
    };

    fetchChatData();
  }, [chatId, user, profile, navigate]);

  // ── real-time subscriptions ─────────────────────────────────────────────────
  useEffect(() => {
    if (!chatId) return;

    const channel = supabase
      .channel(`chat_${chatId}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `chat_id=eq.${chatId}` },
        async (payload) => {
          const { data: userData } = await supabase
            .from('users').select('name, custom_avatar_url').eq('id', payload.new.sender_id).single();
          setMessages(prev => [...prev, { ...payload.new, users: userData }]);
        }
      )
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'sendiyou_chats', filter: `id=eq.${chatId}` },
        (payload) => setChatInfo(prev => ({ ...prev, ...payload.new }))
      )
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'group_members', filter: `chat_id=eq.${chatId}` },
        async (payload) => {
          // Re-fetch this member's full data (including users join)
          const res = await fetch(`${API_BASE}/api/sendiyou/group-members/${chatId}`);
          if (res.ok) {
            const data = await res.json();
            setMembers(data);
          }
        }
      )
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'group_members', filter: `chat_id=eq.${chatId}` },
        async () => {
          const res = await fetch(`${API_BASE}/api/sendiyou/group-members/${chatId}`);
          if (res.ok) setMembers(await res.json());
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [chatId]);

  // ── auto-scroll ─────────────────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages]);

  // ── send message ────────────────────────────────────────────────────────────
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    const text = newMessage;
    setNewMessage('');
    inputRef.current?.focus();

    try {
      await supabase.from('messages').insert([{
        chat_id: chatId, sender_id: user.id, content: text, type: 'USER_MESSAGE',
      }]);

      const others = chatInfo.participant_ids.filter(id => id !== user.id);
      if (others.length > 0) {
        await supabase.from('notifications').insert(
          others.map(id => ({
            user_id: id, sender_id: user.id, type: 'NEW_MESSAGE',
            content: `New message in "${chatInfo.sendiyou_posts?.title}"`,
            link: `/chat/${chatId}`,
          }))
        );
      }
    } catch (err) {
      console.error('Send error:', err);
    }
  };

  // ── reveal identity ─────────────────────────────────────────────────────────
  const handleRevealIdentity = async () => {
    const confirmMsg = isGroup
      ? `Are you sure? Your real name will be permanently visible to ALL ${chatInfo.participant_ids.length} members.`
      : 'Are you sure? Your name will be permanently visible to the other person.';
    if (!window.confirm(confirmMsg)) return;

    setRevealing(true);
    try {
      const res = await fetch(`${API_BASE}/api/sendiyou/reveal-identity`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, user_id: user.id }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setChatInfo(prev => ({ ...prev, revealed_ids: [...(prev.revealed_ids || []), user.id] }));
      setMembers(prev => prev.map(m => m.user_id === user.id ? { ...m, is_revealed: true } : m));
    } catch (err) {
      alert('Failed to reveal identity.');
    } finally {
      setRevealing(false);
    }
  };

  // ── loading ─────────────────────────────────────────────────────────────────
  if (loading || !chatInfo) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="w-12 h-12 animate-spin rounded-full border-t-4 border-violet-primary border-r-4 border-r-transparent" />
      </div>
    );
  }

  const post = chatInfo.sendiyou_posts;
  const hasRevealed = isRevealedFor(user.id);
  const memberCount = chatInfo.participant_ids.length;

  // 1-on-1 other user
  const otherUserId = !isGroup ? chatInfo.participant_ids.find(id => id !== user.id) : null;
  const otherHasRevealed = otherUserId ? isRevealedFor(otherUserId) : false;
  let otherName = 'Anonymous Peer';
  if (!isGroup) {
    if (otherHasRevealed) otherName = 'Identity Revealed ✨';
    else if (otherUserId === post?.creator_id)
      otherName = post?.is_anonymous ? 'Anonymous User' : (post?.users?.name || 'Anonymous User');
  }

  // ── rendered member card inside panel ────────────────────────────────────────
  const MemberRow = ({ m }) => {
    const isMe = m.user_id === user.id;
    const isCreator = m.user_id === post?.creator_id;
    const revealed = m.is_revealed;
    // Only show real data if revealed OR it's "me" (I can always see myself)
    const showReal = revealed || isMe;

    return (
      <div
        className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
          revealed
            ? 'cursor-pointer hover:bg-emerald-free/5 active:bg-emerald-free/10'
            : 'cursor-default'
        }`}
        onClick={() => {
          if (revealed) setSelectedMember(m);
        }}
      >
        {/* Avatar */}
        {showReal && m.users?.custom_avatar_url ? (
          <img
            src={m.users.custom_avatar_url}
            alt={m.alias}
            className="w-11 h-11 rounded-full object-cover shrink-0 border-2 border-emerald-free/30"
          />
        ) : (
          <div
            className={`w-11 h-11 rounded-full shrink-0 flex items-center justify-center text-sm font-bold text-white border-2 ${
              isMe
                ? 'border-violet-primary/50'
                : revealed
                ? 'border-emerald-free/30'
                : 'border-slate-border/50'
            }`}
            style={{
              background: isMe
                ? 'linear-gradient(135deg, #635bff, #a855f7)'
                : revealed
                ? 'linear-gradient(135deg, #10b981, #059669)'
                : 'linear-gradient(135deg, #374151, #6b7280)',
            }}
          >
            {showReal ? (m.users?.name?.charAt(0).toUpperCase() || '?') : '?'}
          </div>
        )}

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-sm font-bold text-text-primary truncate">{m.alias}</span>
            {isMe && (
              <span className="text-[10px] bg-violet-primary/20 text-violet-primary px-1.5 py-0.5 rounded-full font-semibold">You</span>
            )}
            {isCreator && (
              <Crown size={11} className="text-amber-400 shrink-0" />
            )}
          </div>

          {/* Real name if revealed */}
          {revealed && m.users?.name && (
            <p className="text-xs text-emerald-free font-medium truncate">{m.users.name}</p>
          )}
          {!revealed && !isMe && (
            <p className="text-xs text-text-muted italic">Identity hidden</p>
          )}
          {isMe && !revealed && (
            <p className="text-xs text-text-muted">Your identity is hidden</p>
          )}
        </div>

        {/* Status badge */}
        <div className="shrink-0">
          {revealed ? (
            <div className="flex items-center gap-1 text-[10px] text-emerald-free bg-emerald-free/10 px-2 py-1 rounded-full font-semibold border border-emerald-free/20">
              <Eye size={10} /> Revealed
            </div>
          ) : (
            <div className="flex items-center gap-1 text-[10px] text-text-muted bg-slate-deeper px-2 py-1 rounded-full font-semibold border border-slate-border/30">
              <EyeOff size={10} /> Hidden
            </div>
          )}
        </div>

        {/* Arrow for revealed (clickable) */}
        {revealed && (
          <ChevronRight size={14} className="text-text-muted shrink-0" />
        )}
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 pt-24 pb-8 max-w-4xl h-[calc(100vh-64px)] flex flex-col">

      {/* ═══ HEADER ═══ */}
      <div className="glass-card p-4 flex justify-between items-center mb-0 rounded-t-2xl border-b border-slate-border/50 rounded-b-none">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/messages')}
            className="p-2 bg-slate-deeper rounded-xl hover:bg-white/5 transition-colors text-text-secondary"
          >
            <ArrowLeft size={20} />
          </button>

          {/* Clickable group icon + name to open members panel */}
          <button
            onClick={() => isGroup && setShowMembersPanel(true)}
            className={`flex items-center gap-3 ${isGroup ? 'cursor-pointer hover:opacity-80 transition-opacity' : 'cursor-default'}`}
            title={isGroup ? 'View group members' : ''}
          >
            {isGroup ? (
              <div className="w-10 h-10 rounded-xl bg-violet-primary/20 border border-violet-primary/40 flex items-center justify-center">
                <Users size={18} className="text-violet-primary" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-full bg-slate-deeper border border-slate-border/50 flex items-center justify-center text-lg font-bold text-text-primary">
                ?
              </div>
            )}

            <div className="text-left">
              <h2 className="font-bold text-text-primary text-base flex items-center gap-2">
                {isGroup ? (
                  <>
                    <span className="text-violet-primary">Group Chat</span>
                    <span className="px-2 py-0.5 text-[10px] bg-violet-primary/20 text-violet-primary rounded-full font-semibold">
                      {memberCount} members
                    </span>
                  </>
                ) : (
                  <>
                    {otherName}
                    {otherHasRevealed && (
                      <span className="px-2 py-0.5 text-[10px] bg-emerald-free/20 text-emerald-free rounded-full uppercase">
                        Revealed
                      </span>
                    )}
                  </>
                )}
              </h2>
              <p className="text-xs text-text-muted truncate max-w-[200px]">
                {isGroup ? 'Tap to view members' : `Re: ${post?.title}`}
              </p>
            </div>
          </button>
        </div>

        {/* Reveal / Revealed button */}
        <div className="shrink-0">
          {!hasRevealed ? (
            <button
              onClick={handleRevealIdentity}
              disabled={revealing}
              className="px-3 py-2 bg-violet-primary/10 text-violet-primary text-xs font-bold rounded-lg hover:bg-violet-primary/20 transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              <Eye size={14} />
              {revealing ? 'Revealing…' : 'Show My Identity'}
            </button>
          ) : (
            <div className="flex items-center gap-2 text-emerald-free text-xs font-bold bg-emerald-free/10 px-3 py-2 rounded-lg">
              <ShieldAlert size={14} /> Identity Revealed
            </div>
          )}
        </div>
      </div>

      {/* ═══ MEMBER STRIP (group only, compact) ═══ */}
      {isGroup && members.length > 0 && (
        <div
          className="glass-card border-y-0 rounded-none px-4 py-2 flex items-center gap-2 overflow-x-auto border-b border-slate-border/30 bg-slate-deeper/30 cursor-pointer"
          onClick={() => setShowMembersPanel(true)}
          title="View all members"
        >
          <span className="text-[10px] text-text-muted uppercase tracking-wider shrink-0 mr-1">Members:</span>
          {members.map(m => (
            <div key={m.user_id} className="relative shrink-0" title={m.alias}>
              {m.is_revealed && m.users?.custom_avatar_url ? (
                <img src={m.users.custom_avatar_url} className="w-6 h-6 rounded-full object-cover border-2 border-emerald-free/60" />
              ) : (
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white border-2 ${
                    m.user_id === user.id ? 'border-violet-primary/60' : m.is_revealed ? 'border-emerald-free/60' : 'border-slate-border/40'
                  }`}
                  style={{
                    background: m.user_id === user.id
                      ? 'linear-gradient(135deg,#635bff,#a855f7)'
                      : m.is_revealed
                      ? 'linear-gradient(135deg,#10b981,#059669)'
                      : 'linear-gradient(135deg,#374151,#6b7280)',
                  }}
                >
                  {m.is_revealed ? (m.users?.name?.charAt(0).toUpperCase() || '?') : '?'}
                </div>
              )}
              {m.is_revealed && (
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-free rounded-full border border-slate-deeper" />
              )}
            </div>
          ))}
          <ChevronRight size={12} className="text-text-muted ml-auto shrink-0" />
        </div>
      )}

      {/* ═══ MESSAGES ═══ */}
      <div className="flex-1 glass-card p-4 overflow-y-auto mb-0 border-y-0 rounded-none bg-slate-darker/50 space-y-4 border-b border-slate-border/30">
        <div className="text-center my-2">
          <span className="bg-slate-deeper px-4 py-1.5 rounded-full text-xs text-text-muted font-medium border border-slate-border/50">
            {isGroup ? '👥 ' : '💬 '}Chat for: &ldquo;{post?.title}&rdquo;
          </span>
        </div>

        {messages.map((msg, idx) => {
          // System message
          if (msg.type === 'SYSTEM') {
            return (
              <div key={msg.id || idx} className="flex justify-center my-2">
                <div className="inline-flex items-center gap-2 bg-emerald-free/10 border border-emerald-free/20 text-emerald-free text-xs font-medium px-4 py-2 rounded-full">
                  <Sparkles size={12} /> {msg.content}
                </div>
              </div>
            );
          }

          const isMe = msg.sender_id === user.id;
          const senderMember = getMember(msg.sender_id);
          const senderRevealed = isRevealedFor(msg.sender_id);
          const isCreator = msg.sender_id === post?.creator_id;

          let displayName;
          let displaySub = '';

          if (isGroup) {
            const alias = getAliasFor(msg.sender_id);
            if (isMe) displayName = `${myAlias || alias} (You)`;
            else if (senderRevealed) displayName = `${alias} → ${senderMember?.users?.name || 'Unknown'}`;
            else displayName = alias;
          } else {
            if (isMe) displayName = 'You';
            else if (senderRevealed) { displayName = msg.users?.name || 'Unknown'; displaySub = msg.users?.branch || ''; }
            else if (isCreator && !post?.is_anonymous) { displayName = msg.users?.name; displaySub = msg.users?.branch || ''; }
            else if (isCreator && post?.is_anonymous) displayName = 'Anonymous Creator';
            else displayName = 'Anonymous';
          }

          return (
            <div key={msg.id || idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
              <div className="flex items-center gap-1.5 mb-1">
                {isGroup && isCreator && !isMe && <Crown size={10} className="text-amber-400" />}
                <span className="text-xs text-text-muted font-medium">
                  {displayName}{displaySub && ` · ${displaySub}`}
                </span>
                {senderRevealed && !isMe && <Eye size={11} className="text-emerald-free" />}
              </div>
              <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm whitespace-pre-wrap break-words ${
                isMe
                  ? 'bg-violet-primary text-white rounded-tr-sm'
                  : 'bg-slate-card text-text-primary rounded-tl-sm border border-slate-border/50'
              }`}>
                {msg.content}
              </div>
              <span className="text-[10px] text-text-muted mt-1">
                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          );
        })}

        <div ref={messagesEndRef} />
      </div>

      {/* ═══ INPUT ═══ */}
      <form
        onSubmit={handleSendMessage}
        className="glass-card p-3 rounded-t-none border-t border-slate-border/50 flex gap-3 rounded-b-2xl"
      >
        <input
          ref={inputRef}
          type="text"
          value={newMessage}
          onChange={e => setNewMessage(e.target.value)}
          placeholder={isGroup ? `Message as ${myAlias || 'Anonymous'}…` : 'Type an anonymous message…'}
          className="flex-1 bg-slate-deeper border border-slate-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-violet-primary transition-colors text-sm"
        />
        <button
          type="submit"
          disabled={!newMessage.trim()}
          className="p-3 bg-violet-primary text-white rounded-xl hover:bg-violet-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center"
        >
          <Send size={20} />
        </button>
      </form>

      {isGroup && (
        <div className="mt-2 flex items-center justify-center gap-1.5 text-[10px] text-text-muted">
          <Lock size={10} />
          You are chatting as <strong className="text-violet-primary">{myAlias || '…'}</strong>.
          Click &ldquo;Show My Identity&rdquo; to reveal yourself.
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════ */}
      {/* MEMBERS PANEL MODAL                                     */}
      {/* ═══════════════════════════════════════════════════════ */}
      {showMembersPanel && (
        <div
          className="fixed inset-0 z-[55] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setShowMembersPanel(false)}
        >
          <div
            className="w-full max-w-sm bg-slate-card rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-border/50 overflow-hidden"
            onClick={e => e.stopPropagation()}
            style={{ maxHeight: '85vh' }}
          >
            {/* Panel header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-border/30">
              <div>
                <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
                  <Users size={16} className="text-violet-primary" />
                  Group Members
                </h3>
                <p className="text-xs text-text-muted mt-0.5">
                  {members.length} member{members.length !== 1 ? 's' : ''} ·{' '}
                  <span className="text-emerald-free">
                    {members.filter(m => m.is_revealed).length} revealed
                  </span>
                </p>
              </div>
              <button
                onClick={() => setShowMembersPanel(false)}
                className="p-2 rounded-xl text-text-muted hover:text-text-primary hover:bg-slate-deeper transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Member list */}
            <div className="overflow-y-auto px-3 py-3 space-y-1" style={{ maxHeight: 'calc(85vh - 80px)' }}>
              {/* Legend */}
              <div className="flex items-center gap-3 px-2 pb-2 text-[10px] text-text-muted">
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-emerald-free" /> Revealed identity
                </span>
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-slate-border" /> Hidden
                </span>
              </div>

              {members.map(m => (
                <MemberRow key={m.user_id} m={m} />
              ))}

              {members.length === 0 && (
                <div className="text-center py-8 text-text-muted text-sm">
                  No members yet
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════ */}
      {/* PROFILE CARD MODAL (revealed members only)             */}
      {/* ═══════════════════════════════════════════════════════ */}
      {selectedMember && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setSelectedMember(null)}
        >
          <div
            className="w-full max-w-sm bg-slate-card rounded-2xl shadow-2xl overflow-hidden relative border border-slate-border/50"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedMember(null)}
              className="absolute top-3 right-3 z-10 p-1.5 bg-black/30 rounded-full text-white hover:bg-black/50 transition-colors"
            >
              <X size={16} />
            </button>

            {/* Banner */}
            <div
              className="h-28 w-full"
              style={{ background: `url(${DEFAULT_BANNER}) center/cover no-repeat` }}
            />

            {/* Content */}
            <div className="px-6 pb-6 pt-0 text-center relative -top-10">
              {/* Avatar */}
              <div className="w-20 h-20 mx-auto rounded-full border-4 border-slate-card overflow-hidden bg-slate-deeper flex items-center justify-center text-2xl font-bold text-text-primary mb-2">
                {selectedMember.users?.custom_avatar_url ? (
                  <img src={selectedMember.users.custom_avatar_url} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  selectedMember.users?.name?.charAt(0).toUpperCase() || '?'
                )}
              </div>

              {/* Alias badge */}
              <div className="inline-flex items-center gap-1.5 bg-violet-primary/10 text-violet-primary border border-violet-primary/30 text-xs font-bold px-3 py-1 rounded-full mb-2">
                🎭 {selectedMember.alias}
              </div>

              {/* Real name */}
              <h3 className="text-lg font-bold text-text-primary mb-0.5">
                {selectedMember.users?.name}
              </h3>
              <p className="text-text-secondary text-xs mb-1">
                {selectedMember.users?.branch || 'Campus Student'}
              </p>

              {/* Email */}
              {selectedMember.users?.email && (
                <p className="text-text-muted text-xs mb-2 flex items-center justify-center gap-1">
                  ✉️ {selectedMember.users.email}
                </p>
              )}

              {/* Bio */}
              {selectedMember.users?.bio && (
                <p className="text-text-muted text-sm mb-3 px-3 leading-relaxed italic">
                  &ldquo;{selectedMember.users.bio}&rdquo;
                </p>
              )}

              {/* Gender + Revealed badge */}
              <div className="flex items-center justify-center gap-2 flex-wrap mb-4">
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-deeper/50 rounded-full text-xs font-medium text-text-primary border border-slate-border/30">
                  {selectedMember.users?.gender === 'Male' ? '👨' : selectedMember.users?.gender === 'Female' ? '👩' : '🌈'} {selectedMember.users?.gender}
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-free/10 rounded-full text-xs font-semibold text-emerald-free border border-emerald-free/20">
                  <UserCheck size={11} /> Identity Revealed
                </div>
              </div>

              {/* Creator flag */}
              {selectedMember.user_id === post?.creator_id && (
                <div className="flex items-center justify-center gap-1.5 text-amber-400 text-xs font-semibold">
                  <Crown size={12} /> Group Creator
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatPage;
