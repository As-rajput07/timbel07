import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { MessageSquare, Clock, User, Heart, Search, Users } from 'lucide-react';
import LottieLib from 'lottie-react';
import loaderAnimation from '../assets/loder.json';

const Lottie = LottieLib.default || LottieLib;

const getConnectionIcon = (type) => {
  switch (type?.toLowerCase()) {
    case 'crush': return <Heart size={16} className="text-pink-500" />;
    case 'missing item': return <Search size={16} className="text-amber-500" />;
    case 'group study': return <Users size={16} className="text-emerald-500" />;
    default: return <MessageSquare size={16} className="text-violet-primary" />;
  }
};

export default function MessagesPage() {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchChats();
    }
  }, [user]);

  const fetchChats = async () => {
    try {
      // Fetch chats where user is a participant. RLS handles filtering automatically.
      const { data, error } = await supabase
        .from('sendiyou_chats')
        .select(`
          *,
          post:sendiyou_posts(*),
          messages(content, created_at, sender_id)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Process chats to find the latest message
      const processedChats = data.map(chat => {
        let latestMessage = null;
        if (chat.messages && chat.messages.length > 0) {
          latestMessage = chat.messages.reduce((latest, current) => {
            return new Date(current.created_at) > new Date(latest.created_at) ? current : latest;
          });
        }
        
        // Determine the "other" participant's ID (for a 1-on-1 logic)
        // If it's the post creator, they are participant_ids[0]. The replier is [1].
        const otherParticipantId = chat.participant_ids.find(id => id !== user.id) || chat.participant_ids[0];
        
        // Determine if identity is revealed
        const isRevealed = chat.revealed_ids.includes(otherParticipantId);

        return {
          ...chat,
          latestMessage,
          isRevealed,
          lastActivity: latestMessage ? latestMessage.created_at : chat.created_at
        };
      });

      // Sort by last activity descending
      processedChats.sort((a, b) => new Date(b.lastActivity) - new Date(a.lastActivity));

      setChats(processedChats);
    } catch (err) {
      console.error('Error fetching chats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-24 flex justify-center items-center">
        <Lottie animationData={loaderAnimation} className="w-16 h-16" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 px-4 pb-12">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-violet-primary/10 flex items-center justify-center">
            <MessageSquare className="w-6 h-6 text-violet-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold font-heading text-text-primary">Your Messages</h1>
            <p className="text-text-muted mt-1">Continue conversations for your accepted posts</p>
          </div>
        </div>

        {chats.length === 0 ? (
          <div className="glass-card p-12 text-center border-slate-border border-dashed">
            <div className="w-16 h-16 rounded-full bg-slate-deeper flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-8 h-8 text-text-muted" />
            </div>
            <h3 className="text-lg font-bold text-text-primary mb-2">No active conversations</h3>
            <p className="text-text-muted text-sm max-w-md mx-auto">
              You haven't replied to any posts or received any replies to your posts yet.
            </p>
            <button
              onClick={() => navigate('/sendiyou')}
              className="mt-6 px-6 py-2.5 bg-violet-primary hover:bg-violet-hover text-white rounded-lg font-medium transition-colors"
            >
              Explore SendiYou
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {chats.map(chat => (
              <div 
                key={chat.id}
                onClick={() => navigate(`/chat/${chat.id}`)}
                className="glass-card p-5 cursor-pointer hover:border-violet-primary/50 transition-all hover:-translate-y-0.5 group flex flex-col sm:flex-row gap-4 sm:items-center justify-between"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-deeper text-text-secondary border border-slate-border">
                      {getConnectionIcon(chat.post?.connection_type)}
                      {chat.post?.connection_type}
                    </span>
                    <span className="text-xs text-text-muted flex items-center gap-1">
                      <Clock size={12} />
                      {new Date(chat.lastActivity).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-bold text-text-primary truncate mb-1 group-hover:text-violet-primary transition-colors">
                    {chat.post?.title || 'Unknown Post'}
                  </h3>
                  
                  {chat.latestMessage ? (
                    <p className="text-sm text-text-secondary truncate pr-8">
                      {chat.latestMessage.sender_id === user.id ? 'You: ' : ''}
                      {chat.latestMessage.content}
                    </p>
                  ) : (
                    <p className="text-sm text-text-muted italic">No messages yet. Start the conversation!</p>
                  )}
                </div>
                
                <div className="shrink-0 flex items-center gap-3 bg-slate-deeper/50 px-4 py-2 rounded-xl border border-slate-border/50">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${chat.isRevealed ? 'bg-emerald-free/20 text-emerald-free' : 'bg-slate-card text-text-muted border border-slate-border'}`}>
                    <User size={16} />
                  </div>
                  <div className="text-sm font-semibold">
                    {chat.isRevealed ? 'Identity Revealed' : 'Anonymous'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
