import React, { useState, useEffect } from 'react';
import { X, Save, Loader2 } from 'lucide-react';
import api from '../services/api';

const EditClassroomModal = ({ isOpen, onClose, classroom, onUpdate, onDelete }) => {
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    department: '',
    year: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (classroom) {
      setFormData({
        name: classroom.name || '',
        subject: classroom.subject || '',
        department: classroom.department || '',
        year: classroom.year || ''
      });
    }
  }, [classroom]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      const res = await api.put(`/classrooms/${classroom.id}`, formData);
      onUpdate(res.data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update classroom');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletePassword) return;
    try {
      setDeleting(true);
      setError('');
      await api.delete(`/classrooms/${classroom.id}`, { data: { password: deletePassword } });
      onDelete();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete classroom');
    } finally {
      setDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[120] p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Edit Classroom</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[70vh] custom-scrollbar">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>}
            
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Classroom Name</label>
              <input 
                required
                type="text" 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500 transition-all text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Subject</label>
              <input 
                required
                type="text" 
                value={formData.subject}
                onChange={(e) => setFormData({...formData, subject: e.target.value})}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500 transition-all text-slate-900 dark:text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Department</label>
                <input 
                  type="text" 
                  value={formData.department}
                  onChange={(e) => setFormData({...formData, department: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500 transition-all text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Year</label>
                <input 
                  type="text" 
                  value={formData.year}
                  onChange={(e) => setFormData({...formData, year: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500 transition-all text-slate-900 dark:text-white"
                />
              </div>
            </div>
            
            <div className="pt-4 flex justify-end gap-3">
              <button 
                type="button" 
                onClick={onClose}
                className="px-6 py-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors font-medium"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={loading || showDeleteConfirm}
                className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white rounded-xl transition-all shadow-lg shadow-brand-500/20 font-bold flex items-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                Save Changes
              </button>
            </div>
          </form>

          {/* Delete Section */}
          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-700">
            {!showDeleteConfirm ? (
              <button 
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="text-red-600 dark:text-red-400 text-sm font-medium hover:underline"
              >
                Delete this classroom
              </button>
            ) : (
              <div className="bg-red-50 dark:bg-red-500/5 p-4 rounded-xl border border-red-100 dark:border-red-500/10 space-y-4">
                <p className="text-xs text-red-600 dark:text-red-400 font-bold uppercase">Danger Zone</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">This action is irreversible. Enter your password to confirm deletion.</p>
                <input 
                  type="password"
                  placeholder="Enter your password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/50 rounded-lg focus:ring-2 focus:ring-red-500 text-sm"
                />
                <div className="flex gap-2">
                  <button 
                    onClick={handleDelete}
                    disabled={deleting || !deletePassword}
                    className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white py-2 rounded-lg text-sm font-bold transition-colors"
                  >
                    {deleting ? 'Deleting...' : 'Permanently Delete'}
                  </button>
                  <button 
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setDeletePassword('');
                    }}
                    className="px-4 py-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-sm font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditClassroomModal;
