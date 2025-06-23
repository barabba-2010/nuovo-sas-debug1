import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import './pid5-test.css';
import { 
  pid5Questions, 
  pid5Instructions, 
  pid5ResponseOptions,
  calculatePID5Scores,
  pid5Facets,
  pid5Domains
} from '../../../lib/pid5-data';
import './pid5-test.css';

interface PID5TestProps {
  onComplete: (results: any) => void;
  onSave?: (state: PID5TestState) => void;
  initialState?: Partial<PID5TestState>;
}

export interface PID5TestState {
  currentStep: 'intro' | 'questions' | 'review' | 'complete';
  currentPage: number;
  answers: { [key: number]: number };
  startTime?: string;
  completedTime?: string;
}

const QUESTIONS_PER_PAGE = 20;
const TOTAL_PAGES = Math.ceil(pid5Questions.length / QUESTIONS_PER_PAGE);

export default function PID5Test({ onComplete, onSave, initialState }: PID5TestProps) {
  const { data: session } = useSession();
  const [testState, setTestState] = useState<PID5TestState>({
    currentStep: initialState?.currentStep || 'intro',
    currentPage: initialState?.currentPage || 1,
    answers: initialState?.answers || {},
    startTime: initialState?.startTime,
    completedTime: initialState?.completedTime
  });

  const [showMissingAlert, setShowMissingAlert] = useState(false);

  // Salva lo stato quando cambia
  useEffect(() => {
    if (onSave && testState.currentStep !== 'intro') {
      onSave(testState);
    }
  }, [testState, onSave]);

  // Calcola il progresso del test
  const calculateProgress = () => {
    const answeredCount = Object.keys(testState.answers).length;
    const totalQuestions = pid5Questions.length;
    return Math.round((answeredCount / totalQuestions) * 100);
  };

  // Gestione delle risposte
  const handleAnswer = (questionId: number, value: number) => {
    console.log(`Risposta registrata: Domanda ${questionId} = ${value}`);
    setTestState(prev => {
      const newAnswers = {
        ...prev.answers,
        [questionId]: value
      };
      console.log(`Totale risposte salvate: ${Object.keys(newAnswers).length}`);
      return {
        ...prev,
        answers: newAnswers
      };
    });
  };

  // Navigazione tra le pagine
  const goToPage = (page: number) => {
    if (page >= 1 && page <= TOTAL_PAGES) {
      setTestState(prev => ({ ...prev, currentPage: page }));
      window.scrollTo(0, 0);
    }
  };

  // Controlla se tutte le domande sono state risposte
  const checkAllAnswered = () => {
    const answeredCount = Object.keys(testState.answers).length;
    return answeredCount === pid5Questions.length;
  };

  // Trova le domande mancanti
  const getMissingQuestions = () => {
    const missing: number[] = [];
    pid5Questions.forEach(q => {
      if (testState.answers[q.id] === undefined) {
        missing.push(q.id);
      }
    });
    return missing;
  };

  // Inizia il test
  const startTest = () => {
    setTestState(prev => ({
      ...prev,
      currentStep: 'questions',
      startTime: new Date().toISOString()
    }));
  };

  // Vai alla revisione
  const goToReview = () => {
    const answeredCount = Object.keys(testState.answers).length;
    const totalQuestions = pid5Questions.length;
    
    console.log('goToReview chiamata');
    console.log('Risposte date:', answeredCount);
    console.log('Domande totali:', totalQuestions);
    console.log('Tutte risposte?', checkAllAnswered());
    console.log('Stato risposte:', testState.answers);
    
    if (checkAllAnswered()) {
      setTestState(prev => ({ ...prev, currentStep: 'review' }));
      window.scrollTo(0, 0);
    } else {
      const missing = getMissingQuestions();
      console.log('Domande mancanti:', missing);
      setShowMissingAlert(true);
      setTimeout(() => setShowMissingAlert(false), 5000);
    }
  };

  // Completa il test
  const completeTest = async () => {
    const completedTime = new Date().toISOString();
    const scores = calculatePID5Scores(testState.answers);
    
    const results = {
      answers: testState.answers,
      scores: scores,
      startTime: testState.startTime,
      completedTime: completedTime,
      testType: 'pid5'
    };

    // Salva nel database
    try {
      const response = await fetch('/api/tests/pid5/results', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          results: results,
          completedAt: completedTime,
          testState: { ...testState, completedTime }
        }),
      });

      if (response.ok) {
        setTestState(prev => ({ ...prev, currentStep: 'complete', completedTime }));
        onComplete(results);
      } else {
        throw new Error('Errore nel salvataggio');
      }
    } catch (error) {
      console.error('Errore nel salvataggio del test:', error);
      alert('Si è verificato un errore nel salvataggio del test. Riprova.');
    }
  };

  // Render dell'introduzione (stile SAS)
  const renderIntro = () => (
    <div className="card border-0 shadow-sm">
      <div className="card-body p-4">
        <h3>Inventario di Personalità per il DSM-5 (PID-5)</h3>
        <p className="mb-4">
          {pid5Instructions}
        </p>
        
        <div className="alert alert-info mb-4">
          <h5 className="alert-heading">
            <i className="bi bi-info-circle me-2"></i>
            Informazioni sul Test
          </h5>
          <ul className="mb-0">
            <li><strong>Numero di domande:</strong> 220</li>
            <li><strong>Durata stimata:</strong> 25-40 minuti</li>
            <li><strong>Valutazione:</strong> 25 facet di personalità raggruppate in 5 domini</li>
            <li><strong>Salvataggio:</strong> Il test salva automaticamente i progressi</li>
          </ul>
        </div>

        <div className="d-flex justify-content-between">
          <button 
            className="btn btn-secondary"
            onClick={() => window.history.back()}
          >
            <i className="bi bi-arrow-left me-2"></i>
            Torna ai test
          </button>
          <button 
            className="btn btn-primary"
            onClick={startTest}
          >
            Inizia il test
            <i className="bi bi-arrow-right ms-2"></i>
          </button>
        </div>
      </div>
    </div>
  );

  // Render delle domande (stile SAS con risposte orizzontali)
  const renderQuestions = () => {
    const startIdx = (testState.currentPage - 1) * QUESTIONS_PER_PAGE;
    const endIdx = startIdx + QUESTIONS_PER_PAGE;
    const pageQuestions = pid5Questions.slice(startIdx, endIdx);

    return (
      <div className="card border-0 shadow-sm">
        <div className="card-body p-4">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h3>Domande {startIdx + 1} - {Math.min(endIdx, pid5Questions.length)} di {pid5Questions.length}</h3>
            <span className="badge bg-primary">
              Pagina {testState.currentPage} di {TOTAL_PAGES}
            </span>
          </div>

          {/* Progress bar */}
          <div className="progress mb-4" style={{ height: '20px' }}>
            <div 
              className="progress-bar bg-primary progress-bar-striped progress-bar-animated" 
              role="progressbar" 
              style={{ width: `${calculateProgress()}%` }}
              aria-valuenow={calculateProgress()} 
              aria-valuemin={0} 
              aria-valuemax={100}
            >
              {calculateProgress()}%
            </div>
          </div>

          {/* Alert per domande mancanti */}
          {showMissingAlert && (
            <div className="alert alert-warning alert-dismissible fade show" role="alert">
              <i className="bi bi-exclamation-triangle me-2"></i>
              <strong>Attenzione!</strong> Devi rispondere a tutte le domande prima di procedere.
              Hai ancora {getMissingQuestions().length} domande senza risposta.
              <button 
                type="button" 
                className="btn-close" 
                onClick={() => setShowMissingAlert(false)}
              />
            </div>
          )}

          {/* Pulsante temporaneo per test - RIMUOVERE IN PRODUZIONE */}
          {session && (session.user as any)?.role === 'ADMIN' && (
            <div className="alert alert-info mb-4">
              <div className="d-flex justify-content-between align-items-center">
                <span>
                  <i className="bi bi-tools me-2"></i>
                  <strong>Strumenti Admin</strong> - Solo per test e debug
                </span>
                <button 
                  className="btn btn-sm btn-warning"
                  onClick={() => {
                    const newAnswers = { ...testState.answers };
                    pid5Questions.forEach(q => {
                      if (newAnswers[q.id] === undefined) {
                        // Genera risposte più bilanciate: 70% basse (0-1), 30% alte (2-3)
                        const rand = Math.random();
                        if (rand < 0.35) {
                          newAnswers[q.id] = 0; // 35% "Sempre o spesso falso"
                        } else if (rand < 0.70) {
                          newAnswers[q.id] = 1; // 35% "Talvolta o abbastanza falso"
                        } else if (rand < 0.90) {
                          newAnswers[q.id] = 2; // 20% "Talvolta o abbastanza vero"
                        } else {
                          newAnswers[q.id] = 3; // 10% "Sempre o spesso vero"
                        }
                      }
                    });
                    setTestState(prev => ({ ...prev, answers: newAnswers }));
                    console.log('Risposte auto-compilate:', Object.keys(newAnswers).length);
                  }}
                >
                  <i className="bi bi-magic me-1"></i>
                  Compila risposte mancanti
                </button>
              </div>
            </div>
          )}

          {/* Domande con layout orizzontale */}
          <div className="questions-container">
            {pageQuestions.map((question, index) => (
              <div key={question.id} className="question-item mb-4">
                <div className="row align-items-center">
                  <div className="col-lg-5">
                    <div className="d-flex align-items-start">
                      <span className="question-number me-2">{question.id}.</span>
                      <div className="question-text flex-grow-1">
                        {question.text}
                        {question.reverse && (
                          <span className="badge bg-info ms-2" title="Item con punteggio invertito">
                            <i className="bi bi-arrow-repeat"></i>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="col-lg-7">
                    <div className="response-options-horizontal">
                      {pid5ResponseOptions.map((option) => {
                        const isSelected = testState.answers[question.id] === option.value;
                        return (
                          <div key={option.value} className="response-option-wrapper">
                            <button
                              className={`btn ${isSelected ? 'btn-primary selected' : 'btn-outline-primary'} response-button`}
                              onClick={() => handleAnswer(question.id, option.value)}
                              title={option.label}
                            >
                              {option.value}
                            </button>
                            <div className="response-label">{option.label}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Navigazione */}
          <div className="d-flex justify-content-between mt-4">
            <button 
              className="btn btn-outline-secondary" 
              onClick={() => goToPage(testState.currentPage - 1)}
              disabled={testState.currentPage === 1}
            >
              <i className="bi bi-arrow-left me-2"></i>
              Pagina precedente
            </button>

            <div className="d-flex gap-2">
              {/* Mostra alcuni numeri di pagina */}
              {Array.from({ length: Math.min(5, TOTAL_PAGES) }, (_, i) => {
                let pageNum;
                if (TOTAL_PAGES <= 5) {
                  pageNum = i + 1;
                } else if (testState.currentPage <= 3) {
                  pageNum = i + 1;
                } else if (testState.currentPage >= TOTAL_PAGES - 2) {
                  pageNum = TOTAL_PAGES - 4 + i;
                } else {
                  pageNum = testState.currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    className={`btn ${testState.currentPage === pageNum ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => goToPage(pageNum)}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            {testState.currentPage === TOTAL_PAGES ? (
              <button 
                className="btn btn-success"
                onClick={goToReview}
              >
                Rivedi e completa
                <i className="bi bi-check-circle ms-2"></i>
              </button>
            ) : (
              <button 
                className="btn btn-primary" 
                onClick={() => goToPage(testState.currentPage + 1)}
              >
                Pagina successiva
                <i className="bi bi-arrow-right ms-2"></i>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Render della revisione (stile SAS)
  const renderReview = () => {
    const scores = calculatePID5Scores(testState.answers);
    
    return (
      <div className="card border-0 shadow-sm">
        <div className="card-body p-4">
          <h3 className="mb-4">Revisione delle Risposte</h3>
          
          <div className="alert alert-success mb-4">
            <i className="bi bi-check-circle me-2"></i>
            Hai completato tutte le {pid5Questions.length} domande. Rivedi il riepilogo dei tuoi punteggi prima di confermare.
          </div>

          {/* Riepilogo Domini */}
          <div className="mb-4">
            <h4 className="text-primary mb-3">Punteggi dei Domini</h4>
            <div className="row">
              {pid5Domains.map(domain => {
                const score = scores.domainScores[domain.id];
                const interpretation = getScoreInterpretation(score.mean);
                return (
                  <div key={domain.id} className="col-md-6 mb-3">
                    <div className="card border-0 bg-light">
                      <div className="card-body">
                        <h5 className="card-title">{domain.name}</h5>
                        <div className="d-flex justify-content-between align-items-center">
                          <span className="h3 mb-0">{score.mean.toFixed(2)}</span>
                          <span className={`badge bg-${interpretation.color}`}>
                            {interpretation.label}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top 5 Facet */}
          <div className="mb-4">
            <h4 className="text-primary mb-3">Facet Principali (Top 5)</h4>
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Facet</th>
                    <th>Punteggio</th>
                    <th>Interpretazione</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(scores.facetScores)
                    .sort(([,a]: any, [,b]: any) => b.mean - a.mean)
                    .slice(0, 5)
                    .map(([facetId, score]: any) => {
                      const facet = pid5Facets.find(f => f.id === facetId);
                      const interpretation = getScoreInterpretation(score.mean);
                      return (
                        <tr key={facetId}>
                          <td>{facet?.name || facetId}</td>
                          <td>{score.mean.toFixed(2)}</td>
                          <td>
                            <span className={`badge bg-${interpretation.color}`}>
                              {interpretation.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pulsanti azione */}
          <div className="d-flex justify-content-between mt-4">
            <button 
              className="btn btn-secondary"
              onClick={() => setTestState(prev => ({ ...prev, currentStep: 'questions', currentPage: 1 }))}
            >
              <i className="bi bi-arrow-left me-2"></i>
              Torna alle domande
            </button>
            <button 
              className="btn btn-success btn-lg"
              onClick={completeTest}
            >
              <i className="bi bi-check-circle me-2"></i>
              Conferma e completa
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Render completamento (stile SAS)
  const renderComplete = () => (
    <div className="card border-0 shadow-sm">
      <div className="card-body p-5 text-center">
        <div className="mb-4">
          <i className="bi bi-check-circle text-success" style={{ fontSize: '4rem' }}></i>
        </div>
        <h2 className="mb-3">Test Completato!</h2>
        <p className="text-muted mb-4">
          Hai completato con successo l'Inventario di Personalità PID-5.
          I tuoi risultati sono stati salvati e sono disponibili nella sezione report.
        </p>
        <div className="d-grid gap-2 d-md-flex justify-content-md-center">
          <a href="/reports" className="btn btn-primary">
            <i className="bi bi-file-earmark-text me-2"></i>
            Vai ai Report
          </a>
          <a href="/tests" className="btn btn-outline-secondary">
            <i className="bi bi-arrow-left me-2"></i>
            Torna ai Test
          </a>
        </div>
      </div>
    </div>
  );

  // Funzione helper per interpretare i punteggi
  const getScoreInterpretation = (score: number) => {
    if (score < 0.5) return { label: 'Molto Basso', color: 'success' };
    if (score < 1.0) return { label: 'Basso', color: 'info' };
    if (score < 1.5) return { label: 'Medio', color: 'warning' };
    if (score < 2.0) return { label: 'Elevato', color: 'danger' };
    return { label: 'Molto Elevato', color: 'danger' };
  };

  // Render principale
  return (
    <div className="container py-4">
      <div className="row justify-content-center">
        <div className="col-lg-10">
          {testState.currentStep === 'intro' && renderIntro()}
          {testState.currentStep === 'questions' && renderQuestions()}
          {testState.currentStep === 'review' && renderReview()}
          {testState.currentStep === 'complete' && renderComplete()}
        </div>
      </div>
    </div>
  );
} 