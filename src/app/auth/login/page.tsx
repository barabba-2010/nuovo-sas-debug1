'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { signIn, useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [organizationCode, setOrganizationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Gestisce i messaggi dalla query string URL
  useEffect(() => {
    // Se l'utente è già autenticato, reindirizza alla home
    if (status === 'authenticated' && session) {
      console.log('Utente già autenticato, reindirizzo alla home');
      router.push('/');
      return;
    }
    
    // Controlla se c'è un messaggio nella query string
    const registered = searchParams.get('registered');
    if (registered === 'true') {
      setSuccessMessage('Registrazione completata con successo! Ora puoi accedere.');
    }
    
    // Controlla se c'è un errore nella query string
    const errorParam = searchParams.get('error');
    if (errorParam) {
      switch (errorParam) {
        case 'CredentialsSignin':
          setError('Credenziali non valide. Controlla email e password.');
          break;
        case 'SessionRequired':
          setError('Devi effettuare l\'accesso per visualizzare quella pagina.');
          break;
        default:
          setError('Si è verificato un errore durante il login.');
      }
    }
  }, [searchParams, session, status, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset stati
    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    console.log(`Login - tentativo per l'utente: ${email}`);

    try {
      const result = await signIn('credentials', {
        redirect: false,
        email,
        password,
        organizationCode: organizationCode || undefined,
      });

      console.log(`Login - risultato:`, result);

      if (result?.error) {
        console.error(`Login - errore:`, result.error);
        if (result.error === 'InvalidOrganizationCode') {
          setError('Codice azienda non valido.');
        } else if (result.error === 'OrganizationCodeRequired') {
          setError('Il codice azienda è obbligatorio per il tuo account.');
        } else {
          setError('Credenziali non valide. Riprova.');
        }
        setIsLoading(false);
      } else {
        console.log(`Login - successo, reindirizzo alla home`);
        
        // Usa toast per mostrare il successo
        toast.success('Login effettuato con successo!');
        
        // Reindirizza direttamente senza update
        router.push('/');
        router.refresh();
      }
    } catch (error) {
      console.error('Login - errore non gestito:', error);
      setError('Si è verificato un errore durante il login. Riprova.');
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-lg-5 col-md-7 col-sm-9">
          <div className="card shadow-lg border-0 rounded-lg">
            <div className="card-header bg-primary text-white text-center py-4">
              <h3 className="fw-light mb-0">Accedi</h3>
            </div>
            <div className="card-body p-4 p-md-5">
              {/* Messaggio di successo */}
              {successMessage && (
                <div className="alert alert-success" role="alert">
                  <i className="bi bi-check-circle-fill me-2"></i>
                  {successMessage}
                </div>
              )}
              
              {/* Messaggio di errore */}
              {error && (
                <div className="alert alert-danger" role="alert">
                  <i className="bi bi-exclamation-triangle-fill me-2"></i>
                  {error}
                </div>
              )}
              
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="email" className="form-label">Email</label>
                  <div className="input-group">
                    <span className="input-group-text">
                      <i className="bi bi-envelope"></i>
                    </span>
                    <input
                      type="email"
                      className="form-control"
                      id="email"
                      placeholder="nome@azienda.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>
                
                <div className="mb-3">
                  <label htmlFor="password" className="form-label">Password</label>
                  <div className="input-group">
                    <span className="input-group-text">
                      <i className="bi bi-lock"></i>
                    </span>
                    <input
                      type={showPassword ? "text" : "password"}
                      className="form-control"
                      id="password"
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                    <button 
                      className="btn btn-outline-secondary" 
                      type="button"
                      onClick={togglePasswordVisibility}
                      tabIndex={-1}
                    >
                      <i className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"}`}></i>
                    </button>
                  </div>
                </div>

                <div className="mb-4">
                  <label htmlFor="organizationCode" className="form-label">
                    Codice Azienda
                  </label>
                  <div className="input-group">
                    <span className="input-group-text">
                      <i className="bi bi-building"></i>
                    </span>
                    <input
                      type="text"
                      className="form-control"
                      id="organizationCode"
                      placeholder="Inserisci il codice della tua azienda"
                      value={organizationCode}
                      onChange={(e) => setOrganizationCode(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                  <small className="text-muted">
                    Obbligatorio per dipendenti e manager. Gli admin possono lasciarlo vuoto.
                  </small>
                </div>
                
                <div className="d-grid">
                  <button 
                    type="submit" 
                    className="btn btn-primary btn-lg"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Accesso in corso...
                      </>
                    ) : (
                      'Accedi'
                    )}
                  </button>
                </div>
              </form>
            </div>
            <div className="card-footer text-center py-3">
              <div className="mb-2">
                <Link href="/auth/register" className="text-decoration-none">
                  Sei un dipendente? <span className="text-primary">Registrati</span>
                </Link>
              </div>
              <div>
                <Link href="/auth/forgot-password" className="text-decoration-none small">
                  Password dimenticata?
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 