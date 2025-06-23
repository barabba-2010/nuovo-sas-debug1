'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect } from 'react';

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Rimuovo il redirect automatico - gli utenti possono scegliere dove andare

  // Mostra loading mentre verifica la sessione
  if (status === 'loading') {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Caricamento...</span>
        </div>
      </div>
    );
  }

  // Se l'utente è autenticato, mostra una versione diversa
  if (status === 'authenticated' && session) {
    const userRole = (session.user as any)?.role;
    
    return (
      <div className="container py-5">
        <div className="text-center mb-5">
          <h1 className="display-4 fw-bold mb-3">
            Bentornato, {session.user?.name || 'Utente'}!
          </h1>
          <p className="lead text-muted">
            Scegli dove vuoi andare
          </p>
        </div>
        
        <div className="row g-4 justify-content-center">
          <div className="col-md-4">
            <Link href="/dashboard" className="text-decoration-none">
              <div className="card h-100 border-0 shadow-sm hover-shadow">
                <div className="card-body text-center py-5">
                  <i className="bi bi-speedometer2 display-3 text-primary mb-3"></i>
                  <h4>Dashboard</h4>
                  <p className="text-muted">
                    Visualizza le tue statistiche e attività recenti
                  </p>
                </div>
              </div>
            </Link>
          </div>
          
          {userRole === 'ADMIN' && (
            <div className="col-md-4">
              <Link href="/admin" className="text-decoration-none">
                <div className="card h-100 border-0 shadow-sm hover-shadow">
                  <div className="card-body text-center py-5">
                    <i className="bi bi-shield-lock display-3 text-danger mb-3"></i>
                    <h4>Pannello Admin</h4>
                    <p className="text-muted">
                      Gestisci il sistema
                    </p>
                  </div>
                </div>
              </Link>
            </div>
          )}
          
          {userRole === 'MANAGER' && (
            <div className="col-md-4">
              <Link href="/manager" className="text-decoration-none">
                <div className="card h-100 border-0 shadow-sm hover-shadow">
                  <div className="card-body text-center py-5">
                    <i className="bi bi-people-fill display-3 text-info mb-3"></i>
                    <h4>Pannello Manager</h4>
                    <p className="text-muted">
                      Gestisci il tuo team
                    </p>
                  </div>
                </div>
              </Link>
            </div>
          )}
          
          <div className="col-md-4">
            <Link href="/tests" className="text-decoration-none">
              <div className="card h-100 border-0 shadow-sm hover-shadow">
                <div className="card-body text-center py-5">
                  <i className="bi bi-clipboard-check display-3 text-success mb-3"></i>
                  <h4>I Miei Test</h4>
                  <p className="text-muted">
                    Inizia un nuovo test o visualizza quelli completati
                  </p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Landing page per utenti non autenticati
  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero-section bg-gradient-primary text-white py-5">
        <div className="container py-5">
          <div className="row align-items-center min-vh-75">
            <div className="col-lg-6">
              <h1 className="display-3 fw-bold mb-4">
                Valutazione Psicologica Professionale
              </h1>
              <p className="lead mb-4">
                Piattaforma avanzata per test psicologici clinici. 
                Analisi dettagliate, report professionali e strumenti 
                evidence-based per professionisti della salute mentale.
              </p>
              <div className="d-flex gap-3 flex-wrap">
                <Link href="/auth/register" className="btn btn-light btn-lg px-4">
                  <i className="bi bi-person-plus me-2"></i>
                  Inizia Gratis
                </Link>
                <Link href="/auth/login" className="btn btn-outline-light btn-lg px-4">
                  <i className="bi bi-box-arrow-in-right me-2"></i>
                  Accedi
                </Link>
              </div>
              <div className="mt-4">
                <small className="text-white-50">
                  <i className="bi bi-shield-check me-2"></i>
                  Dati protetti e conformi GDPR
                </small>
              </div>
            </div>
            <div className="col-lg-6 text-center">
              <div className="position-relative">
                <div className="bg-white bg-opacity-10 rounded-circle p-5 d-inline-block">
                  <i className="bi bi-clipboard2-pulse display-1"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section py-5">
        <div className="container py-5">
          <div className="text-center mb-5">
            <h2 className="display-5 fw-bold">Strumenti Professionali</h2>
            <p className="lead text-muted">
              Tutto ciò che serve per valutazioni psicologiche complete
            </p>
          </div>
          
          <div className="row g-4">
            <div className="col-md-6 col-lg-4">
              <div className="card h-100 border-0 shadow-sm card-hover">
                <div className="card-body p-4">
                  <div className="feature-icon bg-primary bg-opacity-10 text-primary rounded-circle p-3 d-inline-flex mb-3">
                    <i className="bi bi-graph-up fs-3"></i>
                  </div>
                  <h4>Test S-AS Avanzato</h4>
                  <p className="text-muted">
                    Valutazione completa di Scopo e Antiscopo con analisi 
                    fattoriale e raccomandazioni personalizzate.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="col-md-6 col-lg-4">
              <div className="card h-100 border-0 shadow-sm card-hover">
                <div className="card-body p-4">
                  <div className="feature-icon bg-success bg-opacity-10 text-success rounded-circle p-3 d-inline-flex mb-3">
                    <i className="bi bi-file-earmark-pdf fs-3"></i>
                  </div>
                  <h4>Report Professionali</h4>
                  <p className="text-muted">
                    Genera report dettagliati in PDF con grafici, 
                    analisi e interpretazioni cliniche.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="col-md-6 col-lg-4">
              <div className="card h-100 border-0 shadow-sm card-hover">
                <div className="card-body p-4">
                  <div className="feature-icon bg-info bg-opacity-10 text-info rounded-circle p-3 d-inline-flex mb-3">
                    <i className="bi bi-shield-lock fs-3"></i>
                  </div>
                  <h4>Privacy Garantita</h4>
                  <p className="text-muted">
                    Dati separati per ogni utente, crittografia end-to-end 
                    e conformità alle normative sulla privacy.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="col-md-6 col-lg-4">
              <div className="card h-100 border-0 shadow-sm card-hover">
                <div className="card-body p-4">
                  <div className="feature-icon bg-warning bg-opacity-10 text-warning rounded-circle p-3 d-inline-flex mb-3">
                    <i className="bi bi-clock-history fs-3"></i>
                  </div>
                  <h4>Archivio Completo</h4>
                  <p className="text-muted">
                    Accedi a tutti i test e report precedenti, 
                    traccia i progressi nel tempo.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="col-md-6 col-lg-4">
              <div className="card h-100 border-0 shadow-sm card-hover">
                <div className="card-body p-4">
                  <div className="feature-icon bg-danger bg-opacity-10 text-danger rounded-circle p-3 d-inline-flex mb-3">
                    <i className="bi bi-person-badge fs-3"></i>
                  </div>
                  <h4>Multi-Paziente</h4>
                  <p className="text-muted">
                    Gestisci valutazioni per diversi pazienti 
                    mantenendo i dati organizzati e separati.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="col-md-6 col-lg-4">
              <div className="card h-100 border-0 shadow-sm card-hover">
                <div className="card-body p-4">
                  <div className="feature-icon bg-secondary bg-opacity-10 text-secondary rounded-circle p-3 d-inline-flex mb-3">
                    <i className="bi bi-bar-chart-line fs-3"></i>
                  </div>
                  <h4>Analisi Avanzate</h4>
                  <p className="text-muted">
                    Grafici interattivi, statistiche dettagliate 
                    e interpretazioni basate su evidenze.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="how-it-works py-5 bg-light">
        <div className="container py-5">
          <div className="text-center mb-5">
            <h2 className="display-5 fw-bold">Come Funziona</h2>
            <p className="lead text-muted">
              Inizia in pochi minuti
            </p>
          </div>
          
          <div className="row g-4">
            <div className="col-md-4 text-center">
              <div className="step-number bg-primary text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-3" 
                   style={{ width: '60px', height: '60px', fontSize: '24px' }}>
                1
              </div>
              <h4>Registrati</h4>
              <p className="text-muted">
                Crea il tuo account gratuito in meno di un minuto
              </p>
            </div>
            
            <div className="col-md-4 text-center">
              <div className="step-number bg-primary text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-3" 
                   style={{ width: '60px', height: '60px', fontSize: '24px' }}>
                2
              </div>
              <h4>Completa i Test</h4>
              <p className="text-muted">
                Scegli e completa i test psicologici disponibili
              </p>
            </div>
            
            <div className="col-md-4 text-center">
              <div className="step-number bg-primary text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-3" 
                   style={{ width: '60px', height: '60px', fontSize: '24px' }}>
                3
              </div>
              <h4>Ottieni Report</h4>
              <p className="text-muted">
                Ricevi report dettagliati con analisi e raccomandazioni
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section bg-primary text-white py-5">
        <div className="container py-5 text-center">
          <h2 className="display-5 fw-bold mb-4">
            Inizia la Tua Valutazione Professionale
          </h2>
          <p className="lead mb-4">
            Unisciti a professionisti che utilizzano la nostra piattaforma 
            per valutazioni psicologiche accurate
          </p>
          <Link href="/auth/register" className="btn btn-light btn-lg px-5">
            <i className="bi bi-rocket-takeoff me-2"></i>
            Crea Account Gratuito
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-dark text-white py-4">
        <div className="container">
          <div className="row">
            <div className="col-md-6">
              <p className="mb-0">
                © 2024 PsychAssess. Tutti i diritti riservati.
              </p>
            </div>
            <div className="col-md-6 text-md-end">
              <Link href="/privacy" className="text-white-50 text-decoration-none me-3">
                Privacy
              </Link>
              <Link href="/terms" className="text-white-50 text-decoration-none">
                Termini di Servizio
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
} 