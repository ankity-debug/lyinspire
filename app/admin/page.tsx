'use client';

import { useState, useEffect } from 'react';
import { AdminAuth } from '@/components/admin-auth';
import { EnhancedAdminDashboard } from '@/components/enhanced-admin-dashboard';
import { useAuth } from '@/hooks/use-auth';

export default function AdminPage() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {!isAuthenticated ? <AdminAuth /> : <EnhancedAdminDashboard />}
    </div>
  );
}