'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Report {
  id: string;
  title: string;
  userId: string;
  userName: string;
  testName: string;
  createdAt: string;
  updatedAt: string;
  status: 'completed' | 'pending' | 'error';
}

export default function ReportManagementPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [filteredReports, setFilteredReports] = useState<Report[]>([]);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState({ show: false, type: '', message: '' });
  
  // Check for admin access
  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/auth/login');
      return;
    }
    
    if (session.user?.role !== 'ADMIN') {
      router.push('/reports');
      return;
    }
    
    fetchReports();
  }, [session, status, router]);
  
  const fetchReports = async () => {
    setLoading(true);
    try {
      // Simuliamo una chiamata API
      setTimeout(() => {
        // In un'app reale, qui otterresti i dati dal database
        setReports([]);
        setLoading(false);
      }, 500);
    } catch (error) {
      console.error('Error fetching reports:', error);
      setLoading(false);
    }
  };
  
  // Applicazione dei filtri
  useEffect(() => {
    let filtered = [...reports];
    
    // Filtra per stato
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(report => 
        report.status.toLowerCase() === statusFilter.toLowerCase()
      );
    }
    
    // Filtra per termine di ricerca
    if (searchTerm.trim() !== '') {
      filtered = filtered.filter(report => 
        report.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        report.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.testName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredReports(filtered);
  }, [reports, statusFilter, searchTerm]);
  
  // Gestione dei report
  const regenerateReport = async (reportId: string) => {
    try {
      // Simulazione dell'operazione
      setAlertMessage({ 
        show: true, 
        type: 'success', 
        message: 'Report regeneration started. This may take a few moments.' 
      });
      
      // In un'app reale, qui invieresti una richiesta API
      
      // Reset del messaggio dopo 3 secondi
      setTimeout(() => {
        setAlertMessage({ show: false, type: '', message: '' });
      }, 3000);
    } catch (error) {
      setAlertMessage({ 
        show: true, 
        type: 'danger', 
        message: 'Failed to regenerate report. Please try again.' 
      });
    }
  };
  
  const deleteReport = async (reportId: string) => {
    try {
      // Simulazione dell'operazione
      setReports(prev => prev.filter(report => report.id !== reportId));
      
      setAlertMessage({ 
        show: true, 
        type: 'success', 
        message: 'Report deleted successfully.' 
      });
      
      // Reset del messaggio dopo 3 secondi
      setTimeout(() => {
        setAlertMessage({ show: false, type: '', message: '' });
      }, 3000);
    } catch (error) {
      setAlertMessage({ 
        show: true, 
        type: 'danger', 
        message: 'Failed to delete report. Please try again.' 
      });
    }
  };
  
  // Formatta la data in modo leggibile
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };
  
  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3 mb-0">Report Management</h1>
      </div>
      
      {/* Alert Message */}
      {alertMessage.show && (
        <div className={`alert alert-${alertMessage.type} alert-dismissible fade show`} role="alert">
          <i className={`bi ${alertMessage.type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'} me-2`}></i>
          {alertMessage.message}
          <button 
            type="button" 
            className="btn-close" 
            onClick={() => setAlertMessage({ show: false, type: '', message: '' })}
          ></button>
        </div>
      )}
      
      {/* Filters */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-6">
              <div className="input-group">
                <span className="input-group-text bg-white">
                  <i className="bi bi-search text-muted"></i>
                </span>
                <input 
                  type="text" 
                  className="form-control border-start-0" 
                  placeholder="Search by title, user, or test..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-6">
              <select 
                className="form-select" 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="ALL">All Status</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="error">Error</option>
              </select>
            </div>
          </div>
        </div>
      </div>
      
      {/* Loading State */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3">Loading reports...</p>
        </div>
      ) : (
        <>
          {filteredReports.length === 0 ? (
            <div className="card border-0 shadow-sm">
              <div className="card-body p-5 text-center">
                <i className="bi bi-file-earmark-text text-muted display-1 mb-3"></i>
                <h3>No Reports Found</h3>
                <p className="text-muted mb-4">There are no reports matching your search criteria.</p>
              </div>
            </div>
          ) : (
            <div className="card border-0 shadow-sm">
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="bg-light">
                      <tr>
                        <th>Report Title</th>
                        <th>User</th>
                        <th>Test</th>
                        <th>Created</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredReports.map(report => (
                        <tr key={report.id}>
                          <td>
                            <div className="d-flex align-items-center">
                              <div>
                                <h6 className="mb-0">{report.title}</h6>
                              </div>
                            </div>
                          </td>
                          <td>{report.userName}</td>
                          <td>{report.testName}</td>
                          <td>{formatDate(report.createdAt)}</td>
                          <td>
                            <span className={`badge ${
                              report.status === 'completed' ? 'bg-success' : 
                              report.status === 'pending' ? 'bg-warning text-dark' : 
                              'bg-danger'
                            }`}>
                              {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                            </span>
                          </td>
                          <td>
                            <div className="btn-group">
                              <Link href={`/reports/${report.id}`} className="btn btn-sm btn-outline-secondary">
                                <i className="bi bi-eye"></i>
                              </Link>
                              <button 
                                className="btn btn-sm btn-outline-primary" 
                                onClick={() => regenerateReport(report.id)}
                                disabled={report.status === 'pending'}
                              >
                                <i className="bi bi-arrow-clockwise"></i>
                              </button>
                              <button 
                                className="btn btn-sm btn-outline-danger" 
                                onClick={() => {
                                  setSelectedReport(report);
                                  setShowModal(true);
                                }}
                              >
                                <i className="bi bi-trash"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}
      
      {/* Delete Confirmation Modal */}
      {showModal && selectedReport && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Delete Confirmation</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <div className="modal-body">
                <p>Are you sure you want to delete the report: <strong>{selectedReport.title}</strong>?</p>
                <p className="text-danger">
                  <i className="bi bi-exclamation-triangle-fill me-2"></i>
                  This action cannot be undone.
                </p>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button 
                  type="button" 
                  className="btn btn-danger" 
                  onClick={() => {
                    deleteReport(selectedReport.id);
                    setShowModal(false);
                  }}
                >
                  Delete Report
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
} 