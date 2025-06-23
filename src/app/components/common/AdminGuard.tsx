'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

// Componente che protegge le rotte admin
export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(0); // Per forzare refresh

  // Questa funzione verifica il ruolo admin e forza il refresh della sessione se necessario
  const verifyAdminRole = async () => {
    try {
      // Check from localStorage cache first
      const cachedRole = localStorage.getItem('userRole');
      
      if (cachedRole === 'ADMIN') {
        setIsAuthorized(true);
      }
      
      // Se la sessione è ancora in caricamento, aspettiamo
      if (status === 'loading') {
        return;
      }
      
      // Se l'utente non è autenticato, redirect al login
      if (status === 'unauthenticated') {
        router.push('/auth/login');
        return;
      }
      
      // Verifica se l'utente è admin
      if (session?.user?.role === 'ADMIN') {
        setIsAuthorized(true);
        localStorage.setItem('userRole', 'ADMIN');
      } else {
        console.warn('User is not admin, refreshing session...', session?.user);
        // Forza aggiornamento della sessione
        await update();
        // Ricontrolla dopo update
        if (session?.user?.role === 'ADMIN') {
          setIsAuthorized(true);
          localStorage.setItem('userRole', 'ADMIN');
        } else {
          setIsAuthorized(false);
          localStorage.removeItem('userRole');
          // Non fare redirect qui, lasciamo che il middleware gestisca questo
        }
      }
    } catch (error) {
      console.error('Error in AdminGuard:', error);
    }
  };

  // Controlla al montaggio, al cambio di sessione, e periodicamente
  useEffect(() => {
    verifyAdminRole();
    
    // Forza aggiornamento ogni 10 secondi per maggiore sicurezza
    const interval = setInterval(() => {
      setForceUpdate(prev => prev + 1);
    }, 10000);
    
    // Ogni volta che lo stato di forceUpdate cambia, verifichiamo di nuovo
    verifyAdminRole();
    
    return () => clearInterval(interval);
  }, [session, status, forceUpdate]);

  // Se non è autorizzato, nascondi il contenuto admin
  if (!isAuthorized) {
    return null;
  }

  // Se è autorizzato, mostra il contenuto admin
  return <>{children}</>;
} 