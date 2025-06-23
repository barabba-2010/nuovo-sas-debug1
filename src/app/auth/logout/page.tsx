'use client';

import { useEffect } from 'react';
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function LogoutPage() {
  const router = useRouter();
  
  useEffect(() => {
    const performLogout = async () => {
      // Clear any local storage items
      try {
        localStorage.removeItem('userRole');
      } catch (e) {
        // Ignore localStorage errors
      }
      
      // Sign out from Next Auth
      await signOut({ redirect: false });
      
      // Redirect to home page
      router.push('/');
      router.refresh();
    };
    
    performLogout();
  }, [router]);
  
  return (
    <div className="container text-center py-5">
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
      <p className="mt-3">Disconnessione in corso...</p>
    </div>
  );
} 