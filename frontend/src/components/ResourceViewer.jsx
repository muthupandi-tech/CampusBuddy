import React from 'react';
import { X, FileText, Download } from 'lucide-react';

const ResourceViewer = ({ resource, onClose }) => {
  if (!resource) return null;

  const getFileType = (url) => {
    const ext = url.split('.').pop().toLowerCase();
    if (ext === 'pdf') return 'pdf';
    if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) return 'image';
    if (['mp4', 'webm', 'ogg'].includes(ext)) return 'video';
    return 'other';
  };

  const fileType = getFileType(resource.file_url);
  // Using the relative URL directly as Vite proxy handles /uploads 
  const previewUrl = resource.file_url; 

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-brand-100 text-brand-600 flex items-center justify-center">
              <FileText size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 leading-tight">{resource.title}</h3>
              <p className="text-xs text-slate-500">{resource.subject_name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a 
              href={previewUrl} 
              download 
              className="p-2 text-slate-500 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-all"
              title="Download"
            >
              <Download size={20} />
            </a>
            <button 
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content Viewer */}
        <div className="flex-1 overflow-auto bg-slate-100 p-4 min-h-[500px] flex items-center justify-center">
          {fileType === 'pdf' && (
            <iframe 
              src={`${previewUrl}#toolbar=0`} 
              className="w-full h-full border-none rounded-lg bg-white shadow-lg"
              title={resource.title}
            />
          )}

          {fileType === 'image' && (
            <img 
              src={previewUrl} 
              alt={resource.title} 
              className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
            />
          )}

          {fileType === 'video' && (
            <video 
              controls 
              className="max-w-full max-h-full rounded-lg shadow-lg"
              autoPlay
            >
              <source src={previewUrl} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          )}

          {fileType === 'other' && (
            <div className="text-center p-12 bg-white rounded-3xl shadow-xl max-w-md">
               <div className="h-20 w-20 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-6">
                 <FileText size={40} />
               </div>
               <h4 className="text-xl font-bold text-slate-800 mb-2">Preview Unavailable</h4>
               <p className="text-slate-500 mb-8 text-sm">This file type cannot be previewed in the browser. Please download it to view the content.</p>
               <a 
                 href={previewUrl} 
                 download
                 className="inline-flex items-center gap-2 px-6 py-3 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 transition-all shadow-lg shadow-brand-200"
               >
                 <Download size={18} /> Download Resource
               </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResourceViewer;
