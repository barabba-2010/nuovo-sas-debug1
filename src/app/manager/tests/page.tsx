'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import axios from 'axios';

interface TeamTest {
  id: string;
  testTitle: string;
  testType: string;
  completedAt: string;
  status: string;
  // Non includiamo informazioni identificative dell'utente
}

interface TestStats {
  totalTests: number;
  completedTests: number;
  inProgressTests: number;
  testTypes: {
    type: string;
    count: number;
  }[];
}

export default function ManagerTestsPage() {
  const { data: session, status } = useSession();
  const [tests, setTests] = useState<TeamTest[]>([]);
  const [stats, setStats] = useState<TestStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      fetchTestsData();
    }
  }, [status, session, filter]);

  const fetchTestsData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch anonymous test data
      const testsResponse = await axios.get('/api/manager/tests', {
        params: { filter }
      });
      setTests(testsResponse.data.tests);
      setStats(testsResponse.data.stats);
      
    } catch (error: any) {
      console.error('Errore nel caricamento dei test:', error);
      setError(error.response?.data?.message || 'Errore nel caricamento dei test');
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

  return (
    <div className="container py-4">
      <nav aria-label="breadcrumb">
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <Link href="/manager">Dashboard Manager</Link>
          </li>
          <li className="breadcrumb-item active">Test del Team</li>
        </ol>
      </nav>

      <div className="row mb-4">
        <div className="col">
          <h1 className="h2">Test del Team</h1>
          <p className="text-muted">
            Visualizzazione anonima dei test completati dal tuo team
          </p>
        </div>
      </div>

      {/* Statistiche */}
      {stats && (
        <div className="row mb-4">
          <div className="col-md-3">
            <div className="card text-center">
              <div className="card-body">
                <h5 className="card-title">Test Totali</h5>
                <p className="card-text display-6">{stats.totalTests}</p>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card text-center">
              <div className="card-body">
                <h5 className="card-title">Completati</h5>
                <p className="card-text display-6 text-success">{stats.completedTests}</p>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card text-center">
              <div className="card-body">
                <h5 className="card-title">In Corso</h5>
                <p className="card-text display-6 text-warning">{stats.inProgressTests}</p>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card">
              <div className="card-body">
                <h5 className="card-title">Per Tipo</h5>
                {stats.testTypes.map((type) => (
                  <div key={type.type} className="d-flex justify-content-between">
                    <span>{type.type}:</span>
                    <span className="badge bg-primary">{type.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filtri */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row align-items-center">
            <div className="col-md-6">
              <label className="form-label">Filtra per stato:</label>
              <select 
                className="form-select" 
                value={filter} 
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="all">Tutti i test</option>
                <option value="completed">Completati</option>
                <option value="in_progress">In corso</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Tabella Test Anonimi */}
      <div className="card">
        <div className="card-header">
          <h5 className="mb-0">Test del Team (Anonimi)</h5>
        </div>
        <div className="card-body">
          {tests.length > 0 ? (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>ID Anonimo</th>
                    <th>Test</th>
                    <th>Tipo</th>
                    <th>Data Completamento</th>
                    <th>Stato</th>
                  </tr>
                </thead>
                <tbody>
                  {tests.map((test, index) => (
                    <tr key={test.id}>
                      <td>#{index + 1}</td>
                      <td>{test.testTitle}</td>
                      <td>
                        <span className="badge bg-secondary">{test.testType}</span>
                      </td>
                      <td>
                        {test.completedAt 
                          ? new Date(test.completedAt).toLocaleDateString('it-IT')
                          : '-'
                        }
                      </td>
                      <td>
                        {test.status === 'COMPLETED' ? (
                          <span className="badge bg-success">Completato</span>
                        ) : (
                          <span className="badge bg-warning">In corso</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-clipboard-x fs-1 d-block mb-3"></i>
              <p>Nessun test trovato</p>
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
    </div>
  );
} 