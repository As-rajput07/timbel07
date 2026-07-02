import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import { ArrowLeft, Send, Eye, ShieldAlert } from 'lucide-react';

const ChatPage = () => {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  
  const [chatInfo, setChatInfo] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  
  const messagesEndRef = useRef(null);

  // Fetch Chat Info & Initial Messages
  useEffect(() => {
    if (!user || !profile) return;
    
    const fetchChatData = async () => {
      try {
        // Fetch chat info (post details and participants)
        const { data: chatData, error: chatError } = await supabase
          .from('sendiyou_chats')
          .select(`
            *,
            sendiyou_posts (
              title,
              creator_id,
              is_anonymous,
              users ( name, gender, branch )
            )
          `)
          .eq('id', chatId)
          .single();
          
        if (chatError) throw chatError;
        
        // Verify user is part of this chat
        if (!chatData.participant_ids.includes(user.id)) {
          navigate('/sendiyou');
          return;
        }
        
        setChatInfo(chatData);

        // Fetch initial messages
        const { data: msgData, error: msgError } = await supabase
          .from('messages')
          .select('*, users(name, gender, branch)')
          .eq('chat_id', chatId)
          .order('created_at', { ascending: true });
          
        if (msgError) throw msgError;
        setMessages(msgData || []);
        
      } catch (err) {
        console.error('Error fetching chat:', err);
        navigate('/sendiyou');
      } finally {
        setLoading(false);
      }
    };

    fetchChatData();
  }, [chatId, user, profile, navigate]);

  // Set up Real-time Subscription for new messages
  useEffect(() => {
    if (!chatId) return;

    const channel = supabase
      .channel(`chat_${chatId}`)
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `chat_id=eq.${chatId}` },
        async (payload) => {
          // Fetch user details for the new message
          const { data: userData } = await supabase
            .from('users')
            .select('name, gender, branch')
            .eq('id', payload.new.sender_id)
            .single();
            
          const completeMessage = { ...payload.new, users: userData };
          setMessages(prev => [...prev, completeMessage]);
        }
      )
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'sendiyou_chats', filter: `id=eq.${chatId}` },
        (payload) => {
          setChatInfo(prev => ({ ...prev, revealed_ids: payload.new.revealed_ids }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatId]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    
    const text = newMessage;
    setNewMessage('');
    
    try {
      const { error } = await supabase
        .from('messages')
        .insert([{
          chat_id: chatId,
          sender_id: user.id,
          content: text
        }]);
        
      if (error) throw error;

      // Insert notifications for other participants
      const otherParticipantIds = chatInfo.participant_ids.filter(id => id !== user.id);
      if (otherParticipantIds.length > 0) {
        const notificationsData = otherParticipantIds.map(id => ({
          user_id: id,
          sender_id: user.id,
          type: 'NEW_MESSAGE',
          content: `New message in "${chatInfo.sendiyou_posts.title}"`,
          link: `/chat/${chatId}`
        }));
        await supabase.from('notifications').insert(notificationsData);
      }
    } catch (err) {
      console.error('Error sending message:', err);
      alert('Failed to send message.');
    }
  };

  const handleRevealIdentity = async () => {
    if (!window.confirm("Are you sure you want to reveal your identity? Your Name and Branch will be permanently visible to the other person in this chat.")) return;
    
    try {
      const newRevealedIds = [...(chatInfo.revealed_ids || []), user.id];
      const { error } = await supabase
        .from('sendiyou_chats')
        .update({ revealed_ids: newRevealedIds })
        .eq('id', chatId);
        
      if (error) throw error;
      
      // Update local state immediately for better UX
      setChatInfo(prev => ({ ...prev, revealed_ids: newRevealedIds }));
    } catch (err) {
      console.error('Error revealing identity:', err);
    }
  };

  if (loading || !chatInfo) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="w-12 h-12 animate-spin rounded-full border-t-4 border-violet-primary border-r-4 border-r-transparent"></div>
      </div>
    );
  }

  // Determine if the current user has revealed identity
  const hasRevealed = chatInfo.revealed_ids?.includes(user.id);
  
  // Determine the other participant's details
  const otherUserId = chatInfo.participant_ids.find(id => id !== user.id);
  const otherHasRevealed = chatInfo.revealed_ids?.includes(otherUserId);
  
  const post = chatInfo.sendiyou_posts;
  // If the other user is the creator, check if post is anonymous and if they revealed
  // If the other user is NOT the creator, they are just an anonymous peer unless revealed
  let otherName = "Anonymous Peer";
  let otherSub = "Gender Unknown";
  
  if (otherHasRevealed) {
    // We would need to fetch the other user's actual data if they revealed, 
    // but for simplicity we rely on messages to show their name, or we can just say "Identity Revealed"
    otherName = "Identity Revealed ✨";
    otherSub = "Check their messages for details";
  } else if (otherUserId === post.creator_id) {
    otherName = post.is_anonymous ? 'Anonymous User' : post.users?.name;
    otherSub = post.is_anonymous ? post.users?.gender : post.users?.branch;
  }

  return (
    <div className="container mx-auto px-4 pt-24 pb-8 max-w-4xl h-[calc(100vh-64px)] flex flex-col">
      {/* Chat Header */}
      <div className="glass-card p-4 flex justify-between items-center mb-4 rounded-t-2xl border-b border-slate-border/50 rounded-b-none">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/sendiyou')} className="p-2 bg-slate-deeper rounded-xl hover:bg-white/5 transition-colors text-text-secondary">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="font-bold text-text-primary text-lg flex items-center gap-2">
              {otherName} 
              {otherHasRevealed && <span className="px-2 py-0.5 text-[10px] bg-emerald-free/20 text-emerald-free rounded-full uppercase">Revealed</span>}
            </h2>
            <p className="text-xs text-text-muted">Re: {post.title}</p>
          </div>
        </div>
        
        <div>
          {!hasRevealed ? (
            <button 
              onClick={handleRevealIdentity}
              className="px-4 py-2 bg-violet-primary/10 text-violet-primary text-sm font-bold rounded-lg hover:bg-violet-primary/20 transition-colors flex items-center gap-2 tooltip-trigger"
              title="Make your name & branch visible"
            >
              <Eye size={16} /> Reveal Identity
            </button>
          ) : (
            <div className="flex items-center gap-2 text-emerald-free text-sm font-bold bg-emerald-free/10 px-4 py-2 rounded-lg">
              <ShieldAlert size={16} /> Identity Revealed
            </div>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 glass-card p-4 overflow-y-auto mb-4 border-y-0 rounded-none bg-slate-darker/50 space-y-4">
        <div className="text-center my-4">
          <span className="bg-slate-deeper px-4 py-1.5 rounded-full text-xs text-text-muted font-medium border border-slate-border/50">
            Chat started for: "{post.title}"
          </span>
        </div>
        
        {messages.map((msg, idx) => {
          const isMe = msg.sender_id === user.id;
          const senderRevealed = chatInfo.revealed_ids?.includes(msg.sender_id);
          const isCreator = msg.sender_id === post.creator_id;
          
          let displayName = isMe ? "You" : "Anonymous";
          let displaySub = "";
          
          if (senderRevealed) {
            displayName = isMe ? "You" : msg.users?.name;
            displaySub = isMe ? "" : msg.users?.branch;
          } else if (isCreator && !post.is_anonymous) {
             displayName = msg.users?.name;
             displaySub = msg.users?.branch;
          } else if (isCreator && post.is_anonymous) {
             displayName = "Anonymous Creator";
             displaySub = msg.users?.gender;
          }

          return (
            <div key={msg.id || idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
              <div className="flex items-center gap-2 mb-1">
                {!isMe && <span className="text-xs text-text-muted font-medium">{displayName} {displaySub && `· ${displaySub}`}</span>}
                {senderRevealed && !isMe && <Eye size={12} className="text-emerald-free" />}
              </div>
              <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl ${isMe ? 'bg-violet-primary text-white rounded-tr-sm' : 'bg-slate-card text-text-primary rounded-tl-sm border border-slate-border/50'}`}>
                <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
              </div>
              <span className="text-[10px] text-text-muted mt-1">
                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSendMessage} className="glass-card p-3 rounded-t-none border-t border-slate-border/50 flex gap-3 rounded-b-2xl">
        <input 
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type an anonymous message..."
          className="flex-1 bg-slate-deeper border border-slate-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-violet-primary transition-colors text-sm"
        />
        <button 
          type="submit"
          disabled={!newMessage.trim()}
          className="p-3 bg-violet-primary text-white rounded-xl hover:bg-violet-primary/90 transition-colors disabled:opacity-50 disabled:hover:bg-violet-primary flex items-center justify-center"
        >
          <Send size={20} />
        </button>
      </form>
    </div>
  );
};

export default ChatPage;
