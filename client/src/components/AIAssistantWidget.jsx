import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, User } from 'lucide-react';
import LottieLib from 'lottie-react';
import assistantAnimation from '../assets/assistent.json';
import loaderAnimation from '../assets/loder.json';

const Lottie = LottieLib.default || LottieLib;

export default function AIAssistantWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'ai', text: 'Namaste! Main Timbel ki AI Assistant hoon. Aapko timetable, classes, ya platform ke baare me koi query hai toh zaroor puchiye!' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: userMessage,
          history: messages.slice(-10) // Send last 10 messages as context
        })
      });

      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();

      setMessages(prev => [...prev, { role: 'ai', text: data.reply }]);
    } catch (error) {
      console.error('Chat Error:', error);
      setMessages(prev => [...prev, { role: 'ai', text: 'Sorry, abhi backend me thodi problem hai. Please thodi der baad try karein.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Floating Action Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 rounded-full bg-violet-primary text-white shadow-2xl flex items-center justify-center hover:bg-violet-600 transition-all hover:scale-110 active:scale-95 border-2 border-violet-400/30 group"
        >
          <MessageSquare className="w-6 h-6 group-hover:animate-pulse" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="w-[350px] sm:w-[400px] max-w-[calc(100vw-32px)] h-[500px] max-h-[calc(100vh-100px)] glass-card flex flex-col rounded-2xl shadow-2xl border border-violet-primary/30 overflow-hidden animate-in zoom-in-95 duration-200">
          
          {/* Header */}
          <div className="p-4 border-b border-slate-border/50 bg-slate-darker flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-violet-primary/20 flex items-center justify-center border border-violet-primary/30 overflow-hidden">
                <Lottie animationData={assistantAnimation} className="w-8 h-8" />
              </div>
              <div>
                <h3 className="font-bold text-text-primary text-sm">Timbel Assistant</h3>
                <p className="text-xs text-emerald-free flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-free animate-pulse-soft"></span> Online
                </p>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-2 text-text-muted hover:text-text-primary hover:bg-slate-border/50 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-border scrollbar-track-transparent">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center mt-1 border ${
                    msg.role === 'user' 
                      ? 'bg-slate-deep border-slate-border text-text-secondary' 
                      : 'bg-violet-primary/20 border-violet-primary/30 text-violet-primary'
                  }`}>
                    {msg.role === 'user' ? <User className="w-4 h-4" /> : <Lottie animationData={assistantAnimation} className="w-8 h-8" />}
                  </div>
                  
                  <div className={`p-3 rounded-2xl text-sm ${
                    msg.role === 'user'
                      ? 'bg-violet-primary text-white rounded-tr-sm'
                      : 'bg-slate-card text-text-primary border border-slate-border/50 rounded-tl-sm'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex gap-3 max-w-[85%]">
                  <div className="w-8 h-8 shrink-0 rounded-full flex items-center justify-center mt-1 border bg-violet-primary/20 border-violet-primary/30 text-violet-primary">
                    <Lottie animationData={assistantAnimation} className="w-8 h-8" />
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-card border border-slate-border/50 rounded-tl-sm flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-violet-primary/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 rounded-full bg-violet-primary/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 rounded-full bg-violet-primary/60 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-slate-border/50 bg-slate-darker shrink-0">
            <form onSubmit={handleSend} className="relative flex items-center">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me anything..."
                className="w-full bg-slate-deep border border-slate-border rounded-xl pl-4 pr-12 py-3 text-sm text-text-primary focus:outline-none focus:border-violet-primary focus:ring-1 focus:ring-violet-primary transition-all"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="absolute right-2 p-2 text-violet-primary hover:bg-violet-primary/10 rounded-lg transition-colors disabled:opacity-50 disabled:hover:bg-transparent"
              >
                {isLoading ? <Lottie animationData={loaderAnimation} className="w-8 h-8" /> : <Send className="w-5 h-5" />}
              </button>
            </form>
            <p className="text-[10px] text-text-muted text-center mt-2">
              Timbel AI can make mistakes. Consider verifying important data.
            </p>
          </div>

        </div>
      )}
    </div>
  );
}
