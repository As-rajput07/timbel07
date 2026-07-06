import React, { useState, useEffect } from 'react';
import { Bell, BellOff, Info } from 'lucide-react';

const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

export default function PushNotificationManager() {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showIOSWarning, setShowIOSWarning] = useState(false);

  useEffect(() => {
    // Check if Push Notifications are supported
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      checkSubscription();
    }

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // Detect standalone mode (PWA installed)
    const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    setIsStandalone(isStandaloneMode);
  }, []);

  const checkSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (err) {
      console.error('Error checking subscription', err);
    }
  };

  const subscribeUser = async () => {
    if (isIOS && !isStandalone) {
      setShowIOSWarning(true);
      return;
    }

    try {
      if (!('Notification' in window)) {
        alert('This browser does not support notifications, or you are not using a secure connection (HTTPS or localhost).');
        return;
      }
      
      console.log("Requesting permission...");
      const permission = await Notification.requestPermission();
      console.log("Permission result:", permission);
      
      if (permission !== 'granted') {
        alert('You need to allow notifications to receive updates. Current status: ' + permission);
        return;
      }

      console.log("Waiting for service worker ready...");
      
      // Add a 5 second timeout to see if it's getting stuck here
      const registration = await Promise.race([
        navigator.serviceWorker.ready,
        new Promise((_, reject) => setTimeout(() => reject(new Error('Service Worker is not registering. Please check the console for Vite PWA errors.')), 5000))
      ]);
      
      console.log("SW Ready:", registration);
      
      const publicVapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
      if (!publicVapidKey) {
        alert('Configuration error: VITE_VAPID_PUBLIC_KEY is missing');
        return;
      }

      console.log("Subscribing to push manager...");
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
      });
      console.log("Subscription created:", subscription);

      // Send subscription to our backend
      console.log("Sending subscription to server...");
      const response = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscription)
      });

      if (response.ok) {
        alert('Notifications enabled successfully!');
        setIsSubscribed(true);
      } else {
        const errData = await response.json();
        alert('Failed to save subscription on server: ' + (errData.error || 'Unknown error'));
      }
    } catch (err) {
      console.error('Failed to subscribe user: ', err);
      alert('Error: ' + err.message);
    }
  };

  if (!isSupported) return null;
  
  if (isSubscribed) {
    return (
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 999, color: '#10B981', fontSize: 12, fontWeight: 600 }}>
        <Bell size={14} /> Notifications Enabled
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button 
        onClick={subscribeUser}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: 'rgba(99,91,255,0.1)', border: '1px solid rgba(99,91,255,0.4)', borderRadius: 999, color: '#F8FAFC', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s'
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(99,91,255,0.2)' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(99,91,255,0.1)' }}
      >
        <Bell size={14} style={{ color: '#635BFF' }} /> Get Timetable Alerts
      </button>

      {showIOSWarning && (
        <div style={{ position: 'absolute', bottom: '110%', left: '50%', transform: 'translateX(-50%)', width: 260, padding: 14, background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(245,158,11,0.4)', borderRadius: 12, boxShadow: '0 10px 30px rgba(0,0,0,0.5)', zIndex: 100, backdropFilter: 'blur(10px)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <Info size={16} color="#F59E0B" style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <p style={{ margin: 0, fontSize: 12, color: '#F8FAFC', fontWeight: 600, marginBottom: 6 }}>iOS Limitation</p>
              <p style={{ margin: 0, fontSize: 11, color: '#94A3B8', lineHeight: 1.5 }}>
                Apple requires you to add this app to your Home Screen before enabling notifications. 
                <br/><br/>
                Tap the Share icon <span style={{fontSize:14}}>↑</span> and select <strong>"Add to Home Screen"</strong>. Then open the app from your home screen.
              </p>
            </div>
          </div>
          <button 
            onClick={() => setShowIOSWarning(false)}
            style={{ width: '100%', padding: '6px', background: 'transparent', border: 'none', color: '#635BFF', fontSize: 11, fontWeight: 600, marginTop: 8, cursor: 'pointer' }}
          >
            Got it
          </button>
        </div>
      )}
    </div>
  );
}
