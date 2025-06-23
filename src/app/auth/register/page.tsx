'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession, signIn } from 'next-auth/react';
import axios from 'axios';

export default function RegisterPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    organizationCode: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Se l'utente è già autenticato, reindirizza alla home
  useEffect(() => {
    if (status === 'authenticated' && session) {
      console.log('Registrazione - utente già autenticato, reindirizza alla home');
      router.push('/');
    }
  }, [session, status, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    console.log('Registrazione - tentativo con:', { 
      name: formData.name, 
      email: formData.email, 
      organizationCode: formData.organizationCode,
      passwordLength: formData.password.length 
    });

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Le password non corrispondono');
      setIsLoading(false);
      return;
    }

    try {
      // Call your registration API endpoint
      console.log('Registrazione - chiamata API in corso...');
      const response = await axios.post('/api/auth/register', {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        organizationCode: formData.organizationCode
      });
      
      console.log('Registrazione - risposta API:', response.status, response.data);

      // Login automatico dopo la registrazione
      console.log('Registrazione - completata, login automatico...');
      const signInResult = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        organizationCode: formData.organizationCode,
        redirect: false
      });

      if (signInResult?.ok) {
        console.log('Login automatico riuscito, redirect a selezione team...');
        router.push('/auth/select-team');
      } else {
        console.log('Login automatico fallito:', signInResult?.error);
        // Se il login automatico fallisce, reindirizza comunque alla pagina di login
        router.push('/auth/login?registered=true');
      }
    } catch (error: any) {
      console.error('Registrazione - errore:', error);
      
      // Gestione dettagliata degli errori
      if (error.response) {
        console.error('Registrazione - dettagli errore:', {
          status: error.response.status,
          data: error.response.data
        });
        
        // Gestione specifica dei codici di errore
        if (error.response.status === 409) {
          setError('Email già registrata. Usa un altro indirizzo email o accedi.');
        } else if (error.response.status === 404) {
          setError('Codice azienda non valido. Verifica il codice fornito dalla tua azienda.');
        } else {
          setError(error.response.data?.message || 'Si è verificato un errore durante la registrazione');
        }
      } else if (error.request) {
        console.error('Registrazione - nessuna risposta ricevuta');
        setError('Nessuna risposta dal server. Verifica la tua connessione.');
      } else {
        console.error('Registrazione - errore di configurazione:', error.message);
        setError(`Errore: ${error.message}`);
      }
      
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  // Se l'utente è già autenticato, mostra un messaggio appropriato
  if (status === 'authenticated' && session) {
    return (
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-lg-6 col-md-8">
            <div className="card shadow-lg border-0 rounded-lg">
              <div className="card-body p-5 text-center">
                <i className="bi bi-check-circle text-success fs-1 mb-3"></i>
                <h3>Sei già registrato</h3>
                <p className="mb-4">Hai già effettuato l'accesso come {session.user?.email}</p>
                <Link href="/" className="btn btn-primary">
                  <i className="bi bi-house-door me-2"></i>
                  Vai alla Home
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-lg-6 col-md-8">
          <div className="card shadow-lg border-0 rounded-lg">
            <div className="card-header bg-primary text-white text-center py-4">
              <h3 className="fw-light mb-0">Registrazione Dipendente</h3>
            </div>
            <div className="card-body p-4 p-md-5">
              {error && (
                <div className="alert alert-danger" role="alert">
                  <i className="bi bi-exclamation-triangle-fill me-2"></i>
                  {error}
                </div>
              )}
              
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="organizationCode" className="form-label">Codice Azienda</label>
                  <div className="input-group">
                    <span className="input-group-text">
                      <i className="bi bi-building"></i>
                    </span>
                    <input
                      type="text"
                      className="form-control"
                      id="organizationCode"
                      name="organizationCode"
                      placeholder="Inserisci il codice fornito dalla tua azienda"
                      value={formData.organizationCode}
                      onChange={handleChange}
                      required
                      disabled={isLoading}
                    />
                  </div>
                  <small className="text-muted">
                    Il codice azienda ti è stato fornito dal tuo responsabile HR
                  </small>
                </div>

                <div className="mb-3">
                  <label htmlFor="name" className="form-label">Nome completo</label>
                  <div className="input-group">
                    <span className="input-group-text">
                      <i className="bi bi-person"></i>
                    </span>
                    <input
                      type="text"
                      className="form-control"
                      id="name"
                      name="name"
                      placeholder="Nome e cognome"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>
                
                <div className="mb-3">
                  <label htmlFor="email" className="form-label">Email aziendale</label>
                  <div className="input-group">
                    <span className="input-group-text">
                      <i className="bi bi-envelope"></i>
                    </span>
                    <input
                      type="email"
                      className="form-control"
                      id="email"
                      name="email"
                      placeholder="nome@azienda.com"
                      value={formData.email}
                      onChange={handleChange}
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
                      name="password"
                      placeholder="Inserisci una password sicura"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      minLength={8}
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
                  <small className="text-muted">
                    Utilizza almeno 8 caratteri
                  </small>
                </div>
                
                <div className="mb-4">
                  <label htmlFor="confirmPassword" className="form-label">Conferma Password</label>
                  <div className="input-group">
                    <span className="input-group-text">
                      <i className="bi bi-shield-lock"></i>
                    </span>
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      className="form-control"
                      id="confirmPassword"
                      name="confirmPassword"
                      placeholder="Conferma la tua password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                      disabled={isLoading}
                    />
                    <button 
                      className="btn btn-outline-secondary" 
                      type="button"
                      onClick={toggleConfirmPasswordVisibility}
                      tabIndex={-1}
                    >
                      <i className={`bi ${showConfirmPassword ? "bi-eye-slash" : "bi-eye"}`}></i>
                    </button>
                  </div>
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
                        Registrazione in corso...
                      </>
                    ) : (
                      'Registrati'
                    )}
                  </button>
                </div>
              </form>
            </div>
            <div className="card-footer text-center py-3">
              <div className="mb-2">
                <Link href="/auth/login" className="text-decoration-none">
                  Hai già un account? <span className="text-primary">Accedi</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 