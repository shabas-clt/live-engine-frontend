import { createContext, useContext, useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import api from '../api/axios';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = Cookies.get('admin_token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await api.get('/auth/me');
      setAdmin(response.data);
    } catch (error) {
      Cookies.remove('admin_token');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    Cookies.set('admin_token', response.data.access_token, { expires: 1 });
    setAdmin(response.data.admin);
    return response.data;
  };

  const logout = () => {
    Cookies.remove('admin_token');
    setAdmin(null);
    window.location.href = '/login';
  };

  const value = {
    admin,
    loading,
    login,
    logout,
    isSuperAdmin: admin?.role === 'superadmin',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
