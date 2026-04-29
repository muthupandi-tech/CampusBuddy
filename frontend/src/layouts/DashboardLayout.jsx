import React, { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  MessageSquare, 
  LogOut, 
  User, 
  Settings,
  BarChart3,
  Library
} from 'lucide-react';
import NotificationBell from '../components/NotificationBell';
import Chatbot from '../components/Chatbot';
import UserMenu from '../components/UserMenu';

const DashboardLayout = ({ children }) => {
  const { user } = useContext(AuthContext);
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Analytics', path: '/analytics', icon: BarChart3 },
    { name: 'Classrooms', path: '/classrooms', icon: Library },
    { name: 'Messages', path: '/messages', icon: MessageSquare },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex transition-colors duration-300">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 hidden md:flex flex-col transition-colors duration-300">
        <div className="h-16 flex items-center px-6 border-b border-slate-200 dark:border-slate-700">
          <span className="text-xl font-bold tracking-tight text-brand-600 dark:text-brand-400">CampusBuddy</span>
        </div>
        
        <div className="flex-1 py-6 px-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 font-medium' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <item.icon className={`w-5 h-5 ${isActive ? 'text-brand-600' : 'text-slate-400'}`} />
                <span>{item.name}</span>
              </Link>
            )
          })}
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-slate-700">
          <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-4 flex items-center space-x-3 transition-colors duration-300">
             <div className="h-10 w-10 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center text-brand-600 dark:text-brand-400 font-bold border-2 border-white dark:border-slate-800 overflow-hidden">
                {user?.avatar_url ? <img src={user.avatar_url} className="h-full w-full object-cover" /> : user?.name?.charAt(0)}
             </div>
             <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{user?.name}</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate capitalize">{user?.role}</p>
             </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="h-16 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-6 lg:px-8 transition-colors duration-300">
          <div className="flex items-center md:hidden">
             <span className="text-xl font-bold tracking-tight text-brand-600 dark:text-brand-400">CB</span>
          </div>
          
          <div className="flex-1 flex justify-end items-center space-x-4">
            <NotificationBell />
            <UserMenu />
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-6 lg:p-8">
          <div className="max-w-7xl mx-auto animate-fade-in-up">
            {children}
          </div>
        </div>
      </main>
      
      <Chatbot />
      
      {/* Mobile Nav Bar - Simple Bottom Bar for MVP */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex justify-around p-2 z-[40]">
         {navItems.map((item) => (
           <Link key={item.name} to={item.path} className={`p-2 rounded-lg flex flex-col items-center ${location.pathname.startsWith(item.path) ? 'text-brand-600 dark:text-brand-400' : 'text-slate-500 dark:text-slate-400'}`}>
             <item.icon className="w-6 h-6 mb-1"/>
             <span className="text-[10px]">{item.name}</span>
           </Link>
         ))}
          <div className="p-2">
             <UserMenu />
          </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
