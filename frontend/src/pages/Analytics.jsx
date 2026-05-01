import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import DashboardLayout from '../layouts/DashboardLayout';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { Activity, TrendingUp, PieChart as PieIcon, Loader2, Award, Users, MapPin } from 'lucide-react';
import api from '../services/api';

const CHART_HEIGHT = 300;
const COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'];

const isDark = () => document.documentElement.classList.contains('dark');

const tooltipStyle = () => ({
  borderRadius: '12px',
  border: 'none',
  boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.15)',
  backgroundColor: isDark() ? '#1e293b' : '#fff',
  color: isDark() ? '#f1f5f9' : '#1e293b',
  fontSize: '13px',
});

const Analytics = () => {
  const { user } = useContext(AuthContext);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const endpoint = user.role === 'admin' ? '/analytics/admin' : '/analytics/student';
        const res = await api.get(endpoint);
        setData(res.data);
      } catch (err) {
        console.error('Failed to fetch analytics');
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [user.role]);

  if (loading) return (
    <DashboardLayout>
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-12 h-12 animate-spin text-brand-600 mb-4" />
        <p className="text-slate-500 font-medium">Preparing your insights...</p>
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in-up">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 transition-colors">Performance Analytics</h1>
          <p className="text-slate-500 dark:text-slate-400">Visual insights into your academic journey</p>
        </div>

        {user.role === 'student' && data && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Subject Wise Attendance Bar Chart */}
              <div className="card p-6 border-t-4 border-indigo-500">
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-6 flex items-center gap-2">
                  <Activity className="text-indigo-500" size={20} /> Subject-wise Attendance (%)
                </h3>
                <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
                  <BarChart data={data.attendanceStats}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--chart-grid, #f1f5f9)" />
                    <XAxis dataKey="subject" axisLine={false} tickLine={false} tick={{ fill: 'var(--chart-tick, #94a3b8)', fontSize: 12 }} />
                    <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: 'var(--chart-tick, #94a3b8)', fontSize: 12 }} />
                    <Tooltip contentStyle={tooltipStyle()} />
                    <Bar dataKey="percentage" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Attendance Trend Line Chart */}
              <div className="card p-6 border-t-4 border-brand-500">
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-6 flex items-center gap-2">
                  <TrendingUp className="text-brand-500" size={20} /> Monthly Attendance Trend
                </h3>
                <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
                  <AreaChart data={data.overallTrend}>
                    <defs>
                      <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ec4899" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--chart-grid, #f1f5f9)" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: 'var(--chart-tick, #94a3b8)', fontSize: 12 }} />
                    <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: 'var(--chart-tick, #94a3b8)', fontSize: 12 }} />
                    <Tooltip contentStyle={tooltipStyle()} />
                    <Area type="monotone" dataKey="attendance" stroke="#ec4899" strokeWidth={3} fillOpacity={1} fill="url(#colorTrend)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div className="card p-6 bg-indigo-50 dark:bg-indigo-900/20 border-none transition-colors">
                  <Award className="h-10 w-10 text-indigo-600 dark:text-indigo-400 mb-2" />
                  <h4 className="text-slate-500 dark:text-slate-400 text-sm font-medium">Top Performer</h4>
                  <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">Advanced AI</p>
               </div>
               <div className="card p-6 bg-emerald-50 dark:bg-emerald-900/20 border-none transition-colors">
                  <TrendingUp className="h-10 w-10 text-emerald-600 dark:text-emerald-400 mb-2" />
                  <h4 className="text-slate-500 dark:text-slate-400 text-sm font-medium">Avg. Attendance</h4>
                  <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">82.5%</p>
               </div>
               <div className="card p-6 bg-rose-50 dark:bg-rose-900/20 border-none transition-colors">
                  <Activity className="h-10 w-10 text-rose-600 dark:text-rose-400 mb-2" />
                  <h4 className="text-slate-500 dark:text-slate-400 text-sm font-medium">Target to 100%</h4>
                  <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">17.5%</p>
               </div>
            </div>
          </>
        )}

        {user.role === 'admin' && data && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* User Distribution Pie Chart */}
            <div className="card p-6">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-6 flex items-center gap-2">
                <Users className="text-blue-500" size={20} /> User Distribution
              </h3>
              <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
                <PieChart>
                  <Pie
                    data={data.userDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="count"
                    nameKey="role"
                    label
                  >
                    {data.userDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle()} />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Department Distribution Bar Chart */}
            <div className="card p-6">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-6 flex items-center gap-2">
                <MapPin className="text-emerald-500" size={20} /> Department Stats
              </h3>
              <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
                <BarChart data={data.departmentDistribution} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--chart-grid, #f1f5f9)" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="department" type="category" axisLine={false} tickLine={false} width={80} tick={{ fill: 'var(--chart-tick, #94a3b8)', fontSize: 12 }} />
                  <Tooltip contentStyle={tooltipStyle()} />
                  <Bar dataKey="count" fill="#10b981" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {!data && !loading && (
          <div className="py-20 text-center bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700">
            <Activity className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <p className="text-slate-500 dark:text-slate-400 font-medium">No analytics data available yet.</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Analytics;
