import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { ApiClient } from '../api/client';

export const DEMO_USERS: Record<string, User> = {
  admin: {
    id: 1,
    username: 'admin',
    email: 'admin@cybersentinel.internal',
    full_name: 'Lead SOC Administrator',
    role: 'Super Administrator',
    permissions: ['*'],
  },
  secadmin: {
    id: 2,
    username: 'secadmin',
    email: 'secadmin@cybersentinel.internal',
    full_name: 'Security Admin',
    role: 'Security Administrator',
    permissions: ['networks:read', 'networks:write', 'scans:read', 'scans:write', 'vulns:read', 'vulns:write'],
  },
  analyst: {
    id: 3,
    username: 'analyst',
    email: 'analyst@cybersentinel.internal',
    full_name: 'Threat Analyst',
    role: 'Security Analyst',
    permissions: ['alerts:read', 'alerts:write', 'traffic:read'],
  },
  viewer: {
    id: 4,
    username: 'viewer',
    email: 'viewer@cybersentinel.internal',
    full_name: 'Compliance Auditor',
    role: 'Viewer',
    permissions: ['read:all'],
  },
};

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string, totpCode?: string) => Promise<void>;
  loginDemo: (username?: string) => void;
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

  const loginDemo = (username: string = 'admin') => {
    const userToSet = DEMO_USERS[username.toLowerCase()] || DEMO_USERS.admin;
    ApiClient.setToken('demo_token_' + Date.now());
    localStorage.setItem('cybersentinel_user', JSON.stringify(userToSet));
    setUser(userToSet);
  };

  const login = async (username: string, password: string, totpCode?: string) => {
    try {
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
    } catch (err: any) {
      // If user typed recognized demo account credentials and the backend is offline, we can auto-allow or throw
      throw err;
    }
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
        loginDemo,
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
