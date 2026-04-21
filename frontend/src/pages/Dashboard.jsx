import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import DashboardLayout from '../layouts/DashboardLayout';
import { BookOpen, UserCheck, Users, Activity, MessageSquare, Loader2 } from 'lucide-react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.get('/users/student/dashboard');
        setData(res.data);
      } catch (err) {
        setError('Failed to load student dashboard data.');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-brand-600">
        <Loader2 className="w-12 h-12 animate-spin mb-4" />
        <p className="font-medium text-slate-600">Loading your academic profile...</p>
      </div>
    );
  }

  if (error) {
    return <div className="text-center py-10 text-red-500 font-medium">{error}</div>;
  }

  const { user, attendance, subjects } = data;

  return (
    <div className="space-y-6 animate-fade-in-up">
      <h1 className="text-2xl font-bold text-slate-800">Student Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="card p-6 flex flex-col items-center text-center">
          <div className="h-20 w-20 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 text-3xl font-bold mb-4 shadow-inner">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <h2 className="text-xl font-bold text-slate-800">{user.name}</h2>
          <p className="text-slate-500 mb-2">{user.email || user.phone}</p>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 uppercase tracking-wider">
            {user.department} • Year {user.year}
          </span>
        </div>

        {/* Attendance Card */}
        <div className="card p-6 flex flex-col justify-center items-center text-center col-span-1 md:col-span-2">
           <UserCheck className={`h-10 w-10 mb-3 ${attendance >= 75 ? 'text-emerald-500' : 'text-amber-500'}`} />
           <h3 className="text-lg font-medium text-slate-600">Overall Attendance</h3>
           
           <div className="w-full max-w-sm mt-4">
             <div className="flex justify-between text-sm font-medium mb-1">
               <span className="text-slate-600">Progress</span>
               <span className={attendance >= 75 ? 'text-emerald-600' : 'text-amber-600'}>{attendance}%</span>
             </div>
             <div className="w-full bg-slate-100 rounded-full h-3 flex overflow-hidden">
               <div 
                 className={`h-3 rounded-full transition-all duration-1000 ${attendance >= 75 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                 style={{ width: `${attendance}%` }}
               ></div>
             </div>
           </div>
           
           <p className="mt-3 text-sm text-slate-500">
             {attendance >= 75 ? 'You are above the 75% minimum required.' : 'Warning: You are below the 75% minimum threshold.'}
           </p>
        </div>
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
          <h3 className="text-lg font-bold text-slate-800 flex items-center">
            <BookOpen className="h-5 w-5 mr-2 text-brand-500" /> Subject Breakdown
          </h3>
          <button 
            onClick={() => navigate('/messages')} 
            className="btn-secondary text-sm flex items-center transition-transform hover:scale-105"
          >
            <MessageSquare className="w-4 h-4 mr-2" /> Message Staff
          </button>
        </div>
        
        {subjects.length === 0 ? (
          <p className="text-slate-500 text-center py-4">No subjects registered for this semester.</p>
        ) : (
          <div className="space-y-4">
            {subjects.map((sub, idx) => (
              <div key={idx} className="p-4 rounded-xl border border-slate-100 hover:shadow-md transition-shadow bg-white flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <p className="text-base font-bold text-slate-800">{sub.name}</p>
                  <p className="text-sm font-medium text-brand-600 mt-1">{sub.code}</p>
                </div>
                
                <div className="flex-1 max-w-xs w-full">
                  <div className="flex justify-between text-xs font-medium mb-1">
                    <span className="text-slate-500">Attendance</span>
                    <span className="text-slate-700">{sub.attendance_percentage}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${sub.attendance_percentage >= 75 ? 'bg-emerald-400' : 'bg-amber-400'}`}
                      style={{ width: `${sub.attendance_percentage}%` }}
                    ></div>
                  </div>
                </div>

                <div className="text-right ml-4">
                  <span className="inline-flex items-center justify-center px-3 py-1 text-sm font-medium bg-slate-100 text-slate-600 rounded-lg">
                    {sub.credits} Credits
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const StaffDashboard = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.get('/users/staff/dashboard');
        setData(res.data);
      } catch (err) {
        setError('Failed to load staff dashboard data.');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-purple-600">
        <Loader2 className="w-12 h-12 animate-spin mb-4" />
        <p className="font-medium text-slate-600">Loading staff tools...</p>
      </div>
    );
  }

  if (error) {
    return <div className="text-center py-10 text-red-500 font-medium">{error}</div>;
  }

  const { user, subjectsHandled } = data;

  return (
    <div className="space-y-6 animate-fade-in-up">
       <h1 className="text-2xl font-bold text-slate-800">Faculty Dashboard</h1>
       
       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6 flex flex-col items-center text-center">
          <div className="h-20 w-20 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 text-3xl font-bold mb-4 shadow-inner">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <h2 className="text-xl font-bold text-slate-800">{user.name}</h2>
          <p className="text-slate-500 mb-2">{user.email || user.phone}</p>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 uppercase tracking-wider">
            Department of {user.department}
          </span>
        </div>

        <div className="card p-6 col-span-1 md:col-span-2 flex flex-col justify-center">
           <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3 mb-4 flex items-center">
             <BookOpen className="h-5 w-5 mr-2 text-purple-500" /> Subjects Assigned
           </h3>
           {subjectsHandled.length === 0 ? (
             <p className="text-slate-500 text-center py-4">No subjects assigned currently.</p>
           ) : (
             <div className="grid gap-4 sm:grid-cols-2">
                {subjectsHandled.map((sub, idx) => (
                  <div key={idx} className="flex justify-between items-center p-4 rounded-xl hover:shadow-md transition-shadow border border-slate-100 bg-white">
                    <div>
                      <p className="font-bold text-slate-800">{sub.name}</p>
                      <p className="text-sm font-medium text-purple-600 mt-1">{sub.code}</p>
                    </div>
                    <div className="text-center px-3 py-2 bg-slate-50 rounded-lg">
                      <p className="text-xl font-extrabold text-slate-700">{sub.students}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Students</p>
                    </div>
                  </div>
                ))}
             </div>
           )}
        </div>
      </div>

      <div className="mt-8 flex justify-center">
          <button 
            onClick={() => navigate('/messages')}
            className="btn-primary bg-purple-600 hover:bg-purple-700 w-full md:w-auto shadow-md hover:shadow-lg flex items-center justify-center py-4 px-8 text-lg rounded-xl transition-all hover:-translate-y-1"
          >
            <MessageSquare className="mr-3" /> Connect With Students
          </button>
      </div>
    </div>
  );
};

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/users/stats');
        setStats(res.data);
      } catch (error) {
        console.error("Failed to fetch admin stats", error);
      }
      setLoading(false);
    };
    fetchStats();
  }, []);

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 text-indigo-600">
      <Loader2 className="w-12 h-12 animate-spin mb-4" />
      <p className="font-medium text-slate-600">Gathering administrative data...</p>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in-up">
      <h1 className="text-2xl font-bold text-slate-800">Admin Overview</h1>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
         <div className="card p-6 flex flex-col justify-center items-center">
            <Users className="h-10 w-10 text-indigo-500 mb-3" />
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Total Users</h3>
            <p className="text-4xl font-extrabold text-slate-800 mt-2">{stats?.totalUsers || 0}</p>
         </div>

         {stats?.roleStats?.map(role => (
           <div key={role.role} className="card p-6 flex flex-col justify-center items-center">
              <UserCheck className="h-10 w-10 text-slate-400 mb-3" />
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest">{role.role}s</h3>
              <p className="text-4xl font-extrabold text-slate-800 mt-2">{role.count}</p>
           </div>
         ))}
      </div>

      <div className="card p-6">
        <h3 className="text-lg font-bold text-slate-800 flex items-center border-b border-slate-100 pb-4 mb-4">
          <Activity className="h-5 w-5 mr-2 text-indigo-500" /> Recent Activity Log
        </h3>
        <div className="space-y-3">
          {stats?.recentActivity?.map(act => (
            <div key={act.id} className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-4 rounded-xl bg-slate-50 border border-transparent hover:border-indigo-100 hover:bg-indigo-50/50 transition-all">
              <span className="text-sm text-slate-700 font-medium">{act.text}</span>
              <span className="text-xs font-semibold text-slate-400 mt-2 sm:mt-0 px-2 py-1 bg-white rounded-md shadow-sm">{act.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const Dashboard = () => {
  const { user } = useContext(AuthContext);

  if (!user) return null;

  return (
    <DashboardLayout>
      {user.role === 'student' && <StudentDashboard />}
      {user.role === 'staff' && <StaffDashboard />}
      {user.role === 'admin' && <AdminDashboard />}
    </DashboardLayout>
  );
};

export default Dashboard;
