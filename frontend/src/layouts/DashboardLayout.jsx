import React, { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  MessageSquare, 
  LogOut, 
  User, 
  Settings,
  BarChart3
} from 'lucide-react';
import NotificationBell from '../components/NotificationBell';
import Chatbot from '../components/Chatbot';

const DashboardLayout = ({ children }) => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Analytics', path: '/analytics', icon: BarChart3 },
    { name: 'Messages', path: '/messages', icon: MessageSquare },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-slate-200">
          <span className="text-xl font-bold tracking-tight text-brand-600">CampusBuddy</span>
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
                    ? 'bg-brand-50 text-brand-600 font-medium' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <item.icon className={`w-5 h-5 ${isActive ? 'text-brand-600' : 'text-slate-400'}`} />
                <span>{item.name}</span>
              </Link>
            )
          })}
        </div>

        <div className="p-4 border-t border-slate-200">
          <button 
            onClick={handleLogout}
            className="flex items-center space-x-3 text-slate-600 hover:text-red-600 hover:bg-red-50 w-full px-4 py-3 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 lg:px-8">
          <div className="flex items-center md:hidden">
             <span className="text-xl font-bold tracking-tight text-brand-600">CB</span>
          </div>
          
          <div className="flex-1 flex justify-end items-center space-x-4">
            <NotificationBell />
            <div className="h-8 w-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-bold border border-brand-200">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
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
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around p-2">
         {navItems.map((item) => (
           <Link key={item.name} to={item.path} className={`p-2 rounded-lg flex flex-col items-center ${location.pathname.startsWith(item.path) ? 'text-brand-600' : 'text-slate-500'}`}>
             <item.icon className="w-6 h-6 mb-1"/>
             <span className="text-[10px]">{item.name}</span>
           </Link>
         ))}
         <button onClick={handleLogout} className="p-2 rounded-lg flex flex-col items-center text-slate-500 hover:text-red-600">
            <LogOut className="w-6 h-6 mb-1"/>
            <span className="text-[10px]">Logout</span>
         </button>
      </div>
    </div>
  );
};

export default DashboardLayout;
