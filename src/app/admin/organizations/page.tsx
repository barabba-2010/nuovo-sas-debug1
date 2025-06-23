'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Link from 'next/link';

interface Organization {
  id: string;
  name: string;
  code: string;
  createdAt: string;
  _count: {
    teams: number;
    members: number;
  };
}

export default function OrganizationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newOrg, setNewOrg] = useState({ name: '', code: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
      return;
    }

    if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
      router.push('/');
      return;
    }

    if (status === 'authenticated' && session?.user?.role === 'ADMIN') {
      fetchOrganizations();
    }
  }, [status, session, router]);

  const fetchOrganizations = async () => {
    try {
      const response = await axios.get('/api/admin/organizations');
      setOrganizations(response.data.organizations);
      setIsLoading(false);
    } catch (error) {
      console.error('Errore nel caricamento delle organizzazioni:', error);
      setError('Errore nel caricamento delle organizzazioni');
      setIsLoading(false);
    }
  };

  const generateCode = () => {
    const prefix = newOrg.name.substring(0, 3).toUpperCase() || 'ORG';
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    setNewOrg({ ...newOrg, code: `${prefix}${random}` });
  };

  const handleCreateOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await axios.post('/api/admin/organizations', newOrg);
      setShowCreateModal(false);
      setNewOrg({ name: '', code: '' });
      fetchOrganizations();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Errore nella creazione dell\'organizzazione');
    }
  };

  const handleDeleteOrganization = async (id: string) => {
    if (!confirm('Sei sicuro di voler eliminare questa organizzazione? Questa azione non può essere annullata.')) {
      return;
    }
    
    try {
      await axios.delete(`/api/admin/organizations/${id}`);
      fetchOrganizations();
    } catch (error: any) {
      console.error('Errore nell\'eliminazione dell\'organizzazione:', error);
      setError(error.response?.data?.message || 'Errore nell\'eliminazione dell\'organizzazione');
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="container py-5">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Caricamento...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <nav aria-label="breadcrumb">
        <ol className="breadcrumb">
          <li className="breadcrumb-item"><Link href="/admin">Admin</Link></li>
          <li className="breadcrumb-item active">Organizzazioni</li>
        </ol>
      </nav>

      <div className="row mb-4">
        <div className="col">
          <h1 className="h2">Gestione Organizzazioni</h1>
        </div>
        <div className="col-auto">
          <button 
            className="btn btn-primary"
            onClick={() => setShowCreateModal(true)}
          >
            <i className="bi bi-plus-circle me-2"></i>
            Nuova Organizzazione
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          {error}
          <button type="button" className="btn-close" onClick={() => setError('')}></button>
        </div>
      )}

      <div className="card">
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Codice</th>
                  <th>Team</th>
                  <th>Membri</th>
                  <th>Creata il</th>
                  <th>Azioni</th>
                </tr>
              </thead>
              <tbody>
                {organizations.map((org) => (
                  <tr key={org.id}>
                    <td className="fw-semibold">{org.name}</td>
                    <td>
                      <code className="bg-light p-1 rounded">{org.code}</code>
                    </td>
                    <td>{org._count.teams}</td>
                    <td>{org._count.members}</td>
                    <td>{new Date(org.createdAt).toLocaleDateString('it-IT')}</td>
                    <td>
                      <Link 
                        href={`/admin/organizations/${org.id}`}
                        className="btn btn-sm btn-outline-primary me-2"
                      >
                        <i className="bi bi-eye"></i> Dettagli
                      </Link>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleDeleteOrganization(org.id)}
                        disabled={org._count.members > 0}
                        title={org._count.members > 0 ? 'Non puoi eliminare un\'organizzazione con membri' : 'Elimina organizzazione'}
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {organizations.length === 0 && (
              <div className="text-center py-5 text-muted">
                <i className="bi bi-building fs-1 d-block mb-3"></i>
                <p>Nessuna organizzazione presente</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Creazione Organizzazione */}
      {showCreateModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Nuova Organizzazione</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowCreateModal(false)}
                ></button>
              </div>
              <form onSubmit={handleCreateOrganization}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Nome Organizzazione</label>
                    <input
                      type="text"
                      className="form-control"
                      value={newOrg.name}
                      onChange={(e) => setNewOrg({ ...newOrg, name: e.target.value })}
                      placeholder="Es. Tech Solutions Srl"
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Codice Azienda</label>
                    <div className="input-group">
                      <input
                        type="text"
                        className="form-control"
                        value={newOrg.code}
                        onChange={(e) => setNewOrg({ ...newOrg, code: e.target.value.toUpperCase() })}
                        placeholder="Es. TECH001"
                        required
                      />
                      <button 
                        type="button" 
                        className="btn btn-outline-secondary"
                        onClick={generateCode}
                      >
                        <i className="bi bi-arrow-clockwise"></i> Genera
                      </button>
                    </div>
                    <small className="text-muted">
                      Il codice sarà utilizzato dai dipendenti per registrarsi
                    </small>
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={() => setShowCreateModal(false)}
                  >
                    Annulla
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Crea Organizzazione
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 