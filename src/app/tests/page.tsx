'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
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
  questions: string;
  questionsArray?: TestSection[];
  metadata?: string;
}

export default function TestsPage() {
  const { data: session, status } = useSession();
  const isAdmin = session?.user?.role === 'ADMIN';
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [managementMode, setManagementMode] = useState(false);
  const [updatingTest, setUpdatingTest] = useState<string | null>(null);

  useEffect(() => {
    const fetchTests = async () => {
      if (status === 'loading') return;
      
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
  }, [status]);

  const toggleTestVisibility = async (testId: string, currentStatus: boolean) => {
    setUpdatingTest(testId);
    try {
      const response = await axios.patch(`/api/tests/${testId}`, {
        isActive: !currentStatus
      });
      
      if (response.data.success) {
        setTests(tests.map(test => 
          test.id === testId ? { ...test, isActive: !currentStatus } : test
        ));
      }
    } catch (error) {
      console.error('Errore nell\'aggiornamento del test:', error);
      alert('Errore nell\'aggiornamento del test');
    } finally {
      setUpdatingTest(null);
    }
  };

  const deleteTest = async (testId: string, testTitle: string) => {
    if (!confirm(`Sei sicuro di voler eliminare il test "${testTitle}"? Questa azione non può essere annullata.`)) {
      return;
    }

    setUpdatingTest(testId);
    try {
      const response = await axios.delete(`/api/tests/${testId}`);
      
      if (response.data.success) {
        setTests(tests.filter(test => test.id !== testId));
        alert('Test eliminato con successo');
      }
    } catch (error) {
      console.error('Errore nell\'eliminazione del test:', error);
      alert('Errore nell\'eliminazione del test');
    } finally {
      setUpdatingTest(null);
    }
  };

  // Separa i test di sistema da quelli personalizzati
  const systemTests = tests.filter(test => {
    try {
      const metadata = test.metadata ? JSON.parse(test.metadata) : {};
      return metadata.isSystemTest === true;
    } catch {
      return false;
    }
  });

  const customTests = tests.filter(test => {
    try {
      const metadata = test.metadata ? JSON.parse(test.metadata) : {};
      return metadata.isSystemTest !== true;
    } catch {
      return true;
    }
  });

  // Filtra i test in base al ruolo e alla modalità gestione
  const visibleSystemTests = managementMode && isAdmin
    ? systemTests
    : systemTests.filter(test => test.isActive);
    
  const visibleCustomTests = isAdmin || managementMode
    ? customTests 
    : customTests.filter(test => test.isActive);

  // Funzione per determinare l'href del test
  const getTestHref = (test: Test) => {
    // Per i test di sistema, usa percorsi specifici
    if (test.title.includes('S-AS')) {
      return '/tests/sas';
    } else if (test.title.includes('PID-5')) {
      return '/tests/pid5';
    }
    // Per test personalizzati
    return `/tests/${test.id}`;
  };
  
  return (
    <div className="container py-5">
      <div className="row justify-content-between align-items-center mb-4">
        <div className="col-auto">
          <h1 className="h2 mb-0">Test Psicologici Disponibili</h1>
          <p className="text-muted mb-0">Scegli il test più adatto alle tue esigenze</p>
        </div>
        
        {isAdmin && (
          <div className="col-auto d-flex gap-2">
            <button 
              className={`btn ${managementMode ? 'btn-danger' : 'btn-outline-primary'}`}
              onClick={() => setManagementMode(!managementMode)}
            >
              <i className={`bi ${managementMode ? 'bi-x-lg' : 'bi-gear'} me-2`}></i>
              {managementMode ? 'Chiudi Gestione' : 'Gestione Test'}
            </button>
            <Link 
              href="/tests/manage" 
              className="btn btn-primary"
            >
              <i className="bi bi-plus-circle me-2"></i>
              Crea Nuovo Test
            </Link>
          </div>
        )}
      </div>

      {managementMode && isAdmin && (
        <div className="alert alert-info mb-4">
          <i className="bi bi-info-circle me-2"></i>
          <strong>Modalità Gestione Attiva:</strong> Puoi attivare/disattivare o eliminare tutti i test. Le modifiche saranno applicate immediatamente.
        </div>
      )}
      
      {error && (
        <div className="alert alert-danger" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {error}
        </div>
      )}
      
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Caricamento...</span>
          </div>
          <p className="mt-2">Caricamento dei test in corso...</p>
        </div>
      ) : (
        <>
          {/* Sezione Test di Sistema */}
          {visibleSystemTests.length > 0 && (
            <div className="mb-5">
              <h3 className="h5 mb-3 text-muted">
                <i className="bi bi-shield-check me-2"></i>
                Test Standardizzati
              </h3>
              <div className="row">
                {visibleSystemTests.map(test => (
                  <div className="col-md-6 col-lg-4 mb-4" key={test.id}>
                    <div className={`card h-100 border-0 shadow-sm ${!test.isActive && managementMode ? 'opacity-75' : ''}`}>
                      {managementMode && isAdmin && (
                        <div className="card-header bg-light border-0">
                          <div className="d-flex justify-content-between align-items-center">
                            <div className="form-check form-switch">
                              <input 
                                className="form-check-input" 
                                type="checkbox" 
                                id={`system-test-active-${test.id}`}
                                checked={test.isActive}
                                onChange={() => toggleTestVisibility(test.id, test.isActive)}
                                disabled={updatingTest === test.id}
                              />
                              <label className="form-check-label" htmlFor={`system-test-active-${test.id}`}>
                                {test.isActive ? 'Attivo' : 'Disattivato'}
                              </label>
                            </div>
                            <button 
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => deleteTest(test.id, test.title)}
                              disabled={updatingTest === test.id}
                              title="Elimina test"
                            >
                              {updatingTest === test.id ? (
                                <span className="spinner-border spinner-border-sm" role="status"></span>
                              ) : (
                                <i className="bi bi-trash"></i>
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                      <div className="card-body">
                        <div className="d-flex justify-content-between align-items-start mb-3">
                          <h5 className="card-title">
                            {test.title}
                          </h5>
                          {!managementMode && (
                            <span className="badge bg-success">Disponibile</span>
                          )}
                        </div>
                        
                        <p className="card-text text-muted mb-4" style={{ minHeight: '3rem' }}>
                          {test.description}
                        </p>
                        
                        <div className="d-flex mb-3">
                          <span className="badge bg-light text-dark me-2">
                            <i className="bi bi-tag me-1"></i>
                            {test.category}
                          </span>
                          <span className="badge bg-light text-dark">
                            <i className="bi bi-clock me-1"></i>
                            {test.timeLimit || 30} min
                          </span>
                        </div>
                        
                        <div className="mb-3">
                          <small className="text-muted">
                            <i className="bi bi-info-circle me-1"></i>
                            Test professionale con analisi dettagliata dei risultati
                          </small>
                        </div>
                      </div>
                      <div className="card-footer bg-white border-0">
                        {!managementMode ? (
                          <Link href={getTestHref(test)} className="btn btn-primary w-100">
                            <i className="bi bi-play-fill me-2"></i>
                            Inizia Test
                          </Link>
                        ) : (
                          <button className="btn btn-secondary w-100" disabled>
                            <i className="bi bi-lock me-2"></i>
                            Test di Sistema
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sezione Test Personalizzati (se presenti) */}
          {(visibleCustomTests.length > 0 || isAdmin) && (
            <div>
              <h3 className="h5 mb-3 text-muted">
                <i className="bi bi-person-badge me-2"></i>
                Test Personalizzati
              </h3>
              <div className="row">
                {visibleCustomTests.map(test => (
                  <div className="col-md-6 col-lg-4 mb-4" key={test.id}>
                    <div className={`card h-100 border-0 shadow-sm ${!test.isActive ? 'opacity-75' : ''}`}>
                      {managementMode && isAdmin && (
                        <div className="card-header bg-light border-0">
                          <div className="d-flex justify-content-between align-items-center">
                            <div className="form-check form-switch">
                              <input 
                                className="form-check-input" 
                                type="checkbox" 
                                id={`test-active-${test.id}`}
                                checked={test.isActive}
                                onChange={() => toggleTestVisibility(test.id, test.isActive)}
                                disabled={updatingTest === test.id}
                              />
                              <label className="form-check-label" htmlFor={`test-active-${test.id}`}>
                                {test.isActive ? 'Attivo' : 'Disattivato'}
                              </label>
                            </div>
                            <button 
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => deleteTest(test.id, test.title)}
                              disabled={updatingTest === test.id}
                            >
                              {updatingTest === test.id ? (
                                <span className="spinner-border spinner-border-sm" role="status"></span>
                              ) : (
                                <i className="bi bi-trash"></i>
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                      <div className="card-body">
                        <div className="d-flex justify-content-between align-items-start mb-3">
                          <h5 className="card-title">{test.title}</h5>
                          {!test.isActive && !managementMode && isAdmin && (
                            <span className="badge bg-danger">Disattivato</span>
                          )}
                        </div>
                        
                        <p className="card-text text-muted mb-4" style={{ minHeight: '3rem' }}>
                          {test.description.length > 100 
                            ? `${test.description.substring(0, 100)}...` 
                            : test.description}
                        </p>
                        
                        <div className="d-flex mb-3">
                          <span className="badge bg-light text-dark me-2">
                            <i className="bi bi-tag me-1"></i>
                            {test.category}
                          </span>
                          <span className="badge bg-light text-dark">
                            <i className="bi bi-clock me-1"></i>
                            {test.timeLimit} min
                          </span>
                        </div>
                      </div>
                      <div className="card-footer bg-white border-0">
                        {managementMode && isAdmin ? (
                          <Link href={`/tests/manage/${test.id}`} className="btn btn-outline-primary w-100">
                            <i className="bi bi-pencil me-2"></i>
                            Modifica Test
                          </Link>
                        ) : (
                          <Link href={`/tests/${test.id}`} className="btn btn-primary w-100">
                            <i className="bi bi-eye me-2"></i>
                            Visualizza Test
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
             
      {/* Messaggio se non ci sono test */}
      {visibleSystemTests.length === 0 && visibleCustomTests.length === 0 && !loading && (
        <div className="alert alert-info mt-4">
          <div className="d-flex align-items-center">
            <i className="bi bi-info-circle me-3 fs-4"></i>
            <div>
              <h5 className="alert-heading mb-1">Nessun test disponibile</h5>
              <p className="mb-0">
                {isAdmin ? 'Tutti i test sono stati disattivati. Puoi riattivarli dalla modalità gestione o crearne di nuovi.' : 'I test verranno aggiunti dagli amministratori.'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 