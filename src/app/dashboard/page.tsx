'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

interface DashboardStats {
  totalTests: number;
  totalReports: number;
  lastTestDate: string | null;
  recentReports: any[];
}

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    totalTests: 0,
    totalReports: 0,
    lastTestDate: null,
    recentReports: []
  });
  const [loading, setLoading] = useState(true);
  const [checkingTeam, setCheckingTeam] = useState(true);

  const userRole = (session?.user as any)?.role;
  const isAdmin = userRole === 'ADMIN';
  const isManager = userRole === 'MANAGER';
  const isEmployee = userRole === 'EMPLOYEE';

  useEffect(() => {
    if (status === 'loading') return;
    
    if (status === 'unauthenticated') {
      router.push('/auth/login');
      return;
    }

    // Se è un employee, verifica se ha un team
    if (status === 'authenticated' && session?.user && isEmployee) {
      checkUserTeam();
    } else if (status === 'authenticated') {
      setCheckingTeam(false);
      fetchDashboardStats();
    }
  }, [status, session, router, isEmployee]);

  const checkUserTeam = async () => {
    try {
      // Se l'utente è un employee, verifica se ha un team
      if ((session?.user as any)?.role === 'EMPLOYEE') {
        const response = await axios.get('/api/user/team-status');
        if (!response.data.hasTeam) {
          // Reindirizza alla selezione del team
          router.push('/auth/select-team');
          return;
        }
      }
      setCheckingTeam(false);
      fetchDashboardStats();
    } catch (error) {
      console.error('Errore nel controllo del team:', error);
      setCheckingTeam(false);
      fetchDashboardStats();
    }
  };

  // Carica le statistiche
  useEffect(() => {
    if (status === 'authenticated') {
      fetchDashboardStats();
    }
  }, [status]);

  const fetchDashboardStats = async () => {
    try {
      // Fetch reports
      const reportsResponse = await fetch('/api/reports');
      if (reportsResponse.ok) {
        const reports = await reportsResponse.json();
        
        // Calcola statistiche
        const totalReports = reports.length;
        const recentReports = reports
          .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 5);
        
        const lastTest = reports[0];
        const lastTestDate = lastTest ? new Date(lastTest.createdAt).toISOString() : null;
        
        setStats({
          totalTests: totalReports, // Per ora usiamo lo stesso numero
          totalReports,
          lastTestDate,
          recentReports
        });
      }
    } catch (error) {
      console.error('Errore nel caricamento delle statistiche:', error);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Caricamento...</span>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }
  
  return (
    <div className="container py-5">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 mb-1">Bentornato, {session.user?.name || 'Utente'}!</h1>
          <p className="text-muted mb-0">Ecco un riepilogo della tua attività</p>
        </div>
        <div>
          {isAdmin && (
            <Link href="/tests/manage" className="btn btn-primary me-2">
              <i className="bi bi-gear me-2"></i>
              Gestione
            </Link>
          )}
          <Link href="/profile" className="btn btn-outline-secondary">
            <i className="bi bi-person me-2"></i>
            Profilo
          </Link>
        </div>
      </div>
      
      {/* Statistiche */}
      <div className="row g-4 mb-4">
        <div className="col-md-3">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="flex-shrink-0">
                  <div className="bg-primary bg-opacity-10 text-primary rounded-circle p-3">
                    <i className="bi bi-clipboard-check fs-4"></i>
                  </div>
                </div>
                <div className="flex-grow-1 ms-3">
                  <h6 className="text-muted mb-1">Test Completati</h6>
                  <h3 className="mb-0">{stats.totalTests}</h3>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-md-3">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="flex-shrink-0">
                  <div className="bg-success bg-opacity-10 text-success rounded-circle p-3">
                    <i className="bi bi-file-earmark-text fs-4"></i>
                  </div>
                </div>
                <div className="flex-grow-1 ms-3">
                  <h6 className="text-muted mb-1">Report Generati</h6>
                  <h3 className="mb-0">{stats.totalReports}</h3>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-md-3">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="flex-shrink-0">
                  <div className="bg-info bg-opacity-10 text-info rounded-circle p-3">
                    <i className="bi bi-calendar-check fs-4"></i>
                  </div>
                </div>
                <div className="flex-grow-1 ms-3">
                  <h6 className="text-muted mb-1">Ultimo Test</h6>
                  <p className="mb-0 fw-bold">
                    {stats.lastTestDate 
                      ? new Date(stats.lastTestDate).toLocaleDateString('it-IT')
                      : 'Nessuno'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-md-3">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="flex-shrink-0">
                  <div className="bg-warning bg-opacity-10 text-warning rounded-circle p-3">
                    <i className="bi bi-star fs-4"></i>
                  </div>
                </div>
                <div className="flex-grow-1 ms-3">
                  <h6 className="text-muted mb-1">Test Disponibili</h6>
                  <h3 className="mb-0">S-AS</h3>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="row g-4">
        {/* Azioni Rapide */}
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-header bg-white py-3">
              <h5 className="mb-0">Azioni Rapide</h5>
            </div>
            <div className="card-body p-4">
              <div className="row g-3">
                {/* Link per Admin */}
                {isAdmin && (
                  <>
                    <div className="col-md-6">
                      <Link href="/admin" className="text-decoration-none">
                        <div className="d-flex align-items-center p-3 rounded bg-danger bg-opacity-10 hover-shadow transition">
                          <div className="flex-shrink-0">
                            <i className="bi bi-shield-lock fs-1 text-danger"></i>
                          </div>
                          <div className="flex-grow-1 ms-3">
                            <h6 className="mb-1">Pannello Admin</h6>
                            <p className="text-muted small mb-0">
                              Gestisci organizzazioni e utenti
                            </p>
                          </div>
                        </div>
                      </Link>
                    </div>
                  </>
                )}
                
                {/* Link per Manager */}
                {isManager && (
                  <>
                    <div className="col-md-6">
                      <Link href="/manager" className="text-decoration-none">
                        <div className="d-flex align-items-center p-3 rounded bg-info bg-opacity-10 hover-shadow transition">
                          <div className="flex-shrink-0">
                            <i className="bi bi-people-fill fs-1 text-info"></i>
                          </div>
                          <div className="flex-grow-1 ms-3">
                            <h6 className="mb-1">Pannello Manager</h6>
                            <p className="text-muted small mb-0">
                              Gestisci il tuo team
                            </p>
                          </div>
                        </div>
                      </Link>
                    </div>
                  </>
                )}
                
                {/* Link comuni per tutti */}
                <div className="col-md-6">
                  <Link href="/tests/sas" className="text-decoration-none">
                    <div className="d-flex align-items-center p-3 rounded bg-primary bg-opacity-10 hover-shadow transition">
                      <div className="flex-shrink-0">
                        <i className="bi bi-play-circle fs-1 text-primary"></i>
                      </div>
                      <div className="flex-grow-1 ms-3">
                        <h6 className="mb-1">Inizia Test S-AS</h6>
                        <p className="text-muted small mb-0">
                          Valutazione Scopo-Antiscopo
                        </p>
                      </div>
                    </div>
                  </Link>
                </div>
                
                <div className="col-md-6">
                  <Link href="/reports" className="text-decoration-none">
                    <div className="d-flex align-items-center p-3 rounded bg-success bg-opacity-10 hover-shadow transition">
                      <div className="flex-shrink-0">
                        <i className="bi bi-file-earmark-pdf fs-1 text-success"></i>
                      </div>
                      <div className="flex-grow-1 ms-3">
                        <h6 className="mb-1">Visualizza Report</h6>
                        <p className="text-muted small mb-0">
                          Accedi ai tuoi report
                        </p>
                      </div>
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          </div>
          
          {/* Report Recenti */}
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Report Recenti</h5>
              <Link href="/reports" className="btn btn-sm btn-outline-primary">
                Vedi tutti
              </Link>
            </div>
            <div className="card-body p-0">
              {stats.recentReports.length > 0 ? (
                <div className="list-group list-group-flush">
                  {stats.recentReports.map((report: any) => (
                    <Link 
                      key={report.id}
                      href={`/reports/${report.id}`}
                      className="list-group-item list-group-item-action py-3"
                    >
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <h6 className="mb-1">{report.title}</h6>
                          <small className="text-muted">
                            {new Date(report.createdAt).toLocaleDateString('it-IT', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </small>
                        </div>
                        <i className="bi bi-chevron-right text-muted"></i>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-5">
                  <i className="bi bi-file-earmark-x text-muted fs-1 mb-3"></i>
                  <p className="text-muted">Nessun report disponibile</p>
                  <Link href="/tests" className="btn btn-primary">
                    Inizia un Test
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Sidebar */}
        <div className="col-lg-4">
          {/* Profilo Utente */}
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-header bg-white py-3">
              <h5 className="mb-0">Il tuo Profilo</h5>
            </div>
            <div className="card-body text-center py-4">
              <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center mx-auto mb-3" 
                   style={{ width: '80px', height: '80px', fontSize: '32px' }}>
                {session.user?.name?.charAt(0) || session.user?.email?.charAt(0) || 'U'}
              </div>
              <h5 className="mb-1">{session.user?.name || 'Utente'}</h5>
              <p className="text-muted mb-3">{session.user?.email || ''}</p>
              <span className={`badge mb-3 ${
                isAdmin ? 'bg-danger' : 
                isManager ? 'bg-info' : 
                'bg-secondary'
              }`}>
                {isAdmin ? 'Amministratore' : 
                 isManager ? 'Manager' : 
                 'Dipendente'}
              </span>
              
              <div className="d-grid gap-2">
                <Link href="/profile" className="btn btn-outline-primary">
                  <i className="bi bi-person-gear me-2"></i>
                  Gestisci Profilo
                </Link>
              </div>
            </div>
          </div>
          
          {/* Guide Rapide */}
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white py-3">
              <h5 className="mb-0">Guide Rapide</h5>
            </div>
            <div className="card-body">
              <div className="d-flex align-items-start mb-3">
                <i className="bi bi-1-circle text-primary fs-5 me-3"></i>
                <div>
                  <h6 className="mb-1">Completa un Test</h6>
                  <p className="text-muted small mb-0">
                    Scegli il test S-AS per iniziare la valutazione
                  </p>
                </div>
              </div>
              
              <div className="d-flex align-items-start mb-3">
                <i className="bi bi-2-circle text-primary fs-5 me-3"></i>
                <div>
                  <h6 className="mb-1">Visualizza i Risultati</h6>
                  <p className="text-muted small mb-0">
                    I risultati sono disponibili immediatamente
                  </p>
                </div>
              </div>
              
              <div className="d-flex align-items-start">
                <i className="bi bi-3-circle text-primary fs-5 me-3"></i>
                <div>
                  <h6 className="mb-1">Scarica il Report</h6>
                  <p className="text-muted small mb-0">
                    Esporta i report in formato PDF
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 