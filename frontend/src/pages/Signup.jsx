import React, { useState, useContext, useEffect, useRef } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import api from '../services/api';

const Signup = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'student',
    department: '',
    year: ''
  });
  
  const [step, setStep] = useState(1); // 1 = Registration Form, 2 = OTP Verification
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(60);
  const otpInputRefs = useRef([]);

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { signup } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    let interval;
    if (step === 2 && timer > 0) {
      interval = setInterval(() => setTimer(timer - 1), 1000);
    } else if (step === 2 && timer === 0) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleOtpChange = (index, value) => {
    if (isNaN(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus the next input
    if (value !== '' && index < 5) {
      otpInputRefs.current[index + 1].focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    // Auto-focus previous input on backspace
    if (e.key === 'Backspace' && index > 0 && otp[index] === '') {
      otpInputRefs.current[index - 1].focus();
    }
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      await api.post('/auth/send-otp', { email: formData.email });
      setStep(2);
      setTimer(60);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtpAndSignup = async (e) => {
    e.preventDefault();
    const otpValue = otp.join('');
    if (otpValue.length !== 6) {
      setError('Please enter a valid 6-digit OTP.');
      return;
    }

    setError('');
    setIsLoading(true);
    
    const submitData = { ...formData, otp: otpValue };
    if (submitData.year) {
      submitData.year = parseInt(submitData.year, 10);
    }

    try {
      const res = await signup(submitData);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid OTP or registration failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError('');
    try {
      await api.post('/auth/send-otp', { email: formData.email });
      setTimer(60);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to resend OTP.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 py-12">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden animate-fade-in-up">
        <div className="p-8">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold text-slate-800">
              {step === 1 ? 'Create Account' : 'Verify Email'}
            </h2>
            <p className="text-slate-500 mt-2">
              {step === 1 ? 'Join CampusBuddy today' : `We sent a code to ${formData.email}`}
            </p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-6 text-center animate-fade-in-up">
              {error}
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                <input 
                  type="text" 
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="input-field" 
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                  <input 
                    type="email" 
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="input-field" 
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                  <input 
                    type="text" 
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="input-field" 
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="input-field pr-10" 
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                <select 
                  name="role" 
                  value={formData.role} 
                  onChange={handleChange}
                  className="input-field bg-white"
                >
                  <option value="student">Student</option>
                  <option value="staff">Staff</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              {formData.role === 'student' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Department</label>
                      <input 
                        type="text" 
                        name="department"
                        value={formData.department}
                        onChange={handleChange}
                        className="input-field" 
                      />
                  </div>
                  <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Year</label>
                      <input 
                        type="number" 
                        name="year"
                        value={formData.year}
                        onChange={handleChange}
                        className="input-field" 
                        min="1" max="5"
                      />
                  </div>
                </div>
              )}
              
              {formData.role === 'staff' && (
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Department</label>
                    <input 
                      type="text" 
                      name="department"
                      value={formData.department}
                      onChange={handleChange}
                      className="input-field" 
                    />
                 </div>
              )}

              <button 
                type="submit" 
                className="w-full btn-primary mt-6 py-3"
                disabled={isLoading}
              >
                {isLoading ? 'Sending OTP...' : 'Send OTP'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtpAndSignup} className="space-y-6 animate-fade-in-up">
              <div className="flex justify-center gap-2 mb-4">
                {otp.map((data, index) => (
                  <input
                    key={index}
                    type="text"
                    maxLength="1"
                    ref={el => otpInputRefs.current[index] = el}
                    value={data}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    className="w-12 h-14 text-center text-xl font-bold bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all"
                  />
                ))}
              </div>

              <button 
                type="submit" 
                className="w-full btn-primary py-3"
                disabled={isLoading || otp.join('').length !== 6}
              >
                {isLoading ? 'Verifying & Registering...' : 'Verify & Register'}
              </button>
              
              <div className="text-center text-sm text-slate-500 mt-4">
                {timer > 0 ? (
                  <p>Resend OTP in <span className="font-medium text-slate-700">{timer}s</span></p>
                ) : (
                  <button 
                    type="button" 
                    onClick={handleResendOtp}
                    className="font-medium text-brand-600 hover:text-brand-500 underline"
                  >
                    Resend OTP
                  </button>
                )}
              </div>
              <div className="text-center mt-2">
                <button 
                    type="button" 
                    onClick={() => setStep(1)}
                    className="text-xs text-slate-400 hover:text-slate-600"
                  >
                    Back to Form
                </button>
              </div>
            </form>
          )}
          
          <div className="mt-6 text-center text-sm text-slate-600">
            Already have an account? <Link to="/login" className="font-medium text-brand-600 hover:text-brand-500">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
