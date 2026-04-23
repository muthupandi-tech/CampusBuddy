import React, { useState } from 'react';
import { X, Bell, Moon, Sun, Lock, Shield, CheckCircle2, Volume2, Eye, EyeOff } from 'lucide-react';

const SettingsModal = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState('Notifications');
  const [notifs, setNotifs] = useState(true);
  const [darkMode, setDarkMode] = useState(() => document.documentElement.classList.contains('dark'));
  const [showPassword, setShowPassword] = useState(false);

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
          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-6">Settings</h3>
          <div className="space-y-2">
            {tabs.map((tab) => (
              <button
                key={tab.name}
                onClick={() => setActiveTab(tab.name)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl transition-all ${
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
        <div className="flex-1 p-8">
          <div className="flex items-center justify-between mb-8 md:hidden">
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">{activeTab}</h3>
            <button onClick={onClose} className="p-2 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-colors">
              <X size={20} className="text-slate-400" />
            </button>
          </div>
          
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
                    onClick={() => setNotifs(!notifs)}
                    className={`w-12 h-6 rounded-full transition-all relative ${notifs ? 'bg-brand-600' : 'bg-slate-300 dark:bg-slate-600'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${notifs ? 'right-1' : 'left-1'}`} />
                  </button>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Mute Notifications</label>
                  <div className="grid grid-cols-2 gap-3">
                    {['1 Hour', '8 Hours', 'Until Tomorrow', 'Indefinitely'].map(time => (
                      <button key={time} className="p-3 text-sm font-semibold text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-slate-700 rounded-xl hover:border-brand-500 dark:hover:border-brand-400 hover:text-brand-600 dark:hover:text-brand-300 transition-all text-left flex items-center justify-between group">
                        {time}
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
                    className={`p-6 rounded-3xl border-2 flex flex-col items-center gap-3 transition-all ${!darkMode ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-900/20 shadow-lg shadow-brand-50 dark:shadow-none' : 'border-slate-100 dark:border-slate-700 hover:border-slate-200 dark:hover:border-slate-600'}`}
                  >
                    <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${!darkMode ? 'bg-brand-100 dark:bg-brand-900/40 text-brand-600 dark:text-brand-400' : 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500'}`}>
                      <Sun size={24} />
                    </div>
                    <span className={`font-bold text-sm ${!darkMode ? 'text-brand-700 dark:text-brand-300' : 'text-slate-500 dark:text-slate-400'}`}>Light Mode</span>
                  </button>
                  <button 
                    onClick={() => toggleDarkMode(true)}
                    className={`p-6 rounded-3xl border-2 flex flex-col items-center gap-3 transition-all ${darkMode ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-900/20 shadow-lg shadow-brand-50 dark:shadow-none' : 'border-slate-100 dark:border-slate-700 hover:border-slate-200 dark:hover:border-slate-600'}`}
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
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 ml-1 uppercase tracking-wider">Current Password</label>
                    <div className="relative">
                      <input 
                        type={showPassword ? 'text' : 'password'}
                        className="w-full pl-4 pr-12 py-3 bg-slate-50 dark:bg-slate-900/50 border border-transparent dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 transition-all"
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
                      type="password"
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-transparent dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 transition-all"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
                <button className="w-full py-4 bg-slate-900 dark:bg-brand-600 text-white rounded-2xl font-bold hover:bg-slate-800 dark:hover:bg-brand-700 shadow-xl shadow-slate-100 dark:shadow-none transition-all flex items-center justify-center gap-2">
                  <Lock size={18} />
                  Update Password
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
