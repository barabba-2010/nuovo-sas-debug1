export default function AboutPage() {
  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-lg-10">
          <h1 className="text-center mb-5">Chi Siamo</h1>
          
          <div className="row mb-5">
            <div className="col-lg-6">
              <h2 className="h3 mb-4">La Nostra Missione</h2>
              <p className="lead">
                PsychAssess nasce con l'obiettivo di rendere la valutazione psicologica 
                più accessibile, accurata e professionale attraverso l'uso della tecnologia.
              </p>
              <p>
                Crediamo che strumenti di valutazione di qualità debbano essere disponibili 
                per tutti i professionisti della salute mentale, permettendo loro di fornire 
                il miglior supporto possibile ai loro pazienti.
              </p>
            </div>
            <div className="col-lg-6">
              <div className="bg-primary bg-opacity-10 rounded p-5 text-center">
                <i className="bi bi-heart-pulse display-1 text-primary mb-3"></i>
                <h3>Valutazioni Professionali</h3>
                <p className="mb-0">
                  Test validati scientificamente per risultati affidabili
                </p>
              </div>
            </div>
          </div>

          <div className="row g-4 mb-5">
            <div className="col-md-4">
              <div className="card h-100 border-0 shadow-sm">
                <div className="card-body text-center p-4">
                  <i className="bi bi-shield-check display-4 text-primary mb-3"></i>
                  <h4>Sicurezza</h4>
                  <p className="text-muted">
                    I tuoi dati sono protetti con i più alti standard di sicurezza
                  </p>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card h-100 border-0 shadow-sm">
                <div className="card-body text-center p-4">
                  <i className="bi bi-graph-up-arrow display-4 text-success mb-3"></i>
                  <h4>Precisione</h4>
                  <p className="text-muted">
                    Algoritmi avanzati per analisi accurate e dettagliate
                  </p>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card h-100 border-0 shadow-sm">
                <div className="card-body text-center p-4">
                  <i className="bi bi-people display-4 text-info mb-3"></i>
                  <h4>Supporto</h4>
                  <p className="text-muted">
                    Team dedicato per assistenza e aggiornamenti continui
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-light rounded p-5 text-center">
            <h3 className="mb-4">Il Nostro Impegno</h3>
            <p className="lead mb-4">
              Ci impegniamo a fornire strumenti che rispettino i più alti standard 
              etici e professionali nel campo della psicologia.
            </p>
            <div className="row g-4 text-start">
              <div className="col-md-6">
                <div className="d-flex">
                  <i className="bi bi-check-circle text-success fs-4 me-3"></i>
                  <div>
                    <h5>Conformità GDPR</h5>
                    <p className="text-muted mb-0">
                      Piena conformità alle normative sulla privacy
                    </p>
                  </div>
                </div>
              </div>
              <div className="col-md-6">
                <div className="d-flex">
                  <i className="bi bi-check-circle text-success fs-4 me-3"></i>
                  <div>
                    <h5>Test Validati</h5>
                    <p className="text-muted mb-0">
                      Solo strumenti con validazione scientifica
                    </p>
                  </div>
                </div>
              </div>
              <div className="col-md-6">
                <div className="d-flex">
                  <i className="bi bi-check-circle text-success fs-4 me-3"></i>
                  <div>
                    <h5>Aggiornamenti Costanti</h5>
                    <p className="text-muted mb-0">
                      Piattaforma sempre aggiornata con le ultime ricerche
                    </p>
                  </div>
                </div>
              </div>
              <div className="col-md-6">
                <div className="d-flex">
                  <i className="bi bi-check-circle text-success fs-4 me-3"></i>
                  <div>
                    <h5>Formazione Continua</h5>
                    <p className="text-muted mb-0">
                      Risorse e guide per l'uso ottimale degli strumenti
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center mt-5">
            <h3>Hai domande?</h3>
            <p className="lead mb-4">
              Siamo qui per aiutarti a ottenere il massimo dalla nostra piattaforma
            </p>
            <a href="mailto:info@psychassess.com" className="btn btn-primary btn-lg">
              <i className="bi bi-envelope me-2"></i>
              Contattaci
            </a>
          </div>
        </div>
      </div>
    </div>
  );
} 