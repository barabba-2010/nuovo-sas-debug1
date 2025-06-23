'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const [errorMessage, setErrorMessage] = useState('Si è verificato un errore durante l\'autenticazione');
  
  useEffect(() => {
    const error = searchParams.get('error');
    
    if (error) {
      switch (error) {
        case 'CredentialsSignin':
          setErrorMessage('Credenziali non valide. Verifica email e password.');
          break;
        case 'AccessDenied':
          setErrorMessage('Accesso negato. Non hai i permessi necessari.');
          break;
        case 'OAuthSignin':
        case 'OAuthCallback':
        case 'OAuthCreateAccount':
        case 'EmailCreateAccount':
        case 'Callback':
          setErrorMessage('Si è verificato un errore con il provider di autenticazione.');
          break;
        case 'OAuthAccountNotLinked':
          setErrorMessage('L\'account è già associato a un altro indirizzo email.');
          break;
        case 'EmailSignin':
          setErrorMessage('Si è verificato un errore nell\'invio dell\'email di accesso.');
          break;
        case 'SessionRequired':
          setErrorMessage('Accesso richiesto. Effettua il login per continuare.');
          break;
        default:
          setErrorMessage('Si è verificato un errore durante l\'autenticazione.');
      }
    }
  }, [searchParams]);
  
  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-lg-6 col-md-8">
          <div className="card border-0 shadow-lg">
            <div className="card-header bg-danger text-white text-center py-4">
              <h3 className="fw-light mb-0">Errore di Autenticazione</h3>
            </div>
            <div className="card-body p-5 text-center">
              <div className="mb-4">
                <i className="bi bi-exclamation-triangle-fill text-danger" style={{ fontSize: '4rem' }}></i>
              </div>
              <h4 className="mb-4">{errorMessage}</h4>
              <p className="mb-4">
                Puoi provare a effettuare nuovamente l'accesso o contattare il supporto se il problema persiste.
              </p>
              <div className="d-grid gap-3 col-lg-6 col-md-8 mx-auto">
                <Link href="/auth/login" className="btn btn-primary btn-lg">
                  <i className="bi bi-box-arrow-in-right me-2"></i>
                  Torna al login
                </Link>
                <Link href="/" className="btn btn-outline-secondary">
                  <i className="bi bi-house-door me-2"></i>
                  Torna alla Home
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 