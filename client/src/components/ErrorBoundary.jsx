import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen pt-32 px-4 flex justify-center bg-slate-darker">
          <div className="w-full max-w-2xl glass-card p-8 shadow-xl border border-red-busy/50">
            <h2 className="text-2xl font-bold text-red-busy mb-4">Something went wrong.</h2>
            <div className="bg-black/30 p-4 rounded-xl text-red-300 font-mono text-sm overflow-auto max-h-96">
              <p className="font-bold mb-2">{this.state.error && this.state.error.toString()}</p>
              <pre className="whitespace-pre-wrap">{this.state.errorInfo && this.state.errorInfo.componentStack}</pre>
            </div>
            <button 
              onClick={() => window.location.href = '/'} 
              className="mt-6 px-6 py-2 bg-slate-border text-white rounded-lg hover:bg-slate-border/80"
            >
              Go to Home Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
