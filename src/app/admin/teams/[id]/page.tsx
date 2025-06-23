'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import axios from 'axios';
import Link from 'next/link';

interface TeamMember {
  id: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  joinedAt: string;
}

interface AvailableMember {
  id: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

interface Team {
  id: string;
  name: string;
  organization: {
    id: string;
    name: string;
    code: string;
  };
  manager?: {
    id: string;
    name: string;
    email: string;
  };
  members: TeamMember[];
  createdAt: string;
}

export default function TeamDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const [team, setTeam] = useState<Team | null>(null);
  const [availableMembers, setAvailableMembers] = useState<AvailableMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showChangeManagerModal, setShowChangeManagerModal] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [selectedManagerId, setSelectedManagerId] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
      return;
    }

    if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
      router.push('/');
      return;
    }

    if (status === 'authenticated' && session?.user?.role === 'ADMIN' && params.id) {
      fetchTeam();
    }
  }, [status, session, router, params.id]);

  const fetchTeam = async () => {
    try {
      const response = await axios.get(`/api/admin/teams/${params.id}`);
      setTeam(response.data.team);
      
      // Fetch available members from the same organization
      const orgResponse = await axios.get(`/api/admin/organizations/${response.data.team.organization.id}`);
      const orgMembers = orgResponse.data.organization.members;
      
      // Filter out members already in the team
      const teamMemberIds = response.data.team.members.map((m: TeamMember) => m.user.id);
      const available = orgMembers.filter((m: AvailableMember) => 
        !teamMemberIds.includes(m.user.id) && m.user.id !== response.data.team.manager?.id
      );
      setAvailableMembers(available);
      
      setIsLoading(false);
    } catch (error) {
      console.error('Errore nel caricamento del team:', error);
      setError('Errore nel caricamento del team');
      setIsLoading(false);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await axios.post(`/api/admin/teams/${params.id}/members`, {
        memberId: selectedMemberId
      });
      setShowAddMemberModal(false);
      setSelectedMemberId('');
      fetchTeam();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Errore nell\'aggiunta del membro');
    }
  };

  const handleChangeManager = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await axios.patch(`/api/admin/teams/${params.id}`, {
        managerId: selectedManagerId
      });
      setShowChangeManagerModal(false);
      setSelectedManagerId('');
      fetchTeam();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Errore nel cambio del manager');
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Sei sicuro di voler rimuovere questo membro dal team?')) {
      return;
    }

    try {
      await axios.delete(`/api/admin/teams/${params.id}/members/${memberId}`);
      fetchTeam(); // Ricarica i dati
    } catch (error) {
      console.error('Errore nella rimozione del membro:', error);
      setError('Errore nella rimozione del membro');
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

  if (!team) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger">
          Team non trovato
        </div>
        <Link href="/admin/teams" className="btn btn-primary">
          Torna ai Team
        </Link>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <nav aria-label="breadcrumb">
        <ol className="breadcrumb">
          <li className="breadcrumb-item"><Link href="/admin">Admin</Link></li>
          <li className="breadcrumb-item"><Link href="/admin/teams">Team</Link></li>
          <li className="breadcrumb-item active">{team.name}</li>
        </ol>
      </nav>

      <div className="row mb-4">
        <div className="col">
          <h1 className="h2">{team.name}</h1>
          <p className="text-muted">
            Organizzazione: {team.organization.name} ({team.organization.code})
          </p>
        </div>
        <div className="col-auto">
          <Link 
            href={`/admin/organizations/${team.organization.id}`}
            className="btn btn-outline-primary me-2"
          >
            <i className="bi bi-building me-2"></i>
            Vai all'Organizzazione
          </Link>
          <button 
            className="btn btn-primary"
            onClick={() => setShowAddMemberModal(true)}
            disabled={availableMembers.length === 0}
          >
            <i className="bi bi-person-plus me-2"></i>
            Aggiungi Membro
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          {error}
          <button type="button" className="btn-close" onClick={() => setError('')}></button>
        </div>
      )}

      {/* Informazioni Team */}
      <div className="card mb-4">
        <div className="card-header">
          <h5 className="mb-0">Informazioni Team</h5>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-6">
              <p><strong>Nome:</strong> {team.name}</p>
              <p><strong>Creato il:</strong> {new Date(team.createdAt).toLocaleDateString('it-IT')}</p>
            </div>
            <div className="col-md-6">
              <p><strong>Manager:</strong> {team.manager ? (
                <>
                  {team.manager.name} ({team.manager.email})
                  <button 
                    className="btn btn-sm btn-outline-primary ms-2"
                    onClick={() => setShowChangeManagerModal(true)}
                  >
                    <i className="bi bi-pencil"></i> Cambia
                  </button>
                </>
              ) : (
                <>
                  <span className="text-muted">Nessun manager assegnato</span>
                  <button 
                    className="btn btn-sm btn-outline-primary ms-2"
                    onClick={() => setShowChangeManagerModal(true)}
                  >
                    <i className="bi bi-plus"></i> Assegna
                  </button>
                </>
              )}</p>
              <p><strong>Membri totali:</strong> {team.members.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Membri del Team */}
      <div className="card">
        <div className="card-header">
          <h5 className="mb-0">Membri del Team</h5>
        </div>
        <div className="card-body">
          {team.members.length > 0 ? (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Email</th>
                    <th>Ruolo</th>
                    <th>Data ingresso</th>
                    <th>Azioni</th>
                  </tr>
                </thead>
                <tbody>
                  {team.members.map((member) => (
                    <tr key={member.id}>
                      <td>{member.user.name}</td>
                      <td>{member.user.email}</td>
                      <td>
                        <span className={`badge bg-${member.user.role === 'MANAGER' ? 'warning' : 'primary'}`}>
                          {member.user.role}
                        </span>
                      </td>
                      <td>{new Date(member.joinedAt).toLocaleDateString('it-IT')}</td>
                      <td>
                        <button 
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleRemoveMember(member.id)}
                        >
                          <i className="bi bi-x-circle"></i> Rimuovi
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-people fs-1 d-block mb-3"></i>
              <p>Nessun membro in questo team</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal Aggiungi Membro */}
      {showAddMemberModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Aggiungi Membro al Team</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowAddMemberModal(false)}
                ></button>
              </div>
              <form onSubmit={handleAddMember}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Seleziona Membro</label>
                    <select
                      className="form-select"
                      value={selectedMemberId}
                      onChange={(e) => setSelectedMemberId(e.target.value)}
                      required
                    >
                      <option value="">-- Seleziona un membro --</option>
                      {availableMembers.map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.user.name} ({member.user.email}) - {member.user.role}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={() => setShowAddMemberModal(false)}
                  >
                    Annulla
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Aggiungi al Team
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal Cambia Manager */}
      {showChangeManagerModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {team.manager ? 'Cambia Manager' : 'Assegna Manager'}
                </h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowChangeManagerModal(false)}
                ></button>
              </div>
              <form onSubmit={handleChangeManager}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Seleziona Manager</label>
                    <select
                      className="form-select"
                      value={selectedManagerId}
                      onChange={(e) => setSelectedManagerId(e.target.value)}
                      required
                    >
                      <option value="">-- Seleziona un manager --</option>
                      {/* Mostra tutti i manager dell'organizzazione */}
                      {[...availableMembers, ...team.members]
                        .filter(m => m.user.role === 'MANAGER')
                        .map((member) => (
                          <option key={member.user.id} value={member.user.id}>
                            {member.user.name} ({member.user.email})
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={() => setShowChangeManagerModal(false)}
                  >
                    Annulla
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {team.manager ? 'Cambia Manager' : 'Assegna Manager'}
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