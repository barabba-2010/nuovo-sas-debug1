'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';

export default function ClearSessionPage() {
  const router = useRouter();

  useEffect(() => {
    // Pulisci la sessione
    const clearSession = async () => {
      try {
        // Chiama l'API per pulire i cookie
        await fetch('/api/auth/clear-session');
        
        // Effettua il logout
        await signOut({ redirect: false });
        
        // Pulisci localStorage
        localStorage.clear();
        
        // Reindirizza al login
        setTimeout(() => {
          router.push('/auth/login');
        }, 2000);
      } catch (error) {
        console.error('Errore nella pulizia della sessione:', error);
      }
    };

    clearSession();
  }, [router]);

  return (
    <div className="container py-5">
      <div className="text-center">
        <div className="spinner-border text-primary mb-3" role="status">
          <span className="visually-hidden">Pulizia in corso...</span>
        </div>
        <h3>Pulizia sessione in corso...</h3>
        <p className="text-muted">Verrai reindirizzato alla pagina di login</p>
      </div>
    </div>
  );
} 