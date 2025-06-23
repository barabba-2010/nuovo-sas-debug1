'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { factorDefinitions } from '../../../lib/sas-data';

interface SASResult {
  id: string;
  testTitle: string;
  completedAt: string;
  score: number;
  maxScore: number;
  metadata: {
    scopo: number;
    antiscopo: number;
    balance: number;
    factorScores: Record<string, any>;
    topFactors: Array<{
      id: number;
      name: string;
      score: number;
    }>;
  };
  results: any;
}

export default function SASResultsPage() {
  const { data: session, status } = useSession();
  const [results, setResults] = useState<SASResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedResult, setSelectedResult] = useState<SASResult | null>(null);

  useEffect(() => {
    const fetchResults = async () => {
      if (status === 'loading') return;
      
      try {
        const response = await fetch('/api/tests/sas/results');
        if (response.ok) {
          const data = await response.json();
          setResults(data.results);
        } else {
          setError('Errore nel caricamento dei risultati');
        }
      } catch (err) {
        console.error('Errore:', err);
        setError('Errore di connessione');
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [status]);

  if (status === 'loading' || loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Caricamento...</span>
        </div>
        <p className="mt-3">Caricamento risultati...</p>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="container py-5">
        <div className="alert alert-warning" role="alert">
          <h4 className="alert-heading">Accesso richiesto</h4>
          <p>Devi effettuare l'accesso per visualizzare i risultati.</p>
          <hr />
          <Link href="/auth/login" className="btn btn-primary">
            <i className="bi bi-box-arrow-in-right me-2"></i>
            Accedi
          </Link>
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
          <hr />
          <Link href="/tests" className="btn btn-outline-secondary">
            <i className="bi bi-arrow-left me-2"></i>
            Torna ai Test
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h2 mb-0">Risultati Test S-AS</h1>
          <p className="text-muted mb-0">Cronologia dei tuoi test completati</p>
        </div>
        <div>
          <Link href="/tests/sas" className="btn btn-primary me-2">
            <i className="bi bi-plus-circle me-2"></i>
            Nuovo Test
          </Link>
          <Link href="/tests" className="btn btn-outline-secondary">
            <i className="bi bi-arrow-left me-2"></i>
            Torna ai Test
          </Link>
        </div>
      </div>

      {results.length === 0 ? (
        <div className="card border-0 shadow-sm">
          <div className="card-body p-5 text-center">
            <i className="bi bi-clipboard2-data fs-1 text-muted mb-3"></i>
            <h4>Nessun risultato disponibile</h4>
            <p className="text-muted mb-4">
              Non hai ancora completato nessun Test S-AS. Completa il primo test per visualizzare i risultati qui.
            </p>
            <Link href="/tests/sas" className="btn btn-primary">
              <i className="bi bi-play-fill me-2"></i>
              Inizia il primo Test S-AS
            </Link>
          </div>
        </div>
      ) : (
        <div className="row">
          {/* Lista risultati */}
          <div className="col-lg-4">
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-primary text-white">
                <h5 className="mb-0">
                  <i className="bi bi-list-ul me-2"></i>
                  Test Completati ({results.length})
                </h5>
              </div>
              <div className="card-body p-0">
                <div className="list-group list-group-flush">
                  {results.map((result) => (
                    <button
                      key={result.id}
                      className={`list-group-item list-group-item-action ${
                        selectedResult?.id === result.id ? 'active' : ''
                      }`}
                      onClick={() => setSelectedResult(result)}
                    >
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <h6 className="mb-1">Test S-AS</h6>
                          <small className={selectedResult?.id === result.id ? 'text-light' : 'text-muted'}>
                            {new Date(result.completedAt).toLocaleDateString('it-IT', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </small>
                        </div>
                        <div className="text-end">
                          <span className={`badge ${selectedResult?.id === result.id ? 'bg-light text-dark' : 'bg-primary'}`}>
                            Bil: {result.metadata.balance}
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Dettagli risultato selezionato */}
          <div className="col-lg-8">
            {selectedResult ? (
              <div>
                {/* Riepilogo punteggi */}
                <div className="card border-0 shadow-sm mb-4">
                  <div className="card-body">
                    <h5 className="card-title">
                      Riepilogo Punteggi 
                      <small className="text-muted ms-2">
                        {new Date(selectedResult.completedAt).toLocaleDateString('it-IT')}
                      </small>
                    </h5>
                    <div className="row text-center">
                      <div className="col-md-4">
                        <div className="p-3 bg-primary bg-opacity-10 rounded">
                          <h6 className="text-primary">Scopo</h6>
                          <h4 className="text-primary">{selectedResult.metadata.scopo}</h4>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="p-3 bg-secondary bg-opacity-10 rounded">
                          <h6 className="text-secondary">Antiscopo</h6>
                          <h4 className="text-secondary">{selectedResult.metadata.antiscopo}</h4>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="p-3 bg-info bg-opacity-10 rounded">
                          <h6 className="text-info">Bilanciamento</h6>
                          <h4 className="text-info">{selectedResult.metadata.balance}</h4>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Fattori principali */}
                <div className="card border-0 shadow-sm mb-4">
                  <div className="card-body">
                    <h5 className="card-title">Fattori Principali</h5>
                    <div className="table-responsive">
                      <table className="table table-striped">
                        <thead>
                          <tr>
                            <th>Posizione</th>
                            <th>Fattore</th>
                            <th>Punteggio</th>
                            <th>Descrizione</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedResult.metadata.topFactors.map((factor, index) => (
                            <tr key={factor.id}>
                              <td>
                                <span className={`badge ${index === 0 ? 'bg-warning' : index === 1 ? 'bg-secondary' : 'bg-dark'}`}>
                                  {index + 1}°
                                </span>
                              </td>
                              <td><strong>{factor.id}. {factor.name}</strong></td>
                              <td><span className="badge bg-primary">{factor.score.toFixed(1)}</span></td>
                              <td>{factorDefinitions[factor.id]?.description}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Tutti i fattori */}
                <div className="card border-0 shadow-sm mb-4">
                  <div className="card-body">
                    <h5 className="card-title">Analisi Completa dei Fattori</h5>
                    <div className="table-responsive">
                      <table className="table table-sm">
                        <thead>
                          <tr>
                            <th>Fattore</th>
                            <th>Punteggio</th>
                            <th style={{ width: "40%" }}>Barra di Progresso</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.values(selectedResult.metadata.factorScores)
                            .sort((a: any, b: any) => a.id - b.id)
                            .map((factor: any) => {
                              const maxScore = Math.max(...Object.values(selectedResult.metadata.factorScores).map((f: any) => f.score));
                              const percentage = maxScore > 0 ? (factor.score / maxScore) * 100 : 0;
                              
                              return (
                                <tr key={factor.id}>
                                  <td>
                                    <strong>{factor.id}. {factor.name}</strong>
                                  </td>
                                  <td>
                                    <span className="badge bg-primary">{factor.score.toFixed(1)}</span>
                                  </td>
                                  <td>
                                    <div className="progress" style={{ height: '20px' }}>
                                      <div 
                                        className="progress-bar" 
                                        style={{ width: `${percentage}%` }}
                                      >
                                        {factor.score.toFixed(1)}
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Azioni */}
                <div className="card border-0 shadow-sm">
                  <div className="card-body">
                    <h5 className="card-title">Azioni</h5>
                    <div className="d-flex gap-2">
                      <button 
                        className="btn btn-primary"
                        onClick={() => {
                          // Qui si potrebbe implementare la generazione PDF
                          alert('Funzionalità di esportazione PDF in sviluppo');
                        }}
                      >
                        <i className="bi bi-file-pdf me-2"></i>
                        Esporta PDF
                      </button>
                      <button 
                        className="btn btn-outline-primary"
                        onClick={() => {
                          // Qui si potrebbe implementare la condivisione
                          navigator.clipboard.writeText(window.location.href);
                          alert('Link copiato negli appunti');
                        }}
                      >
                        <i className="bi bi-share me-2"></i>
                        Condividi
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="card border-0 shadow-sm">
                <div className="card-body p-5 text-center">
                  <i className="bi bi-arrow-left-circle fs-1 text-muted mb-3"></i>
                  <h4>Seleziona un risultato</h4>
                  <p className="text-muted">
                    Clicca su uno dei test completati nella lista a sinistra per visualizzarne i dettagli.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 