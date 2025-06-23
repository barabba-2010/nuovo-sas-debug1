'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

export default function RolesDebugPage() {
  const { data: session, status } = useSession();
  const [dbRole, setDbRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkRole() {
      try {
        const response = await fetch('/api/auth/check-role');
        if (response.ok) {
          const data = await response.json();
          setDbRole(data.role);
        }
      } catch (error) {
        console.error('Error checking role:', error);
      } finally {
        setLoading(false);
      }
    }

    if (session) {
      checkRole();
    } else {
      setLoading(false);
    }
  }, [session]);

  return (
    <div className="container mt-5">
      <h1>Debug Ruoli Utente</h1>
      
      <div className="card mt-4">
        <div className="card-body">
          <h5 className="card-title">Stato Sessione</h5>
          <p>Status: <strong>{status}</strong></p>
          
          {session ? (
            <>
              <h5 className="mt-4">Dati Sessione</h5>
              <ul>
                <li>Email: <strong>{session.user?.email}</strong></li>
                <li>Nome: <strong>{session.user?.name}</strong></li>
                <li>ID: <strong>{(session.user as any)?.id}</strong></li>
                <li>Ruolo (sessione): <strong className="text-primary">{(session.user as any)?.role || 'NON DEFINITO'}</strong></li>
              </ul>

              <h5 className="mt-4">Ruolo dal Database</h5>
              {loading ? (
                <p>Caricamento...</p>
              ) : (
                <p>Ruolo (database): <strong className="text-success">{dbRole || 'NON TROVATO'}</strong></p>
              )}

              <h5 className="mt-4">Permessi</h5>
              <ul>
                <li>
                  Accesso Admin: 
                  <strong className={(session.user as any)?.role === 'ADMIN' ? 'text-success' : 'text-danger'}>
                    {(session.user as any)?.role === 'ADMIN' ? ' ✓ SI' : ' ✗ NO'}
                  </strong>
                </li>
                <li>
                  Accesso Manager: 
                  <strong className={(session.user as any)?.role === 'MANAGER' ? 'text-success' : 'text-danger'}>
                    {(session.user as any)?.role === 'MANAGER' ? ' ✓ SI' : ' ✗ NO'}
                  </strong>
                </li>
                <li>
                  Accesso Employee: 
                  <strong className={(session.user as any)?.role === 'EMPLOYEE' ? 'text-success' : 'text-danger'}>
                    {(session.user as any)?.role === 'EMPLOYEE' ? ' ✓ SI' : ' ✗ NO'}
                  </strong>
                </li>
              </ul>

              <div className="mt-4">
                <h5>Link Rapidi</h5>
                <div className="btn-group" role="group">
                  <a href="/" className="btn btn-outline-primary">Home</a>
                  <a href="/dashboard" className="btn btn-outline-primary">Dashboard</a>
                  {(session.user as any)?.role === 'ADMIN' && (
                    <a href="/admin" className="btn btn-outline-success">Admin</a>
                  )}
                  {(session.user as any)?.role === 'MANAGER' && (
                    <a href="/manager" className="btn btn-outline-info">Manager</a>
                  )}
                </div>
              </div>
            </>
          ) : (
            <p>Nessuna sessione attiva</p>
          )}
        </div>
      </div>

      <div className="card mt-4">
        <div className="card-body">
          <h5 className="card-title">Credenziali di Test</h5>
          <table className="table">
            <thead>
              <tr>
                <th>Ruolo</th>
                <th>Email</th>
                <th>Password</th>
                <th>Codice Org</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><span className="badge bg-danger">ADMIN</span></td>
                <td>admin@example.com</td>
                <td>password123</td>
                <td>-</td>
              </tr>
              <tr>
                <td><span className="badge bg-info">MANAGER</span></td>
                <td>manager@test.com</td>
                <td>password123</td>
                <td>TECH01</td>
              </tr>
              <tr>
                <td><span className="badge bg-secondary">EMPLOYEE</span></td>
                <td>employee@test.com</td>
                <td>password123</td>
                <td>TECH01</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 