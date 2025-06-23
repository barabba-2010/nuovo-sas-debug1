'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import axios from 'axios';

interface Report {
  id: string;
  title: string;
  createdAt: string;
  metadata: any;
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState('profile');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [reports, setReports] = useState<Report[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);
  
  const isAdmin = session?.user?.role === 'ADMIN';
  
  // Gestisce il parametro tab dall'URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    if (tabParam && ['profile', 'tests', 'reports', 'admin'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, []);
  
  // Carica i report quando si apre la tab
  useEffect(() => {
    if (activeTab === 'reports' && session) {
      fetchReports();
    }
  }, [activeTab, session]);
  
  const fetchReports = async () => {
    setLoadingReports(true);
    try {
      const response = await fetch('/api/reports');
      if (response.ok) {
        const data = await response.json();
        setReports(data);
      }
    } catch (error) {
      console.error('Errore nel caricamento dei report:', error);
    } finally {
      setLoadingReports(false);
    }
  };
  
  // Clean database action for admins
  const handleCleanDatabase = async () => {
    if (!isAdmin) return;
    
    if (!confirm('ATTENZIONE: Questa operazione eliminerà tutti i dati relativi ai test e report degli utenti. Procedere?')) {
      return;
    }
    
    setIsLoading(true);
    setMessage({ text: '', type: '' });
    
    try {
      const response = await axios.post('/api/cleanup');
      setMessage({ 
        text: `Pulizia completata: ${response.data.stats.reports} report e ${response.data.stats.testResults} risultati di test eliminati.`, 
        type: 'success' 
      });
    } catch (error: any) {
      console.error('Errore durante la pulizia:', error);
      setMessage({ 
        text: `Errore durante la pulizia: ${error.response?.data?.message || error.message}`, 
        type: 'danger' 
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  if (status === 'loading') {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2">Caricamento profilo...</p>
      </div>
    );
  }
  
  if (!session) {
    return (
      <div className="container py-5">
        <div className="alert alert-warning">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          Devi effettuare l'accesso per visualizzare questa pagina.
        </div>
        <Link href="/auth/login" className="btn btn-primary">
          <i className="bi bi-box-arrow-in-right me-2"></i>
          Accedi
        </Link>
      </div>
    );
  }
  
  return (
    <div className="container py-5">
      <div className="row">
        <div className="col-lg-4 mb-4">
          <div className="card border-0 shadow-sm">
            <div className="card-body text-center py-5">
              <div className="mb-3">
                <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center mx-auto" 
                     style={{ width: '100px', height: '100px', fontSize: '40px' }}>
                  {session.user?.name?.charAt(0) || session.user?.email?.charAt(0) || 'U'}
                </div>
              </div>
              <h4 className="mb-1">{session.user?.name || 'Utente'}</h4>
              <p className="text-muted">{session.user?.email}</p>
              
              {isAdmin && (
                <div className="mt-2">
                  <span className="badge bg-danger px-3 py-2">Amministratore</span>
                </div>
              )}
              
              <div className="mt-4">
                <Link href="/auth/logout" className="btn btn-outline-danger">
                  <i className="bi bi-box-arrow-right me-2"></i>
                  Logout
                </Link>
              </div>
            </div>
          </div>
          
          <div className="list-group mt-4 shadow-sm">
            <button 
              className={`list-group-item list-group-item-action ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              <i className="bi bi-person-fill me-2"></i>
              Profilo
            </button>
            <button 
              className={`list-group-item list-group-item-action ${activeTab === 'tests' ? 'active' : ''}`}
              onClick={() => setActiveTab('tests')}
            >
              <i className="bi bi-clipboard-check me-2"></i>
              I miei Test
            </button>
            <button 
              className={`list-group-item list-group-item-action ${activeTab === 'reports' ? 'active' : ''}`}
              onClick={() => setActiveTab('reports')}
            >
              <i className="bi bi-file-earmark-text me-2"></i>
              Report
            </button>
            
            {isAdmin && (
              <button 
                className={`list-group-item list-group-item-action ${activeTab === 'admin' ? 'active' : ''}`}
                onClick={() => setActiveTab('admin')}
              >
                <i className="bi bi-gear-fill me-2"></i>
                Amministrazione
              </button>
            )}
          </div>
        </div>
        
        <div className="col-lg-8">
          {message.text && (
            <div className={`alert alert-${message.type} alert-dismissible fade show`} role="alert">
              {message.type === 'success' ? (
                <i className="bi bi-check-circle-fill me-2"></i>
              ) : (
                <i className="bi bi-exclamation-triangle-fill me-2"></i>
              )}
              {message.text}
              <button type="button" className="btn-close" onClick={() => setMessage({ text: '', type: '' })}></button>
            </div>
          )}
          
          {activeTab === 'profile' && (
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-white py-3">
                <h5 className="mb-0">Informazioni Profilo</h5>
              </div>
              <div className="card-body">
                <div className="mb-3">
                  <label className="form-label">Nome</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={session.user?.name || ''} 
                    readOnly 
                  />
                </div>
                
                <div className="mb-3">
                  <label className="form-label">Email</label>
                  <input 
                    type="email" 
                    className="form-control" 
                    value={session.user?.email || ''} 
                    readOnly 
                  />
                </div>
                
                <div className="mb-0">
                  <label className="form-label">Ruolo</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={session.user?.role === 'ADMIN' ? 'Amministratore' : 'Utente'} 
                    readOnly 
                  />
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'tests' && (
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-white py-3">
                <h5 className="mb-0">I miei Test</h5>
              </div>
              <div className="card-body p-4">
                <div className="text-center py-5">
                  <i className="bi bi-clipboard-x text-muted fs-1 mb-3"></i>
                  <h4>Nessun test disponibile</h4>
                  <p className="text-muted">
                    Non hai ancora completato alcun test o non ci sono test disponibili al momento.
                  </p>
                  <Link href="/tests" className="btn btn-primary mt-3">
                    <i className="bi bi-arrow-right me-2"></i>
                    Vai ai Test disponibili
                  </Link>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'reports' && (
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-white py-3">
                <h5 className="mb-0">Archivio Report</h5>
              </div>
              <div className="card-body p-4">
                {loadingReports ? (
                  <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Caricamento...</span>
                    </div>
                    <p className="mt-2">Caricamento report...</p>
                  </div>
                ) : reports.length === 0 ? (
                  <div className="text-center py-5">
                    <i className="bi bi-file-earmark-x text-muted fs-1 mb-3"></i>
                    <h4>Nessun report disponibile</h4>
                    <p className="text-muted">
                      Non hai ancora nessun report salvato o generato dal sistema.
                    </p>
                    <Link href="/tests" className="btn btn-primary mt-3">
                      <i className="bi bi-arrow-right me-2"></i>
                      Completa un test per generare un report
                    </Link>
                  </div>
                ) : (
                  <div>
                    {/* Raggruppa i report per tipo di test */}
                    {(() => {
                      const groupedReports = reports.reduce((acc: any, report) => {
                        const testType = report.metadata?.testType || 'altro';
                        if (!acc[testType]) {
                          acc[testType] = [];
                        }
                        acc[testType].push(report);
                        return acc;
                      }, {});
                      
                      return Object.entries(groupedReports).map(([testType, typeReports]: [string, any]) => (
                        <div key={testType} className="mb-4">
                          <h6 className="text-uppercase text-muted mb-3">
                            <i className="bi bi-folder me-2"></i>
                            Test {testType === 'sas' ? 'S-AS (Scopo-Antiscopo)' : testType.toUpperCase()}
                          </h6>
                          <div className="list-group">
                            {typeReports
                              .sort((a: Report, b: Report) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                              .map((report: Report, index: number) => (
                                <div key={report.id} className="list-group-item list-group-item-action">
                                  <div className="d-flex justify-content-between align-items-start">
                                    <div className="flex-grow-1">
                                      <div className="d-flex align-items-center mb-1">
                                        {index === 0 && (
                                          <span className="badge bg-success me-2">Più recente</span>
                                        )}
                                        <h6 className="mb-0">{report.title}</h6>
                                      </div>
                                      <small className="text-muted">
                                        {new Date(report.createdAt).toLocaleDateString('it-IT', {
                                          day: 'numeric',
                                          month: 'long',
                                          year: 'numeric',
                                          hour: '2-digit',
                                          minute: '2-digit'
                                        })}
                                      </small>
                                      {report.metadata && (
                                        <div className="mt-1">
                                          <small className="text-muted">
                                            Punteggi: S: {report.metadata.scopo}, AS: {report.metadata.antiscopo}, Bil: {report.metadata.balance}
                                          </small>
                                        </div>
                                      )}
                                    </div>
                                    <div className="d-flex gap-2">
                                      <Link 
                                        href={`/reports/${report.id}`} 
                                        className="btn btn-sm btn-outline-primary"
                                      >
                                        <i className="bi bi-eye"></i>
                                      </Link>
                                      <button 
                                        className="btn btn-sm btn-outline-danger"
                                        onClick={async () => {
                                          if (confirm('Sei sicuro di voler eliminare questo report?')) {
                                            try {
                                              await fetch(`/api/reports/${report.id}`, { method: 'DELETE' });
                                              fetchReports();
                                            } catch (error) {
                                              console.error('Errore nell\'eliminazione:', error);
                                            }
                                          }
                                        }}
                                      >
                                        <i className="bi bi-trash"></i>
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      ));
                    })()}
                    
                    <div className="mt-4 text-center">
                      <Link href="/reports" className="btn btn-primary">
                        <i className="bi bi-file-earmark-text me-2"></i>
                        Vai alla sezione Report
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {activeTab === 'admin' && isAdmin && (
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-white py-3">
                <h5 className="mb-0">Pannello Amministrazione</h5>
              </div>
              <div className="card-body p-4">
                <div className="mb-4">
                  <h5>Pannello Admin Completo</h5>
                  <p className="text-muted">
                    Accedi al pannello di amministrazione completo per gestire organizzazioni, utenti, manager e report.
                  </p>
                  <Link href="/admin" className="btn btn-primary btn-lg">
                    <i className="bi bi-shield-lock me-2"></i>
                    Vai al Pannello Admin
                  </Link>
                </div>
                
                <hr className="my-4" />
                
                <div className="mb-4">
                  <h5>Gestione Test</h5>
                  <p className="text-muted">
                    Gestisci i test disponibili sulla piattaforma.
                  </p>
                  <Link href="/tests/manage" className="btn btn-outline-primary">
                    <i className="bi bi-gear me-2"></i>
                    Gestione Test
                  </Link>
                </div>
                
                <hr className="my-4" />
                
                <div className="mb-3">
                  <h5 className="text-danger">Zona Pericolo</h5>
                  <div className="card bg-danger bg-opacity-10 border-danger my-3">
                    <div className="card-body">
                      <h6 className="text-danger">Pulizia Dati</h6>
                      <p className="small mb-3">
                        Questa operazione eliminerà tutti i dati relativi ai test degli utenti, inclusi risultati e report.
                        L'operazione non può essere annullata.
                      </p>
                      <button 
                        className="btn btn-danger"
                        onClick={handleCleanDatabase}
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                            Pulizia in corso...
                          </>
                        ) : (
                          <>
                            <i className="bi bi-trash me-2"></i>
                            Pulisci Dati Test
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 