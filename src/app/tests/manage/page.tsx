'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

interface TestSection {
  title: string;
  description: string;
  questions: any[];
}

interface Test {
  id: string;
  title: string;
  description: string;
  category: string;
  type: string;
  timeLimit: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  creatorId: string;
  questions: string;
  questionsArray?: TestSection[];
  questionCount?: number;
}

// Definizione dei test di sistema disponibili
const ALL_SYSTEM_TESTS = [
  {
    id: 'sas',
    title: 'Test S-AS',
    description: 'Valutazione completa degli obiettivi (Scopo) e delle preoccupazioni (Antiscopo)',
    category: 'Psicologia Clinica',
    type: 'PERSONALITY'
  }
  // Qui potrai aggiungere altri test di sistema in futuro
];

export default function TestManagementPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const isAdmin = session?.user?.role === 'ADMIN';

  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [deletedSystemTests, setDeletedSystemTests] = useState<string[]>([]);
  const [showSystemTests, setShowSystemTests] = useState(false);
  
  // Redirect if not admin
  useEffect(() => {
    if (status === 'loading') return;
    
    if (!isAdmin) {
      router.push('/');
    }
  }, [status, isAdmin, router]);

  // Carica i test di sistema eliminati
  useEffect(() => {
    const deleted = JSON.parse(localStorage.getItem('deletedSystemTests') || '[]');
    setDeletedSystemTests(deleted);
  }, []);

  // Fetch tests
  useEffect(() => {
    const fetchTests = async () => {
      if (status === 'loading' || !isAdmin) return;
      
      try {
        setLoading(true);
        const response = await axios.get('/api/tests');
        if (response.data && response.data.tests) {
          setTests(response.data.tests);
        }
      } catch (err) {
        console.error('Errore nel recupero dei test:', err);
        setError('Impossibile caricare i test. Riprova più tardi.');
      } finally {
        setLoading(false);
      }
    };

    fetchTests();
  }, [status, isAdmin]);

  // Funzione per modificare lo stato di un test (attivo/disattivo)
  const handleToggleActive = async (testId: string, currentStatus: boolean) => {
    try {
      setActionLoading(testId);
      const response = await axios.patch(`/api/tests/${testId}`, {
        isActive: !currentStatus
      });
      
      // Aggiorna la lista dei test con il nuovo stato
      setTests(prev => 
        prev.map(test => 
          test.id === testId 
            ? { ...test, isActive: !currentStatus } 
            : test
        )
      );
      
      setMessage({
        type: 'success',
        text: `Test ${!currentStatus ? 'attivato' : 'disattivato'} con successo!`
      });
      
      // Pulisci il messaggio dopo 3 secondi
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      
    } catch (err) {
      console.error('Errore durante l\'aggiornamento dello stato del test:', err);
      setMessage({
        type: 'danger',
        text: 'Impossibile aggiornare lo stato del test.'
      });
    } finally {
      setActionLoading(null);
    }
  };

  // Funzione per eliminare un test
  const handleDeleteTest = async (testId: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo test? Questa azione non può essere annullata.')) {
      return;
    }
    
    try {
      setActionLoading(testId);
      await axios.delete(`/api/tests/${testId}`);
      
      // Rimuovi il test dalla lista
      setTests(prev => prev.filter(test => test.id !== testId));
      
      setMessage({
        type: 'success',
        text: 'Test eliminato con successo!'
      });
      
      // Pulisci il messaggio dopo 3 secondi
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      
    } catch (err) {
      console.error('Errore durante l\'eliminazione del test:', err);
      setMessage({
        type: 'danger',
        text: 'Impossibile eliminare il test.'
      });
    } finally {
      setActionLoading(null);
    }
  };

  // Funzione per ripristinare un test di sistema
  const handleRestoreSystemTest = (testId: string) => {
    // Rimuovi il test dalla lista dei test eliminati
    const newDeletedTests = deletedSystemTests.filter(id => id !== testId);
    setDeletedSystemTests(newDeletedTests);
    localStorage.setItem('deletedSystemTests', JSON.stringify(newDeletedTests));
    
    // Rimuovi anche lo stato salvato per questo test
    const savedState = JSON.parse(localStorage.getItem('systemTestsState') || '{}');
    delete savedState[testId];
    localStorage.setItem('systemTestsState', JSON.stringify(savedState));
    
    setMessage({
      type: 'success',
      text: 'Test di sistema ripristinato con successo! Torna alla pagina dei test per vederlo.'
    });
    
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };
  
  if (status === 'loading') {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3">Verifica delle autorizzazioni...</p>
      </div>
    );
  }
  
  if (!isAdmin) {
    return null; // Will redirect
  }
  
  return (
    <div className="container py-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h2 mb-0">Gestione Test</h1>
          <p className="text-muted">Gestisci e organizza i test psicologici</p>
        </div>
        <div className="d-flex gap-2">
          <button 
            className="btn btn-outline-secondary"
            onClick={() => setShowSystemTests(!showSystemTests)}
          >
            <i className="bi bi-gear me-2"></i>
            Test di Sistema
          </button>
          <Link href="/tests/create" className="btn btn-primary">
            <i className="bi bi-plus-circle me-2"></i>
            Crea Nuovo Test
          </Link>
        </div>
      </div>
      
      {message.text && (
        <div className={`alert alert-${message.type} alert-dismissible fade show`} role="alert">
          <i className={`bi ${message.type === 'success' ? 'bi-check-circle' : 'bi-exclamation-triangle'} me-2`}></i>
          {message.text}
          <button type="button" className="btn-close" onClick={() => setMessage({ type: '', text: '' })}></button>
        </div>
      )}
      
      {error && (
        <div className="alert alert-danger" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {error}
        </div>
      )}

      {/* Sezione Test di Sistema */}
      {showSystemTests && (
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-header bg-light">
            <h5 className="mb-0">
              <i className="bi bi-shield-check me-2"></i>
              Gestione Test di Sistema
            </h5>
          </div>
          <div className="card-body">
            {deletedSystemTests.length > 0 ? (
              <>
                <p className="text-muted mb-3">
                  I seguenti test di sistema sono stati rimossi e possono essere ripristinati:
                </p>
                <div className="list-group">
                  {deletedSystemTests.map(testId => {
                    const testInfo = ALL_SYSTEM_TESTS.find(t => t.id === testId);
                    if (!testInfo) return null;
                    
                    return (
                      <div key={testId} className="list-group-item d-flex justify-content-between align-items-center">
                        <div>
                          <h6 className="mb-1">{testInfo.title}</h6>
                          <p className="mb-0 text-muted small">{testInfo.description}</p>
                        </div>
                        <button 
                          className="btn btn-sm btn-success"
                          onClick={() => handleRestoreSystemTest(testId)}
                        >
                          <i className="bi bi-arrow-clockwise me-1"></i>
                          Ripristina
                        </button>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <p className="text-muted mb-0">
                <i className="bi bi-check-circle me-2"></i>
                Tutti i test di sistema sono attivi. Puoi gestirli dalla pagina principale dei test.
              </p>
            )}
          </div>
        </div>
      )}
      
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Caricamento...</span>
          </div>
          <p className="mt-2">Caricamento dei test in corso...</p>
        </div>
      ) : tests.length > 0 ? (
        <div className="card border-0 shadow-sm">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead className="bg-light">
                <tr>
                  <th>Titolo</th>
                  <th>Categoria</th>
                  <th>Stato</th>
                  <th>Domande</th>
                  <th>Tempo</th>
                  <th>Creato il</th>
                  <th className="text-end">Azioni</th>
                </tr>
              </thead>
              <tbody>
                {tests.map(test => (
                  <tr key={test.id}>
                    <td>
                      <Link href={`/tests/${test.id}`} className="text-decoration-none">
                        {test.title}
                      </Link>
                    </td>
                    <td>{test.category}</td>
                    <td>
                      {test.isActive ? (
                        <span className="badge bg-success">Attivo</span>
                      ) : (
                        <span className="badge bg-danger">Disattivato</span>
                      )}
                    </td>
                    <td>{test.questionCount || 0}</td>
                    <td>{test.timeLimit} min</td>
                    <td>{new Date(test.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div className="d-flex justify-content-end gap-2">
                        <Link 
                          href={`/tests/${test.id}`}
                          className="btn btn-sm btn-outline-secondary"
                        >
                          <i className="bi bi-eye"></i>
                        </Link>
                        <Link 
                          href={`/tests/${test.id}/edit`}
                          className="btn btn-sm btn-outline-primary"
                        >
                          <i className="bi bi-pencil"></i>
                        </Link>
                        <button
                          className={`btn btn-sm ${test.isActive ? 'btn-outline-danger' : 'btn-outline-success'}`}
                          onClick={() => handleToggleActive(test.id, test.isActive)}
                          disabled={actionLoading === test.id}
                        >
                          {actionLoading === test.id ? (
                            <span className="spinner-border spinner-border-sm" role="status"></span>
                          ) : (
                            <i className={`bi ${test.isActive ? 'bi-x-circle' : 'bi-check-circle'}`}></i>
                          )}
                        </button>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDeleteTest(test.id)}
                          disabled={actionLoading === test.id}
                        >
                          {actionLoading === test.id ? (
                            <span className="spinner-border spinner-border-sm" role="status"></span>
                          ) : (
                            <i className="bi bi-trash"></i>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="card border-0 shadow-sm">
          <div className="card-body p-4">
            <div className="d-flex align-items-center justify-content-center py-5">
              <div className="text-center">
                <i className="bi bi-clipboard-x fs-1 text-muted mb-3"></i>
                <h4>Nessun test personalizzato</h4>
                <p className="text-muted">
                  Non ci sono test personalizzati nel sistema. Inizia creando il tuo primo test.
                </p>
                <Link href="/tests/create" className="btn btn-primary mt-3">
                  <i className="bi bi-plus-circle me-2"></i>
                  Crea il Primo Test
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 