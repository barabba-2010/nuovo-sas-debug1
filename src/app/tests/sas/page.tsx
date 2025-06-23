'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import SASTest from '../../components/tests/sas/SASTest';
import { type SASTestState } from '../../lib/sas-data';

export default function SASTestPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [savedState, setSavedState] = useState<Partial<SASTestState> | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasCompletedTest, setHasCompletedTest] = useState(false);

  // Controlla se l'utente ha già completato il test
  useEffect(() => {
    const checkPreviousCompletion = async () => {
      if (session?.user?.id) {
        try {
          const response = await fetch('/api/reports?testType=sas');
          if (response.ok) {
            const reports = await response.json();
            // Se ci sono report S-AS, significa che il test è stato completato
            if (reports.length > 0) {
              setHasCompletedTest(true);
              // Rimuovi automaticamente lo stato salvato se il test è già stato completato
              localStorage.removeItem('sas_test_state');
              setSavedState(null);
            }
          }
        } catch (error) {
          console.error('Errore nel controllo dei test completati:', error);
        }
      }
    };

    checkPreviousCompletion();
  }, [session]);

  // Carica lo stato salvato dal localStorage
  useEffect(() => {
    const saved = localStorage.getItem('sas_test_state');
    if (saved) {
      try {
        setSavedState(JSON.parse(saved));
      } catch (e) {
        console.error('Errore nel caricamento dello stato salvato:', e);
      }
    }
    setLoading(false);
  }, []);

  // Gestisce il salvataggio automatico dello stato
  const handleSave = (state: SASTestState) => {
    try {
      localStorage.setItem('sas_test_state', JSON.stringify(state));
    } catch (e) {
      console.error('Errore nel salvataggio dello stato:', e);
    }
  };

  // Gestisce il completamento del test
  const handleComplete = async (results: any) => {
    try {
      // Il componente SASTest ha già salvato i risultati nel database
      // Quindi qui dobbiamo solo gestire la navigazione
      
      // Rimuovi lo stato salvato
      localStorage.removeItem('sas_test_state');
      
      // Mostra notifica di successo
      alert('Test completato con successo! I risultati sono stati salvati.');
      
      // Reindirizza alla pagina dei report dopo un breve delay
      setTimeout(() => {
        router.push('/reports');
      }, 1500);
    } catch (error) {
      console.error('Errore:', error);
      alert('Si è verificato un errore.');
    }
  };

  // Verifica autenticazione
  if (status === 'loading' || loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Caricamento...</span>
        </div>
        <p className="mt-3">Caricamento in corso...</p>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="container py-5">
        <div className="alert alert-warning" role="alert">
          <h4 className="alert-heading">Accesso richiesto</h4>
          <p>Devi effettuare l'accesso per completare questo test.</p>
          <hr />
          <Link href="/auth/login" className="btn btn-primary">
            <i className="bi bi-box-arrow-in-right me-2"></i>
            Accedi
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header con informazioni sul test */}
      <div className="bg-primary text-white py-4 mb-4">
        <div className="container">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h1 className="h2 mb-2">Test S-AS (Scopo-Antiscopo)</h1>
              <p className="mb-0 opacity-75">
                Valutazione degli obiettivi e delle preoccupazioni personali
              </p>
            </div>
            <div className="text-end">
              <div className="small opacity-75">Durata stimata</div>
              <div className="h5 mb-0">10-15 min</div>
            </div>
          </div>
        </div>
      </div>

      {/* Mostra avviso se c'è un test in corso */}
      {savedState && savedState.currentStep && savedState.currentStep !== 'intro' && (
        <div className="container">
          <div className="alert alert-info mb-4">
            <div className="d-flex align-items-center">
              <i className="bi bi-info-circle me-3 fs-4"></i>
              <div>
                <h5 className="alert-heading mb-1">Test in corso</h5>
                <p className="mb-1">
                  Hai un test S-AS in corso. Puoi continuare da dove avevi lasciato o riiniziare.
                </p>
                <div className="mt-2">
                  <button 
                    className="btn btn-sm btn-outline-danger me-2"
                    onClick={() => {
                      if (confirm('Sei sicuro di voler ricominciare? Il progresso attuale andrà perso.')) {
                        localStorage.removeItem('sas_test_state');
                        setSavedState(null);
                      }
                    }}
                  >
                    <i className="bi bi-arrow-clockwise me-1"></i>
                    Ricomincia
                  </button>
                  <span className="text-muted small">
                    Oppure continua qui sotto da dove avevi lasciato
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mostra avviso se il test è già stato completato */}
      {hasCompletedTest && !savedState && (
        <div className="container">
          <div className="alert alert-warning mb-4">
            <div className="d-flex align-items-center">
              <i className="bi bi-exclamation-triangle me-3 fs-4"></i>
              <div>
                <h5 className="alert-heading mb-1">Test già completato</h5>
                <p className="mb-0">
                  Hai già completato questo test. Iniziando nuovamente, verrà creato un nuovo report.
                  Il report precedente rimarrà disponibile nel tuo archivio.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Test S-AS */}
      <SASTest 
        onComplete={handleComplete}
        onSave={handleSave}
        initialState={savedState || undefined}
      />

      {/* Link di ritorno */}
      <div className="container mt-4">
        <div className="text-center">
          <Link href="/tests" className="btn btn-outline-secondary">
            <i className="bi bi-arrow-left me-2"></i>
            Torna alla lista dei test
          </Link>
        </div>
      </div>
    </div>
  );
} 