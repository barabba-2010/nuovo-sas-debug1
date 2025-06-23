'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useAdmin } from './common/SessionProvider';

export default function SessionKeepAlive() {
  const { data: session, status, update } = useSession();
  const { refreshSession } = useAdmin();
  
  useEffect(() => {
    // Controlla se il ruolo è presente nella sessione
    if (status === 'authenticated' && session?.user && !(session.user as any).role) {
      console.log('SessionKeepAlive: Role missing, updating session...');
      update();
    }
  }, [status, session, update]);
  
  useEffect(() => {
    // Refresh periodico della sessione admin
    const interval = setInterval(() => {
      if (status === 'authenticated') {
        refreshSession();
      }
    }, 5 * 60 * 1000); // Ogni 5 minuti
    
    return () => clearInterval(interval);
  }, [status, refreshSession]);
  
  // Gestisce il focus della finestra
  useEffect(() => {
    const handleFocus = () => {
      if (status === 'authenticated') {
        console.log('Window focused, checking session...');
        update();
        refreshSession();
      }
    };
    
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [status, update, refreshSession]);
  
  return null;
} 