'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Link from 'next/link';

interface Manager {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  organizationMemberships: Array<{
    organization: {
      id: string;
      name: string;
      code: string;
    };
  }>;
  _count: {
    managedTeams: number;
  };
}

export default function ManagersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [managers, setManagers] = useState<Manager[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
      return;
    }

    if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
      router.push('/');
      return;
    }

    if (status === 'authenticated' && session?.user?.role === 'ADMIN') {
      fetchManagers();
    }
  }, [status, session, router]);

  const fetchManagers = async () => {
    try {
      const response = await axios.get('/api/admin/managers');
      setManagers(response.data.managers);
      setIsLoading(false);
    } catch (error) {
      console.error('Errore nel caricamento dei manager:', error);
      setError('Errore nel caricamento dei manager');
      setIsLoading(false);
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="container py-5">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Caricamento...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <nav aria-label="breadcrumb">
        <ol className="breadcrumb">
          <li className="breadcrumb-item"><Link href="/admin">Admin</Link></li>
          <li className="breadcrumb-item active">Manager</li>
        </ol>
      </nav>

      <div className="row mb-4">
        <div className="col">
          <h1 className="h2">Gestione Manager</h1>
          <p className="text-muted">Totale manager: {managers.length}</p>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          {error}
          <button type="button" className="btn-close" onClick={() => setError('')}></button>
        </div>
      )}

      <div className="card">
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Email</th>
                  <th>Organizzazione</th>
                  <th>Team Gestiti</th>
                  <th>Registrato il</th>
                  <th>Azioni</th>
                </tr>
              </thead>
              <tbody>
                {managers.map((manager) => (
                  <tr key={manager.id}>
                    <td>{manager.name || '-'}</td>
                    <td>{manager.email}</td>
                    <td>
                      {manager.organizationMemberships.length > 0 ? (
                        manager.organizationMemberships.map(om => (
                          <span key={om.organization.id} className="badge bg-light text-dark me-1">
                            {om.organization.name}
                          </span>
                        ))
                      ) : (
                        <span className="text-muted">-</span>
                      )}
                    </td>
                    <td>
                      <span className="badge bg-primary">
                        {manager._count.managedTeams}
                      </span>
                    </td>
                    <td>{new Date(manager.createdAt).toLocaleDateString('it-IT')}</td>
                    <td>
                      <button className="btn btn-sm btn-outline-primary">
                        <i className="bi bi-eye"></i> Dettagli
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {managers.length === 0 && (
              <div className="text-center py-5 text-muted">
                <i className="bi bi-person-badge fs-1 d-block mb-3"></i>
                <p>Nessun manager presente</p>
                <p className="small">I manager possono essere creati dalla pagina delle organizzazioni</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 