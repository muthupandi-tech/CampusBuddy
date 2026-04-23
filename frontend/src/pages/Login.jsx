import React, { useState, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

const Login = () => {
  const [formData, setFormData] = useState({ emailPhone: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const res = await login(formData.emailPhone, formData.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to login. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden animate-fade-in-up">
        <div className="p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-slate-800">Welcome Back</h2>
            <p className="text-slate-500 mt-2">Sign in to your CampusBuddy account</p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-6 pb-2 text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Email or Phone</label>
              <input 
                type="text" 
                name="emailPhone"
                value={formData.emailPhone}
                onChange={handleChange}
                className="input-field" 
                placeholder="Enter email or phone"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
              <input 
                type="password" 
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="input-field" 
                placeholder="••••••••"
                required
              />
            </div>
            
            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input type="checkbox" className="rounded border-slate-300 text-brand-600 shadow-sm focus:border-brand-300 focus:ring focus:ring-brand-200 focus:ring-opacity-50" />
                <span className="ml-2 text-sm text-slate-600">Remember me</span>
              </label>
              <Link to="/forgot-password" className="text-sm font-medium text-brand-600 hover:text-brand-500">Forgot your password?</Link>
            </div>

            <button 
              type="submit" 
              className="w-full btn-primary flex justify-center py-3"
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
          
          <div className="mt-8 text-center text-sm text-slate-600">
            Don't have an account? <Link to="/signup" className="font-medium text-brand-600 hover:text-brand-500">Sign up</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
