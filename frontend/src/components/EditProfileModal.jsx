import React, { useState, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { X, Camera, Save, User, Phone, MapPin, Calendar } from 'lucide-react';
import api from '../services/api';

const EditProfileModal = ({ onClose }) => {
  const { user, updateUser } = useContext(AuthContext); 
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    department: user?.department || '',
    year: user?.year || 1,
    avatar_url: user?.avatar_url || ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await api.put('/users/profile', formData);
      // Update context directly
      updateUser(res.data.user); 
      onClose();
    } catch (err) {
      alert('Failed to update profile.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAvatarChange = () => {
    const url = prompt('Enter image URL for avatar:', formData.avatar_url);
    if (url !== null) {
      setFormData({ ...formData, avatar_url: url });
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-zoom-in transition-colors duration-300 no-scrollbar">
        <div className="flex items-center justify-between p-6 border-b border-slate-50 dark:border-slate-700/50">
          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Edit Profile</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-colors">
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="flex flex-col items-center mb-8">
            <div className="relative group">
              <div className="h-24 w-24 rounded-full bg-brand-50 dark:bg-brand-900/40 border-4 border-white dark:border-slate-700 shadow-xl flex items-center justify-center text-brand-600 dark:text-brand-400 font-bold text-3xl overflow-hidden">
                {formData.avatar_url ? (
                  <img src={formData.avatar_url} alt="Preview" className="h-full w-full object-cover" />
                ) : (
                  formData.name.charAt(0).toUpperCase()
                )}
              </div>
              <button 
                type="button"
                onClick={handleAvatarChange}
                className="absolute bottom-0 right-0 p-2 bg-brand-600 text-white rounded-full shadow-lg hover:bg-brand-700 transition-all border-2 border-white dark:border-slate-700"
              >
                <Camera size={16} />
              </button>
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-3 font-medium">Click the camera icon to update photo</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 ml-1 uppercase tracking-wider flex items-center">
                <User size={12} className="mr-1" /> Full Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border-2 border-transparent focus:border-brand-500 focus:bg-white dark:focus:bg-slate-800 transition-all text-sm font-medium text-slate-900 dark:text-slate-100"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 ml-1 uppercase tracking-wider flex items-center">
                <Phone size={12} className="mr-1" /> Phone Number
              </label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border-2 border-transparent focus:border-brand-500 focus:bg-white dark:focus:bg-slate-800 transition-all text-sm font-medium text-slate-900 dark:text-slate-100"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 ml-1 uppercase tracking-wider flex items-center">
                <MapPin size={12} className="mr-1" /> Department
              </label>
              <input
                type="text"
                name="department"
                value={formData.department}
                onChange={handleChange}
                placeholder="e.g. Computer Science"
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border-2 border-transparent focus:border-brand-500 focus:bg-white dark:focus:bg-slate-800 transition-all text-sm font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 ml-1 uppercase tracking-wider flex items-center">
                <Calendar size={12} className="mr-1" /> Year of Study
              </label>
              <select
                name="year"
                value={formData.year}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border-2 border-transparent focus:border-brand-500 focus:bg-white dark:focus:bg-slate-800 transition-all text-sm font-medium text-slate-900 dark:text-slate-100"
              >
                {[1,2,3,4].map(y => <option key={y} value={y} className="dark:bg-slate-800">Year {y}</option>)}
              </select>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-50 dark:border-slate-700/50 flex gap-3 transition-colors">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 px-4 rounded-xl bg-brand-600 text-white font-bold hover:bg-brand-700 shadow-lg shadow-brand-100 dark:shadow-none transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Save size={18} />
              <span>{isSubmitting ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfileModal;
