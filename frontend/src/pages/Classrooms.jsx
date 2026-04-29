import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import api from '../services/api';
import { 
  BookOpen, Plus, Search, Users, 
  ChevronRight, Library, MoreVertical, X,
  GraduationCap, ArrowLeft
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const Classrooms = () => {
  const { user } = useContext(AuthContext);
  const [classrooms, setClassrooms] = useState([]);
  const [filter, setFilter] = useState('all'); // 'all' or 'my'
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', subject: '', department: '', year: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const fetchClassrooms = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/classrooms?filter=${filter}`);
      setClassrooms(res.data);
    } catch (err) {
      console.error('Failed to fetch classrooms', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClassrooms();
  }, [filter]);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      await api.post('/classrooms', formData);
      setShowCreateModal(false);
      setFormData({ name: '', subject: '', department: '', year: '' });
      fetchClassrooms();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create classroom');
    }
  };

  const handleJoinRequest = async (id) => {
    try {
      await api.post(`/classrooms/${id}/request`);
      // Update UI optimistic
      setClassrooms(prev => prev.map(c => 
        c.id === id ? { ...c, my_status: 'pending' } : c
      ));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to request join');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <button 
              onClick={() => navigate('/dashboard')}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500"
              title="Go back"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <Library className="w-6 h-6 text-brand-500" />
            Classrooms
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Collaborate, share resources, and discuss in isolated groups.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
            <button 
              onClick={() => setFilter('all')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                filter === 'all' 
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              All
            </button>
            <button 
              onClick={() => setFilter('my')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                filter === 'my' 
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              My Classes
            </button>
          </div>
          
          {(user?.role === 'staff' || user?.role === 'admin') && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm shadow-brand-500/20"
            >
              <Plus className="w-4 h-4" />
              Create
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse"></div>
          ))}
        </div>
      ) : classrooms.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
          <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 dark:text-white">No classrooms found</h3>
          <p className="text-slate-500 dark:text-slate-400 mt-1">There are no classrooms available for your filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classrooms.map((cls) => {
            const isMember = cls.my_status === 'approved' || cls.member_role === 'staff' || cls.member_role === 'student';
            const isPending = cls.my_status === 'pending';

            return (
              <div 
                key={cls.id} 
                className="group bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-lg hover:shadow-brand-500/5 transition-all duration-300 flex flex-col"
              >
                <div className="h-2 bg-gradient-to-r from-brand-400 to-indigo-500"></div>
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-semibold text-lg text-slate-900 dark:text-white line-clamp-1 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                      {cls.name}
                    </h3>
                    <div className="bg-slate-100 dark:bg-slate-700 p-1.5 rounded-md text-brand-600 dark:text-brand-400">
                      <GraduationCap className="w-4 h-4" />
                    </div>
                  </div>
                  
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 line-clamp-1">{cls.subject}</p>
                  
                  <div className="space-y-2 mt-auto">
                    <div className="flex items-center text-xs text-slate-500 dark:text-slate-400">
                      <span className="font-medium mr-1">Instructor:</span> 
                      {cls.staff_name || 'Staff'}
                    </div>
                    <div className="flex items-center text-xs text-slate-500 dark:text-slate-400">
                      <span className="font-medium mr-1">Dept:</span> {cls.department || 'N/A'} &bull; <span className="font-medium mx-1">Year:</span> {cls.year || 'N/A'}
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                    {isMember ? (
                      <Link 
                        to={`/classrooms/${cls.id}`}
                        className="text-brand-600 dark:text-brand-400 text-sm font-medium flex items-center hover:underline"
                      >
                        Enter Classroom <ChevronRight className="w-4 h-4 ml-1" />
                      </Link>
                    ) : isPending ? (
                      <span className="text-amber-500 text-sm font-medium px-3 py-1 bg-amber-50 dark:bg-amber-500/10 rounded-full">
                        Request Pending
                      </span>
                    ) : (
                      <button 
                        onClick={() => handleJoinRequest(cls.id)}
                        className="text-sm font-medium px-4 py-1.5 bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 hover:bg-brand-100 dark:hover:bg-brand-500/20 rounded-lg transition-colors"
                      >
                        Request to Join
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl w-full max-w-md shadow-2xl overflow-hidden animate-fade-in-up">
            <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Create Classroom</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreateSubmit} className="p-5 space-y-4">
              {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>}
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Classroom Name</label>
                <input 
                  required
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="e.g. Data Structures CS201"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Subject</label>
                <input 
                  required
                  type="text" 
                  value={formData.subject}
                  onChange={(e) => setFormData({...formData, subject: e.target.value})}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="e.g. Computer Science"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Department</label>
                  <input 
                    type="text" 
                    value={formData.department}
                    onChange={(e) => setFormData({...formData, department: e.target.value})}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder="e.g. CSE"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Year</label>
                  <input 
                    type="text" 
                    value={formData.year}
                    onChange={(e) => setFormData({...formData, year: e.target.value})}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder="e.g. 2nd Year"
                  />
                </div>
              </div>
              
              <div className="pt-4 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg transition-colors shadow-sm shadow-brand-500/20 font-medium"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Classrooms;
