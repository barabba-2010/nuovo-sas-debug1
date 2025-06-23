'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import './sas-test.css';
import { 
  sasStatements, 
  ratingOptions, 
  type SASTestState,
  factorDefinitions 
} from '../../../lib/sas-data';
import { 
  calculateSASResults, 
  analyzePartTwoOrientation, 
  generateOrientationAnalysis 
} from '../../../lib/sas-calculations';
import './sas-test.css';

interface SASTestProps {
  onComplete?: (results: any) => void;
  onSave?: (state: SASTestState) => void;
  initialState?: Partial<SASTestState>;
}

export default function SASTest({ onComplete, onSave, initialState }: SASTestProps) {
  // Stato iniziale del test
  const getInitialState = (): SASTestState => ({
    currentStep: 'intro',
    part1: {
      currentPair: 1,
      answers: {},
      completed: false
    },
    part2: {
      currentPair: 1,
      answers: {},
      completed: false
    },
    part3: {
      selectedStatements: [],
      answers: {
        q2: '',
        q3: '',
        q4: '',
        q5: '',
        q6: ''
      },
      completed: false
    },
    results: {
      scopo: 0,
      antiscopo: 0,
      balance: 0,
      factorScores: {},
      interpretation: '',
      recommendations: []
    }
  });

  const [testState, setTestState] = useState<SASTestState>(() => {
    if (initialState) {
      return { ...getInitialState(), ...initialState };
    }
    return getInitialState();
  });

  // Reset del test quando viene ricaricato senza initialState
  useEffect(() => {
    if (!initialState) {
      setTestState(getInitialState());
    }
  }, []);

  // Salva automaticamente lo stato
  useEffect(() => {
    if (onSave) {
      onSave(testState);
    }
  }, [testState, onSave]);

  // Calcola il progresso del test
  const calculateProgress = () => {
    let progress = 0;
    
    switch (testState.currentStep) {
      case 'intro':
        progress = 0;
        break;
      case 'part1':
        const answered1 = Object.keys(testState.part1.answers).length / 2;
        const totalQuestions1 = sasStatements.length * 2;
        progress = 25 * (answered1 / totalQuestions1);
        break;
      case 'part2':
        const answered2 = Object.keys(testState.part2.answers).length;
        progress = 25 + (25 * (answered2 / sasStatements.length));
        break;
      case 'part3':
        let p3Progress = 0;
        p3Progress += testState.part3.selectedStatements.length >= 2 ? 25 : 0;
        p3Progress += testState.part3.answers.q2 ? 25 : 0;
        p3Progress += testState.part3.answers.q3 ? 25 : 0;
        p3Progress += (testState.part3.answers.q4 ? 25 : 0) + 
                     ((testState.part3.answers.q4 === "yes" && testState.part3.answers.q5) || 
                      (testState.part3.answers.q4 === "no" && testState.part3.answers.q6) ? 25 : 0);
        progress = 50 + (25 * (p3Progress / 100));
        break;
      case 'results':
        progress = 100;
        break;
    }
    
    return Math.min(100, Math.max(0, progress));
  };

  // Navigazione tra le sezioni
  const goToStep = (step: SASTestState['currentStep']) => {
    setTestState(prev => ({ ...prev, currentStep: step }));
  };

  // Gestione Parte I
  const handlePart1Rating = (questionId: string, type: 'S' | 'AS', rating: number) => {
    const key = questionId + type;
    setTestState(prev => ({
      ...prev,
      part1: {
        ...prev.part1,
        answers: {
          ...prev.part1.answers,
          [key]: rating
        }
      }
    }));
  };

  const nextPairPart1 = () => {
    const current = testState.part1.currentPair;
    const stmt = sasStatements[current - 1];
    
    // Verifica che entrambe le affermazioni abbiano risposta
    if (!testState.part1.answers.hasOwnProperty(stmt.id + "S") || 
        !testState.part1.answers.hasOwnProperty(stmt.id + "AS")) {
      alert("Rispondi a entrambe le affermazioni.");
      return;
    }
    
    if (current === sasStatements.length) {
      // Parte 1 completata
      setTestState(prev => ({
        ...prev,
        part1: { ...prev.part1, completed: true },
        currentStep: 'part2'
      }));
    } else {
      setTestState(prev => ({
        ...prev,
        part1: { ...prev.part1, currentPair: current + 1 }
      }));
    }
  };

  const prevPairPart1 = () => {
    if (testState.part1.currentPair > 1) {
      setTestState(prev => ({
        ...prev,
        part1: { ...prev.part1, currentPair: prev.part1.currentPair - 1 }
      }));
    }
  };

  // Gestione Parte II
  const handlePart2Selection = (questionId: string, type: 'S' | 'AS') => {
    setTestState(prev => ({
      ...prev,
      part2: {
        ...prev.part2,
        answers: {
          ...prev.part2.answers,
          [questionId]: { type, score: 1 }
        }
      }
    }));
  };

  const nextPairPart2 = () => {
    const current = testState.part2.currentPair;
    const stmt = sasStatements[current - 1];
    
    // Verifica che sia stata fatta una selezione
    if (!testState.part2.answers.hasOwnProperty(stmt.id)) {
      alert("Seleziona un'affermazione prima di continuare.");
      return;
    }
    
    if (current === sasStatements.length) {
      // Parte 2 completata
      setTestState(prev => ({
        ...prev,
        part2: { ...prev.part2, completed: true },
        currentStep: 'part3'
      }));
    } else {
      setTestState(prev => ({
        ...prev,
        part2: { ...prev.part2, currentPair: current + 1 }
      }));
    }
  };

  const prevPairPart2 = () => {
    if (testState.part2.currentPair > 1) {
      setTestState(prev => ({
        ...prev,
        part2: { ...prev.part2, currentPair: prev.part2.currentPair - 1 }
      }));
    }
  };

  // Gestione Parte III
  const handleStatementSelection = (statementId: string) => {
    if (testState.part3.selectedStatements.length < 2) {
      setTestState(prev => ({
        ...prev,
        part3: {
          ...prev.part3,
          selectedStatements: [...prev.part3.selectedStatements, statementId]
        }
      }));
    }
  };

  const removeSelectedStatement = (statementId: string) => {
    setTestState(prev => ({
      ...prev,
      part3: {
        ...prev.part3,
        selectedStatements: prev.part3.selectedStatements.filter(id => id !== statementId)
      }
    }));
  };

  const handlePart3Answer = (questionKey: keyof SASTestState['part3']['answers'], value: string) => {
    setTestState(prev => ({
      ...prev,
      part3: {
        ...prev.part3,
        answers: {
          ...prev.part3.answers,
          [questionKey]: value
        }
      }
    }));
  };

  // Completa il test
  const completeTest = async () => {
    // Validazioni
    if (testState.part3.selectedStatements.length < 2) {
      alert("Seleziona due affermazioni.");
      return;
    }
    
    if (!testState.part3.answers.q2 || !testState.part3.answers.q3) {
      alert("Rispondi a tutte le domande aperte.");
      return;
    }
    
    if (!testState.part3.answers.q4) {
      alert("Rispondi alla domanda sulle strategie.");
      return;
    }
    
    if (testState.part3.answers.q4 === 'yes' && !testState.part3.answers.q5) {
      alert("Rispondi a 'In che misura?'");
      return;
    }
    
    if (testState.part3.answers.q4 === 'no' && !testState.part3.answers.q6) {
      alert("Rispondi a 'Perché?'");
      return;
    }
    
    // Calcola i risultati
    const results = calculateSASResults(testState);
    
    // Aggiorna lo stato con i risultati
    const updatedState = {
      ...testState,
      currentStep: 'results' as const,
      results
    };
    setTestState(updatedState);
    
    // Salva lo stato aggiornato
    if (onSave) {
      onSave(updatedState);
    }
    
    // Salva i risultati nel database
    try {
      // Recupera le informazioni del paziente dal sessionStorage o da un altro store
      const patientInfo = {
        firstName: sessionStorage.getItem('patientFirstName') || '',
        lastName: sessionStorage.getItem('patientLastName') || '',
        age: sessionStorage.getItem('patientAge') || ''
      };
      
      const response = await fetch('/api/tests/sas/results', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          results: results,
          testState: updatedState,
          patientInfo: patientInfo,
          completedAt: new Date().toISOString()
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Risultati salvati con successo:', data);
        
        // Chiama onComplete con i risultati e l'ID del report
        if (onComplete) {
          onComplete({ ...results, reportId: data.reportId });
        }
      } else {
        const errorData = await response.json();
        console.error('Errore nel salvataggio dei risultati:', errorData);
        alert(`Errore nel salvataggio: ${errorData.error || 'Errore sconosciuto'}`);
      }
    } catch (error) {
      console.error('Errore:', error);
      alert('Errore di connessione durante il salvataggio');
    }
  };

  // Render dell'introduzione
  const renderIntro = () => (
    <div className="card border-0 shadow-sm">
      <div className="card-body p-4">
        <h3>Introduzione al Test S-AS</h3>
        <p className="mb-4">
          Il test S-AS ti aiuta a identificare i tuoi obiettivi principali (Scopo) e le tue preoccupazioni (Antiscopo). 
          Il test è diviso in tre parti e dura circa 10-15 minuti.
        </p>
        
        <ul className="mb-4">
          <li><strong>Parte I:</strong> Valutazione su scala da 0 a 4 per ogni coppia di affermazioni.</li>
          <li><strong>Parte II:</strong> Selezione dell'affermazione che ti rappresenta e assegnazione di un punteggio (0-4).</li>
          <li><strong>Parte III:</strong> Risposte alle domande aperte.</li>
        </ul>
        
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
            onClick={() => goToStep('part1')}
          >
            Inizia il test
            <i className="bi bi-arrow-right ms-2"></i>
          </button>
        </div>
      </div>
    </div>
  );

  // Render Parte I
  const renderPart1 = () => {
    const currentStmt = sasStatements[testState.part1.currentPair - 1];
    if (!currentStmt) return null;

    return (
      <div className="card border-0 shadow-sm">
        <div className="card-body p-4">
          <h3>Parte I: Valutazione delle affermazioni</h3>
          <p className="mb-4">
            Per ciascuna coppia, assegna un punteggio da 0 a 4. I punteggi per l'affermazione "Scopo" e per quella "Antiscopo" sono indipendenti.
          </p>
          
          <div className="mb-4">
            <span className="badge bg-primary">
              Coppia {testState.part1.currentPair} di {sasStatements.length}
            </span>
          </div>

          {/* Affermazione Scopo */}
          <div className="mb-4 p-3 border-start border-4 border-primary bg-light question-card">
            <div className="badge bg-primary mb-2">Scopo</div>
            <div className="h6 mb-3">
              {currentStmt.id}. (S) {currentStmt.scopo}
            </div>
            
            <div className="rating-buttons-container">
              {ratingOptions.map((option) => {
                const isSelected = testState.part1.answers[currentStmt.id + 'S'] === option.value;
                return (
                  <div key={option.value} className="text-center">
                    <button
                      className={`btn ${isSelected ? 'btn-primary selected' : 'btn-outline-primary'} rating-button`}
                      onClick={() => handlePart1Rating(currentStmt.id, 'S', option.value)}
                    >
                      {option.value}
                    </button>
                    <div className="rating-label">{option.label}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Affermazione Antiscopo */}
          <div className="mb-4 p-3 border-start border-4 border-secondary bg-light question-card">
            <div className="badge bg-secondary mb-2">Antiscopo</div>
            <div className="h6 mb-3">
              {currentStmt.id}a. (AS) {currentStmt.antiscopo}
            </div>
            
            <div className="rating-buttons-container">
              {ratingOptions.map((option) => {
                const isSelected = testState.part1.answers[currentStmt.id + 'AS'] === option.value;
                return (
                  <div key={option.value} className="text-center">
                    <button
                      className={`btn ${isSelected ? 'btn-secondary selected' : 'btn-outline-secondary'} rating-button`}
                      onClick={() => handlePart1Rating(currentStmt.id, 'AS', option.value)}
                    >
                      {option.value}
                    </button>
                    <div className="rating-label">{option.label}</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="d-flex justify-content-between">
            {testState.part1.currentPair > 1 ? (
              <button className="btn btn-outline-secondary" onClick={prevPairPart1}>
                <i className="bi bi-arrow-left me-2"></i>
                Indietro
              </button>
            ) : (
              <div></div>
            )}
            
            <button className="btn btn-primary" onClick={nextPairPart1}>
              {testState.part1.currentPair === sasStatements.length ? 'Continua' : 'Avanti'}
              <i className="bi bi-arrow-right ms-2"></i>
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Render Parte II
  const renderPart2 = () => {
    const currentStmt = sasStatements[testState.part2.currentPair - 1];
    if (!currentStmt) return null;

    return (
      <div className="card border-0 shadow-sm">
        <div className="card-body p-4">
          <h3>Parte II: Selezione e valutazione</h3>
          <p className="mb-4">
            Per ciascuna delle 20 coppie, scegli solo una delle due affermazioni, quella che ti rappresenta di più.
          </p>
          
          <div className="mb-4">
            <span className="badge bg-primary">
              Coppia {testState.part2.currentPair} di {sasStatements.length}
            </span>
          </div>

          <h5 className="mb-4 text-primary">Scegli l'affermazione che ti rappresenta di più:</h5>

          {/* Opzione Scopo */}
          <div 
            className={`card mb-3 selection-card ${testState.part2.answers[currentStmt.id]?.type === 'S' ? 'border-primary border-2 bg-primary bg-opacity-10' : ''}`}
            onClick={() => handlePart2Selection(currentStmt.id, 'S')}
          >
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="me-3">
                  <div 
                    className={`rounded-circle d-flex align-items-center justify-content-center ${
                      testState.part2.answers[currentStmt.id]?.type === 'S' ? 'bg-primary selection-check' : 'border border-primary'
                    }`}
                    style={{ width: '30px', height: '30px' }}
                  >
                    {testState.part2.answers[currentStmt.id]?.type === 'S' && (
                      <i className="bi bi-check text-white"></i>
                    )}
                  </div>
                </div>
                <div>
                  <strong>{currentStmt.id}. (S)</strong> {currentStmt.scopo}
                </div>
              </div>
            </div>
          </div>

          {/* Opzione Antiscopo */}
          <div 
            className={`card mb-4 selection-card ${testState.part2.answers[currentStmt.id]?.type === 'AS' ? 'border-secondary border-2 bg-secondary bg-opacity-10' : ''}`}
            onClick={() => handlePart2Selection(currentStmt.id, 'AS')}
          >
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="me-3">
                  <div 
                    className={`rounded-circle d-flex align-items-center justify-content-center ${
                      testState.part2.answers[currentStmt.id]?.type === 'AS' ? 'bg-secondary selection-check' : 'border border-secondary'
                    }`}
                    style={{ width: '30px', height: '30px' }}
                  >
                    {testState.part2.answers[currentStmt.id]?.type === 'AS' && (
                      <i className="bi bi-check text-white"></i>
                    )}
                  </div>
                </div>
                <div>
                  <strong>{currentStmt.id}a. (AS)</strong> {currentStmt.antiscopo}
                </div>
              </div>
            </div>
          </div>

          <div className="d-flex justify-content-between">
            {testState.part2.currentPair > 1 ? (
              <button className="btn btn-outline-secondary" onClick={prevPairPart2}>
                <i className="bi bi-arrow-left me-2"></i>
                Indietro
              </button>
            ) : (
              <div></div>
            )}
            
            <button className="btn btn-primary" onClick={nextPairPart2}>
              {testState.part2.currentPair === sasStatements.length ? 'Continua' : 'Avanti'}
              <i className="bi bi-arrow-right ms-2"></i>
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Render Parte III
  const renderPart3 = () => {
    // Genera la lista delle affermazioni disponibili per la selezione
    const availableStatements: Array<{id: string, text: string, type: 'S' | 'AS'}> = [];
    
    sasStatements.forEach(stmt => {
      const sId = stmt.id + ":S";
      const aId = stmt.id + ":AS";
      
      if (!testState.part3.selectedStatements.includes(sId)) {
        availableStatements.push({ id: sId, text: stmt.scopo, type: 'S' });
      }
      
      if (!testState.part3.selectedStatements.includes(aId)) {
        availableStatements.push({ id: aId, text: stmt.antiscopo, type: 'AS' });
      }
    });

    return (
      <div className="card border-0 shadow-sm">
        <div className="card-body p-4">
          <h3>Parte III: Domande aperte</h3>
          <p className="mb-4">Seleziona due affermazioni che ti rappresentano e rispondi alle seguenti domande.</p>

          {/* Affermazioni selezionate */}
          <div className="mb-4">
            <h5>Affermazioni selezionate:</h5>
            {testState.part3.selectedStatements.length === 0 ? (
              <p className="text-muted">Nessuna affermazione selezionata. Seleziona 2 affermazioni dalla lista sottostante.</p>
            ) : (
              <div>
                {testState.part3.selectedStatements.map(sel => {
                  const [id, type] = sel.split(":");
                  const stmt = sasStatements.find(s => s.id === id);
                  if (!stmt) return null;
                  
                  const text = type === "S" ? stmt.scopo : stmt.antiscopo;
                  const badgeClass = type === "S" ? "bg-primary" : "bg-secondary";
                  
                  return (
                    <div key={sel} className={`card mb-2 border-start border-4 ${type === "S" ? "border-primary" : "border-secondary"}`}>
                      <div className="card-body p-3">
                        <div className={`badge ${badgeClass} mb-2`}>
                          {type === "S" ? "Scopo" : "Antiscopo"}
                        </div>
                        <div>{id}{type === "AS" ? "a" : ""}. ({type}) {text}</div>
                        <button 
                          className="btn btn-sm btn-outline-danger mt-2"
                          onClick={() => removeSelectedStatement(sel)}
                        >
                          <i className="bi bi-x me-1"></i>
                          Rimuovi
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Lista delle affermazioni disponibili */}
          {testState.part3.selectedStatements.length < 2 && (
            <div className="mb-4">
              <h5>Seleziona le affermazioni che ti rappresentano:</h5>
              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {availableStatements.map(av => {
                  const [id, type] = av.id.split(":");
                  const badgeClass = type === "S" ? "bg-primary" : "bg-secondary";
                  
                  return (
                    <div 
                      key={av.id}
                      className="card mb-2"
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleStatementSelection(av.id)}
                    >
                      <div className="card-body p-3">
                        <div className={`badge ${badgeClass} mb-2`}>
                          {type === "S" ? "Scopo" : "Antiscopo"}
                        </div>
                        <div>{id}{type === "AS" ? "a" : ""}. ({type}) {av.text}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Domande aperte */}
          <div className="mb-4">
            <label className="form-label">
              <strong>2. In che modo cerchi di raggiungere ciò che hai selezionato?</strong>
            </label>
            <textarea 
              className="form-control"
              rows={4}
              value={testState.part3.answers.q2}
              onChange={(e) => handlePart3Answer('q2', e.target.value)}
              placeholder="Inserisci la tua risposta..."
            />
          </div>

          <div className="mb-4">
            <label className="form-label">
              <strong>3. In che modo cerchi di perseguire o evitare ciò che indicano le affermazioni?</strong>
            </label>
            <textarea 
              className="form-control"
              rows={4}
              value={testState.part3.answers.q3}
              onChange={(e) => handlePart3Answer('q3', e.target.value)}
              placeholder="Inserisci la tua risposta..."
            />
          </div>

          <div className="mb-4">
            <label className="form-label">
              <strong>4. Secondo te, queste strategie funzionano?</strong>
            </label>
            <div className="d-flex gap-3">
              <div className="form-check">
                <input 
                  className="form-check-input" 
                  type="radio" 
                  name="strategies-work"
                  id="strategies-yes"
                  checked={testState.part3.answers.q4 === 'yes'}
                  onChange={() => handlePart3Answer('q4', 'yes')}
                />
                <label className="form-check-label" htmlFor="strategies-yes">
                  Sì
                </label>
              </div>
              <div className="form-check">
                <input 
                  className="form-check-input" 
                  type="radio" 
                  name="strategies-work"
                  id="strategies-no"
                  checked={testState.part3.answers.q4 === 'no'}
                  onChange={() => handlePart3Answer('q4', 'no')}
                />
                <label className="form-check-label" htmlFor="strategies-no">
                  No
                </label>
              </div>
            </div>
          </div>

          {testState.part3.answers.q4 === 'yes' && (
            <div className="mb-4">
              <label className="form-label">
                <strong>5. Se sì, in che misura?</strong>
              </label>
              <textarea 
                className="form-control"
                rows={3}
                value={testState.part3.answers.q5}
                onChange={(e) => handlePart3Answer('q5', e.target.value)}
                placeholder="Inserisci la tua risposta..."
              />
            </div>
          )}

          {testState.part3.answers.q4 === 'no' && (
            <div className="mb-4">
              <label className="form-label">
                <strong>6. Se no, perché?</strong>
              </label>
              <textarea 
                className="form-control"
                rows={3}
                value={testState.part3.answers.q6}
                onChange={(e) => handlePart3Answer('q6', e.target.value)}
                placeholder="Inserisci la tua risposta..."
              />
            </div>
          )}

          <div className="d-flex justify-content-between">
            <button 
              className="btn btn-outline-secondary"
              onClick={() => goToStep('part2')}
            >
              <i className="bi bi-arrow-left me-2"></i>
              Indietro
            </button>
            
            <button 
              className="btn btn-success"
              onClick={completeTest}
            >
              Completa Test
              <i className="bi bi-check ms-2"></i>
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Render dei risultati
  const renderResults = () => {
    const orientationData = analyzePartTwoOrientation(testState);
    
    return (
      <div>
        <div className="alert alert-success">
          <h4 className="alert-heading">
            <i className="bi bi-check-circle me-2"></i>
            Test completato con successo!
          </h4>
          <p className="mb-0">Il tuo report completo è stato salvato nella sezione Report.</p>
        </div>

        {/* Riepilogo punteggi */}
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body">
            <h4>Riepilogo Punteggi</h4>
            <div className="row text-center">
              <div className="col-md-4">
                <div className="p-3 bg-primary bg-opacity-10 rounded">
                  <h5 className="text-primary">Scopo</h5>
                  <h3 className="text-primary">{testState.results.scopo}</h3>
                </div>
              </div>
              <div className="col-md-4">
                <div className="p-3 bg-secondary bg-opacity-10 rounded">
                  <h5 className="text-secondary">Antiscopo</h5>
                  <h3 className="text-secondary">{testState.results.antiscopo}</h3>
                </div>
              </div>
              <div className="col-md-4">
                <div className="p-3 bg-info bg-opacity-10 rounded">
                  <h5 className="text-info">Bilanciamento</h5>
                  <h3 className="text-info">{testState.results.balance}</h3>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Azioni */}
        <div className="card border-0 shadow-sm">
          <div className="card-body text-center">
            <h4>Il tuo report è pronto!</h4>
            <p className="text-muted mb-4">
              Abbiamo generato un report completo con grafici, analisi dettagliate e raccomandazioni personalizzate.
            </p>
            <div className="d-flex justify-content-center gap-3">
              <Link href="/reports" className="btn btn-primary">
                <i className="bi bi-file-earmark-text me-2"></i>
                Vai ai Report
              </Link>
              <button 
                className="btn btn-outline-primary"
                onClick={() => {
                  // Reset del test quando si torna ai test
                  localStorage.removeItem('sas_test_state');
                  window.location.href = '/tests';
                }}
              >
                <i className="bi bi-arrow-left me-2"></i>
                Torna ai Test
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container py-4">
      {/* Progress bar */}
      <div className="mb-4">
        <div className="d-flex justify-content-between mb-2">
          <small className="text-muted">Progresso del test</small>
          <small className="text-muted">{Math.round(calculateProgress())}%</small>
        </div>
        <div className="progress" style={{ height: '8px' }}>
          <div 
            className="progress-bar bg-primary" 
            style={{ width: `${calculateProgress()}%` }}
          ></div>
        </div>
      </div>

      {/* Indicatori di sezione */}
      <div className="d-flex justify-content-between mb-4">
        {[
          { key: 'intro', label: 'Introduzione', icon: 'info-circle' },
          { key: 'part1', label: 'Parte I', icon: '1-circle' },
          { key: 'part2', label: 'Parte II', icon: '2-circle' },
          { key: 'part3', label: 'Parte III', icon: '3-circle' },
          { key: 'results', label: 'Risultati', icon: 'bar-chart' }
        ].map((step, index) => {
          const isActive = testState.currentStep === step.key;
          const isCompleted = (
            (step.key === 'part1' && testState.part1.completed) ||
            (step.key === 'part2' && testState.part2.completed) ||
            (step.key === 'part3' && testState.part3.completed) ||
            (step.key === 'results' && testState.part3.completed)
          );
          
          return (
            <div key={step.key} className={`text-center ${isActive ? 'text-primary' : isCompleted ? 'text-success' : 'text-muted'}`}>
              <div 
                className={`rounded-circle d-inline-flex align-items-center justify-content-center mb-2 ${
                  isActive ? 'bg-primary text-white' : isCompleted ? 'bg-success text-white' : 'bg-light'
                }`}
                style={{ width: '40px', height: '40px', cursor: isCompleted ? 'pointer' : 'default' }}
                onClick={() => isCompleted && goToStep(step.key as any)}
              >
                <i className={`bi bi-${step.icon}`}></i>
              </div>
              <div className="small">{step.label}</div>
            </div>
          );
        })}
      </div>

      {/* Contenuto principale */}
      {testState.currentStep === 'intro' && renderIntro()}
      {testState.currentStep === 'part1' && renderPart1()}
      {testState.currentStep === 'part2' && renderPart2()}
      {testState.currentStep === 'part3' && renderPart3()}
      {testState.currentStep === 'results' && renderResults()}
    </div>
  );
} 