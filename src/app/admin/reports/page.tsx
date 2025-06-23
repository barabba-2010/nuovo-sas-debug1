'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Link from 'next/link';

interface Report {
  id: string;
  title: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    organizationMemberships: Array<{
      organization: {
        id: string;
        name: string;
      };
      team?: {
        id: string;
        name: string;
      };
    }>;
  };
}

export default function AdminReportsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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
      fetchReports();
    }
  }, [status, session, router]);

  const fetchReports = async () => {
    try {
      const response = await axios.get('/api/admin/reports');
      setReports(response.data.reports);
      setIsLoading(false);
    } catch (error) {
      console.error('Errore nel caricamento dei report:', error);
      setError('Errore nel caricamento dei report');
      setIsLoading(false);
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
          <li className="breadcrumb-item active">Report</li>
        </ol>
      </nav>

      <div className="row mb-4">
        <div className="col">
          <h1 className="h2">Tutti i Report</h1>
          <p className="text-muted">Totale report: {reports.length}</p>
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
                  <th>Test</th>
                  <th>Utente</th>
                  <th>Email</th>
                  <th>Organizzazione</th>
                  <th>Team</th>
                  <th>Data</th>
                  <th>Azioni</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => (
                  <tr key={report.id}>
                    <td>{report.title}</td>
                    <td>{report.user.name || '-'}</td>
                    <td>{report.user.email}</td>
                    <td>
                      {report.user.organizationMemberships.length > 0 ? (
                        report.user.organizationMemberships[0].organization.name
                      ) : (
                        <span className="text-muted">-</span>
                      )}
                    </td>
                    <td>
                      {report.user.organizationMemberships.length > 0 && report.user.organizationMemberships[0].team ? (
                        report.user.organizationMemberships[0].team.name
                      ) : (
                        <span className="text-muted">-</span>
                      )}
                    </td>
                    <td>{new Date(report.createdAt).toLocaleDateString('it-IT')}</td>
                    <td>
                      <Link 
                        href={`/reports/${report.id}`}
                        className="btn btn-sm btn-outline-primary"
                      >
                        <i className="bi bi-eye"></i> Visualizza
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {reports.length === 0 && (
              <div className="text-center py-5 text-muted">
                <i className="bi bi-file-earmark-text fs-1 d-block mb-3"></i>
                <p>Nessun report presente</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 