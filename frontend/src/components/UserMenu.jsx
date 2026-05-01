import React, { useState, useRef, useEffect, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { 
  User, 
  Settings, 
  MessageSquare, 
  LogOut, 
  ChevronDown, 
  Edit3,
  Moon,
  Sun,
  Bell,
  Lock,
  X
} from 'lucide-react';
import api from '../services/api';
import EditProfileModal from './EditProfileModal';
import SettingsModal from './SettingsModal';
import FeedbackModal from './FeedbackModal';
import LogoutModal from './LogoutModal';

const UserMenu = () => {
  const { user, logout } = useContext(AuthContext);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showLogout, setShowLogout] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const menuItems = [
    { 
      label: 'Profile', 
      icon: User, 
      description: 'View & Edit Profile',
      onClick: () => { setShowEditProfile(true); setIsOpen(false); }
    },
    { 
      label: 'Settings', 
      icon: Settings, 
      description: 'App preferences',
      onClick: () => { setShowSettings(true); setIsOpen(false); }
    },
    { 
      label: 'Feedback', 
      icon: MessageSquare, 
      description: 'Send us your thoughts',
      onClick: () => { setShowFeedback(true); setIsOpen(false); }
    },
  ];

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200 group"
      >
        <div className="h-9 w-9 rounded-full bg-brand-100 border-2 border-white shadow-sm flex items-center justify-center text-brand-600 font-bold overflow-hidden">
          {user?.avatar_url ? (
            <img src={user.avatar_url} alt="Profile" className="h-full w-full object-cover" />
          ) : (
            user?.name?.charAt(0).toUpperCase()
          )}
        </div>
        <div className="hidden sm:block text-left">
          <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-none">{user?.name}</p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 capitalize">
            {user?.role} {user?.admin_department || user?.department ? `• ${user?.admin_department || user?.department}` : ''}
          </p>
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-72 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 py-2 z-[9999] animate-fade-in-up origin-top-right">
          {/* User Info Section */}
          <div className="px-4 py-3 border-b border-slate-50 dark:border-slate-700/50">
            <div className="flex items-center space-x-3">
              <div className="h-12 w-12 rounded-full bg-brand-50 flex items-center justify-center text-brand-600 font-bold text-lg overflow-hidden border border-brand-100">
                {user?.avatar_url ? (
                   <img src={user.avatar_url} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  user?.name?.charAt(0).toUpperCase()
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">{user?.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
                <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-brand-50 dark:bg-brand-900/40 text-brand-600 dark:text-brand-300 uppercase tracking-wider">
                  {user?.role}
                </span>
              </div>
            </div>
          </div>

          {/* Menu Sections */}
          <div className="py-2">
            {menuItems.map((item, idx) => (
              <button
                key={idx}
                onClick={item.onClick}
                className="w-full flex items-center px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group"
              >
                <div className="h-9 w-9 rounded-lg bg-slate-50 dark:bg-slate-700/50 group-hover:bg-brand-50 dark:group-hover:bg-brand-900/30 flex items-center justify-center transition-colors">
                  <item.icon className="w-5 h-5 text-slate-500 dark:text-slate-400 group-hover:text-brand-600 dark:group-hover:text-brand-400" />
                </div>
                <div className="ml-3 text-left">
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-slate-100">{item.label}</p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500">{item.description}</p>
                </div>
              </button>
            ))}
          </div>

          <div className="border-t border-slate-50 dark:border-slate-700/50 mt-1 pt-2 px-2">
            <button
              onClick={() => { setShowLogout(true); setIsOpen(false); }}
              className="w-full flex items-center px-3 py-2.5 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors group"
            >
              <div className="h-9 w-9 rounded-lg bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center">
                <LogOut className="w-5 h-5" />
              </div>
              <span className="ml-3 text-sm font-bold">Logout</span>
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      {showEditProfile && <EditProfileModal onClose={() => setShowEditProfile(false)} />}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
      {showFeedback && <FeedbackModal onClose={() => setShowFeedback(false)} />}
      {showLogout && <LogoutModal onClose={() => setShowLogout(false)} />}
    </div>
  );
};

export default UserMenu;
