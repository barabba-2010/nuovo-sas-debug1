'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import axios from 'axios';
import Link from 'next/link';

interface Organization {
  id: string;
  name: string;
  code: string;
  teams: Team[];
  members: Member[];
}

interface Team {
  id: string;
  name: string;
  manager?: {
    id: string;
    name: string;
    email: string;
  };
  _count: {
    members: number;
  };
}

interface Member {
  id: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  team?: {
    id: string;
    name: string;
  };
}

export default function OrganizationDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateTeamModal, setShowCreateTeamModal] = useState(false);
  const [showCreateManagerModal, setShowCreateManagerModal] = useState(false);
  const [showEditTeamModal, setShowEditTeamModal] = useState(false);
  const [showEditOrgModal, setShowEditOrgModal] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [newTeam, setNewTeam] = useState({ name: '', managerId: '' });
  const [newManager, setNewManager] = useState({ name: '', email: '', password: '' });
  const [editOrg, setEditOrg] = useState({ name: '', code: '' });
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
      fetchOrganization();
    }
  }, [status, session, router, params.id]);

  const fetchOrganization = async () => {
    try {
      const response = await axios.get(`/api/admin/organizations/${params.id}`);
      setOrganization(response.data.organization);
      setIsLoading(false);
    } catch (error) {
      console.error('Errore nel caricamento dell\'organizzazione:', error);
      setError('Errore nel caricamento dell\'organizzazione');
      setIsLoading(false);
    }
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await axios.post(`/api/admin/organizations/${params.id}/teams`, newTeam);
      setShowCreateTeamModal(false);
      setNewTeam({ name: '', managerId: '' });
      fetchOrganization();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Errore nella creazione del team');
    }
  };

  const handleCreateManager = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await axios.post(`/api/admin/organizations/${params.id}/managers`, {
        ...newManager,
        organizationCode: organization?.code
      });
      setShowCreateManagerModal(false);
      setNewManager({ name: '', email: '', password: '' });
      fetchOrganization();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Errore nella creazione del manager');
    }
  };

  const handlePromoteToManager = async (userId: string) => {
    try {
      await axios.patch(`/api/admin/users/${userId}/promote`, {
        role: 'MANAGER'
      });
      fetchOrganization();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Errore nella promozione a manager');
    }
  };

  const handleDeleteTeam = async (teamId: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo team? I membri verranno spostati fuori dal team.')) {
      return;
    }
    
    try {
      await axios.delete(`/api/admin/teams/${teamId}`);
      fetchOrganization();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Errore nell\'eliminazione del team');
    }
  };

  const handleEditTeam = (team: Team) => {
    setEditingTeam(team);
    setNewTeam({ name: team.name, managerId: team.manager?.id || '' });
    setShowEditTeamModal(true);
  };

  const handleUpdateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeam) return;
    
    try {
      await axios.patch(`/api/admin/teams/${editingTeam.id}`, newTeam);
      setShowEditTeamModal(false);
      setEditingTeam(null);
      setNewTeam({ name: '', managerId: '' });
      fetchOrganization();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Errore nell\'aggiornamento del team');
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Sei sicuro di voler rimuovere questo membro dall\'organizzazione?')) {
      return;
    }
    
    try {
      await axios.delete(`/api/admin/organizations/${params.id}/members/${memberId}`);
      fetchOrganization();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Errore nella rimozione del membro');
    }
  };

  const handleEditOrganization = () => {
    if (organization) {
      setEditOrg({ name: organization.name, code: organization.code });
      setShowEditOrgModal(true);
    }
  };

  const handleUpdateOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await axios.patch(`/api/admin/organizations/${params.id}`, editOrg);
      setShowEditOrgModal(false);
      fetchOrganization();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Errore nell\'aggiornamento dell\'organizzazione');
    }
  };

  if (status === 'loading' || isLoading || !organization) {
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
          <li className="breadcrumb-item"><Link href="/admin/organizations">Organizzazioni</Link></li>
          <li className="breadcrumb-item active">{organization.name}</li>
        </ol>
      </nav>

      <div className="row mb-4">
        <div className="col">
          <h1 className="h2">{organization.name}</h1>
          <p className="text-muted">Codice: <code>{organization.code}</code></p>
        </div>
        <div className="col-auto">
          <button 
            className="btn btn-outline-primary"
            onClick={handleEditOrganization}
          >
            <i className="bi bi-pencil me-2"></i>
            Modifica Organizzazione
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          {error}
          <button type="button" className="btn-close" onClick={() => setError('')}></button>
        </div>
      )}

      {/* Sezione Team */}
      <div className="card mb-4">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Team</h5>
          <button 
            className="btn btn-sm btn-primary"
            onClick={() => setShowCreateTeamModal(true)}
          >
            <i className="bi bi-plus-circle me-2"></i>
            Nuovo Team
          </button>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>Nome Team</th>
                  <th>Manager</th>
                  <th>Membri</th>
                  <th>Azioni</th>
                </tr>
              </thead>
              <tbody>
                {organization.teams.map((team) => (
                  <tr key={team.id}>
                    <td>{team.name}</td>
                    <td>
                      {team.manager ? (
                        <span>{team.manager.name} ({team.manager.email})</span>
                      ) : (
                        <span className="text-muted">Nessun manager</span>
                      )}
                    </td>
                    <td>{team._count.members}</td>
                    <td>
                      <Link 
                        href={`/admin/teams/${team.id}`}
                        className="btn btn-sm btn-outline-primary"
                      >
                        <i className="bi bi-eye"></i> Dettagli
                      </Link>
                      <button 
                        className="btn btn-sm btn-outline-danger ms-2"
                        onClick={() => handleDeleteTeam(team.id)}
                      >
                        <i className="bi bi-trash"></i> Elimina
                      </button>
                      <button 
                        className="btn btn-sm btn-outline-warning ms-2"
                        onClick={() => handleEditTeam(team)}
                      >
                        <i className="bi bi-pencil"></i> Modifica
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {organization.teams.length === 0 && (
              <div className="text-center py-3 text-muted">
                Nessun team presente
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sezione Membri */}
      <div className="card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Membri</h5>
          <button 
            className="btn btn-sm btn-primary"
            onClick={() => setShowCreateManagerModal(true)}
          >
            <i className="bi bi-plus-circle me-2"></i>
            Nuovo Manager
          </button>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Email</th>
                  <th>Ruolo</th>
                  <th>Team</th>
                  <th>Azioni</th>
                </tr>
              </thead>
              <tbody>
                {organization.members.map((member) => (
                  <tr key={member.id}>
                    <td>{member.user.name}</td>
                    <td>{member.user.email}</td>
                    <td>
                      <span className={`badge bg-${member.user.role === 'MANAGER' ? 'warning' : 'secondary'}`}>
                        {member.user.role}
                      </span>
                    </td>
                    <td>{member.team?.name || '-'}</td>
                    <td>
                      {member.user.role === 'EMPLOYEE' && (
                        <button 
                          className="btn btn-sm btn-outline-warning me-2"
                          onClick={() => handlePromoteToManager(member.user.id)}
                        >
                          <i className="bi bi-arrow-up"></i> Promuovi a Manager
                        </button>
                      )}
                      <Link 
                        href={`/admin/users/${member.user.id}`}
                        className="btn btn-sm btn-outline-primary"
                      >
                        <i className="bi bi-eye"></i> Dettagli
                      </Link>
                      <button 
                        className="btn btn-sm btn-outline-danger ms-2"
                        onClick={() => handleRemoveMember(member.id)}
                      >
                        <i className="bi bi-trash"></i> Rimuovi
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Creazione Team */}
      {showCreateTeamModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Nuovo Team</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowCreateTeamModal(false)}
                ></button>
              </div>
              <form onSubmit={handleCreateTeam}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Nome Team</label>
                    <input
                      type="text"
                      className="form-control"
                      value={newTeam.name}
                      onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Manager (opzionale)</label>
                    <select
                      className="form-select"
                      value={newTeam.managerId}
                      onChange={(e) => setNewTeam({ ...newTeam, managerId: e.target.value })}
                    >
                      <option value="">-- Seleziona Manager --</option>
                      {organization.members
                        .filter(m => m.user.role === 'MANAGER')
                        .map(m => (
                          <option key={m.user.id} value={m.user.id}>
                            {m.user.name} ({m.user.email})
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={() => setShowCreateTeamModal(false)}
                  >
                    Annulla
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Crea Team
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal Creazione Manager */}
      {showCreateManagerModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Nuovo Manager</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowCreateManagerModal(false)}
                ></button>
              </div>
              <form onSubmit={handleCreateManager}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Nome Completo</label>
                    <input
                      type="text"
                      className="form-control"
                      value={newManager.name}
                      onChange={(e) => setNewManager({ ...newManager, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      className="form-control"
                      value={newManager.email}
                      onChange={(e) => setNewManager({ ...newManager, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Password Temporanea</label>
                    <input
                      type="password"
                      className="form-control"
                      value={newManager.password}
                      onChange={(e) => setNewManager({ ...newManager, password: e.target.value })}
                      required
                      minLength={8}
                    />
                    <small className="text-muted">Il manager dovrà cambiarla al primo accesso</small>
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={() => setShowCreateManagerModal(false)}
                  >
                    Annulla
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Crea Manager
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal Modifica Team */}
      {showEditTeamModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Modifica Team</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowEditTeamModal(false)}
                ></button>
              </div>
              <form onSubmit={handleUpdateTeam}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Nome Team</label>
                    <input
                      type="text"
                      className="form-control"
                      value={newTeam.name}
                      onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Manager (opzionale)</label>
                    <select
                      className="form-select"
                      value={newTeam.managerId}
                      onChange={(e) => setNewTeam({ ...newTeam, managerId: e.target.value })}
                    >
                      <option value="">-- Seleziona Manager --</option>
                      {organization.members
                        .filter(m => m.user.role === 'MANAGER')
                        .map(m => (
                          <option key={m.user.id} value={m.user.id}>
                            {m.user.name} ({m.user.email})
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={() => setShowEditTeamModal(false)}
                  >
                    Annulla
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Aggiorna Team
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal Modifica Organizzazione */}
      {showEditOrgModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Modifica Organizzazione</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowEditOrgModal(false)}
                ></button>
              </div>
              <form onSubmit={handleUpdateOrganization}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Nome</label>
                    <input
                      type="text"
                      className="form-control"
                      value={editOrg.name}
                      onChange={(e) => setEditOrg({ ...editOrg, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Codice</label>
                    <input
                      type="text"
                      className="form-control"
                      value={editOrg.code}
                      onChange={(e) => setEditOrg({ ...editOrg, code: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={() => setShowEditOrgModal(false)}
                  >
                    Annulla
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Aggiorna Organizzazione
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