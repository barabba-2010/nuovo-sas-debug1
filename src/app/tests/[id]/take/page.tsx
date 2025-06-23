'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import axios from 'axios';
import './take-test.css';

declare global {
  interface Window {
    testSaveThrottled?: boolean;
  }
}

interface TestOption {
  value: string;
  label: string;
}

interface TestQuestion {
  id: string;
  text: string;
  type: string;
  options: TestOption[];
  metadata?: any;
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
  questions: string;
  metadata?: string;
}

export default function TakeTestPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { data: session, status } = useSession();
  // Usiamo useParams per ottenere il parametro id in modo sicuro
  const routeParams = useParams();
  const testId = routeParams.id as string;
  
  // Stati per gestire il test
  const [test, setTest] = useState<Test | null>(null);
  const [sections, setSections] = useState<TestSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentSection, setCurrentSection] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [progress, setProgress] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [showConfirmExit, setShowConfirmExit] = useState(false);
  const [savedTest, setSavedTest] = useState(false);
  
  // Recupera il test in base all'ID
  useEffect(() => {
    const fetchTest = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/tests/${testId}`);
        setTest(response.data);
        
        // Parsing delle sezioni e domande JSON
        try {
          const sectionsData = JSON.parse(response.data.questions);
          setSections(sectionsData);
          
          // Verifica che ci siano esattamente 20 coppie di affermazioni nelle prime due sezioni
          if (sectionsData[0] && sectionsData[0].questions.length !== 40) {
            console.warn('La sezione 1 dovrebbe contenere 40 affermazioni (20 coppie)');
          }
          
          if (sectionsData[1] && sectionsData[1].questions.length !== 40) {
            console.warn('La sezione 2 dovrebbe contenere 40 affermazioni (20 coppie)');
          }
          
          // Inizializza le risposte con valori vuoti
          const initialAnswers: Record<string, any> = {};
          sectionsData.forEach((section: TestSection) => {
            section.questions.forEach((question: TestQuestion) => {
              initialAnswers[question.id] = null;
            });
          });
          
          // Verifica se esiste un test salvato in localStorage
          const savedData = localStorage.getItem(`test_${testId}`);
          if (savedData) {
            try {
              const savedAnswers = JSON.parse(savedData);
              setAnswers(savedAnswers.answers || initialAnswers);
              setCurrentSection(savedAnswers.currentSection || 0);
              setCurrentStep(savedAnswers.currentStep || 0);
              setSavedTest(true);
            } catch (e) {
              console.error('Errore nel parsing dei dati salvati:', e);
              setAnswers(initialAnswers);
            }
          } else {
            setAnswers(initialAnswers);
          }
          
        } catch (e) {
          console.error('Errore nel parsing delle domande:', e);
          setSections([]);
          setError('Formato del test non valido');
        }
        
        // Imposta l'ora di inizio
        setStartTime(new Date());
        
      } catch (err: any) {
        console.error('Errore nel caricamento del test:', err);
        setError('Impossibile caricare il test. Riprova più tardi.');
      } finally {
        setLoading(false);
      }
    };
    
    if (testId) {
      fetchTest();
    }
    
    // Event listener per confermare l'uscita dalla pagina
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!savedTest) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [testId]);
  
  // Calcola il progresso del test
  useEffect(() => {
    if (sections.length === 0) return;
    
    // Calcola il totale delle domande in tutte le sezioni
    const totalQuestions = sections.reduce((acc, section) => acc + section.questions.length, 0);
    
    // Calcola quante domande sono state completate
    const answeredQuestions = Object.values(answers).filter(value => value !== null).length;
    
    // Aggiorna il progresso
    setProgress(Math.round((answeredQuestions / totalQuestions) * 100));
  }, [answers, sections]);
  
  // Ottenere il totale delle coppie di domande per le sezioni 1 e 2
  useEffect(() => {
    if (sections && sections.length >= 2) {
      // Verifica che ci siano esattamente 20 coppie di affermazioni nella sezione 1
      const section1Questions = sections[0]?.questions || [];
      if (section1Questions.length !== 40) {
        console.warn(`La sezione 1 contiene ${section1Questions.length} affermazioni invece di 40`);
      }
      
      // Verifica che ci siano esattamente 20 coppie di affermazioni nella sezione 2
      const section2Questions = sections[1]?.questions || [];
      if (section2Questions.length !== 40) {
        console.warn(`La sezione 2 contiene ${section2Questions.length} affermazioni invece di 40`);
      }
    }
  }, [sections]);
  
  // Aggiungiamo un effect per debug delle domande
  useEffect(() => {
    if (sections.length > 0) {
      console.log('Sezioni caricate:', sections);
      
      // Log dettagliato delle prime 3 domande di ogni sezione
      sections.forEach((section, sectionIndex) => {
        console.log(`Sezione ${sectionIndex + 1} - ${section.title}:`);
        const sampleQuestions = section.questions.slice(0, 6);
        sampleQuestions.forEach((q, qIndex) => {
          console.log(`  Domanda ${qIndex + 1}: ${q.text} (ID: ${q.id})`);
        });
        console.log(`  ... totale domande: ${section.questions.length}`);
      });
    }
  }, [sections]);
  
  // Aggiungiamo un onLoad effect per prevenire caricamenti inutili delle risorse
  useEffect(() => {
    // Rimuovi il listener di localStorage quando si carica la pagina
    const handleStorage = (e: StorageEvent) => {
      if (e.key === `test_${testId}`) {
        e.stopImmediatePropagation();
      }
    };
    
    window.addEventListener('storage', handleStorage);
    
    // Precarica alcune immagini comuni per la UI
    const preloadImages = [
      '/path/to/common-image-1.png',
      '/path/to/common-image-2.png'
    ];
    
    preloadImages.forEach(src => {
      const img = new Image();
      img.src = src;
    });
    
    // Imposta un debounce sui salvataggi di localStorage
    window.testSaveThrottled = false;
    
    return () => {
      window.removeEventListener('storage', handleStorage);
    };
  }, [testId]);
  
  // Aggiunta di una funzione per controllare se tutte le domande della coppia corrente sono state risposte
  const areCurrentQuestionsAnswered = () => {
    if (!sections || sections.length === 0 || currentSection >= sections.length) {
      return true;
    }
    
    const currentSectionData = sections[currentSection];
    
    // Per le sezioni 1 e 2 che mostrano coppie di domande
    if (currentSection === 0 || currentSection === 1) {
      const startIndex = currentStep * 2;
      const endIndex = startIndex + 2;
      const currentQuestions = currentSectionData.questions.slice(startIndex, endIndex);
      
      // Verifica che tutte le domande della coppia attuale abbiano risposta
      return currentQuestions.every(question => answers[question.id] !== null && answers[question.id] !== undefined);
    }
    
    // Per la sezione 3 che mostra una domanda alla volta
    if (currentSection === 2) {
      const question = currentSectionData.questions[currentStep];
      
      // Se è una domanda multiselect, deve avere almeno 2 selezioni
      if (question.type === 'MULTIPLE_CHOICE' && question.metadata?.multiselect) {
        return Array.isArray(answers[question.id]) && answers[question.id]?.length >= (question.metadata?.max || 2);
      }
      
      // Altrimenti, deve avere una risposta
      return answers[question.id] !== null && answers[question.id] !== undefined;
    }
    
    return true;
  };
  
  // Modifica della funzione handleNext per richiedere risposte a tutte le domande
  const handleNext = () => {
    const currentSectionData = sections[currentSection];
    
    // Verifica che tutte le domande abbiano risposta prima di procedere
    if (!areCurrentQuestionsAnswered()) {
      alert('Per favore, rispondi a tutte le domande prima di procedere.');
      return;
    }
    
    // Se è la sezione 3, controlliamo se ci sono almeno 2 selezioni per la domanda multiselect
    if (currentSection === 2 && currentStep === 0) {
      const selectQuestion = currentSectionData.questions[0];
      const selectedValues = answers[selectQuestion.id] || [];
      if (!Array.isArray(selectedValues) || selectedValues.length < 2) {
        alert('Seleziona almeno 2 affermazioni per continuare');
        return;
      }
    }
    
    // Verifica se siamo alla domanda Si/No e dobbiamo gestire il percorso condizionale
    if (currentSection === 2 && currentStep === 3) { // Domanda Si/No
      const answer = answers[currentSectionData.questions[currentStep].id];
      
      if (answer === null || answer === undefined) {
        alert('Per favore, rispondi alla domanda prima di continuare');
        return;
      }
      
      // Salta alla domanda appropriata in base alla risposta
      if (answer === 'Si') {
        // Se la risposta è Sì, vai alla domanda 5
        setCurrentStep(4);
      } else {
        // Se la risposta è No, vai alla domanda 6
        setCurrentStep(5);
      }
    } 
    // Verifica se siamo all'ultima domanda della sezione 1 o 2
    else if ((currentSection === 0 || currentSection === 1) && 
        currentStep < Math.floor(currentSectionData.questions.length / 2) - 1) {
      // Procedi alla prossima coppia nella stessa sezione
      setCurrentStep(currentStep + 1);
    } else if (currentSection === 2 && currentStep < currentSectionData.questions.length - 1) {
      // Nella sezione 3, avanza di una domanda alla volta
      setCurrentStep(currentStep + 1);
    } else if (currentSection < sections.length - 1) {
      // Passa alla sezione successiva
      setCurrentSection(currentSection + 1);
      setCurrentStep(0);
    } else {
      // Test completato
      handleSubmitTest();
    }
    
    // Salva lo stato corrente
    saveTestState();
  };
  
  // Gestisce il ritorno alla domanda precedente
  const handlePrevious = () => {
    if ((currentSection === 0 || currentSection === 1) && currentStep > 0) {
      // Torna alla coppia precedente nella stessa sezione
      setCurrentStep(currentStep - 1);
    } else if (currentSection === 2 && currentStep > 0) {
      // Nella sezione 3, torna indietro di una domanda
      setCurrentStep(currentStep - 1);
    } else if (currentSection > 0) {
      // Torna alla sezione precedente
      setCurrentSection(currentSection - 1);
      
      // Calcola l'ultimo step della sezione precedente
      if (currentSection === 1 || currentSection === 2) {
        // Per la sezione 1 e 2, andiamo all'ultima coppia
        const prevSectionQuestions = sections[currentSection - 1].questions;
        setCurrentStep(Math.floor(prevSectionQuestions.length / 2) - 1);
      } else if (currentSection === 3) {
        // Per la sezione 3, andiamo all'ultima domanda
        const prevSectionQuestions = sections[currentSection - 1].questions;
        setCurrentStep(prevSectionQuestions.length - 1);
      }
    }
  };
  
  // Gestisce la sottomissione di una risposta
  const handleAnswer = (questionId: string, value: any) => {
    console.log(`Setting answer for question ${questionId} to ${value}`);
    setAnswers(prev => {
      const newAnswers = {
        ...prev,
        [questionId]: value
      };
      console.log('New answers:', newAnswers);
      return newAnswers;
    });
  };
  
  // Gestisce la sottomissione del test completo
  const handleSubmitTest = async () => {
    try {
      setLoading(true);
      
      // Calcola la durata del test
      const endTime = new Date();
      const duration = startTime ? Math.floor((endTime.getTime() - startTime.getTime()) / 1000) : 0;
      
      // Prepara i dati da inviare
      const testResult = {
        testId: test?.id,
        answers,
        duration,
        completedAt: endTime.toISOString()
      };
      
      // Invia i risultati all'API
      await axios.post('/api/tests/results', testResult);
      
      // Rimuovi il test salvato dal localStorage
      localStorage.removeItem(`test_${testId}`);
      setSavedTest(true);
      
      // Reindirizza alla pagina dei risultati
      router.push(`/tests/${testId}/results`);
      
    } catch (err) {
      console.error('Errore nell\'invio dei risultati:', err);
      setError('Si è verificato un errore nell\'invio dei risultati. Riprova più tardi.');
      setLoading(false);
    }
  };
  
  // Salva lo stato del test corrente
  const saveTestState = () => {
    if (window.testSaveThrottled) return;
    
    window.testSaveThrottled = true;
    setTimeout(() => {
      window.testSaveThrottled = false;
    }, 1000);
    
    const testState = {
      testId: test?.id,
      answers,
      currentSection,
      currentStep,
      startTime: startTime?.toISOString(),
      lastUpdated: new Date().toISOString()
    };
    
    try {
      localStorage.setItem(`test_${testId}`, JSON.stringify(testState));
      setSavedTest(true);
    } catch (e) {
      console.error('Errore nel salvataggio del test:', e);
    }
  };
  
  // Interrompe il test e salva lo stato
  const handlePauseTest = () => {
    saveTestState();
    setShowConfirmExit(true);
  };
  
  // Gestisce il rendering delle domande in base alla sezione corrente
  const renderQuestions = () => {
    if (!sections || sections.length === 0 || currentSection >= sections.length) {
      return <p>Nessuna domanda disponibile</p>;
    }
    
    const currentSectionData = sections[currentSection];
    
    // Sezione 1: Valutazione delle affermazioni
    if (currentSection === 0) {
      // Ogni step mostra una coppia (2 domande)
      const startIndex = currentStep * 2;
      const endIndex = startIndex + 2;
      const currentQuestions = currentSectionData.questions.slice(startIndex, endIndex);
      const totalPairs = Math.floor(currentSectionData.questions.length / 2);
      
      // Mostra sempre il testo originale dell'affermazione
      const formattedQuestions = currentQuestions.map((question, index) => {
        const pairNumber = currentStep + 1;
        const text = question.text || '';
        
        return {
          ...question,
          displayText: text 
            ? `${pairNumber}${index === 0 ? '.' : 'a.'} ${index === 0 ? '(S)' : '(AS)'} ${text}`
            : `${pairNumber}${index === 0 ? '.' : 'a.'} ${index === 0 ? '(S)' : '(AS)'} Testo affermazione ${pairNumber}${index === 0 ? '' : 'a'}`
        };
      });
      
      return (
        <div>
          <h4 className="mb-3 pb-2 border-bottom">{currentSectionData.title}</h4>
          <p className="mb-4">Per ciascuna delle 20 coppie di affermazioni (40 affermazioni totali), indica quanto ti rappresenta ogni affermazione.</p>
          
          <div className="mb-4">
            <div className="d-inline-block px-3 py-2 bg-light rounded">
              <strong>Coppia {currentStep + 1} di {totalPairs}</strong>
            </div>
          </div>
          
          {/* Una coppia per volta */}
          {formattedQuestions.map((question, index) => {
            return (
              <div key={question.id} className="mb-5">
                <div className="card border-0 border-start border-3 border-primary shadow-sm" style={{borderRadius: '0.5rem'}}>
                  <div className="card-body p-4">
                    <div className="px-2 py-1 bg-primary bg-opacity-10 text-primary rounded mb-3 d-inline-block">
                      {index === 0 ? 'Scopo' : 'Antiscopo'}
                    </div>
                    
                    <div className="d-flex align-items-center mb-3">
                      <span className="h5 mb-0">
                        {question.displayText}
                      </span>
                    </div>
                    
                    {question.type === 'SCALE' && (
                      <div className="d-flex justify-content-between mt-4">
                        {question.options?.map((option) => {
                          const isSelected = answers[question.id] === option.value;
                          return (
                            <div 
                              key={option.value} 
                              className="d-flex flex-column align-items-center"
                              onClick={() => {
                                handleAnswer(question.id, option.value);
                              }}
                            >
                              <div
                                className={`option-box ${isSelected ? 'selected' : ''}`}
                              >
                                <span>{option.value}</span>
                                {isSelected && (
                                  <div className="fill-animation"></div>
                                )}
                              </div>
                              <span className="mt-2 text-center small" style={{ maxWidth: '80px' }}>
                                {option.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          
          {/* Aggiunta di una piccola legenda per chiarire */}
          <div className="mt-4 text-muted small">
            <p className="mb-0">Seleziona un valore da 0 a 4 per ciascuna affermazione.</p>
          </div>
        </div>
      );
    }
    
    // Sezione 2: Selezione dell'affermazione che rappresenta di più
    if (currentSection === 1) {
      const startIndex = currentStep * 2;
      const endIndex = startIndex + 2;
      const currentQuestions = currentSectionData.questions.slice(startIndex, endIndex);
      const totalPairs = Math.floor(currentSectionData.questions.length / 2);
      
      // Ottieni le stesse affermazioni dalla sezione 1 per mantenere la coerenza
      const section1Questions = sections[0]?.questions || [];
      const correspondingQuestion1 = section1Questions[startIndex];
      const correspondingQuestion2 = section1Questions[startIndex + 1];
      
      // Usa le stesse affermazioni della sezione 1 per la sezione 2
      const formattedQuestions = currentQuestions.map((question, index) => {
        const pairNumber = currentStep + 1;
        const correspondingQuestion = index === 0 ? correspondingQuestion1 : correspondingQuestion2;
        const text = correspondingQuestion?.text || question.text || '';
        
        return {
          ...question,
          displayText: text 
            ? `${pairNumber}${index === 0 ? '.' : 'a.'} ${index === 0 ? '(S)' : '(AS)'} ${text}`
            : `${pairNumber}${index === 0 ? '.' : 'a.'} ${index === 0 ? '(S)' : '(AS)'} Testo affermazione ${pairNumber}${index === 0 ? '' : 'a'}`
        };
      });
      
      return (
        <div>
          <h4 className="mb-3 pb-2 border-bottom">{currentSectionData.title}</h4>
          <p className="mb-4">Per ciascuna delle 20 coppie (40 affermazioni totali), scegli solo una delle due affermazioni, quella che ti rappresenta di più.</p>
          
          <div className="mb-4">
            <div className="d-inline-block px-3 py-2 bg-light rounded">
              <strong>Coppia {currentStep + 1} di {totalPairs}</strong>
            </div>
          </div>
          
          <p className="text-primary fw-medium mb-4">Scegli l'affermazione che ti rappresenta di più:</p>
          
          {/* Visualizzazione delle opzioni in verticale */}
          {formattedQuestions.map((question, index) => {
            return (
              <div key={question.id} className="mb-3">
                <div 
                  className={`card border shadow-sm mb-3 ${answers[question.id] === 'selected' ? 'border-primary border-2' : ''}`}
                  style={{
                    borderRadius: '0.5rem', 
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    backgroundColor: answers[question.id] === 'selected' ? 'rgba(13, 110, 253, 0.05)' : ''
                  }}
                  onClick={() => {
                    // Reset the other option in this pair
                    const otherIndex = index === 0 ? 1 : 0;
                    const otherId = formattedQuestions[otherIndex].id;
                    setAnswers(prev => ({
                      ...prev,
                      [question.id]: 'selected',
                      [otherId]: null
                    }));
                  }}
                >
                  <div className="card-body p-3">
                    <div className="d-flex align-items-center">
                      <div 
                        className="me-3 d-flex align-items-center justify-content-center"
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          border: answers[question.id] === 'selected' ? 'none' : '2px solid #0d6efd',
                          backgroundColor: answers[question.id] === 'selected' ? '#0d6efd' : 'transparent',
                          transition: 'all 0.3s ease'
                        }}
                      >
                        {answers[question.id] === 'selected' && (
                          <i className="bi bi-check text-white" style={{ fontSize: '18px' }}></i>
                        )}
                      </div>
                      <div className="flex-grow-1">
                        <p className="mb-0 fw-medium">
                          {question.displayText}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      );
    }
    
    // Sezione 3: Domande aperte con selezione multipla e domande condizionali
    if (currentSection === 2) {
      const question = currentSectionData.questions[currentStep];
      
      return (
        <div>
          <h4 className="mb-4 pb-2 border-bottom">{currentSectionData.title}</h4>
          {currentStep === 0 ? (
            <p className="mb-4">Seleziona due affermazioni che ti rappresentano e rispondi alle seguenti domande.</p>
          ) : null}
          
          <div className="card border-0 shadow-sm mb-4" style={{borderRadius: '0.5rem'}}>
            <div className="card-body p-4">
              <h5 className="mb-3">{question.text}</h5>
              
              {question.type === 'MULTIPLE_CHOICE' && question.metadata?.multiselect && (
                <div className="d-flex flex-column gap-2">
                  <p className="text-muted mb-3">Seleziona {question.metadata?.max || 2} affermazioni che ti colpiscono maggiormente:</p>
                  {question.options.map((option) => {
                    const isSelected = Array.isArray(answers[question.id]) && answers[question.id]?.includes(option.value);
                    const maxSelected = Array.isArray(answers[question.id]) && answers[question.id]?.length >= (question.metadata?.max || 2);
                    
                    return (
                      <div 
                        key={option.value} 
                        className={`card border mb-2 ${isSelected ? 'border-primary border-2' : ''}`}
                        style={{
                          borderRadius: '0.5rem',
                          cursor: maxSelected && !isSelected ? 'not-allowed' : 'pointer',
                          transition: 'all 0.2s ease',
                          opacity: maxSelected && !isSelected ? 0.6 : 1,
                          backgroundColor: isSelected ? 'rgba(13, 110, 253, 0.05)' : ''
                        }}
                        onClick={() => {
                          if (maxSelected && !isSelected) return;
                          
                          const currentSelections = Array.isArray(answers[question.id]) ? [...answers[question.id]] : [];
                          if (isSelected) {
                            handleAnswer(question.id, currentSelections.filter(v => v !== option.value));
                          } else {
                            handleAnswer(question.id, [...currentSelections, option.value]);
                          }
                        }}
                      >
                        <div className="card-body p-3">
                          <div className="d-flex align-items-center">
                            <div 
                              className="me-3 d-flex align-items-center justify-content-center"
                              style={{
                                width: '24px',
                                height: '24px',
                                borderRadius: '4px',
                                border: isSelected ? 'none' : '2px solid #0d6efd',
                                backgroundColor: isSelected ? '#0d6efd' : 'transparent',
                                transition: 'all 0.3s ease'
                              }}
                            >
                              {isSelected && (
                                <i className="bi bi-check text-white" style={{ fontSize: '16px' }}></i>
                              )}
                            </div>
                            <div className="flex-grow-1">
                              <p className="mb-0 fw-medium">{option.label}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              
              {question.type === 'MULTIPLE_CHOICE' && !question.metadata?.multiselect && (
                <div className="d-flex flex-column gap-2">
                  {question.options.map((option) => (
                    <div 
                      key={option.value} 
                      className={`card border mb-2 ${answers[question.id] === option.value ? 'border-primary border-2' : ''}`}
                      style={{
                        borderRadius: '0.5rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        backgroundColor: answers[question.id] === option.value ? 'rgba(13, 110, 253, 0.05)' : ''
                      }}
                      onClick={() => handleAnswer(question.id, option.value)}
                    >
                      <div className="card-body p-3">
                        <div className="d-flex align-items-center">
                          <div 
                            className="me-3 d-flex align-items-center justify-content-center"
                            style={{
                              width: '24px',
                              height: '24px',
                              borderRadius: '50%',
                              border: answers[question.id] === option.value ? 'none' : '2px solid #0d6efd',
                              backgroundColor: answers[question.id] === option.value ? '#0d6efd' : 'transparent',
                              transition: 'all 0.3s ease'
                            }}
                          >
                            {answers[question.id] === option.value && (
                              <i className="bi bi-check text-white" style={{ fontSize: '16px' }}></i>
                            )}
                          </div>
                          <div className="flex-grow-1">
                            <p className="mb-0 fw-medium">{option.label}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {question.type === 'YES_NO' && (
                <div className="d-flex flex-column align-items-center gap-3 mt-4">
                  <p className="mb-3 text-center">Seleziona la tua risposta:</p>
                  <div className="d-flex gap-4">
                    <button
                      className={`btn ${answers[question.id] === 'Si' ? 'btn-primary' : 'btn-outline-primary'}`}
                      onClick={() => {
                        handleAnswer(question.id, 'Si');
                      }}
                      style={{ width: '100px', height: '50px' }}
                    >
                      Sì
                    </button>
                    <button
                      className={`btn ${answers[question.id] === 'No' ? 'btn-primary' : 'btn-outline-primary'}`}
                      onClick={() => {
                        handleAnswer(question.id, 'No');
                      }}
                      style={{ width: '100px', height: '50px' }}
                    >
                      No
                    </button>
                  </div>
                </div>
              )}
              
              {question.type === 'TEXT' && (
                <div>
                  <textarea
                    className="form-control"
                    rows={5}
                    value={answers[question.id] || ''}
                    onChange={(e) => handleAnswer(question.id, e.target.value)}
                    placeholder="Scrivi la tua risposta qui..."
                  />
                </div>
              )}
            </div>
          </div>
          
          {/* Mostra le affermazioni selezionate per riferimento nelle domande successive */}
          {currentStep > 0 && answers[currentSectionData.questions[0].id] && (
            <div className="alert alert-primary bg-primary bg-opacity-10">
              <h6>Affermazioni selezionate:</h6>
              <ul className="mb-0">
                {Array.isArray(answers[currentSectionData.questions[0].id]) && 
                 answers[currentSectionData.questions[0].id].map((selectedValue: string) => {
                  const selectedOption = currentSectionData.questions[0].options.find(
                    opt => opt.value === selectedValue
                  );
                  return selectedOption ? (
                    <li key={selectedValue} className="fw-medium">{selectedOption.label}</li>
                  ) : null;
                })}
              </ul>
            </div>
          )}
        </div>
      );
    }
    
    return null;
  };
  
  // Memoize the rendered questions to prevent unnecessary re-renders
  const memoizedRenderQuestions = React.useMemo(() => {
    return renderQuestions();
  }, [currentSection, currentStep, answers]);
  
  if (status === 'loading' || loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Caricamento...</span>
        </div>
        <p className="mt-3">Caricamento del test in corso...</p>
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
  
  if (!test) {
    return (
      <div className="container py-5">
        <div className="alert alert-warning" role="alert">
          <h4 className="alert-heading">Test non trovato</h4>
          <p>Il test richiesto non è disponibile o potrebbe essere stato rimosso.</p>
          <hr />
          <Link href="/tests" className="btn btn-outline-secondary">
            <i className="bi bi-arrow-left me-2"></i>
            Torna ai Test
          </Link>
        </div>
      </div>
    );
  }
  
  // Calcola se siamo all'ultima domanda dell'ultima sezione
  const isLastQuestion = 
    currentSection === sections.length - 1 && 
    ((currentSection === 2 && currentStep === sections[currentSection]?.questions.length - 1) ||
     (currentSection !== 2 && currentStep === Math.floor(sections[currentSection]?.questions.length / 2) - 1));
  
  // Calcola se siamo alla prima domanda della prima sezione
  const isFirstQuestion = currentSection === 0 && currentStep === 0;
  
  return (
    <div className="container py-5">

      
      {/* Header con titolo e progresso */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>{test.title}</h2>
        <button 
          className="btn btn-outline-secondary" 
          onClick={handlePauseTest}
        >
          <i className="bi bi-pause-circle me-2"></i>
          Interrompi Test
        </button>
      </div>
      
      {/* Barra di progresso */}
      <div className="progress mb-4" style={{ height: '8px' }}>
        <div 
          className="progress-bar bg-primary" 
          role="progressbar" 
          style={{ width: `${progress}%` }} 
          aria-valuenow={progress} 
          aria-valuemin={0} 
          aria-valuemax={100}
        ></div>
      </div>
      
      {/* Indicatore di sezione */}
      <div className="d-flex justify-content-between mb-4">
        {sections.map((section, index) => (
          <div 
            key={index}
            className={`text-center flex-grow-1 position-relative ${index < currentSection ? 'text-success' : (index === currentSection ? 'text-primary' : 'text-muted')}`}
          >
            <div 
              className={`rounded-circle d-inline-flex align-items-center justify-content-center ${index <= currentSection ? 'bg-primary text-white' : 'bg-light text-muted'}`}
              style={{ width: '36px', height: '36px' }}
            >
              {index + 1}
            </div>
            <div className="mt-2 small">{section.title.split(':')[0]}</div>
            {index < sections.length - 1 && (
              <div 
                className="position-absolute top-50 start-100 translate-middle"
                style={{ width: '100%', height: '2px', transform: 'translateY(-50%)' }}
              >
                <div 
                  className={`h-100 ${index < currentSection ? 'bg-primary' : 'bg-light'}`}
                  style={{ width: '90%' }}
                ></div>
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* Area principale con le domande */}
      <div className="card border-0 shadow-sm mb-4" style={{borderRadius: '0.75rem'}}>
        <div className="card-body p-4">
          {memoizedRenderQuestions}
        </div>
      </div>
      
      {/* Pulsanti di navigazione nel footer */}
      <div className="d-flex justify-content-between">
        {currentStep > 0 || currentSection > 0 ? (
          <button 
            className="btn btn-outline-primary px-4" 
            onClick={handlePrevious}
          >
            <i className="bi bi-arrow-left me-2"></i>
            Indietro
          </button>
        ) : (
          <div></div> // Spazio vuoto per mantenere la distribuzione flex
        )}
        
        <button 
          className={`btn ${isLastQuestion ? 'btn-success' : 'btn-primary'} px-4`}
          onClick={handleNext}
          disabled={!areCurrentQuestionsAnswered() && !isLastQuestion}
        >
          {isLastQuestion ? (
            <>
              <i className="bi bi-check-circle me-2"></i>
              Completa Test
            </>
          ) : (
            <>
              Successivo
              <i className="bi bi-arrow-right ms-2"></i>
            </>
          )}
        </button>
      </div>
      
      {/* Modale di conferma uscita */}
      {showConfirmExit && (
        <div className="modal d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Test Salvato</h5>
                <button type="button" className="btn-close" onClick={() => setShowConfirmExit(false)}></button>
              </div>
              <div className="modal-body">
                <p>Il tuo progresso è stato salvato. Puoi continuare il test in un secondo momento.</p>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowConfirmExit(false)}
                >
                  Continua il Test
                </button>
                <Link 
                  href="/tests" 
                  className="btn btn-primary"
                  onClick={() => localStorage.setItem(`test_${testId}_state`, 'paused')}
                >
                  Torna ai Test
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 