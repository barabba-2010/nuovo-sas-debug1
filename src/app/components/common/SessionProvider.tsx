'use client'

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react'
import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useSession } from 'next-auth/react';

// Create a context for roles
export const AdminContext = createContext({ 
  isAdmin: false,
  isManager: false,
  isEmployee: false,
  userRole: null as string | null,
  isLoading: true,
  refreshSession: () => {}
});

// Admin provider component
export function AdminProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status, update } = useSession();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isManager, setIsManager] = useState(false);
  const [isEmployee, setIsEmployee] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Funzione per verificare il ruolo
  const checkAdminRole = useCallback(async () => {
    if (status === 'loading') {
      return;
    }

    if (status !== 'authenticated' || !session?.user) {
      setIsAdmin(false);
      setIsManager(false);
      setIsEmployee(false);
      setUserRole(null);
      setIsLoading(false);
      return;
    }

    try {
      // Prima controlla il ruolo dalla sessione
      const sessionRole = (session.user as any).role;
      if (sessionRole) {
        console.log("User role from session:", sessionRole);
        setUserRole(sessionRole);
        setIsAdmin(sessionRole === 'ADMIN');
        setIsManager(sessionRole === 'MANAGER');
        setIsEmployee(sessionRole === 'EMPLOYEE');
        setIsLoading(false);
        
        // Se il ruolo non è presente nella sessione, aggiorna la sessione
        if (!sessionRole) {
          await update();
        }
        return;
      }

      // Se non c'è il ruolo nella sessione, verifica dal database
      const response = await fetch('/api/auth/check-role');
      if (response.ok) {
        const data = await response.json();
        console.log("User role from DB:", data.role);
        setUserRole(data.role);
        setIsAdmin(data.role === 'ADMIN');
        setIsManager(data.role === 'MANAGER');
        setIsEmployee(data.role === 'EMPLOYEE');
        
        // Aggiorna la sessione con il ruolo
        await update();
      } else {
        setIsAdmin(false);
        setIsManager(false);
        setIsEmployee(false);
        setUserRole(null);
      }
    } catch (error) {
      console.error("Error checking user role:", error);
      setIsAdmin(false);
      setIsManager(false);
      setIsEmployee(false);
      setUserRole(null);
    } finally {
      setIsLoading(false);
    }
  }, [session, status, update]);

  // Verifica il ruolo quando la sessione cambia
  useEffect(() => {
    checkAdminRole();
  }, [status, session, checkAdminRole]);

  // Funzione per refresh manuale
  const refreshSession = useCallback(async () => {
    console.log("Manual admin check requested");
    setIsLoading(true);
    await update();
    await checkAdminRole();
  }, [checkAdminRole, update]);

  // Memoize del valore del context per evitare re-render inutili
  const contextValue = useMemo(() => ({
    isAdmin,
    isManager,
    isEmployee,
    userRole,
    isLoading,
    refreshSession
  }), [isAdmin, isManager, isEmployee, userRole, isLoading, refreshSession]);

  return (
    <AdminContext.Provider value={contextValue}>
      {children}
    </AdminContext.Provider>
  );
}

// Hook to use admin context
export function useAdmin() {
  return useContext(AdminContext);
}

export default function SessionProvider({
  children,
  session
}: {
  children: React.ReactNode
  session: any
}) {
  return (
    <NextAuthSessionProvider 
      session={session}
      refetchInterval={5 * 60} // Refresh ogni 5 minuti
      refetchOnWindowFocus={true} // Refresh quando la finestra torna in focus
    >
      <AdminProvider>
        {children}
      </AdminProvider>
    </NextAuthSessionProvider>
  )
} 