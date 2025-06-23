'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';

interface TeamMember {
  id: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  joinedAt: string;
  _count?: {
    testResults: number;
  };
  lastTest?: {
    completedAt: string;
    test: {
      title: string;
      type: string;
    };
  };
}

interface Team {
  id: string;
  name: string;
  organization: {
    name: string;
  };
  members: TeamMember[];
}

export default function ManagerTeamPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [team, setTeam] = useState<Team | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      fetchTeamData();
    }
  }, [status, session]);

  const fetchTeamData = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get('/api/manager/team');
      setTeam(response.data.team);
    } catch (error: any) {
      console.error('Errore nel caricamento del team:', error);
      setError(error.response?.data?.message || 'Errore nel caricamento del team');
    } finally {
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

  if (error) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger" role="alert">
          <h4 className="alert-heading">Errore</h4>
          <p>{error}</p>
          <Link href="/manager" className="btn btn-primary">
            Torna alla Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="container py-5">
        <div className="alert alert-warning" role="alert">
          <h4 className="alert-heading">Nessun Team Assegnato</h4>
          <p>Non sei ancora stato assegnato a nessun team.</p>
          <Link href="/manager" className="btn btn-primary">
            Torna alla Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <nav aria-label="breadcrumb">
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <Link href="/manager">Dashboard Manager</Link>
          </li>
          <li className="breadcrumb-item active">Il Mio Team</li>
        </ol>
      </nav>

      <div className="row mb-4">
        <div className="col">
          <h1 className="h2">Il Mio Team: {team.name}</h1>
          <p className="text-muted">
            Organizzazione: {team.organization.name}
          </p>
        </div>
      </div>

      {/* Statistiche del Team */}
      <div className="row mb-4">
        <div className="col-md-3">
          <div className="card text-center">
            <div className="card-body">
              <h5 className="card-title">Membri Totali</h5>
              <p className="card-text display-6">{team.members.length}</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-center">
            <div className="card-body">
              <h5 className="card-title">Test Completati</h5>
              <p className="card-text display-6">
                {team.members.reduce((acc, member) => acc + (member._count?.testResults || 0), 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabella Membri */}
      <div className="card">
        <div className="card-header">
          <h5 className="mb-0">Membri del Team</h5>
        </div>
        <div className="card-body">
          {team.members.length > 0 ? (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Email</th>
                    <th>Data di Ingresso</th>
                    <th>Test Completati</th>
                    <th>Ultimo Test</th>
                    <th>Stato</th>
                  </tr>
                </thead>
                <tbody>
                  {team.members.map((member) => {
                    const testCount = member._count?.testResults || 0;
                    const hasTests = testCount > 0;
                    
                    return (
                      <tr key={member.id}>
                        <td>
                          <div className="d-flex align-items-center">
                            <div className="avatar-circle bg-secondary text-white me-2">
                              {(member.user.name || member.user.email).charAt(0).toUpperCase()}
                            </div>
                            {member.user.name || 'N/A'}
                          </div>
                        </td>
                        <td>{member.user.email}</td>
                        <td>{new Date(member.joinedAt).toLocaleDateString('it-IT')}</td>
                        <td>
                          <span className={`badge ${hasTests ? 'bg-success' : 'bg-secondary'}`}>
                            {testCount}
                          </span>
                        </td>
                        <td>
                          {member.lastTest ? (
                            <small className="text-muted">
                              {member.lastTest.test.title} - {new Date(member.lastTest.completedAt).toLocaleDateString('it-IT')}
                            </small>
                          ) : (
                            <span className="text-muted">-</span>
                          )}
                        </td>
                        <td>
                          {hasTests ? (
                            <span className="badge bg-success">
                              <i className="bi bi-check-circle me-1"></i>
                              Attivo
                            </span>
                          ) : (
                            <span className="badge bg-warning">
                              <i className="bi bi-clock me-1"></i>
                              In attesa
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-people fs-1 d-block mb-3"></i>
              <p>Nessun membro nel team</p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4">
        <Link href="/manager" className="btn btn-secondary">
          <i className="bi bi-arrow-left me-2"></i>
          Torna alla Dashboard
        </Link>
      </div>

      <style jsx>{`
        .avatar-circle {
          width: 35px;
          height: 35px;
          border-radius: 50%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 14px;
        }
      `}</style>
    </div>
  );
} 