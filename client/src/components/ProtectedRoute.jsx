import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { isUniversityEmail } from '../utils/authUtils';

export default function ProtectedRoute({ children }) {
  const { user, profile, loading, signInWithGoogle } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen pt-24 flex justify-center items-center">
        <div className="text-violet-primary font-bold">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen pt-32 px-4 flex justify-center">
        <div className="w-full max-w-md glass-card p-8 shadow-xl border border-violet-primary/30 text-center">
          <div className="w-16 h-16 rounded-full bg-violet-primary/10 flex items-center justify-center mb-4 mx-auto">
            <span className="text-violet-primary text-2xl font-bold">🎓</span>
          </div>
          <h2 className="text-xl font-bold font-heading text-text-primary mb-2">University Login Required</h2>
          <p className="text-sm text-text-muted mb-6">
            SendiYou is an exclusive space for university students. Please sign in with your college email address (ending in .ac.in or .edu) to access this feature.
          </p>
          <button 
            onClick={signInWithGoogle}
            className="w-full py-3 rounded-full bg-white text-slate-darker font-bold transition-colors flex items-center justify-center gap-2 hover:bg-gray-200"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  if (!isUniversityEmail(user.email)) {
    return (
      <div className="min-h-screen pt-32 px-4 flex justify-center">
        <div className="w-full max-w-md glass-card p-8 shadow-xl border border-red-busy/50 text-center">
          <div className="w-16 h-16 rounded-full bg-red-busy/10 flex items-center justify-center mb-4 mx-auto">
            <span className="text-red-busy text-2xl font-bold">!</span>
          </div>
          <h2 className="text-xl font-bold font-heading text-text-primary mb-2">Access Denied</h2>
          <p className="text-sm text-text-muted mb-6">
            The email <b>{user.email}</b> is not a verified university email. To access SendiYou, please sign out and log back in with an email ending in .ac.in or .edu.
          </p>
          <button 
            onClick={() => window.location.href = '/'}
            className="w-full py-3 mb-3 rounded-full bg-slate-border hover:bg-slate-border/80 text-white font-medium transition-colors"
          >
            Go Back Home
          </button>
        </div>
      </div>
    );
  }

  if (profile?.is_suspended) {
    return (
      <div className="min-h-screen pt-32 px-4 flex justify-center">
        <div className="w-full max-w-md glass-card p-8 shadow-xl border border-red-busy/50 text-center">
          <div className="w-16 h-16 rounded-full bg-red-busy/10 flex items-center justify-center mb-4 mx-auto">
            <span className="text-red-busy text-2xl font-bold">🛑</span>
          </div>
          <h2 className="text-xl font-bold font-heading text-text-primary mb-2">Account Suspended</h2>
          <p className="text-sm text-text-muted mb-6">
            Your SendiYou account has been suspended by the administrator for violating community guidelines. You can no longer access the SendiYou platform.
          </p>
          <button 
            onClick={() => window.location.href = '/'}
            className="w-full py-3 rounded-full bg-slate-border hover:bg-slate-border/80 text-white font-medium transition-colors"
          >
            Go Back Home
          </button>
        </div>
      </div>
    );
  }

  return children;
}
