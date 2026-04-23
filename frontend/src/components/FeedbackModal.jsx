import React, { useState } from 'react';
import { X, Send, Heart, Bug, Lightbulb, MessageSquare } from 'lucide-react';
import api from '../services/api';

const FeedbackModal = ({ onClose }) => {
  const [category, setCategory] = useState('Suggestion');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const categories = [
    { name: 'Suggestion', icon: Lightbulb, color: 'text-amber-500 bg-amber-50 dark:bg-amber-900/20' },
    { name: 'Bug', icon: Bug, color: 'text-rose-500 bg-rose-50 dark:bg-rose-900/20' },
    { name: 'Complaint', icon: MessageSquare, color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsSubmitting(true);
    try {
      await api.post('/feedback', { category, message });
      setSubmitted(true);
      setTimeout(onClose, 2000);
    } catch (err) {
      alert('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-zoom-in transition-colors duration-300">
        <div className="flex items-center justify-between p-6 border-b border-slate-50 dark:border-slate-700/50">
          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Share Feedback</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-colors">
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        <div className="p-6">
          {submitted ? (
            <div className="py-8 text-center animate-fade-in">
              <div className="h-20 w-20 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart size={40} fill="currentColor" />
              </div>
              <h4 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">Thank You!</h4>
              <p className="text-slate-500 dark:text-slate-400">Your feedback helps us make CampusBuddy better for everyone.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 block mb-3">What kind of feedback is this?</label>
                <div className="grid grid-cols-3 gap-3">
                  {categories.map((cat) => (
                    <button
                      key={cat.name}
                      type="button"
                      onClick={() => setCategory(cat.name)}
                      className={`flex flex-col items-center p-3 rounded-2xl border-2 transition-all ${
                        category === cat.name 
                          ? 'border-brand-500 bg-brand-50/30 dark:bg-brand-900/20 ring-4 ring-brand-50 dark:ring-brand-900/10' 
                          : 'border-slate-100 dark:border-slate-700 hover:border-slate-200 dark:hover:border-slate-600'
                      }`}
                    >
                      <div className={`h-10 w-10 rounded-xl flex items-center justify-center mb-2 ${cat.color}`}>
                        <cat.icon size={20} />
                      </div>
                      <span className={`text-xs font-bold ${category === cat.name ? 'text-brand-700 dark:text-brand-400' : 'text-slate-600 dark:text-slate-400'}`}>{cat.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 block mb-2">Your Message</label>
                <textarea
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tell us what's on your mind..."
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border-2 border-transparent focus:border-brand-500 focus:bg-white dark:focus:bg-slate-800 transition-all resize-none min-h-[120px] text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !message.trim()}
                className="w-full py-4 bg-brand-600 text-white rounded-2xl font-bold hover:bg-brand-700 shadow-lg shadow-brand-100 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? 'Sending...' : (
                  <>
                    <span>Submit Feedback</span>
                    <Send size={18} />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default FeedbackModal;
