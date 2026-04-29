import React, { useState, useEffect } from 'react';
import { 
  Search, X, Plus, User, 
  Filter, GraduationCap, Building2, 
  CheckCircle2, Loader2 
} from 'lucide-react';
import api from '../services/api';

const AddStudentModal = ({ isOpen, onClose, classroomId, existingMemberIds, onStudentAdded }) => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ department: '', year: '' });
  const [addingId, setAddingId] = useState(null);

  const departments = ['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT'];
  const years = ['1', '2', '3', '4'];

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (filters.department) params.append('department', filters.department);
      if (filters.year) params.append('year', filters.year);

      const res = await api.get(`/classrooms/students?${params.toString()}`);
      setStudents(res.data);
    } catch (err) {
      console.error('Failed to fetch students', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStudents();
    }
  }, [isOpen, search, filters]);

  const handleAdd = async (userId) => {
    try {
      setAddingId(userId);
      await api.post(`/classrooms/${classroomId}/add-student`, { userId });
      onStudentAdded();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to add student');
    } finally {
      setAddingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Plus className="w-6 h-6 text-brand-600" />
              Add Students to Classroom
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Select students to directly enroll them in your classroom.</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-400 hover:text-slate-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Filters */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-slate-100 dark:bg-slate-900 border-none rounded-xl focus:ring-2 focus:ring-brand-500 transition-all text-slate-900 dark:text-white"
            />
          </div>
          
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[150px]">
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select 
                  value={filters.department}
                  onChange={(e) => setFilters({...filters, department: e.target.value})}
                  className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-900 border-none rounded-lg focus:ring-2 focus:ring-brand-500 text-sm appearance-none text-slate-900 dark:text-white"
                >
                  <option value="">All Departments</option>
                  {departments.map(dept => <option key={dept} value={dept}>{dept}</option>)}
                </select>
              </div>
            </div>
            
            <div className="flex-1 min-w-[150px]">
              <div className="relative">
                <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select 
                  value={filters.year}
                  onChange={(e) => setFilters({...filters, year: e.target.value})}
                  className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-900 border-none rounded-lg focus:ring-2 focus:ring-brand-500 text-sm appearance-none text-slate-900 dark:text-white"
                >
                  <option value="">All Years</option>
                  {years.map(y => <option key={y} value={y}>{y} Year</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Student List */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-slate-50/30 dark:bg-slate-900/30">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="w-10 h-10 text-brand-600 animate-spin" />
              <p className="text-slate-500 text-sm font-medium">Searching students...</p>
            </div>
          ) : students.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <User className="w-16 h-16 text-slate-200 dark:text-slate-700 mb-4" />
              <p className="text-slate-500 dark:text-slate-400 font-medium">No students found matching your filters.</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {students.map(student => {
                const isMember = existingMemberIds.includes(student.id);
                return (
                  <div 
                    key={student.id}
                    className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                      isMember 
                        ? 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700 opacity-75' 
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-brand-300 dark:hover:border-brand-600 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-brand-100 dark:bg-brand-900/40 flex items-center justify-center text-brand-700 dark:text-brand-400 font-bold border-2 border-white dark:border-slate-700 overflow-hidden shadow-sm">
                        {student.avatar_url ? (
                          <img src={student.avatar_url} className="w-full h-full object-cover" />
                        ) : (
                          student.name.charAt(0)
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">{student.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                          {student.email}
                          <span className="inline-block w-1 h-1 bg-slate-300 rounded-full"></span>
                          {student.department} • {student.year} Year
                        </p>
                      </div>
                    </div>
                    
                    {isMember ? (
                      <div className="flex items-center gap-2 px-4 py-2 text-green-600 dark:text-green-400 font-medium text-sm">
                        <CheckCircle2 className="w-4 h-4" />
                        Enrolled
                      </div>
                    ) : (
                      <button
                        onClick={() => handleAdd(student.id)}
                        disabled={addingId === student.id}
                        className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:bg-slate-400 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-brand-500/20 active:scale-95"
                      >
                        {addingId === student.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Plus className="w-4 h-4" />
                        )}
                        Add Student
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-700 text-center">
          <p className="text-xs text-slate-400 dark:text-slate-500">Students will receive an email notification upon being added.</p>
        </div>
      </div>
    </div>
  );
};

export default AddStudentModal;
