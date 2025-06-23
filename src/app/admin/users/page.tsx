'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Link from 'next/link';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  organizationMemberships: {
    organization: {
      id: string;
      name: string;
      code: string;
    };
    team?: {
      id: string;
      name: string;
    };
  }[];
  _count: {
    reports: number;
  };
}

export default function UsersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

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
      fetchUsers();
    }
  }, [status, session, router]);

  const fetchUsers = async () => {
    try {
      const response = await axios.get('/api/admin/users');
      setUsers(response.data.users);
      setIsLoading(false);
    } catch (error) {
      console.error('Errore nel caricamento degli utenti:', error);
      setIsLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesFilter = filter === 'all' || user.role === filter;
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-danger';
      case 'MANAGER': return 'bg-warning';
      case 'EMPLOYEE': return 'bg-primary';
      default: return 'bg-secondary';
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
          <li className="breadcrumb-item active">Utenti</li>
        </ol>
      </nav>

      <div className="row mb-4">
        <div className="col">
          <h1 className="h2">Gestione Utenti</h1>
          <p className="text-muted">Totale: {users.length} utenti</p>
        </div>
      </div>

      <div className="card mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-6">
              <div className="input-group">
                <span className="input-group-text">
                  <i className="bi bi-search"></i>
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Cerca per nome o email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-6">
              <select 
                className="form-select"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="all">Tutti i ruoli</option>
                <option value="ADMIN">Solo Admin</option>
                <option value="MANAGER">Solo Manager</option>
                <option value="EMPLOYEE">Solo Dipendenti</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Email</th>
                  <th>Ruolo</th>
                  <th>Organizzazione</th>
                  <th>Team</th>
                  <th>Report</th>
                  <th>Registrato il</th>
                  <th>Azioni</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td className="fw-semibold">{user.name}</td>
                    <td>{user.email}</td>
                    <td>
                      <span className={`badge ${getRoleBadgeClass(user.role)}`}>
                        {user.role}
                      </span>
                    </td>
                    <td>
                      {user.organizationMemberships[0]?.organization.name || '-'}
                    </td>
                    <td>
                      {user.organizationMemberships[0]?.team?.name || '-'}
                    </td>
                    <td>
                      <span className="badge bg-secondary">
                        {user._count.reports}
                      </span>
                    </td>
                    <td>{new Date(user.createdAt).toLocaleDateString('it-IT')}</td>
                    <td>
                      <Link 
                        href={`/admin/users/${user.id}`}
                        className="btn btn-sm btn-outline-primary"
                      >
                        <i className="bi bi-eye"></i> Dettagli
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredUsers.length === 0 && (
              <div className="text-center py-5 text-muted">
                <i className="bi bi-people fs-1 d-block mb-3"></i>
                <p>Nessun utente trovato</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 