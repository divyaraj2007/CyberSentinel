import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { ApiClient } from '../api/client';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string, totpCode?: string) => Promise<void>;
  logout: () => void;
  hasRole: (roles: string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('cybersentinel_user');
    const token = localStorage.getItem('cybersentinel_token');
    if (savedUser && token) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        ApiClient.clearToken();
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string, totpCode?: string) => {
    const data = await ApiClient.request<{
      access_token: string;
      refresh_token: string;
      user: User;
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password, totp_code: totpCode }),
    });

    ApiClient.setToken(data.access_token);
    localStorage.setItem('cybersentinel_user', JSON.stringify(data.user));
    setUser(data.user);
  };

  const logout = () => {
    ApiClient.clearToken();
    setUser(null);
  };

  const hasRole = (roles: string[]) => {
    if (!user) return false;
    if (user.role === 'Super Administrator') return true;
    return roles.includes(user.role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
