'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Link from 'next/link';

interface Team {
  id: string;
  name: string;
  organization: {
    id: string;
    name: string;
    code: string;
  };
  manager?: {
    id: string;
    name: string;
    email: string;
  };
  _count: {
    members: number;
  };
  createdAt: string;
}

export default function TeamsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrg, setSelectedOrg] = useState('all');
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
      fetchTeams();
    }
  }, [status, session, router]);

  const fetchTeams = async () => {
    try {
      const response = await axios.get('/api/admin/teams');
      setTeams(response.data.teams);
      setIsLoading(false);
    } catch (error) {
      console.error('Errore nel caricamento dei team:', error);
      setIsLoading(false);
    }
  };

  const filteredTeams = teams.filter(team => {
    const matchesOrg = selectedOrg === 'all' || team.organization.id === selectedOrg;
    const matchesSearch = team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         team.organization.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesOrg && matchesSearch;
  });

  const organizations = [...new Map(teams.map(t => [t.organization.id, t.organization])).values()];

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
          <li className="breadcrumb-item active">Team</li>
        </ol>
      </nav>

      <div className="row mb-4">
        <div className="col">
          <h1 className="h2">Gestione Team</h1>
          <p className="text-muted">Totale: {teams.length} team</p>
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
                  placeholder="Cerca team o organizzazione..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-6">
              <select 
                className="form-select"
                value={selectedOrg}
                onChange={(e) => setSelectedOrg(e.target.value)}
              >
                <option value="all">Tutte le organizzazioni</option>
                {organizations.map(org => (
                  <option key={org.id} value={org.id}>{org.name}</option>
                ))}
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
                  <th>Nome Team</th>
                  <th>Organizzazione</th>
                  <th>Manager</th>
                  <th>Membri</th>
                  <th>Creato il</th>
                  <th>Azioni</th>
                </tr>
              </thead>
              <tbody>
                {filteredTeams.map((team) => (
                  <tr key={team.id}>
                    <td className="fw-semibold">{team.name}</td>
                    <td>
                      <div>
                        {team.organization.name}
                        <br />
                        <small className="text-muted">
                          Codice: <code>{team.organization.code}</code>
                        </small>
                      </div>
                    </td>
                    <td>
                      {team.manager ? (
                        <div>
                          {team.manager.name}
                          <br />
                          <small className="text-muted">{team.manager.email}</small>
                        </div>
                      ) : (
                        <span className="text-muted">Nessun manager</span>
                      )}
                    </td>
                    <td>
                      <span className="badge bg-secondary">
                        {team._count.members}
                      </span>
                    </td>
                    <td>{new Date(team.createdAt).toLocaleDateString('it-IT')}</td>
                    <td>
                      <Link 
                        href={`/admin/teams/${team.id}`}
                        className="btn btn-sm btn-outline-primary"
                      >
                        <i className="bi bi-eye"></i> Dettagli
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredTeams.length === 0 && (
              <div className="text-center py-5 text-muted">
                <i className="bi bi-diagram-3 fs-1 d-block mb-3"></i>
                <p>Nessun team trovato</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 