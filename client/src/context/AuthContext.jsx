import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('sphn_token'));
  const [loading, setLoading] = useState(true);

  // On mount, check if we have a stored backend token and validate it
  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const userData = await authAPI.getMe();
          setUser(userData);
        } catch (err) {
          console.error('Backend token invalid:', err.message);
          localStorage.removeItem('sphn_token');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, [token]);

  /**
   * Login with email/password directly against the backend
   */
  const login = async (email, password, loginType = 'user') => {
    try {
      const data = await authAPI.login(email, password);
      
      // Enforce role checks if needed (though backend handles this)
      if (loginType === 'police' && data.role !== 'police' && data.role !== 'admin') {
        throw new Error('Access denied. This portal is reserved for Enforcement Personnel.');
      }
      if (loginType === 'admin' && data.role !== 'admin') {
        throw new Error('Access denied. This portal is restricted to System Administrators.');
      }

      localStorage.setItem('sphn_token', data.token);
      setToken(data.token);
      setUser(data);

      return data;
    } catch (err) {
      throw new Error(err.message || 'Login failed. Please check your credentials.');
    }
  };

  /**
   * Register a new citizen account directly via the backend
   */
  const register = async (name, email, password) => {
    try {
      const data = await authAPI.register(name, email, password);

      localStorage.setItem('sphn_token', data.token);
      setToken(data.token);
      setUser(data);

      return data;
    } catch (err) {
      throw new Error(err.message || 'Registration failed.');
    }
  };

  /**
   * Google sign-in (currently disabled as it relied on Firebase)
   */
  const googleLogin = async () => {
    throw new Error('Google Login is currently disabled. Please use email and password.');
  };

  /**
   * Admin Login
   */
  const adminLogin = async (email, password) => {
    return login(email, password, 'admin');
  };

  /**
   * Police Login
   */
  const policeLogin = async (email, password) => {
    return login(email, password, 'police');
  };

  /**
   * Logout from the backend
   */
  const logout = async () => {
    localStorage.removeItem('sphn_token');
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    loading,
    login,
    adminLogin,
    policeLogin,
    googleLogin,
    register,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin'
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
