import { useState } from 'react';
import { AlertTriangle, X, CheckCircle } from 'lucide-react';
import LottieLib from 'lottie-react';
import loaderAnimation from '../assets/loder.json';

const Lottie = LottieLib.default || LottieLib;

export default function IssueReportModal({ isOpen, onClose, slot }) {
  const [issueType, setIssueType] = useState('Wrong Teacher');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !slot) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim()) {
      setError('Please describe the issue.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/chat/report-slot-issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          room: slot.room_name || slot.room,
          slot_time: `${slot.start_time} - ${slot.end_time}`,
          issue_type: issueType,
          query_text: description,
          slot_data: slot
        })
      });

      if (!res.ok) throw new Error('Failed to submit issue');
      
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setDescription('');
        setIssueType('Wrong Teacher');
        onClose();
      }, 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="glass-card w-full max-w-md rounded-2xl border border-amber-soon/30 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-border/50 bg-amber-soon/10 flex justify-between items-center">
          <h3 className="font-bold text-amber-soon flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Report Slot Issue
          </h3>
          <button 
            onClick={onClose}
            className="p-1 text-text-muted hover:text-text-primary rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        {isSuccess ? (
          <div className="p-8 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-free/20 flex items-center justify-center mb-4 border border-emerald-free/30">
              <CheckCircle className="w-8 h-8 text-emerald-free" />
            </div>
            <h4 className="text-lg font-bold text-text-primary mb-2">Issue Reported!</h4>
            <p className="text-sm text-text-muted">Thank you. The admin team and AI will review this shortly.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            
            {/* Slot Context Context */}
            <div className="p-3 rounded-lg bg-slate-darker border border-slate-border/50 text-xs text-text-secondary">
              <span className="font-semibold text-text-primary">Reporting for:</span>
              <div className="mt-1 flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded bg-slate-border">Room {slot.room_name || slot.room}</span>
                <span className="px-2 py-0.5 rounded bg-slate-border">{slot.start_time} - {slot.end_time}</span>
                <span className="px-2 py-0.5 rounded bg-slate-border">{slot.subject || 'Unknown'}</span>
              </div>
            </div>

            {/* Form Fields */}
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wider">Issue Type</label>
              <select 
                value={issueType}
                onChange={(e) => setIssueType(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-darker border border-slate-border text-text-primary focus:outline-none focus:border-amber-soon focus:ring-1 focus:ring-amber-soon transition-all text-sm"
              >
                <option value="Wrong Teacher">Wrong Teacher</option>
                <option value="Wrong Subject">Wrong Subject</option>
                <option value="Class Canceled">Class Canceled</option>
                <option value="Slot Empty">Slot Empty (Data Missing)</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wider">Description</label>
              <textarea 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Briefly describe the exact problem here..."
                rows="3"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-darker border border-slate-border text-text-primary focus:outline-none focus:border-amber-soon focus:ring-1 focus:ring-amber-soon transition-all text-sm resize-none"
              />
            </div>

            {error && <div className="text-red-busy text-xs">{error}</div>}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl bg-amber-soon hover:bg-amber-600 text-slate-900 font-bold transition-all disabled:opacity-50 flex justify-center items-center gap-2"
            >
              {isSubmitting ? <Lottie animationData={loaderAnimation} className="w-6 h-6" /> : 'Submit Report'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
