export default function PrivacyPage() {
  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-lg-8">
          <h1 className="mb-4">Privacy Policy</h1>
          
          <div className="card border-0 shadow-sm">
            <div className="card-body p-5">
              <p className="text-muted">Ultimo aggiornamento: {new Date().toLocaleDateString('it-IT')}</p>
              
              <h2 className="h4 mt-4 mb-3">1. Informazioni che raccogliamo</h2>
              <p>
                Raccogliamo solo le informazioni necessarie per fornire i nostri servizi:
              </p>
              <ul>
                <li>Nome e cognome</li>
                <li>Indirizzo email</li>
                <li>Dati dei test psicologici completati</li>
                <li>Report generati</li>
              </ul>
              
              <h2 className="h4 mt-4 mb-3">2. Come utilizziamo le informazioni</h2>
              <p>
                Le informazioni raccolte vengono utilizzate esclusivamente per:
              </p>
              <ul>
                <li>Fornire accesso alla piattaforma</li>
                <li>Salvare i risultati dei test</li>
                <li>Generare report personalizzati</li>
                <li>Migliorare i nostri servizi</li>
              </ul>
              
              <h2 className="h4 mt-4 mb-3">3. Protezione dei dati</h2>
              <p>
                Implementiamo misure di sicurezza tecniche e organizzative per proteggere i tuoi dati:
              </p>
              <ul>
                <li>Crittografia dei dati sensibili</li>
                <li>Accesso limitato ai dati personali</li>
                <li>Monitoraggio continuo della sicurezza</li>
                <li>Conformità GDPR</li>
              </ul>
              
              <h2 className="h4 mt-4 mb-3">4. I tuoi diritti</h2>
              <p>
                Hai il diritto di:
              </p>
              <ul>
                <li>Accedere ai tuoi dati personali</li>
                <li>Richiedere la correzione dei dati</li>
                <li>Richiedere la cancellazione dei dati</li>
                <li>Opporti al trattamento</li>
                <li>Richiedere la portabilità dei dati</li>
              </ul>
              
              <h2 className="h4 mt-4 mb-3">5. Contatti</h2>
              <p>
                Per qualsiasi domanda sulla privacy, contattaci a:
                <br />
                <strong>Email:</strong> privacy@psychassess.com
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 