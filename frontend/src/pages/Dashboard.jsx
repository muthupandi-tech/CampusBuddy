import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import DashboardLayout from '../layouts/DashboardLayout';
import { BookOpen, UserCheck, Users, Activity, MessageSquare, Loader2, Calendar, Megaphone, FileText, UploadCloud, DownloadCloud, Eye, Image as ImageIcon, Play, File } from 'lucide-react';
import ResourceViewer from '../components/ResourceViewer';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

const StudentDashboard = () => {
  const { user: authUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [annHistory, setAnnHistory] = useState([]);
  const [events, setEvents] = useState([]);
  const [evtHistory, setEvtHistory] = useState([]);
  const [resources, setResources] = useState([]);
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [resourceFilter, setResourceFilter] = useState('all');
  const [selectedResource, setSelectedResource] = useState(null);
  const [annTab, setAnnTab] = useState('active'); // 'active' or 'history'
  const [evtTab, setEvtTab] = useState('active'); // 'active' or 'history'

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [resDash, resAnn, resEvt, resRes, resAnnHist, resEvtHist] = await Promise.all([
          api.get('/users/student/dashboard'),
          api.get('/academic/announcements'),
          api.get('/academic/events'),
          api.get('/academic/resources/all'),
          api.get('/academic/announcements/history'),
          api.get('/academic/events/history')
        ]);
        
        const dashData = resDash.data;
        setData(dashData);
        setAnnouncements(resAnn.data);
        setAnnHistory(resAnnHist.data);
        setEvents(resEvt.data);
        setEvtHistory(resEvtHist.data);
        setResources(resRes.data);

        // Fetch Timetable based on user info
        if (dashData?.user?.department && dashData?.user?.year) {
           const ttRes = await api.get(`/academic/timetable?dept=${dashData.user.department}&year=${dashData.user.year}`);
           setTimetable(ttRes.data);
        }
      } catch (err) {
        setError('Failed to load student dashboard data.');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [authUser?.department, authUser?.year]);

  if (loading) return (
      <div className="flex flex-col items-center justify-center py-20 text-brand-600">
        <Loader2 className="w-12 h-12 animate-spin mb-4" />
        <p className="font-medium text-slate-600">Loading your academic profile...</p>
      </div>
  );

  if (error) return <div className="text-center py-10 text-red-500 font-medium">{error}</div>;

  const { user, attendance, subjects } = data;
  const filteredResources = resourceFilter === 'all' ? resources : resources.filter(r => r.subject_id.toString() === resourceFilter);

  return (
    <div className="space-y-8 animate-fade-in-up">
      <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 transition-colors">Student Dashboard</h1>
      
      {/* Top Banner Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6 flex flex-col items-center text-center">
          <div className="h-20 w-20 rounded-full bg-brand-100 dark:bg-brand-900/40 flex items-center justify-center text-brand-600 dark:text-brand-400 text-3xl font-bold mb-4 shadow-inner">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">{user.name}</h2>
          <span className="inline-flex mt-2 items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 uppercase tracking-wider">
            {user.department || 'Undergraduate'} • Year {user.year || 1}
          </span>
        </div>

        <div className="card p-6 flex flex-col justify-center items-center text-center col-span-1 md:col-span-2">
           <UserCheck className={`h-10 w-10 mb-3 ${attendance >= 75 ? 'text-emerald-500' : 'text-amber-500'}`} />
           <h3 className="text-lg font-medium text-slate-600 dark:text-slate-300">Overall Attendance</h3>
           <div className="w-full max-w-sm mt-4">
             <div className="flex justify-between text-sm font-medium mb-1">
               <span className="text-slate-600 dark:text-slate-400">Progress</span>
               <span className={attendance >= 75 ? 'text-emerald-600' : 'text-amber-600'}>{attendance}%</span>
             </div>
             <div className="w-full bg-slate-100 rounded-full h-3 flex overflow-hidden">
               <div className={`h-3 rounded-full transition-all duration-1000 ${attendance >= 75 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                 style={{ width: `${attendance}%` }}></div>
             </div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Announcements */}
        <div className="card p-4 border-t-4 border-indigo-500 flex flex-col max-h-[350px] min-h-[200px]">
           <div className="flex items-center justify-between mb-2">
             <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center">
               <Megaphone className="h-5 w-5 mr-2 text-indigo-500" /> Announcements
             </h3>
             <div className="flex bg-slate-100 dark:bg-slate-900/50 p-1 rounded-lg">
               <button 
                 onClick={() => setAnnTab('active')}
                 className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${annTab === 'active' ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
               >
                 Active
               </button>
               <button 
                 onClick={() => setAnnTab('history')}
                 className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${annTab === 'history' ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
               >
                 History
               </button>
             </div>
           </div>
           
           <div className="space-y-3 overflow-y-auto pr-2 flex-1 scrollbar-thin">
             {(annTab === 'active' ? announcements : annHistory).length === 0 ? (
               <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 opacity-60">
                 <Megaphone size={40} className="mb-2" />
                 <p className="text-sm">No {annTab} announcements.</p>
               </div>
             ) : (annTab === 'active' ? announcements : annHistory).map(ann => {
               const isNew = (new Date() - new Date(ann.created_at)) < (6 * 60 * 60 * 1000);
               const date = new Date(ann.created_at);
               const day = date.getDate();
               const month = date.toLocaleString('default', { month: 'short' });

               return (
                 <div key={ann.id} className={`group p-3 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 transition-all hover:shadow-md hover:border-indigo-100 dark:hover:border-indigo-900 relative bg-white dark:bg-slate-800/40 ${annTab === 'history' ? 'opacity-75 grayscale-[0.3]' : ''}`}>
                   {isNew && annTab === 'active' && (
                     <span className="absolute top-2 right-2 bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg animate-bounce z-10">
                       NEW
                     </span>
                   )}
                   <div className="flex items-start gap-3">
                     <div className="flex flex-col items-center justify-center min-w-[50px] h-[50px] bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl font-bold border border-indigo-100 dark:border-indigo-800">
                       <span className="text-lg leading-none">{day}</span>
                       <span className="text-[10px] uppercase tracking-tighter">{month}</span>
                     </div>
                     <div className="flex-1">
                       <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{ann.title}</h4>
                       <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">{ann.description}</p>
                       <div className="mt-3 flex items-center justify-between text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                         <span>{ann.posted_role}</span>
                         <span>{ann.posted_by_name}</span>
                       </div>
                     </div>
                   </div>
                 </div>
               );
             })}
           </div>
        </div>

        {/* Events */}
        <div className="card p-4 border-t-4 border-brand-500 flex flex-col max-h-[350px] min-h-[200px]">
           <div className="flex items-center justify-between mb-2">
             <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center">
               <Calendar className="h-5 w-5 mr-2 text-brand-500" /> Campus Events
             </h3>
             <div className="flex bg-slate-100 dark:bg-slate-900/50 p-1 rounded-lg">
               <button 
                 onClick={() => setEvtTab('active')}
                 className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${evtTab === 'active' ? 'bg-white dark:bg-slate-800 text-brand-600 dark:text-brand-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
               >
                 Active
               </button>
               <button 
                 onClick={() => setEvtTab('history')}
                 className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${evtTab === 'history' ? 'bg-white dark:bg-slate-800 text-brand-600 dark:text-brand-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
               >
                 History
               </button>
             </div>
           </div>

           <div className="space-y-3 overflow-y-auto pr-2 flex-1 scrollbar-thin">
             {(evtTab === 'active' ? events : evtHistory).length === 0 ? (
               <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 opacity-60">
                 <Calendar size={40} className="mb-2" />
                 <p className="text-sm">No {evtTab} events.</p>
               </div>
             ) : (evtTab === 'active' ? events : evtHistory).map(ev => {
               const date = new Date(ev.event_date);
               const day = date.getDate();
               const month = date.toLocaleString('default', { month: 'short' });

               return (
                 <div key={ev.id} className={`group flex border-l-4 border-brand-400 dark:border-brand-500 bg-white dark:bg-slate-800/40 shadow-sm p-3 rounded-r-2xl transition-all hover:shadow-md hover:translate-x-1 ${evtTab === 'history' ? 'opacity-75 grayscale-[0.3]' : ''}`}>
                   <div className="flex-1">
                     <h4 className="font-bold text-slate-800 dark:text-slate-100 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">{ev.title}</h4>
                     <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{ev.description}</p>
                     <p className="text-xs font-bold text-brand-600 dark:text-brand-400 mt-3 inline-flex items-center bg-brand-50 dark:bg-brand-900/30 px-2 py-1 rounded-lg">
                       📍 {ev.location}
                     </p>
                   </div>
                   <div className="ml-4 flex flex-col items-center justify-center bg-brand-50 dark:bg-brand-900/30 p-2 rounded-2xl text-brand-700 dark:text-brand-300 min-w-[70px] border border-brand-100 dark:border-brand-800">
                     <span className="text-2xl font-black leading-none">{day}</span>
                     <span className="text-xs font-bold uppercase tracking-tighter">{month}</span>
                   </div>
                 </div>
               );
             })}
           </div>
        </div>
      </div>

      {/* Timetable */}
      <div className="card p-6">
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center mb-6">
          <Activity className="h-5 w-5 mr-2 text-emerald-500" /> Weekly Timetable
        </h3>
        {timetable.length === 0 ? (
          <p className="text-slate-500 dark:text-slate-400 text-center py-4">No timetable data mapped for your year/department.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50 border-y border-slate-200 dark:border-slate-700">
                  <th className="py-3 px-4 font-bold text-slate-600 dark:text-slate-400 text-sm">Day</th>
                  <th className="py-3 px-4 font-bold text-slate-600 dark:text-slate-400 text-sm">Time Slot</th>
                  <th className="py-3 px-4 font-bold text-slate-600 dark:text-slate-400 text-sm">Subject</th>
                  <th className="py-3 px-4 font-bold text-slate-600 dark:text-slate-400 text-sm">Code</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {timetable.map((slot, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors border-b border-slate-100 dark:border-slate-700/50">
                    <td className="py-3 px-4 text-sm font-semibold text-slate-800 dark:text-slate-200">{slot.day}</td>
                    <td className="py-3 px-4 text-sm text-brand-600 dark:text-brand-400 font-medium">{slot.time_slot}</td>
                    <td className="py-3 px-4 text-sm text-slate-700 dark:text-slate-300">{slot.subject_name}</td>
                    <td className="py-3 px-4 text-sm text-slate-500 dark:text-slate-400">{slot.subject_code}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Resources & Subjects */}
      <div className="card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 border-b border-slate-100 pb-4 gap-4">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center">
            <FileText className="h-5 w-5 mr-2 text-rose-500" /> Study Resources
          </h3>
          <select 
            value={resourceFilter} 
            onChange={(e) => setResourceFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring focus:ring-brand-200 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none transition-all"
          >
            <option value="all" className="dark:bg-slate-800">All Subjects</option>
            {subjects.map(s => <option key={s.code} value={s.id} className="dark:bg-slate-800">{s.name} ({s.code})</option>)}
          </select>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {filteredResources.length === 0 ? (
            <p className="text-slate-500 dark:text-slate-400 text-sm col-span-full text-center py-8">No resources uploaded yet.</p>
          ) : filteredResources.map(res => {
            const ext = res.file_url.split('.').pop().toLowerCase();
            const isImage = ['jpg', 'jpeg', 'png', 'gif'].includes(ext);
            const isVideo = ['mp4', 'webm', 'ogg'].includes(ext);
            const isPdf = ext === 'pdf';

            return (
              <div key={res.id} className="group border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex flex-col justify-between hover:shadow-xl hover:border-brand-200 dark:hover:border-brand-900 transition-all bg-white dark:bg-slate-800/50 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                   <div className="h-2 w-2 rounded-full bg-brand-500 animate-pulse"></div>
                </div>
                <div>
                  <div className={`flex justify-center items-center h-16 w-16 rounded-2xl mb-4 transition-transform group-hover:scale-110 duration-300 ${
                    isPdf ? 'bg-rose-50 dark:bg-rose-900/30 text-rose-500 dark:text-rose-400' : 
                    isImage ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-500 dark:text-blue-400' : 
                    isVideo ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-500 dark:text-amber-400' : 
                    'bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                  }`}>
                    {isPdf && <FileText size={32} />}
                    {isImage && <ImageIcon size={32} />}
                    {isVideo && <Play size={32} />}
                    {!isPdf && !isImage && !isVideo && <File size={32} />}
                  </div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm mb-1 line-clamp-2 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">{res.title}</h4>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">{res.subject_name}</p>
                </div>
                <button 
                  onClick={() => setSelectedResource(res)}
                  className="w-full flex items-center justify-center text-sm font-bold text-white bg-slate-800 dark:bg-slate-700 hover:bg-brand-600 dark:hover:bg-brand-500 py-2.5 rounded-xl transition-all gap-2 shadow-lg shadow-slate-100 dark:shadow-none"
                >
                  <Eye size={16} /> View Resource
                </button>
              </div>
            );
          })}
        </div>

        {selectedResource && (
          <ResourceViewer 
            resource={selectedResource} 
            onClose={() => setSelectedResource(null)} 
          />
        )}
      </div>
    </div>
  );
};

const StaffDashboard = () => {
  const { user: authUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [annTitle, setAnnTitle] = useState('');
  const [annDesc, setAnnDesc] = useState('');
  const [resTitle, setResTitle] = useState('');
  const [resSubject, setResSubject] = useState('');
  const [resFile, setResFile] = useState(null);
  const [statusMsg, setStatusMsg] = useState({ text: '', type: '' });

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.get('/users/staff/dashboard');
        setData(res.data);
      } catch (err) {
        console.error('Failed to load staff dashboard.');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [authUser?.department]);

  const handlePostAnnouncement = async (e) => {
    e.preventDefault();
    try {
      await api.post('/academic/announcements', { title: annTitle, description: annDesc });
      setStatusMsg({ text: 'Announcement posted successfully!', type: 'success' });
      setAnnTitle(''); setAnnDesc('');
    } catch {
      setStatusMsg({ text: 'Failed to post announcement.', type: 'error' });
    }
  };

  const handleUploadResource = async (e) => {
    e.preventDefault();
    if (!resFile || !resSubject) return setStatusMsg({ text: 'Subject and file are required.', type: 'error' });
    
    const formData = new FormData();
    formData.append('title', resTitle);
    formData.append('subject_id', resSubject);
    formData.append('file', resFile);

    try {
      await api.post('/academic/resources', formData);
      setStatusMsg({ text: 'Resource uploaded successfully!', type: 'success' });
      setResTitle(''); setResFile(null);
    } catch (err) {
      setStatusMsg({ text: err.response?.data?.error || 'Failed to upload resource.', type: 'error' });
    }
  };

  if (loading) return (
      <div className="flex flex-col items-center justify-center py-20 text-purple-600">
        <Loader2 className="w-12 h-12 animate-spin mb-4" />
        <p className="font-medium text-slate-600">Loading staff tools...</p>
      </div>
  );

  const { user, subjectsHandled } = data;

  return (
    <div className="space-y-6 animate-fade-in-up">
       <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Faculty Dashboard</h1>
       
       {statusMsg.text && (
         <div className={`p-4 rounded-lg font-medium text-sm ${statusMsg.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800' : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'}`}>
           {statusMsg.text}
         </div>
       )}

       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         {/* Manage Announcements Form */}
          <div className="card p-6 border-t-4 border-indigo-500">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center mb-4">
              <Megaphone className="h-5 w-5 mr-2 text-indigo-500" /> Post Announcement
            </h3>
           <form onSubmit={handlePostAnnouncement} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Title</label>
                <input type="text" required value={annTitle} onChange={e => setAnnTitle(e.target.value)} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring focus:ring-indigo-200 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100" placeholder="E.g., Tomorrow's class canceled" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
                <textarea required value={annDesc} onChange={e => setAnnDesc(e.target.value)} rows={3} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring focus:ring-indigo-200 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100" placeholder="Details..."></textarea>
              </div>
             <button type="submit" className="w-full bg-indigo-600 text-white font-medium py-2 rounded-lg hover:bg-indigo-700 transition">Post Announcement</button>
           </form>
         </div>

         {/* Upload Resources */}
          <div className="card p-6 border-t-4 border-rose-500">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center mb-4">
              <UploadCloud className="h-5 w-5 mr-2 text-rose-500" /> Upload Material
            </h3>
           <form onSubmit={handleUploadResource} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Material Title</label>
                <input type="text" required value={resTitle} onChange={e => setResTitle(e.target.value)} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring focus:ring-rose-200 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100" placeholder="E.g., Chapter 1 slides" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Target Subject</label>
                <select required value={resSubject} onChange={e => setResSubject(e.target.value)} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring focus:ring-rose-200 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                  <option value="" disabled className="dark:bg-slate-800">Select a subject</option>
                  {subjectsHandled.map(s => <option key={s.code} value={s.id} className="dark:bg-slate-800">{s.name} ({s.code})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Format (PDF, PPT, DOCX)</label>
                <input type="file" required onChange={e => setResFile(e.target.files[0])} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-rose-50 dark:file:bg-rose-900/40 file:text-rose-700 dark:file:text-rose-300 hover:file:bg-rose-100 dark:hover:file:bg-rose-900/60 transition-all text-slate-500" />
              </div>
             <button type="submit" className="w-full bg-rose-600 text-white font-medium py-2 rounded-lg hover:bg-rose-700 transition">Upload File</button>
           </form>
         </div>
       </div>

    </div>
  );
};

const AdminDashboard = () => {
  const [eventTitle, setEventTitle] = useState('');
  const [eventDesc, setEventDesc] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [annTitle, setAnnTitle] = useState('');
  const [annDesc, setAnnDesc] = useState('');
  const [statusMsg, setStatusMsg] = useState({ text: '', type: '' });

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    try {
      await api.post('/academic/events', { title: eventTitle, description: eventDesc, event_date: eventDate, location: eventLocation });
      setStatusMsg({ text: 'Event created globally!', type: 'success' });
      setEventTitle(''); setEventDesc(''); setEventDate(''); setEventLocation('');
    } catch {
      setStatusMsg({ text: 'Failed to create event.', type: 'error' });
    }
  };

  const handlePostAnnouncement = async (e) => {
    e.preventDefault();
    try {
      await api.post('/academic/announcements', { title: annTitle, description: annDesc });
      setStatusMsg({ text: 'Global announcement posted!', type: 'success' });
      setAnnTitle(''); setAnnDesc('');
    } catch {
      setStatusMsg({ text: 'Failed to post announcement.', type: 'error' });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Admin Control Panel</h1>
      
      {statusMsg.text && (
         <div className={`p-4 rounded-lg font-medium text-sm ${statusMsg.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800' : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'}`}>
           {statusMsg.text}
         </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         {/* Manage Announcements Form */}
          <div className="card p-6 border-t-4 border-indigo-500">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center mb-4">
              <Megaphone className="h-5 w-5 mr-2 text-indigo-500" /> Global Announcement
            </h3>
           <form onSubmit={handlePostAnnouncement} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Title</label>
                <input type="text" required value={annTitle} onChange={e => setAnnTitle(e.target.value)} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring focus:ring-indigo-200 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100" placeholder="E.g., Campus Registration Updates" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
                <textarea required value={annDesc} onChange={e => setAnnDesc(e.target.value)} rows={3} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring focus:ring-indigo-200 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100" placeholder="Policy details..."></textarea>
              </div>
             <button type="submit" className="w-full bg-indigo-600 text-white font-medium py-2 rounded-lg hover:bg-indigo-700 transition">Broadcast Announcement</button>
           </form>
         </div>

         {/* Create Events */}
          <div className="card p-6 border-t-4 border-brand-500">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center mb-4">
              <Calendar className="h-5 w-5 mr-2 text-brand-500" /> Schedule Campus Event
            </h3>
           <form onSubmit={handleCreateEvent} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Event Name</label>
                <input type="text" required value={eventTitle} onChange={e => setEventTitle(e.target.value)} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring focus:ring-brand-200 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100" placeholder="E.g., Tech Symposium 2026" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Event Details</label>
                <textarea required value={eventDesc} onChange={e => setEventDesc(e.target.value)} rows={2} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring focus:ring-brand-200 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"></textarea>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                   <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Date</label>
                   <input type="date" required value={eventDate} onChange={e => setEventDate(e.target.value)} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring focus:ring-brand-200 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100" />
                </div>
                <div>
                   <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Location Venue</label>
                   <input type="text" required value={eventLocation} onChange={e => setEventLocation(e.target.value)} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring focus:ring-brand-200 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100" placeholder="Auditorium B" />
                </div>
              </div>
             <button type="submit" className="w-full bg-brand-600 text-white font-medium py-2 rounded-lg hover:bg-brand-700 transition">Establish Event</button>
           </form>
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
