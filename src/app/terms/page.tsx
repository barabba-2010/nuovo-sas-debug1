export default function TermsPage() {
  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-lg-8">
          <h1 className="mb-4">Termini di Servizio</h1>
          
          <div className="card border-0 shadow-sm">
            <div className="card-body p-5">
              <p className="text-muted">Ultimo aggiornamento: {new Date().toLocaleDateString('it-IT')}</p>
              
              <h2 className="h4 mt-4 mb-3">1. Accettazione dei Termini</h2>
              <p>
                Utilizzando PsychAssess, accetti di essere vincolato da questi Termini di Servizio. 
                Se non accetti questi termini, non utilizzare la piattaforma.
              </p>
              
              <h2 className="h4 mt-4 mb-3">2. Descrizione del Servizio</h2>
              <p>
                PsychAssess è una piattaforma professionale per la somministrazione e analisi di test psicologici. 
                Il servizio include:
              </p>
              <ul>
                <li>Accesso a test psicologici validati</li>
                <li>Generazione di report dettagliati</li>
                <li>Archiviazione sicura dei risultati</li>
                <li>Strumenti di analisi avanzati</li>
              </ul>
              
              <h2 className="h4 mt-4 mb-3">3. Uso Appropriato</h2>
              <p>
                Ti impegni a utilizzare la piattaforma solo per scopi legittimi e professionali:
              </p>
              <ul>
                <li>Non utilizzare il servizio per scopi illegali</li>
                <li>Non tentare di accedere a dati di altri utenti</li>
                <li>Non interferire con il funzionamento della piattaforma</li>
                <li>Rispettare la privacy e i diritti degli altri utenti</li>
              </ul>
              
              <h2 className="h4 mt-4 mb-3">4. Account Utente</h2>
              <p>
                Sei responsabile per:
              </p>
              <ul>
                <li>Mantenere la riservatezza delle tue credenziali</li>
                <li>Tutte le attività che avvengono sotto il tuo account</li>
                <li>Notificarci immediatamente di qualsiasi uso non autorizzato</li>
              </ul>
              
              <h2 className="h4 mt-4 mb-3">5. Proprietà Intellettuale</h2>
              <p>
                Tutti i contenuti della piattaforma sono protetti da copyright. 
                Non puoi riprodurre, distribuire o creare opere derivate senza autorizzazione.
              </p>
              
              <h2 className="h4 mt-4 mb-3">6. Limitazione di Responsabilità</h2>
              <p>
                PsychAssess è fornito "così com'è". Non garantiamo che il servizio sarà sempre disponibile 
                o privo di errori. La nostra responsabilità è limitata nei termini consentiti dalla legge.
              </p>
              
              <h2 className="h4 mt-4 mb-3">7. Modifiche ai Termini</h2>
              <p>
                Ci riserviamo il diritto di modificare questi termini in qualsiasi momento. 
                Le modifiche saranno effettive immediatamente dopo la pubblicazione.
              </p>
              
              <h2 className="h4 mt-4 mb-3">8. Contatti</h2>
              <p>
                Per domande sui Termini di Servizio:
                <br />
                <strong>Email:</strong> legal@psychassess.com
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 