import React, { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogOut, X } from 'lucide-react';

const LogoutModal = ({ onClose }) => {
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-zoom-in transition-colors duration-300">
        <div className="p-6 text-center">
          <div className="h-16 w-16 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <LogOut size={32} />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">Ready to Leave?</h3>
          <p className="text-slate-500 dark:text-slate-400 mb-8">Are you sure you want to log out of your session? You will need to log in again to access your account.</p>
          
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
            >
              Stay Logged In
            </button>
            <button
              onClick={handleLogout}
              className="flex-1 py-3 px-4 rounded-xl bg-rose-600 text-white font-bold hover:bg-rose-700 shadow-lg shadow-rose-200 dark:shadow-none transition-all"
            >
              Yes, Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogoutModal;
