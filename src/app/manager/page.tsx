'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';

interface TeamData {
  id: string;
  name: string;
  organization: {
    id: string;
    name: string;
  };
  _count: {
    members: number;
  };
}

interface TeamStats {
  totalTests: number;
  completedTests: number;
  activeMembers: number;
}

export default function ManagerDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [team, setTeam] = useState<TeamData | null>(null);
  const [stats, setStats] = useState<TeamStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      fetchManagerData();
    }
  }, [status, session]);

  const fetchManagerData = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      // Fetch team data for the manager
      const teamResponse = await axios.get('/api/manager/team');
      setTeam(teamResponse.data.team);
      
      // Fetch statistics only if team exists
      if (teamResponse.data.team) {
        const statsResponse = await axios.get('/api/manager/stats');
        setStats(statsResponse.data);
      }
      
    } catch (error: any) {
      console.error('Errore nel caricamento dei dati:', error);
      
      // Se è un 404, significa che il manager non ha un team assegnato
      if (error.response?.status === 404) {
        setError('Non sei ancora stato assegnato a nessun team. Contatta l\'amministratore per essere assegnato a un team.');
      } else {
        setError(error.response?.data?.message || 'Errore nel caricamento dei dati');
      }
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
        <div className="alert alert-warning" role="alert">
          <h4 className="alert-heading">Attenzione</h4>
          <p>{error}</p>
          <hr />
          <p className="mb-0">
            <Link href="/dashboard" className="btn btn-primary">
              Torna alla Dashboard
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <div className="row mb-4">
        <div className="col">
          <h1 className="h2">Dashboard Manager</h1>
          <p className="text-muted">
            Benvenuto, {session?.user?.name || session?.user?.email}
          </p>
        </div>
      </div>

      {/* Informazioni Team */}
      {team && (
        <div className="row mb-4">
          <div className="col-12">
            <div className="card bg-primary text-white">
              <div className="card-body">
                <h5 className="card-title">Il tuo Team: {team.name}</h5>
                <p className="card-text">
                  Organizzazione: {team.organization.name}
                </p>
                <div className="d-flex align-items-center">
                  <i className="bi bi-people-fill me-2"></i>
                  <span>{team._count.members} membri</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Statistiche rapide */}
      <div className="row mb-4">
        <div className="col-md-4">
          <div className="card text-center">
            <div className="card-body">
              <i className="bi bi-people fs-1 text-primary mb-3"></i>
              <h5 className="card-title">Membri Attivi</h5>
              <p className="card-text display-6">{stats?.activeMembers || 0}</p>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card text-center">
            <div className="card-body">
              <i className="bi bi-clipboard-check fs-1 text-success mb-3"></i>
              <h5 className="card-title">Test Completati</h5>
              <p className="card-text display-6">{stats?.completedTests || 0}</p>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card text-center">
            <div className="card-body">
              <i className="bi bi-graph-up fs-1 text-info mb-3"></i>
              <h5 className="card-title">Test Totali</h5>
              <p className="card-text display-6">{stats?.totalTests || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Menu Sezioni */}
      <div className="row g-4">
        <div className="col-md-6 col-lg-4">
          <Link href="/manager/team" className="text-decoration-none">
            <div className="card h-100 shadow-sm hover-shadow transition">
              <div className="card-body text-center p-4">
                <div className="mb-3 text-primary">
                  <i className="bi bi-people-fill fs-1"></i>
                </div>
                <h5 className="card-title">Il Mio Team</h5>
                <p className="card-text text-muted">
                  Visualizza i membri del tuo team e le loro informazioni
                </p>
              </div>
              <div className="card-footer bg-primary bg-opacity-10 border-0">
                <div className="text-center">
                  <span className="text-primary fw-semibold">
                    Gestisci <i className="bi bi-arrow-right"></i>
                  </span>
                </div>
              </div>
            </div>
          </Link>
        </div>

        <div className="col-md-6 col-lg-4">
          <Link href="/manager/tests" className="text-decoration-none">
            <div className="card h-100 shadow-sm hover-shadow transition">
              <div className="card-body text-center p-4">
                <div className="mb-3 text-success">
                  <i className="bi bi-clipboard-data fs-1"></i>
                </div>
                <h5 className="card-title">Test del Team</h5>
                <p className="card-text text-muted">
                  Monitora i test completati dal tuo team (anonimi)
                </p>
              </div>
              <div className="card-footer bg-success bg-opacity-10 border-0">
                <div className="text-center">
                  <span className="text-success fw-semibold">
                    Visualizza <i className="bi bi-arrow-right"></i>
                  </span>
                </div>
              </div>
            </div>
          </Link>
        </div>

        <div className="col-md-6 col-lg-4">
          <Link href="/manager/analytics" className="text-decoration-none">
            <div className="card h-100 shadow-sm hover-shadow transition">
              <div className="card-body text-center p-4">
                <div className="mb-3 text-info">
                  <i className="bi bi-graph-up-arrow fs-1"></i>
                </div>
                <h5 className="card-title">Analitiche</h5>
                <p className="card-text text-muted">
                  Analizza le performance e i risultati aggregati del team
                </p>
              </div>
              <div className="card-footer bg-info bg-opacity-10 border-0">
                <div className="text-center">
                  <span className="text-info fw-semibold">
                    Analizza <i className="bi bi-arrow-right"></i>
                  </span>
                </div>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
} 