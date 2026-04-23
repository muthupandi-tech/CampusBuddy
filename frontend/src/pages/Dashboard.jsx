import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import DashboardLayout from '../layouts/DashboardLayout';
import { BookOpen, UserCheck, Users, Activity, MessageSquare, Loader2, Calendar, Megaphone, FileText, UploadCloud, DownloadCloud } from 'lucide-react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [events, setEvents] = useState([]);
  const [resources, setResources] = useState([]);
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [resourceFilter, setResourceFilter] = useState('all');

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [resDash, resAnn, resEvt, resRes] = await Promise.all([
          api.get('/users/student/dashboard'),
          api.get('/academic/announcements'),
          api.get('/academic/events'),
          api.get('/academic/resources/all')
        ]);
        
        const dashData = resDash.data;
        setData(dashData);
        setAnnouncements(resAnn.data);
        setEvents(resEvt.data);
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
  }, []);

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
      <h1 className="text-2xl font-bold text-slate-800">Student Dashboard</h1>
      
      {/* Top Banner Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6 flex flex-col items-center text-center">
          <div className="h-20 w-20 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 text-3xl font-bold mb-4 shadow-inner">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <h2 className="text-xl font-bold text-slate-800">{user.name}</h2>
          <span className="inline-flex mt-2 items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 uppercase tracking-wider">
            {user.department} • Year {user.year}
          </span>
        </div>

        <div className="card p-6 flex flex-col justify-center items-center text-center col-span-1 md:col-span-2">
           <UserCheck className={`h-10 w-10 mb-3 ${attendance >= 75 ? 'text-emerald-500' : 'text-amber-500'}`} />
           <h3 className="text-lg font-medium text-slate-600">Overall Attendance</h3>
           <div className="w-full max-w-sm mt-4">
             <div className="flex justify-between text-sm font-medium mb-1">
               <span className="text-slate-600">Progress</span>
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
        <div className="card p-6 border-t-4 border-indigo-500">
           <h3 className="text-lg font-bold text-slate-800 flex items-center mb-4">
             <Megaphone className="h-5 w-5 mr-2 text-indigo-500" /> Recent Announcements
           </h3>
           <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
             {announcements.length === 0 ? <p className="text-sm text-slate-500">No new announcements.</p> : announcements.map(ann => (
               <div key={ann.id} className="p-4 bg-slate-50 rounded-lg shadow-sm border border-slate-100">
                 <h4 className="font-bold text-slate-800 text-sm">{ann.title}</h4>
                 <p className="text-xs text-slate-600 mt-1">{ann.description}</p>
                 <div className="mt-2 text-[10px] text-slate-400 capitalize">Mode: {ann.posted_role} - {new Date(ann.created_at).toLocaleDateString()}</div>
               </div>
             ))}
           </div>
        </div>

        {/* Events */}
        <div className="card p-6 border-t-4 border-brand-500">
           <h3 className="text-lg font-bold text-slate-800 flex items-center mb-4">
             <Calendar className="h-5 w-5 mr-2 text-brand-500" /> Upcoming Events
           </h3>
           <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
             {events.length === 0 ? <p className="text-sm text-slate-500">No upcoming events.</p> : events.map(ev => (
               <div key={ev.id} className="flex border-l-4 border-brand-400 bg-white shadow-sm p-4 rounded-r-lg">
                 <div className="flex-1">
                   <h4 className="font-bold text-slate-800">{ev.title}</h4>
                   <p className="text-xs text-slate-500 mt-1">{ev.description}</p>
                   <p className="text-xs font-semibold text-brand-600 mt-2">📍 {ev.location}</p>
                 </div>
                 <div className="ml-4 flex flex-col items-center justify-center bg-brand-50 p-2 rounded-lg text-brand-700 min-w-[70px]">
                   <span className="text-2xl font-black">{new Date(ev.event_date).getDate()}</span>
                   <span className="text-xs font-bold uppercase">{new Date(ev.event_date).toLocaleString('default', { month: 'short' })}</span>
                 </div>
               </div>
             ))}
           </div>
        </div>
      </div>

      {/* Timetable */}
      <div className="card p-6">
        <h3 className="text-lg font-bold text-slate-800 flex items-center mb-6">
          <Activity className="h-5 w-5 mr-2 text-emerald-500" /> Weekly Timetable
        </h3>
        {timetable.length === 0 ? (
          <p className="text-slate-500 text-center">No timetable data mapped for your year/department.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-y border-slate-200">
                  <th className="py-3 px-4 font-bold text-slate-600 text-sm">Day</th>
                  <th className="py-3 px-4 font-bold text-slate-600 text-sm">Time Slot</th>
                  <th className="py-3 px-4 font-bold text-slate-600 text-sm">Subject</th>
                  <th className="py-3 px-4 font-bold text-slate-600 text-sm">Code</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {timetable.map((slot, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 text-sm font-semibold text-slate-800">{slot.day}</td>
                    <td className="py-3 px-4 text-sm text-brand-600 font-medium">{slot.time_slot}</td>
                    <td className="py-3 px-4 text-sm text-slate-700">{slot.subject_name}</td>
                    <td className="py-3 px-4 text-sm text-slate-500">{slot.subject_code}</td>
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
          <h3 className="text-lg font-bold text-slate-800 flex items-center">
            <FileText className="h-5 w-5 mr-2 text-rose-500" /> Study Resources
          </h3>
          <select 
            value={resourceFilter} 
            onChange={(e) => setResourceFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring focus:ring-brand-200 bg-slate-50"
          >
            <option value="all">All Subjects</option>
            {subjects.map(s => <option key={s.code} value={s.id}>{s.name} ({s.code})</option>)}
          </select>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {filteredResources.length === 0 ? (
            <p className="text-slate-500 text-sm col-span-full">No resources uploaded yet.</p>
          ) : filteredResources.map(res => (
            <div key={res.id} className="border border-slate-200 rounded-xl p-4 flex flex-col justify-between hover:shadow-lg transition-shadow bg-white">
              <div>
                <div className="flex justify-center items-center h-16 w-16 bg-rose-50 text-rose-500 rounded-lg mb-4">
                  <FileText size={32} />
                </div>
                <h4 className="font-bold text-slate-800 text-sm mb-1 line-clamp-2">{res.title}</h4>
                <p className="text-xs text-brand-600 mb-4">{res.subject_name}</p>
              </div>
              <a 
                href={`http://localhost:5000${res.file_url}`} 
                target="_blank" rel="noreferrer"
                className="w-full flex items-center justify-center text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 py-2 rounded-lg transition-colors gap-2"
              >
                <DownloadCloud size={16} /> Download
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const StaffDashboard = () => {
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
  }, []);

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
      await api.post('/academic/resources', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setStatusMsg({ text: 'Resource uploaded successfully!', type: 'success' });
      setResTitle(''); setResFile(null);
    } catch {
      setStatusMsg({ text: 'Failed to upload resource.', type: 'error' });
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
       <h1 className="text-2xl font-bold text-slate-800">Faculty Dashboard</h1>
       
       {statusMsg.text && (
         <div className={`p-4 rounded-lg font-medium text-sm ${statusMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
           {statusMsg.text}
         </div>
       )}

       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         {/* Manage Announcements Form */}
         <div className="card p-6 border-t-4 border-indigo-500">
           <h3 className="text-lg font-bold text-slate-800 flex items-center mb-4">
             <Megaphone className="h-5 w-5 mr-2 text-indigo-500" /> Post Announcement
           </h3>
           <form onSubmit={handlePostAnnouncement} className="space-y-4">
             <div>
               <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
               <input type="text" required value={annTitle} onChange={e => setAnnTitle(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring focus:ring-indigo-200" placeholder="E.g., Tomorrow's class canceled" />
             </div>
             <div>
               <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
               <textarea required value={annDesc} onChange={e => setAnnDesc(e.target.value)} rows={3} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring focus:ring-indigo-200" placeholder="Details..."></textarea>
             </div>
             <button type="submit" className="w-full bg-indigo-600 text-white font-medium py-2 rounded-lg hover:bg-indigo-700 transition">Post Announcement</button>
           </form>
         </div>

         {/* Upload Resources */}
         <div className="card p-6 border-t-4 border-rose-500">
           <h3 className="text-lg font-bold text-slate-800 flex items-center mb-4">
             <UploadCloud className="h-5 w-5 mr-2 text-rose-500" /> Upload Material
           </h3>
           <form onSubmit={handleUploadResource} className="space-y-4">
             <div>
               <label className="block text-sm font-medium text-slate-700 mb-1">Material Title</label>
               <input type="text" required value={resTitle} onChange={e => setResTitle(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring focus:ring-rose-200" placeholder="E.g., Chapter 1 slides" />
             </div>
             <div>
               <label className="block text-sm font-medium text-slate-700 mb-1">Target Subject</label>
               <select required value={resSubject} onChange={e => setResSubject(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring focus:ring-rose-200">
                 <option value="" disabled>Select a subject</option>
                 {subjectsHandled.map(s => <option key={s.code} value={s.id}>{s.name} ({s.code})</option>)}
               </select>
             </div>
             <div>
               <label className="block text-sm font-medium text-slate-700 mb-1">Format (PDF, PPT, DOCX)</label>
               <input type="file" required onChange={e => setResFile(e.target.files[0])} className="w-full px-3 py-2 border border-slate-300 rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-rose-50 file:text-rose-700 hover:file:bg-rose-100" />
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
      <h1 className="text-2xl font-bold text-slate-800">Admin Control Panel</h1>
      
      {statusMsg.text && (
         <div className={`p-4 rounded-lg font-medium text-sm ${statusMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
           {statusMsg.text}
         </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         {/* Manage Announcements Form */}
         <div className="card p-6 border-t-4 border-indigo-500">
           <h3 className="text-lg font-bold text-slate-800 flex items-center mb-4">
             <Megaphone className="h-5 w-5 mr-2 text-indigo-500" /> Global Announcement
           </h3>
           <form onSubmit={handlePostAnnouncement} className="space-y-4">
             <div>
               <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
               <input type="text" required value={annTitle} onChange={e => setAnnTitle(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring focus:ring-indigo-200" placeholder="E.g., Campus Registration Updates" />
             </div>
             <div>
               <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
               <textarea required value={annDesc} onChange={e => setAnnDesc(e.target.value)} rows={3} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring focus:ring-indigo-200" placeholder="Policy details..."></textarea>
             </div>
             <button type="submit" className="w-full bg-indigo-600 text-white font-medium py-2 rounded-lg hover:bg-indigo-700 transition">Broadcast Announcement</button>
           </form>
         </div>

         {/* Create Events */}
         <div className="card p-6 border-t-4 border-brand-500">
           <h3 className="text-lg font-bold text-slate-800 flex items-center mb-4">
             <Calendar className="h-5 w-5 mr-2 text-brand-500" /> Schedule Campus Event
           </h3>
           <form onSubmit={handleCreateEvent} className="space-y-4">
             <div>
               <label className="block text-sm font-medium text-slate-700 mb-1">Event Name</label>
               <input type="text" required value={eventTitle} onChange={e => setEventTitle(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring focus:ring-brand-200" placeholder="E.g., Tech Symposium 2026" />
             </div>
             <div>
               <label className="block text-sm font-medium text-slate-700 mb-1">Event Details</label>
               <textarea required value={eventDesc} onChange={e => setEventDesc(e.target.value)} rows={2} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring focus:ring-brand-200"></textarea>
             </div>
             <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                  <input type="date" required value={eventDate} onChange={e => setEventDate(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring focus:ring-brand-200" />
               </div>
               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Location Venue</label>
                  <input type="text" required value={eventLocation} onChange={e => setEventLocation(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring focus:ring-brand-200" placeholder="Auditorium B" />
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
