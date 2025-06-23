'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Script from 'next/script';

declare global {
  interface Window {
    Chart: any;
  }
}

interface ReportData {
  id: string;
  title: string;
  content: string;
  metadata: any;
  createdAt: string;
}

export default function ReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [chartsLoaded, setChartsLoaded] = useState(false);
  const [reportId, setReportId] = useState<string>('');

  useEffect(() => {
    // Await params to get the id
    params.then(p => setReportId(p.id));
  }, [params]);

  useEffect(() => {
    if (status === 'loading' || !reportId) return;
    
    if (!session) {
      router.push('/auth/login');
      return;
    }
    
    fetchReport();
  }, [session, status, reportId]);

  const fetchReport = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`/api/reports/${reportId}`);
      if (response.ok) {
        const data = await response.json();
        setReport(data.report);
      } else {
        setError('Report non trovato');
      }
    } catch (error) {
      console.error('Errore nel caricamento del report:', error);
      setError('Errore nel caricamento del report');
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async () => {
    try {
      // Log per debug
      console.log('Report completo:', report);
      console.log('Report metadata:', report?.metadata);
      console.log('Report title:', report?.title);
      console.log('Test type:', report?.metadata?.testType);
      
      const testType = report?.metadata?.testType;
      
      if (!testType || (testType !== 'sas' && testType !== 'pid5')) {
        alert('Il download PDF non è disponibile per questo tipo di report');
        return;
      }
      
      // Usa l'endpoint corretto in base al tipo di test
      const endpoint = testType === 'sas' ? 
        `/api/reports/sas/pdf?reportId=${reportId}` : 
        `/api/reports/pid5/pdf?reportId=${reportId}`;
      
      console.log('Using PDF endpoint:', endpoint);
      const response = await fetch(endpoint);
      
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      
      if (response.ok) {
        const contentType = response.headers.get('content-type');
        console.log('Content-Type:', contentType);
        
        const blob = await response.blob();
        console.log('Blob type:', blob.type);
        console.log('Blob size:', blob.size);
        
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        
        // Nome file con data e tipo test
        const testName = testType === 'sas' ? 'SAS' : 'PID5';
        const fileName = `Report_${testName}_${new Date().toISOString().split('T')[0]}.pdf`;
        
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        console.log('Download completato:', fileName);
      } else {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        alert('Errore nel download del report: ' + errorText);
      }
    } catch (error) {
      console.error('Errore nel download:', error);
      alert('Errore nel download del report: ' + (error as Error).message);
    }
  };

  const renderCharts = () => {
    if (!report || !chartsLoaded) return;

    const metadata = report.metadata;
    if (!metadata) return;

    // Determina il tipo di test
    const testType = metadata.testType;

    if (testType === 'sas') {
      // Grafico dei fattori S-AS
      const factorsCanvas = document.getElementById('factors-chart') as HTMLCanvasElement;
      if (factorsCanvas && metadata.factorScores) {
        const ctx = factorsCanvas.getContext('2d');
        if (ctx && window.Chart) {
          const orderedFactors = Object.values(metadata.factorScores)
            .sort((a: any, b: any) => a.id - b.id);
          
          new window.Chart(ctx, {
            type: 'bar',
            data: {
              labels: orderedFactors.map((f: any) => `${f.id}. ${f.name}`),
              datasets: [{
                label: 'Punteggio Medio',
                data: orderedFactors.map((f: any) => f.score),
                backgroundColor: [
                  'rgba(106,76,147,0.7)',
                  'rgba(79,157,166,0.7)',
                  'rgba(247,172,166,0.7)',
                  'rgba(151,202,114,0.7)',
                  'rgba(255,194,102,0.7)',
                  'rgba(255,130,130,0.7)',
                  'rgba(149,125,173,0.7)',
                  'rgba(100,181,190,0.7)'
                ],
                borderWidth: 1
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              scales: {
                y: {
                  beginAtZero: true,
                  max: 4,
                  ticks: {
                    stepSize: 0.5
                  },
                  title: {
                    display: true,
                    text: 'Punteggio Medio (0-4)'
                  }
                }
              },
              plugins: {
                legend: { display: false }
              }
            }
          });
        }
      }
      
      // Grafico orientamento (torta) per S-AS
      const orientationCanvas = document.getElementById('orientation-chart') as HTMLCanvasElement;
      if (orientationCanvas && metadata.orientationData) {
        const ctx = orientationCanvas.getContext('2d');
        if (ctx && window.Chart) {
          const scopiCount = metadata.orientationData.scopi.count;
          const antiscopiCount = metadata.orientationData.antiscopi.count;
          
          new window.Chart(ctx, {
            type: 'pie',
            data: {
              labels: ['Scopi', 'Antiscopi'],
              datasets: [{
                data: [scopiCount, antiscopiCount],
                backgroundColor: [
                  'rgba(79,157,166,0.7)',
                  'rgba(247,172,166,0.7)'
                ],
                borderColor: [
                  'rgba(79,157,166,1)',
                  'rgba(247,172,166,1)'
                ],
                borderWidth: 1
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'bottom',
                  labels: {
                    padding: 20,
                    font: {
                      size: 14
                    }
                  }
                },
                tooltip: {
                  callbacks: {
                    label: function(context: any) {
                      const label = context.label || '';
                      const value = context.parsed || 0;
                      const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                      const percentage = Math.round((value / total) * 100);
                      return label + ': ' + value + ' (' + percentage + '%)';
                    }
                  }
                }
              }
            }
          });
        }
      }
    } else if (testType === 'pid5') {
      // Grafico radar per i domini PID-5
      const domainsCanvas = document.getElementById('domains-chart') as HTMLCanvasElement;
      if (domainsCanvas && metadata.domainScores) {
        const ctx = domainsCanvas.getContext('2d');
        if (ctx && window.Chart) {
          // Ordina i domini per punteggio
          const sortedDomains = Object.entries(metadata.domainScores)
            .sort(([,a]: any, [,b]: any) => b.mean - a.mean);
          
          // Mappa dei nomi dei domini
          const domainNames: { [key: string]: string } = {
            'affettivita_negativa': 'Affettività Negativa',
            'distacco': 'Distacco',
            'antagonismo': 'Antagonismo',
            'disinibizione': 'Disinibizione',
            'psicoticismo': 'Psicoticismo'
          };
          
          const domainLabels = sortedDomains.map(([id]) => domainNames[id] || id);
          const domainData = sortedDomains.map(([,score]: any) => score.mean);
          
          new window.Chart(ctx, {
            type: 'radar',
            data: {
              labels: domainLabels,
              datasets: [{
                label: 'Punteggio',
                data: domainData,
                backgroundColor: 'rgba(106, 76, 147, 0.2)',
                borderColor: 'rgba(106, 76, 147, 1)',
                borderWidth: 2,
                pointBackgroundColor: 'rgba(106, 76, 147, 1)',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: 'rgba(106, 76, 147, 1)'
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              scales: {
                r: {
                  beginAtZero: true,
                  max: 3,
                  ticks: {
                    stepSize: 0.5
                  },
                  pointLabels: {
                    font: {
                      size: 12
                    }
                  }
                }
              },
              plugins: {
                legend: {
                  display: false
                },
                title: {
                  display: true,
                  text: 'Profilo dei Domini di Personalità',
                  font: {
                    size: 16
                  }
                }
              }
            }
          });
        }
      }
    }
  };

  useEffect(() => {
    if (chartsLoaded && report) {
      renderCharts();
    }
  }, [chartsLoaded, report]);

  if (loading) {
    return (
      <div className="container py-5">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Caricamento...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {error || 'Report non trovato'}
        </div>
        <Link href="/reports" className="btn btn-primary">
          <i className="bi bi-arrow-left me-2"></i>
          Torna ai Report
        </Link>
      </div>
    );
  }

  return (
    <>
      <Script 
        src="https://cdn.jsdelivr.net/npm/chart.js"
        onLoad={() => setChartsLoaded(true)}
      />
      
      <div className="container py-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h1 className="h3 mb-0">{report.title}</h1>
            <p className="text-muted mb-0">
              Creato il {new Date(report.createdAt).toLocaleDateString('it-IT')}
            </p>
          </div>
          <div className="d-flex gap-2">
            <Link href="/reports" className="btn btn-outline-secondary">
              <i className="bi bi-arrow-left me-2"></i>
              Indietro
            </Link>
            <button className="btn btn-primary" onClick={downloadPDF}>
              <i className="bi bi-file-pdf me-2"></i>
              Scarica PDF
            </button>
          </div>
        </div>

        {/* Contenuto del report */}
        <div id="report-content">
          {/* Contenuto specifico per S-AS */}
          {report.metadata?.testType === 'sas' && (
            <>
              {/* Tabella dei fattori con punteggi corretti */}
              {report.metadata?.factorScores && (
                <div className="card border-0 shadow-sm mb-4">
                  <div className="card-body">
                    <h4>Analisi dei Fattori (Parte I)</h4>
                    <p className="text-muted">Questa analisi è basata sui punteggi assegnati nella Parte I del test.</p>
                    <table className="table table-striped">
                      <thead>
                        <tr>
                          <th>Fattore</th>
                          <th className="text-center">Punteggio Medio</th>
                          <th>Descrizione</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.values(report.metadata.factorScores)
                          .sort((a: any, b: any) => a.id - b.id)
                          .map((factor: any) => (
                            <tr key={factor.id}>
                              <td><strong>{factor.id}. {factor.name}</strong></td>
                              <td className="text-center">{factor.score.toFixed(1)}</td>
                              <td className="text-muted small">
                                {factor.id === 1 && "Bisogno di affermazione sociale e prestigio"}
                                {factor.id === 2 && "Ricerca di stabilità emotiva e psicologica"}
                                {factor.id === 3 && "Timore di esclusione sociale"}
                                {factor.id === 4 && "Tendenza al perfezionismo e al controllo"}
                                {factor.id === 5 && "Preoccupazione per i propri difetti"}
                                {factor.id === 6 && "Tendenza all'auto-sacrificio"}
                                {factor.id === 7 && "Ricerca di identità personale"}
                                {factor.id === 8 && "Cautela nelle relazioni interpersonali"}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Grafico dei fattori */}
              {report.metadata?.factorScores && (
                <div className="card border-0 shadow-sm mb-4">
                  <div className="card-body">
                    <h4>Grafico dei Fattori</h4>
                    <div style={{ position: 'relative', height: '400px' }}>
                      <canvas id="factors-chart"></canvas>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Grafico orientamento Scopi/Antiscopi */}
              {report.metadata?.orientationData && (
                <div className="card border-0 shadow-sm mb-4">
                  <div className="card-body">
                    <h4>Orientamento Scopi vs Antiscopi (Parte II)</h4>
                    <p className="text-muted">Distribuzione delle scelte nella Parte II del test.</p>
                    <div className="row mb-3">
                      <div className="col-6 text-center">
                        <h5 className="text-info">Scelte Scopi: {report.metadata.orientationData.scopi.count}</h5>
                      </div>
                      <div className="col-6 text-center">
                        <h5 className="text-warning">Scelte Antiscopi: {report.metadata.orientationData.antiscopi.count}</h5>
                      </div>
                    </div>
                    <div style={{ position: 'relative', height: '300px' }}>
                      <canvas id="orientation-chart"></canvas>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Contenuto specifico per PID-5 */}
          {report.metadata?.testType === 'pid5' && (
            <>
              {/* Riepilogo Domini */}
              {report.metadata?.domainScores && (
                <div className="card border-0 shadow-sm mb-4">
                  <div className="card-body">
                    <h4>Riepilogo Domini di Personalità</h4>
                    <p className="text-muted">Il PID-5 valuta 5 domini principali della personalità secondo il modello dimensionale del DSM-5.</p>
                    
                    <div className="row g-3 mb-4">
                      {Object.entries(report.metadata.domainScores)
                        .sort(([,a]: any, [,b]: any) => b.mean - a.mean)
                        .map(([domainId, score]: any) => {
                          const domainNames: { [key: string]: string } = {
                            'affettivita_negativa': 'Affettività Negativa',
                            'distacco': 'Distacco',
                            'antagonismo': 'Antagonismo',
                            'disinibizione': 'Disinibizione',
                            'psicoticismo': 'Psicoticismo'
                          };
                          const interpretation = score.mean < 0.5 ? 'Molto Basso' :
                                                 score.mean < 1.0 ? 'Basso' :
                                                 score.mean < 1.5 ? 'Medio' :
                                                 score.mean < 2.0 ? 'Elevato' : 'Molto Elevato';
                          const colorClass = score.mean >= 1.5 ? 'danger' :
                                           score.mean >= 1.0 ? 'warning' :
                                           score.mean >= 0.5 ? 'info' : 'success';
                          
                          return (
                            <div key={domainId} className="col-md-6 col-lg-4">
                              <div className={`card border-${colorClass}`}>
                                <div className="card-body text-center">
                                  <h5 className="card-title">{domainNames[domainId] || domainId}</h5>
                                  <h2 className={`text-${colorClass}`}>{score.mean.toFixed(2)}</h2>
                                  <span className={`badge bg-${colorClass}`}>{interpretation}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                </div>
              )}

              {/* Grafico dei domini */}
              {report.metadata?.domainScores && (
                <div className="card border-0 shadow-sm mb-4">
                  <div className="card-body">
                    <h4>Profilo dei Domini</h4>
                    <div style={{ position: 'relative', height: '400px' }}>
                      <canvas id="domains-chart"></canvas>
                    </div>
                  </div>
                </div>
              )}

              {/* Top 5 Facet */}
              {report.metadata?.facetScores && (
                <div className="card border-0 shadow-sm mb-4">
                  <div className="card-body">
                    <h4>Facet Principali (Top 5)</h4>
                    <p className="text-muted">Le facet con i punteggi più elevati.</p>
                    <table className="table table-striped">
                      <thead>
                        <tr>
                          <th>Facet</th>
                          <th className="text-center">Punteggio</th>
                          <th className="text-center">Interpretazione</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(report.metadata.facetScores)
                          .sort(([,a]: any, [,b]: any) => b.mean - a.mean)
                          .slice(0, 5)
                          .map(([facetId, score]: any) => {
                            const interpretation = score.mean < 0.5 ? 'Molto Basso' :
                                                   score.mean < 1.0 ? 'Basso' :
                                                   score.mean < 1.5 ? 'Medio' :
                                                   score.mean < 2.0 ? 'Elevato' : 'Molto Elevato';
                            const colorClass = score.mean >= 1.5 ? 'danger' :
                                             score.mean >= 1.0 ? 'warning' :
                                             score.mean >= 0.5 ? 'info' : 'success';
                            
                            return (
                              <tr key={facetId}>
                                <td>{facetId}</td>
                                <td className="text-center">{score.mean.toFixed(2)}</td>
                                <td className="text-center">
                                  <span className={`badge bg-${colorClass}`}>{interpretation}</span>
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Contenuto HTML del report */}
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <div dangerouslySetInnerHTML={{ 
                __html: (() => {
                  try {
                    // Prova a parsare come JSON
                    const content = JSON.parse(report.content);
                    // Se ha la proprietà html, usa quella
                    return content.html || report.content;
                  } catch (e) {
                    // Se il parsing fallisce, è già HTML
                    return report.content;
                  }
                })()
              }} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 