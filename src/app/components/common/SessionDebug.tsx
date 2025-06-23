'use client';

import { useSession } from 'next-auth/react';
import { useAdmin } from './SessionProvider';

export default function SessionDebug() {
  const { data: session, status } = useSession();
  const { isAdmin, isManager, isEmployee, userRole, isLoading: adminLoading } = useAdmin();
  
  // Solo in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }
  
  return (
    <div className="position-fixed bottom-0 end-0 m-3 p-2 bg-dark text-white rounded shadow" style={{ fontSize: '12px', zIndex: 9999 }}>
      <div>Status: {status}</div>
      <div>Session: {session ? 'Yes' : 'No'}</div>
      {session && (
        <>
          <div>User ID: {(session.user as any)?.id || 'N/A'}</div>
          <div>Email: {session.user?.email || 'N/A'}</div>
          <div>Role (session): {(session.user as any)?.role || 'N/A'}</div>
          <div>Role (context): {userRole || 'N/A'}</div>
          <div>Is Admin: {isAdmin ? 'Yes' : 'No'}</div>
          <div>Is Manager: {isManager ? 'Yes' : 'No'}</div>
          <div>Is Employee: {isEmployee ? 'Yes' : 'No'}</div>
          <div>Loading: {adminLoading ? 'Yes' : 'No'}</div>
        </>
      )}
    </div>
  );
} 