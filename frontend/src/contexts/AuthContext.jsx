import React, { createContext, useState, useEffect } from 'react';
import api from '../services/api';
import { socket } from '../services/socket';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchUser = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const res = await api.get('/users/me');
          
          if (isMounted) {
            setUser(res.data);
            
            // Connect socket automatically if logged in
            if (!socket.connected) {
              socket.auth = { token };
              socket.connect();
              
              // Add listener for successful connection to safely register
              socket.on('connect', () => {
                socket.emit('register', res.data.id);
              });
              // Fallback if already connecting/connected
              socket.emit('register', res.data.id);
            }
          }
        } catch (error) {
          console.error("Failed to fetch user:", error);
          if (isMounted) localStorage.removeItem('token');
        }
      }
      if (isMounted) setLoading(false);
    };

    fetchUser();
    
    return () => {
      isMounted = false;
      // Do not forcefully close the global singleton socket on unmount during dev fast refresh
    }
  }, []);

  const login = async (emailPhone, password) => {
    const res = await api.post('/auth/login', { emailPhone, password });
    localStorage.setItem('token', res.data.token);
    setUser(res.data.user);
    
    socket.auth = { token: res.data.token };
    socket.connect();
    socket.emit('register', res.data.user.id);
    return res.data;
  };

  const signup = async (userData) => {
    const res = await api.post('/auth/verify-otp', userData);
    localStorage.setItem('token', res.data.token);
    setUser(res.data.user);
    
    socket.auth = { token: res.data.token };
    socket.connect();
    socket.emit('register', res.data.user.id);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    socket.disconnect();
  };

  const updateUser = (userData) => {
    setUser(userData);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};
