'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import axios from 'axios';

interface Team {
  id: string;
  name: string;
  manager?: {
    id: string;
    name: string;
  };
}

export default function SelectTeamPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
      return;
    }

    if (status === 'authenticated' && session?.user) {
      fetchTeams();
    }
  }, [status, session, router]);

  const fetchTeams = async () => {
    try {
      const response = await axios.get('/api/teams/available');
      setTeams(response.data.teams);
      setIsLoading(false);
    } catch (error) {
      console.error('Errore nel caricamento dei team:', error);
      setError('Errore nel caricamento dei team disponibili');
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeam) {
      setError('Seleziona un team');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await axios.post('/api/teams/join', {
        teamId: selectedTeam
      });

      // Redirect to home after successful team selection
      router.push('/');
    } catch (error: any) {
      console.error('Errore nell\'assegnazione al team:', error);
      setError(error.response?.data?.message || 'Errore nell\'assegnazione al team');
      setIsLoading(false);
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-lg-6 col-md-8">
            <div className="card shadow-lg border-0 rounded-lg">
              <div className="card-body p-5 text-center">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Caricamento...</span>
                </div>
                <p className="mt-3">Caricamento team disponibili...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-lg-6 col-md-8">
          <div className="card shadow-lg border-0 rounded-lg">
            <div className="card-header bg-primary text-white text-center py-4">
              <h3 className="fw-light mb-0">Seleziona il tuo Team</h3>
            </div>
            <div className="card-body p-4 p-md-5">
              <div className="alert alert-info mb-4">
                <i className="bi bi-info-circle me-2"></i>
                Benvenuto! Per completare la registrazione, seleziona il team a cui appartieni.
              </div>

              {error && (
                <div className="alert alert-danger" role="alert">
                  <i className="bi bi-exclamation-triangle-fill me-2"></i>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label htmlFor="team" className="form-label">Team di appartenenza</label>
                  <select
                    className="form-select form-select-lg"
                    id="team"
                    value={selectedTeam}
                    onChange={(e) => setSelectedTeam(e.target.value)}
                    required
                    disabled={isLoading || teams.length === 0}
                  >
                    <option value="">-- Seleziona un team --</option>
                    {teams.map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.name} {team.manager && `(Manager: ${team.manager.name})`}
                      </option>
                    ))}
                  </select>
                </div>

                {teams.length === 0 && (
                  <div className="alert alert-warning">
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    Nessun team disponibile. Contatta il tuo responsabile HR.
                  </div>
                )}

                <div className="d-grid">
                  <button
                    type="submit"
                    className="btn btn-primary btn-lg"
                    disabled={isLoading || teams.length === 0}
                  >
                    {isLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Assegnazione in corso...
                      </>
                    ) : (
                      'Conferma e Procedi'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 