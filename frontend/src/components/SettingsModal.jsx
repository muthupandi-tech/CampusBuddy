import React, { useState, useContext } from 'react';
import { X, Bell, Moon, Sun, Lock, Shield, CheckCircle2, Volume2, Eye, EyeOff, Loader2 } from 'lucide-react';
import { AuthContext } from '../contexts/AuthContext';
import api from '../services/api';

const SettingsModal = ({ onClose }) => {
  const { user, updateUser } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('Notifications');
  const [notifs, setNotifs] = useState(user?.notifications_enabled ?? true);

  const [darkMode, setDarkMode] = useState(() => document.documentElement.classList.contains('dark'));
  const [showPassword, setShowPassword] = useState(false);
  
  // Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState({ text: '', type: '' });

  // Preferences State
  const [isUpdatingPrefs, setIsUpdatingPrefs] = useState(false);
  const [prefStatus, setPrefStatus] = useState({ text: '', type: '' });

  const toggleDarkMode = (isDark) => {
    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) return;
    
    setIsUpdatingPassword(true);
    setPasswordStatus({ text: '', type: '' });
    
    try {
      await api.put('/users/change-password', { currentPassword, newPassword });
      setPasswordStatus({ text: 'Password updated successfully!', type: 'success' });
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      setPasswordStatus({ 
        text: err.response?.data?.error || 'Failed to update password. Check your current password.', 
        type: 'error' 
      });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleToggleNotifications = async () => {
    const newState = !notifs;
    setNotifs(newState);
    try {
      const res = await api.put('/users/preferences', { notifications_enabled: newState });
      if (res.data.user) updateUser(res.data.user);
    } catch (err) {
      console.error('Failed to update notifications preference');
      setNotifs(!newState); // revert on error
    }
  };


  const handleMute = async (hours) => {
    setIsUpdatingPrefs(true);
    setPrefStatus({ text: '', type: '' });

    let mutedUntil = null;
    if (hours !== null) {
      const date = new Date();
      date.setHours(date.getHours() + hours);
      mutedUntil = date.toISOString();
    }

    try {
      const res = await api.put('/users/preferences', { muted_until: mutedUntil });
      if (res.data.user) updateUser(res.data.user);
      setPrefStatus({ 
        text: hours ? `Notifications muted for ${hours} hours.` : 'Notifications unmuted.', 
        type: 'success' 
      });
    } catch (err) {

      setPrefStatus({ text: 'Failed to update preferences.', type: 'error' });
    } finally {
      setIsUpdatingPrefs(false);
    }
  };

  const tabs = [
    { name: 'Notifications', icon: Bell },
    { name: 'Appearance', icon: Moon },
    { name: 'Security', icon: Shield },
  ];

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-zoom-in flex flex-col md:flex-row min-h-[400px] transition-colors duration-300">
        
        {/* Sidebar */}
        <div className="w-full md:w-64 bg-slate-50 dark:bg-slate-900/50 p-6 border-r border-slate-100 dark:border-slate-700">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Settings</h3>
            <button onClick={onClose} className="md:hidden p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl">
              <X size={20} />
            </button>
          </div>
          <div className="flex md:flex-col overflow-x-auto md:overflow-x-visible pb-2 md:pb-0 gap-2 no-scrollbar">
            {tabs.map((tab) => (
              <button
                key={tab.name}
                onClick={() => setActiveTab(tab.name)}
                className={`flex items-center space-x-3 px-4 py-3 rounded-2xl transition-all whitespace-nowrap min-w-fit md:w-full ${
                  activeTab === tab.name 
                    ? 'bg-white dark:bg-slate-800 text-brand-600 dark:text-brand-400 shadow-sm font-bold' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-700/50'
                }`}
              >
                <tab.icon size={18} />
                <span className="text-sm">{tab.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 md:p-8 relative">
          <div className="hidden md:flex justify-end absolute top-6 right-6">
            <button onClick={onClose} className="p-2 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-colors">
              <X size={20} className="text-slate-400" />
            </button>
          </div>

          <div className="animate-fade-in">
            {activeTab === 'Notifications' && (
               <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center">
                      <Volume2 size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Push Notifications</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">Receive alerts on your device</p>
                    </div>
                  </div>
                  <button 
                    onClick={handleToggleNotifications}
                    className={`w-12 h-6 rounded-full transition-all relative ${notifs ? 'bg-brand-600' : 'bg-slate-300 dark:bg-slate-600'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${notifs ? 'right-1' : 'left-1'}`} />
                  </button>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Mute Notifications</label>
                    {isUpdatingPrefs && <Loader2 size={14} className="animate-spin text-brand-600" />}
                  </div>
                  
                  {prefStatus.text && (
                    <p className={`text-xs font-medium px-3 py-2 rounded-lg ${prefStatus.type === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                      {prefStatus.text}
                    </p>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: '1 Hour', val: 1 },
                      { label: '8 Hours', val: 8 },
                      { label: '24 Hours', val: 24 },
                      { label: 'Unmute', val: null }
                    ].map(item => (
                      <button 
                        key={item.label} 
                        onClick={() => handleMute(item.val)}
                        disabled={isUpdatingPrefs}
                        className="p-3 text-sm font-semibold text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-slate-700 rounded-xl hover:border-brand-500 dark:hover:border-brand-400 hover:text-brand-600 dark:hover:text-brand-300 transition-all text-left flex items-center justify-between group disabled:opacity-50"
                      >
                        {item.label}
                        <CheckCircle2 size={16} className="text-brand-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'Appearance' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => toggleDarkMode(false)}
                    className={`p-4 md:p-6 rounded-3xl border-2 flex flex-col items-center gap-3 transition-all ${!darkMode ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-900/20 shadow-lg shadow-brand-50 dark:shadow-none' : 'border-slate-100 dark:border-slate-700 hover:border-slate-200 dark:hover:border-slate-600'}`}
                  >
                    <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${!darkMode ? 'bg-brand-100 dark:bg-brand-900/40 text-brand-600 dark:text-brand-400' : 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500'}`}>
                      <Sun size={24} />
                    </div>
                    <span className={`font-bold text-sm ${!darkMode ? 'text-brand-700 dark:text-brand-300' : 'text-slate-500 dark:text-slate-400'}`}>Light Mode</span>
                  </button>
                  <button 
                    onClick={() => toggleDarkMode(true)}
                    className={`p-4 md:p-6 rounded-3xl border-2 flex flex-col items-center gap-3 transition-all ${darkMode ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-900/20 shadow-lg shadow-brand-50 dark:shadow-none' : 'border-slate-100 dark:border-slate-700 hover:border-slate-200 dark:hover:border-slate-600'}`}
                  >
                    <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${darkMode ? 'bg-brand-100 dark:bg-brand-900/40 text-brand-600 dark:text-brand-400' : 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500'}`}>
                      <Moon size={24} />
                    </div>
                    <span className={`font-bold text-sm ${darkMode ? 'text-brand-700 dark:text-brand-300' : 'text-slate-500 dark:text-slate-400'}`}>Dark Mode</span>
                  </button>
                </div>
                <p className="text-center text-xs text-slate-400 italic">Theme changes apply immediately across the entire site.</p>
              </div>
            )}

            {activeTab === 'Security' && (
              <form onSubmit={handleUpdatePassword} className="space-y-6">
                <div className="space-y-4">
                  {passwordStatus.text && (
                    <div className={`p-4 rounded-xl text-sm font-medium ${passwordStatus.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                      {passwordStatus.text}
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 ml-1 uppercase tracking-wider">Current Password</label>
                    <div className="relative">
                      <input 
                        required
                        type={showPassword ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full pl-4 pr-12 py-3 bg-slate-50 dark:bg-slate-900/50 border border-transparent dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 transition-all outline-none"
                        placeholder="••••••••"
                      />
                      <button 
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 ml-1 uppercase tracking-wider">New Password</label>
                    <input 
                      required
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-transparent dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 transition-all outline-none"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
                <button 
                  type="submit"
                  disabled={isUpdatingPassword}
                  className="w-full py-4 bg-slate-900 dark:bg-brand-600 text-white rounded-2xl font-bold hover:bg-slate-800 dark:hover:bg-brand-700 shadow-xl shadow-slate-100 dark:shadow-none transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isUpdatingPassword ? <Loader2 className="animate-spin" /> : <Lock size={18} />}
                  {isUpdatingPassword ? 'Updating...' : 'Update Password'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
