import React, { createContext, useState, useEffect, useContext } from 'react';
import { loginUser, registerUser } from './api';

export interface UserSession {
  id: string;
  username: string;
  email: string;
  isPremium?: boolean;
}

interface AuthContextType {
  user: UserSession | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<UserSession>;
  register: (username: string, email: string, password: string) => Promise<UserSession>;
  logout: () => void;
  updateLocalUsername: (username: string) => void;
  setPremiumStatus: (status: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Cross-platform LocalStorage helper (safely falls back if localStorage is missing)
const storage = {
  getItem: (key: string): string | null => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
    } catch (e) {
      console.warn('Storage getItem error:', e);
    }
    return null;
  },
  setItem: (key: string, value: string): void => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
    } catch (e) {
      console.warn('Storage setItem error:', e);
    }
  },
  removeItem: (key: string): void => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      }
    } catch (e) {
      console.warn('Storage removeItem error:', e);
    }
  }
};

const STORAGE_KEY = 'agroscan_user_session';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Attempt to hydrate user session from storage on load
    const storedUser = storage.getItem(STORAGE_KEY);
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('Failed to parse hydrated user session:', e);
        storage.removeItem(STORAGE_KEY);
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const response = await loginUser(email, password);
    if (response.success && response.user) {
      const sessionUser: UserSession = {
        id: response.user.id,
        username: response.user.username,
        email: response.user.email,
        isPremium: false // Default to free on first login or load from DB if stored, we toggle it locally
      };
      
      // Preserve isPremium if we already upgraded this user locally
      const storedUser = storage.getItem(STORAGE_KEY);
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          if (parsed && parsed.id === sessionUser.id) {
            sessionUser.isPremium = !!parsed.isPremium;
          }
        } catch (_) {}
      }

      setUser(sessionUser);
      storage.setItem(STORAGE_KEY, JSON.stringify(sessionUser));
      return sessionUser;
    }
    throw new Error('Authentication failed');
  };

  const register = async (username, email, password) => {
    const response = await registerUser(username, email, password);
    if (response.success && response.user) {
      const sessionUser: UserSession = {
        id: response.user.id,
        username: response.user.username,
        email: response.user.email,
        isPremium: false
      };
      setUser(sessionUser);
      storage.setItem(STORAGE_KEY, JSON.stringify(sessionUser));
      return sessionUser;
    }
    throw new Error('Registration failed');
  };

  const logout = () => {
    setUser(null);
    storage.removeItem(STORAGE_KEY);
  };

  const updateLocalUsername = (newUsername: string) => {
    if (user) {
      const updatedUser = { ...user, username: newUsername };
      setUser(updatedUser);
      storage.setItem(STORAGE_KEY, JSON.stringify(updatedUser));
    }
  };

  const setPremiumStatus = (status: boolean) => {
    if (user) {
      const updatedUser = { ...user, isPremium: status };
      setUser(updatedUser);
      storage.setItem(STORAGE_KEY, JSON.stringify(updatedUser));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        updateLocalUsername,
        setPremiumStatus
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
