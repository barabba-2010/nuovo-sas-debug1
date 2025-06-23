'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Report {
  id: string;
  title: string;
  testName: string;
  testType: string;
  createdAt: string;
  status: 'completed' | 'pending';
  metadata?: any;
}

export default function ReportsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredReports, setFilteredReports] = useState<Report[]>([]);
  const [error, setError] = useState('');
  
  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/auth/login');
      return;
    }
    
    fetchReports();
  }, [session, status, router]);
  
  const fetchReports = async () => {
    setLoading(true);
    setError('');
    try {
      // Carica i report dal database
      const response = await fetch('/api/reports');
      if (response.ok) {
        const data = await response.json();
        
        // Raggruppa per tipo di test e prendi solo l'ultimo per ogni tipo
        const groupedReports: { [key: string]: any } = {};
        
        data.forEach((report: any) => {
          const parsedMetadata = report.metadata ? JSON.parse(report.metadata) : null;
          const testType = parsedMetadata?.testType || 'unknown';
          
          // Se non abbiamo ancora un report per questo tipo, o se questo è più recente
          if (!groupedReports[testType] || new Date(report.createdAt) > new Date(groupedReports[testType].createdAt)) {
            groupedReports[testType] = {
              ...report,
              metadata: parsedMetadata
            };
          }
        });
        
        // Converti in array e formatta
        const latestReports = Object.values(groupedReports).map((report: any) => ({
          id: report.id,
          title: report.title,
          testName: getTestDisplayName(report.metadata?.testType),
          testType: report.metadata?.testType || 'unknown',
          createdAt: report.createdAt,
          status: 'completed' as const,
          metadata: report.metadata
        }));
        
        // Ordina per data di creazione (più recenti prima)
        latestReports.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        
        setReports(latestReports);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Errore nel caricamento dei report');
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
      setError('Errore di connessione');
    } finally {
      setLoading(false);
    }
  };

  const getTestDisplayName = (testType: string | undefined) => {
    switch(testType?.toLowerCase()) {
      case 'sas':
        return 'Test S-AS (Scopo-Antiscopo)';
      case 'pid5':
        return 'Test PID-5 (Personality Inventory for DSM-5)';
      case 'personality':
        return 'Test di Personalità';
      case 'cognitive':
        return 'Test Cognitivo';
      case 'anxiety':
        return 'Test d\'Ansia';
      case 'depression':
        return 'Test di Depressione';
      default:
        return 'Test Psicologico';
    }
  };

  const downloadPDF = async (reportId: string, testType: string) => {
    try {
      // Verifica il tipo di report
      const isSASReport = testType?.toLowerCase() === 'sas';
      const isPID5Report = testType?.toLowerCase() === 'pid5';
      
      if (!isSASReport && !isPID5Report) {
        alert('Il download PDF è disponibile solo per i report S-AS e PID-5');
        return;
      }
      
      // Usa l'endpoint appropriato per generare il PDF
      const endpoint = isSASReport 
        ? `/api/reports/sas/pdf?reportId=${reportId}`
        : `/api/reports/pid5/pdf?reportId=${reportId}`;
        
      const response = await fetch(endpoint);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const filePrefix = isSASReport ? 'Report_SAS' : 'Report_PID5';
        a.download = `${filePrefix}_${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const errorText = await response.text();
        console.error('Errore nel download:', errorText);
        alert('Errore nel download del report: ' + errorText);
      }
    } catch (error) {
      console.error('Errore nel download:', error);
      alert('Errore nel download del report: ' + (error as Error).message);
    }
  };
  
  // Filtra i report in base al termine di ricerca
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredReports(reports);
    } else {
      const filtered = reports.filter(report => 
        report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.testName.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredReports(filtered);
    }
  }, [reports, searchTerm]);
  
  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 mb-0">I Tuoi Report</h1>
          <p className="text-muted mb-0">Visualizza e scarica i tuoi report di valutazione psicologica più recenti</p>
        </div>
        <Link href="/tests" className="btn btn-primary">
          <i className="bi bi-plus-circle me-2"></i>
          Nuovo Test
        </Link>
      </div>
      
      {/* Error Alert */}
      {error && (
        <div className="alert alert-danger" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {error}
        </div>
      )}
      
      {/* Search Bar */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body">
          <div className="row g-3 align-items-center">
            <div className="col-md-6">
              <div className="input-group">
                <span className="input-group-text bg-white">
                  <i className="bi bi-search text-muted"></i>
                </span>
                <input 
                  type="text" 
                  className="form-control border-start-0" 
                  placeholder="Cerca nei report..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-6 text-end">
              <Link href="/profile?tab=reports" className="btn btn-outline-primary">
                <i className="bi bi-archive me-2"></i>
                Archivio completo
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Info Alert */}
      <div className="alert alert-info mb-4">
        <i className="bi bi-info-circle me-2"></i>
        <strong>Nota:</strong> Qui vengono mostrati solo i report più recenti per ogni tipo di test. 
        Per vedere tutti i report precedenti, visita l'<Link href="/profile?tab=reports" className="alert-link">archivio completo</Link>.
      </div>
      
      {/* Loading State */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Caricamento...</span>
          </div>
          <p className="mt-3">Caricamento report...</p>
        </div>
      ) : (
        <>
          {filteredReports.length === 0 ? (
            <div className="card border-0 shadow-sm">
              <div className="card-body p-5 text-center">
                <i className="bi bi-file-earmark-text text-muted display-1 mb-3"></i>
                <h3>Nessun Report Trovato</h3>
                <p className="text-muted mb-4">Completa un test per generare il tuo report di valutazione personalizzato.</p>
                <Link href="/tests" className="btn btn-primary">
                  <i className="bi bi-clipboard-check me-2"></i>Sfoglia i Test Disponibili
                </Link>
              </div>
            </div>
          ) : (
            <div className="row row-cols-1 row-cols-md-2 g-4">
              {filteredReports.map(report => (
                <div key={report.id} className="col">
                  <div className="card h-100 border-0 shadow-sm hover-elevation transition">
                    <div className="card-body">
                      <div className="d-flex justify-content-between mb-3">
                        <h5 className="card-title mb-0">{report.title}</h5>
                        <div>
                          <span className="badge bg-success me-2">Più recente</span>
                          <span className={`badge ${report.status === 'completed' ? 'bg-primary' : 'bg-warning text-dark'}`}>
                            {report.status === 'completed' ? 'Completato' : 'In elaborazione'}
                          </span>
                        </div>
                      </div>
                      <p className="card-text text-muted">
                        <i className="bi bi-clipboard2-pulse me-2"></i>
                        {report.testName}
                      </p>
                      <p className="card-text">
                        <small className="text-muted">
                          <i className="bi bi-calendar3 me-2"></i>
                          Generato il: {new Date(report.createdAt).toLocaleDateString('it-IT', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </small>
                      </p>
                      <div className="mt-auto pt-3 d-flex justify-content-end gap-2">
                        <Link href={`/reports/${report.id}`} className="btn btn-outline-primary">
                          <i className="bi bi-eye me-2"></i>Visualizza
                        </Link>
                        <button 
                          className="btn btn-primary"
                          onClick={() => downloadPDF(report.id, report.testType)}
                          disabled={report.testType?.toLowerCase() !== 'sas' && report.testType?.toLowerCase() !== 'pid5'}
                          title={report.testType?.toLowerCase() !== 'sas' && report.testType?.toLowerCase() !== 'pid5' ? 'PDF disponibile solo per test S-AS e PID-5' : ''}
                        >
                          <i className="bi bi-file-pdf me-2"></i>Scarica PDF
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
