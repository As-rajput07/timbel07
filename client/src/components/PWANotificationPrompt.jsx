import React, { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';

export default function PWANotificationPrompt() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const checkAndShowPrompt = () => {
      // Check if running as PWA (standalone mode)
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
      
      // Check notification permission
      const needsPermission = 'Notification' in window && Notification.permission !== 'granted';

      // Show if it's PWA and permission is not granted
      if (isStandalone && needsPermission) {
        // Slight delay so it doesn't pop up instantly on app load
        setTimeout(() => setShow(true), 2500);
      }
    };

    checkAndShowPrompt();
  }, []);

  const handleAllow = async () => {
    if (!('Notification' in window)) {
      alert("This browser does not support desktop notification");
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      setShow(false);
    } else {
      // If they deny, we can still close it for this session. 
      // It will reappear next time they open the PWA since it's not granted.
      setShow(false);
      alert("Notifications denied. You can enable them later in your browser settings.");
    }
  };

  const handleClose = () => {
    // Hide for this session. It will reappear on next app load.
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-slate-card rounded-3xl shadow-2xl overflow-hidden border border-violet-primary/30 relative animate-in fade-in zoom-in duration-300">
        
        {/* Close Button */}
        <button 
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 bg-slate-deeper/50 rounded-full text-text-muted hover:text-white hover:bg-slate-deeper transition-colors z-10"
        >
          <X size={18} />
        </button>

        {/* Content */}
        <div className="p-6 text-center">
          <div className="w-16 h-16 mx-auto bg-violet-primary/20 rounded-full flex items-center justify-center mb-4 border border-violet-primary/30">
            <Bell size={28} className="text-violet-primary animate-bounce" />
          </div>
          
          <h2 className="text-xl font-bold text-text-primary mb-2">
            Never Miss an Update!
          </h2>
          <p className="text-sm text-text-secondary mb-6 leading-relaxed">
            Please allow notifications so we can alert you about your class schedules, teacher status, and new SendiYou messages.
          </p>

          <div className="space-y-3">
            <button 
              onClick={handleAllow}
              className="w-full py-3.5 px-4 bg-violet-primary hover:bg-violet-hover text-white font-semibold rounded-xl transition-all shadow-lg shadow-violet-primary/25 flex items-center justify-center gap-2"
            >
              <Bell size={18} />
              Allow Notifications
            </button>
            <button 
              onClick={handleClose}
              className="w-full py-3.5 px-4 bg-slate-deeper hover:bg-slate-deeper/80 text-text-muted hover:text-text-primary font-medium rounded-xl transition-all"
            >
              Maybe Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
