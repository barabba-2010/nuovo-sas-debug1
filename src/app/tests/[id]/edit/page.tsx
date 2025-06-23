'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';

interface TestData {
  id: string;
  title: string;
  description: string;
  instructions: string;
  category: string;
  type: string;
  timeLimit: number;
  isActive: boolean;
  questions: string;
}

export default function EditTestPage({ params }: { params: Promise<{ id: string }> }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [testId, setTestId] = useState<string>('');
  const [test, setTest] = useState<TestData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    instructions: '',
    category: '',
    timeLimit: 30,
    isActive: true
  });

  useEffect(() => {
    params.then(p => setTestId(p.id));
  }, [params]);

  useEffect(() => {
    if (status === 'loading' || !testId) return;
    
    if (!session || session.user?.role !== 'ADMIN') {
      router.push('/tests');
      return;
    }

    fetchTest();
  }, [session, status, testId]);

  const fetchTest = async () => {
    try {
      const response = await axios.get(`/api/tests/${testId}`);
      setTest(response.data);
      setFormData({
        title: response.data.title,
        description: response.data.description,
        instructions: response.data.instructions,
        category: response.data.category,
        timeLimit: response.data.timeLimit,
        isActive: response.data.isActive
      });
    } catch (error) {
      console.error('Errore nel caricamento del test:', error);
      setError('Impossibile caricare il test');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await axios.patch(`/api/tests/${testId}`, formData);
      
      if (response.data.success) {
        setSuccess('Test aggiornato con successo!');
        setTimeout(() => {
          router.push('/tests');
        }, 1500);
      }
    } catch (error) {
      console.error('Errore nell\'aggiornamento del test:', error);
      setError('Errore nell\'aggiornamento del test');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Caricamento...</span>
        </div>
        <p className="mt-2">Caricamento test...</p>
      </div>
    );
  }

  if (!test) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          Test non trovato
        </div>
        <Link href="/tests" className="btn btn-primary">
          <i className="bi bi-arrow-left me-2"></i>
          Torna ai Test
        </Link>
      </div>
    );
  }

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-primary text-white">
              <h4 className="mb-0">
                <i className="bi bi-pencil-square me-2"></i>
                Modifica Test
              </h4>
            </div>
            <div className="card-body p-4">
              {error && (
                <div className="alert alert-danger alert-dismissible fade show" role="alert">
                  <i className="bi bi-exclamation-triangle-fill me-2"></i>
                  {error}
                  <button type="button" className="btn-close" onClick={() => setError('')}></button>
                </div>
              )}

              {success && (
                <div className="alert alert-success alert-dismissible fade show" role="alert">
                  <i className="bi bi-check-circle-fill me-2"></i>
                  {success}
                  <button type="button" className="btn-close" onClick={() => setSuccess('')}></button>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label">Titolo del Test</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Descrizione</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Istruzioni</label>
                  <textarea
                    className="form-control"
                    rows={4}
                    value={formData.instructions}
                    onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                    required
                  />
                </div>

                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Categoria</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      required
                    />
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label">Tempo Limite (minuti)</label>
                    <input
                      type="number"
                      className="form-control"
                      value={formData.timeLimit}
                      onChange={(e) => setFormData({ ...formData, timeLimit: parseInt(e.target.value) })}
                      min="0"
                      required
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="isActive"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    />
                    <label className="form-check-label" htmlFor="isActive">
                      Test Attivo (visibile agli utenti)
                    </label>
                  </div>
                </div>

                <div className="alert alert-info">
                  <i className="bi bi-info-circle me-2"></i>
                  <strong>Nota:</strong> La modifica delle domande del test non è ancora disponibile in questa interfaccia.
                </div>

                <div className="d-flex justify-content-between">
                  <Link href="/tests" className="btn btn-outline-secondary">
                    <i className="bi bi-arrow-left me-2"></i>
                    Annulla
                  </Link>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Salvataggio...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-save me-2"></i>
                        Salva Modifiche
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 