'use client';

import { useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  role: string;
  name?: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('auth-token');
      if (!token) {
        setIsLoading(false);
        return;
      }

      const response = await fetch('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        localStorage.removeItem('auth-token');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('auth-token');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      throw new Error('Login failed');
    }

    const { token, user: userData } = await response.json();
    localStorage.setItem('auth-token', token);
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('auth-token');
    setUser(null);
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    login,
    logout,
  };
}