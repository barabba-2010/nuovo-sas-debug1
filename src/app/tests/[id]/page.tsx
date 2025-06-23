'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import axios from 'axios';

// Definisco le interfacce per TypeScript
interface TestOption {
  value: string;
  label: string;
}

interface TestQuestion {
  id: string;
  text: string;
  type: string;
  options: TestOption[];
}

interface TestSection {
  title: string;
  description: string;
  questions: TestQuestion[];
}

interface Test {
  id: string;
  title: string;
  description: string;
  instructions: string;
  isActive: boolean;
  category: string;
  type: string;
  timeLimit: number;
  questions: string; // JSON string
  questionsArray?: TestSection[]; // Array di sezioni dopo il parsing
  metadata?: string;
}

export default function TestPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const isAdmin = session?.user?.role === 'ADMIN';
  // Usiamo useParams per ottenere il parametro id in modo sicuro
  const routeParams = useParams();
  const testId = routeParams.id as string;
  
  // Stati per gestire i dati del test e lo UI
  const [test, setTest] = useState<Test | null>(null);
  const [hasStartedTest, setHasStartedTest] = useState(false);
  const [parsedSections, setParsedSections] = useState<TestSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  // Recupera i dati del test
  useEffect(() => {
    async function fetchTest() {
      setLoading(true);
      try {
        const response = await axios.get(`/api/tests/${testId}`);
        setTest(response.data);
        
        // Parse delle domande JSON
        try {
          const sectionsData = JSON.parse(response.data.questions);
          setParsedSections(sectionsData);
        } catch (parseError) {
          console.error('Errore nel parsing delle domande:', parseError);
          setParsedSections([]);
        }

        // Controlla se c'è un test già iniziato in localStorage
        const savedTest = localStorage.getItem(`test_${testId}`);
        if (savedTest) {
          setHasStartedTest(true);
        }
      } catch (err: any) {
        console.error('Errore nel recupero del test:', err);
        setError(err.response?.data?.error || 'Errore nel caricamento del test');
      } finally {
        setLoading(false);
      }
    }
    
    if (testId) {
      fetchTest();
    }
  }, [testId]);
  
  // Handle test activation/deactivation
  const handleToggleActive = async () => {
    if (!test) return;
    
    try {
      setLoading(true);
      const newStatus = !test.isActive;
      
      await axios.patch(`/api/tests/${test.id}`, {
        isActive: newStatus
      });
      
      setTest(prev => prev ? {...prev, isActive: newStatus} : null);
      
      setAlertMessage(newStatus 
        ? `"${test.title}" è stato attivato con successo!` 
        : `"${test.title}" è stato disattivato con successo!`
      );
      
      // Clear the message after 3 seconds
      setTimeout(() => {
        setAlertMessage('');
      }, 3000);
    } catch (err) {
      console.error('Errore durante l\'aggiornamento dello stato del test:', err);
      setError('Impossibile aggiornare lo stato del test');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle permanent test deletion
  const handleDeleteTest = async () => {
    if (!test) return;
    
    try {
      setLoading(true);
      await axios.delete(`/api/tests/${test.id}`);
      setShowDeleteModal(false);
      router.push('/tests/manage');
    } catch (err) {
      console.error('Errore durante l\'eliminazione del test:', err);
      setError('Impossibile eliminare il test');
      setLoading(false);
    }
  };

  // Funzione per continuare un test già iniziato o iniziarne uno nuovo
  const startOrContinueTest = () => {
    router.push(`/tests/${testId}/take`);
  };
  
  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3">Caricamento del test in corso...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger" role="alert">
          <h4 className="alert-heading">Errore!</h4>
          <p>{error}</p>
          <hr />
          <div className="d-flex justify-content-end">
            <Link href="/tests" className="btn btn-outline-secondary">
              <i className="bi bi-arrow-left me-2"></i>
              Torna ai Test
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  if (!test) {
    return (
      <div className="container py-5">
        <div className="alert alert-warning" role="alert">
          <h4 className="alert-heading">Test non trovato</h4>
          <p>Il test richiesto non è disponibile o potrebbe essere stato rimosso.</p>
          <hr />
          <div className="d-flex justify-content-end">
            <Link href="/tests" className="btn btn-outline-secondary">
              <i className="bi bi-arrow-left me-2"></i>
              Torna ai Test
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container py-5">
      {alertMessage && (
        <div className="alert alert-success alert-dismissible fade show mb-4" role="alert">
          <i className="bi bi-check-circle-fill me-2"></i>
          {alertMessage}
          <button type="button" className="btn-close" onClick={() => setAlertMessage('')}></button>
        </div>
      )}
      
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <Link href="/tests" className="btn btn-outline-secondary mb-2">
            <i className="bi bi-arrow-left me-2"></i>
            Torna ai Test
          </Link>
          <h1 className="h2 mb-0">{test.title}</h1>
          <p className="text-muted">
            {test.category} • {test.timeLimit} minuti
            {test.isActive ? (
              <span className="badge bg-success ms-2">Attivo</span>
            ) : (
              <span className="badge bg-danger ms-2">Disattivato</span>
            )}
          </p>
        </div>
        
        {isAdmin && (
          <div className="d-flex gap-2">
            <Link href={`/tests/${testId}/edit`} className="btn btn-outline-primary">
              <i className="bi bi-pencil me-2"></i>
              Modifica
            </Link>
            
            <button 
              onClick={handleToggleActive} 
              className={`btn ${test.isActive ? 'btn-outline-danger' : 'btn-outline-success'}`}
              disabled={loading}
            >
              {loading ? (
                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
              ) : (
                <i className={`bi ${test.isActive ? 'bi-x-circle' : 'bi-check-circle'} me-2`}></i>
              )}
              {test.isActive ? 'Disattiva' : 'Attiva'}
            </button>
            
            <button 
              onClick={() => setShowDeleteModal(true)}
              className="btn btn-danger"
              disabled={loading}
            >
              <i className="bi bi-trash me-2"></i>
              Elimina
            </button>
          </div>
        )}
      </div>
      
      <div className="row">
        <div className="col-lg-8">
          {/* Informazioni sul test */}
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-body p-4">
              <h5 className="card-title fw-bold mb-3">Descrizione</h5>
              <p className="card-text">{test.description}</p>
              
              <div className="alert alert-info mt-4 mb-0">
                <h5 className="alert-heading mb-3">
                  <i className="bi bi-info-circle me-2"></i>
                  Istruzioni
                </h5>
                <p className="mb-0">{test.instructions}</p>
              </div>
            </div>
          </div>
          
          {/* Informazioni sul test completato o in corso */}
          {hasStartedTest && (
            <div className="card border-0 shadow-sm mb-4 border-warning border-start border-4">
              <div className="card-body p-4">
                <div className="d-flex">
                  <div className="flex-shrink-0">
                    <i className="bi bi-exclamation-circle text-warning fs-3"></i>
                  </div>
                  <div className="ms-3">
                    <h5 className="mb-2">Test già iniziato</h5>
                    <p className="mb-1">Hai già iniziato questo test ma non l'hai completato. Puoi riprendere da dove hai lasciato.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="col-lg-4">
          {/* Card per iniziare il test */}
          <div className="card border-0 shadow-sm sticky-top" style={{ top: '20px' }}>
            <div className="card-body p-4">
              <h5 className="card-title">Informazioni sul Test</h5>
              
              <div className="d-flex justify-content-between py-2 border-bottom">
                <span className="text-muted">Categoria</span>
                <span className="fw-medium">{test.category}</span>
              </div>
              
              <div className="d-flex justify-content-between py-2 border-bottom">
                <span className="text-muted">Tempo stimato</span>
                <span className="fw-medium">{test.timeLimit} minuti</span>
              </div>
              
              <div className="d-flex justify-content-between py-2 border-bottom">
                <span className="text-muted">Sezioni</span>
                <span className="fw-medium">{parsedSections.length}</span>
              </div>
              
              <div className="d-flex justify-content-between py-2 mb-4">
                <span className="text-muted">Domande totali</span>
                <span className="fw-medium">
                  {parsedSections.reduce((acc, section) => acc + (section.questions?.length || 0), 0)}
                </span>
              </div>
              
              {test.isActive ? (
                <button 
                  className="btn btn-primary w-100 btn-lg" 
                  onClick={startOrContinueTest}
                >
                  {hasStartedTest ? (
                    <>
                      <i className="bi bi-arrow-repeat me-2"></i>
                      Riprendi Test
                    </>
                  ) : (
                    <>
                      <i className="bi bi-play-fill me-2"></i>
                      Inizia Test
                    </>
                  )}
                </button>
              ) : (
                <div className="alert alert-warning mb-0">
                  <i className="bi bi-exclamation-triangle-fill me-2"></i>
                  Questo test non è attualmente disponibile.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Conferma eliminazione</h5>
                <button type="button" className="btn-close" onClick={() => setShowDeleteModal(false)}></button>
              </div>
              <div className="modal-body">
                <p>Sei sicuro di voler eliminare il test <strong>"{test.title}"</strong>?</p>
                <div className="alert alert-danger">
                  <i className="bi bi-exclamation-triangle-fill me-2"></i>
                  Questa azione è irreversibile e comporterà la rimozione di tutti i risultati associati.
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowDeleteModal(false)}
                >
                  Annulla
                </button>
                <button 
                  type="button" 
                  className="btn btn-danger"
                  onClick={handleDeleteTest}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Eliminazione...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-trash me-2"></i>
                      Elimina Test
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 