import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';
import { prisma } from '../../../../lib/prisma';
import { pid5Facets, pid5Domains } from '../../../../lib/pid5-data';

export async function POST(request: NextRequest) {
  try {
    console.log('Ricevuta richiesta POST per salvare risultati PID-5');
    
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      console.log('Utente non autenticato');
      return NextResponse.json(
        { error: 'Non autenticato' }, 
        { status: 401 }
      );
    }

    console.log('Utente autenticato:', session.user.id);

    const body = await request.json();
    const { results, completedAt, testState } = body;

    console.log('Dati ricevuti:', {
      hasResults: !!results,
      hasTestState: !!testState,
      completedAt
    });

    if (!results) {
      return NextResponse.json(
        { error: 'Risultati mancanti' }, 
        { status: 400 }
      );
    }

    // Recupera le informazioni del paziente dal sessionStorage o da un altro store
    const patientInfo = {
      firstName: body.patientInfo?.firstName || '',
      lastName: body.patientInfo?.lastName || '',
      age: body.patientInfo?.age || '',
      therapistName: session.user.name || 'Non specificato'
    };

    // Genera il contenuto del report
    const reportContent = generatePID5ReportContent(results, testState, patientInfo);
    
    console.log('Report content generato, lunghezza:', reportContent.length);
    
    // Salva direttamente come Report (non come TestResult)
    const report = await prisma.report.create({
      data: {
        userId: session.user.id,
        testResultId: null, // Non collegato a un TestResult specifico
        title: `Test PID-5 - ${new Date(completedAt || new Date()).toLocaleDateString('it-IT')}`,
        content: JSON.stringify({
          html: reportContent,
          results: results,
          testState: testState
        }),
        metadata: JSON.stringify({
          testType: 'pid5',
          completedAt: completedAt || new Date(),
          domainScores: results.scores.domainScores,
          facetScores: results.scores.facetScores,
          topDomains: Object.entries(results.scores.domainScores)
            .sort(([,a]: any, [,b]: any) => b.mean - a.mean)
            .slice(0, 3)
            .map(([id, score]: any) => ({ 
              id, 
              name: pid5Domains.find(d => d.id === id)?.name || id,
              score: score.mean 
            }))
        })
      }
    });

    console.log('Report salvato con successo, ID:', report.id);

    return NextResponse.json({ 
      success: true, 
      reportId: report.id 
    });

  } catch (error) {
    console.error('Errore nel salvataggio del report PID-5:', error);
    return NextResponse.json(
      { error: 'Errore interno del server', details: error instanceof Error ? error.message : 'Errore sconosciuto' }, 
      { status: 500 }
    );
  }
}

function generatePID5ReportContent(results: any, testState: any, patientInfo: any): string {
  const date = new Date().toLocaleDateString('it-IT', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  const { domainScores, facetScores } = results.scores;
  
  // Ordina i domini per punteggio
  const sortedDomains = Object.entries(domainScores)
    .sort(([,a]: any, [,b]: any) => b.mean - a.mean);
  
  // Ordina le facet per punteggio
  const sortedFacets = Object.entries(facetScores)
    .sort(([,a]: any, [,b]: any) => b.mean - a.mean);

  // Prepara i dati per i grafici
  const domainLabels = sortedDomains.map(([id]) => pid5Domains.find(d => d.id === id)?.name || id);
  const domainData = sortedDomains.map(([,score]: any) => score.mean);

  // Genera l'analisi qualitativa
  const qualitativeAnalysis = generateQualitativeAnalysis(sortedDomains, sortedFacets);

  return `
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Report Test PID-5 - ${patientInfo?.firstName || ''} ${patientInfo?.lastName || ''}</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
  <style>
    /* Reset e variabili CSS - IDENTICHE AL SAS */
    :root {
      --primary-color: #6a4c93;
      --primary-dark: #563d79;
      --primary-light: #8f70b7;
      --secondary-color: #9984d4;
      --accent-color: #4f9da6;
      --accent-dark: #3c7a80;
      --accent-light: #6fbac3;
      --background-color: #f5f5f5;
      --card-color: #ffffff;
      --text-color: #333333;
      --text-light: #757575;
      --border-color: #e0e0e0;
      --error-color: #F44336;
      --success-color: #4CAF50;
      --report-bg: #311b92;
      --report-text: #ffffff;
      --border-radius: 8px;
      --spacing-xs: 0.25rem;
      --spacing-sm: 0.5rem;
      --spacing-md: 1rem;
      --spacing-lg: 1.5rem;
      --spacing-xl: 2rem;
      --font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      --font-size-xs: 0.75rem;
      --font-size-sm: 0.875rem;
      --font-size-md: 1rem;
      --font-size-lg: 1.125rem;
      --font-size-xl: 1.25rem;
      --font-size-2xl: 1.5rem;
      --transition-duration: 0.3s;
      --transition-timing: ease;
      --shadow-sm: 0 1px 3px rgba(0,0,0,0.12);
      --shadow-md: 0 4px 6px rgba(0,0,0,0.1);
      --shadow-lg: 0 10px 25px rgba(0,0,0,0.1);
      --shadow-focus: 0 0 0 3px rgba(106,76,147,0.3);
    }
    
    * { box-sizing: border-box; margin: 0; padding: 0; }
    
    body {
      font-family: var(--font-family);
      background-color: var(--background-color);
      color: var(--text-color);
      line-height: 1.5;
      font-size: var(--font-size-md);
      overflow-x: hidden;
    }
    
    .pid5-report {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
    
    /* Stili per le card del report - IDENTICI AL SAS */
    .report-card {
      background-color: #fff !important;
      color: #000 !important;
      padding: var(--spacing-md);
      margin: var(--spacing-lg) 0;
      border-radius: var(--border-radius);
      box-shadow: 0 1px 3px rgba(0,0,0,0.12);
      page-break-inside: avoid;
      break-inside: avoid;
      border: 1px solid #ddd;
    }
    
    .report-card h3, .report-card h4 { 
      margin-bottom: var(--spacing-sm); 
      color: #000 !important;
      border-bottom: 1px solid #ddd;
      padding-bottom: var(--spacing-xs);
    }
    
    .report-card table { 
      width: 100%; 
      border-collapse: collapse; 
      margin-bottom: var(--spacing-md);
      border: 1px solid #000;
    }
    
    .report-card th, .report-card td {
      border: 1px solid #000;
      padding: 8px;
      text-align: left;
      color: #000;
    }
    
    .report-card th {
      background-color: #f1f1f1;
      font-weight: bold;
    }
    
    .report-card tr:nth-child(even) {
      background-color: #f5f5f5;
    }
    
    /* Stili per i punteggi */
    .scores-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin: 30px 0;
    }
    
    .score-card {
      background: #fff;
      border: 2px solid #e9ecef;
      border-radius: 8px;
      padding: 20px;
      text-align: center;
    }
    
    .score-card.elevato { border-color: #dc3545; }
    .score-card.medio { border-color: #ffc107; }
    .score-card.basso { border-color: #17a2b8; }
    
    .score-number {
      font-size: 36px;
      font-weight: bold;
      margin: 10px 0;
    }
    
    /* Stili per l'analisi qualitativa - IDENTICI AL SAS */
    .qualitative-analysis {
      padding: 5px;
    }
    
    .domain-analysis-item {
      margin-bottom: 25px;
      padding: 18px;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      background-color: #fcfcfc;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
      page-break-inside: avoid;
      break-inside: avoid;
    }
    
    .domain-analysis-item h4 {
      font-size: 1.15rem;
      margin-bottom: 15px;
      padding-bottom: 10px;
      border-bottom: 1px solid #eee;
      color: #6a4c93;
      font-weight: 600;
    }
    
    .domain-analysis-item p {
      margin-bottom: 15px;
      line-height: 1.6;
      font-size: 1rem;
    }
    
    .domain-analysis-item em {
      display: block;
      margin-bottom: 15px;
      padding: 12px;
      background-color: #f8f5ff;
      border-left: 4px solid #6a4c93;
      font-style: normal;
      font-weight: 500;
      border-radius: 0 4px 4px 0;
    }
    
    .high-score {
      color: #dc3545;
      font-weight: 600;
    }
    
    .medium-score {
      color: #ffc107;
      font-weight: 600;
    }
    
    .low-score {
      color: #28a745;
      font-weight: 600;
    }
    
    /* Stili per le facet */
    .facet-table {
      width: 100%;
      margin: 20px 0;
    }
    
    .facet-table th {
      background: #8f70b7;
      color: white;
      padding: 10px;
    }
    
    .facet-table td {
      padding: 10px;
      border-bottom: 1px solid #ddd;
    }
    
    /* Note e disclaimer */
    .analysis-note {
      margin-top: 25px;
      padding: 15px;
      background-color: #f5f5f5;
      border-radius: 5px;
      font-size: 0.95rem;
      font-style: italic;
      color: #666;
      border-left: 3px solid #ccc;
    }
    
    .disclaimer-box {
      margin-top: 25px;
      padding: 15px;
      background-color: #fbf0e5;
      border-radius: 5px;
      font-size: 0.95rem;
      color: #856404;
      border-left: 3px solid #f5c6cb;
      border: 1px solid #ffeeba;
    }
    
    .disclaimer-box strong {
      color: #856404;
      display: block;
      margin-bottom: 5px;
    }
    
    /* Stili per le raccomandazioni */
    .recommendations {
      background: #e8f4fd;
      padding: 20px;
      border-radius: 8px;
    }
    
    .recommendation-item {
      margin: 15px 0;
      padding: 15px;
      background: white;
      border-radius: 5px;
      border-left: 4px solid #17a2b8;
    }
    
    /* Badge per interpretazione */
    .interpretation-badge {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 0.85em;
      font-weight: 600;
    }
    
    .badge-success { background: #d4edda; color: #155724; }
    .badge-info { background: #d1ecf1; color: #0c5460; }
    .badge-warning { background: #fff3cd; color: #856404; }
    .badge-danger { background: #f8d7da; color: #721c24; }
    
    /* Stili per la stampa */
    @media print {
      body {
        padding: 0;
        background: white;
      }
      
      .report-card {
        page-break-inside: avoid;
        break-inside: avoid;
        margin: 0 0 20px 0;
        box-shadow: none;
      }
      
      .domain-analysis-item {
        page-break-inside: avoid;
        break-inside: avoid;
      }
    }
    
    /* Grafici */
    .chart-container {
      position: relative;
      height: 350px;
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <div class="pid5-report">
    <div class="report-card">
      <h3>Report Test PID-5 (Personality Inventory for DSM-5)</h3>
      <p><strong>Paziente:</strong> ${patientInfo?.firstName || ''} ${patientInfo?.lastName || ''}</p>
      <p><strong>Età:</strong> ${patientInfo?.age || ''}</p>
      <p><strong>Terapeuta:</strong> ${patientInfo?.therapistName || 'Non specificato'}</p>
      <p><strong>Data completamento:</strong> ${date}</p>
    </div>

    <!-- Riepilogo Domini -->
    <div class="report-card">
      <h3>Riepilogo Domini di Personalità</h3>
      <p>Il PID-5 valuta 5 domini principali della personalità secondo il modello dimensionale del DSM-5.</p>
      
      <div class="scores-grid">
        ${sortedDomains.map(([domainId, score]: any) => {
          const domain = pid5Domains.find(d => d.id === domainId);
          const interpretation = getScoreInterpretation(score.mean);
          const colorClass = interpretation.color === 'danger' ? 'elevato' : 
                           interpretation.color === 'warning' ? 'medio' : 'basso';
          return `
            <div class="score-card ${colorClass}">
              <h4>${domain?.name || domainId}</h4>
              <div class="score-number">${score.mean.toFixed(2)}</div>
              <span class="interpretation-badge badge-${interpretation.color}">
                ${interpretation.label}
              </span>
            </div>
          `;
        }).join('')}
      </div>

      <div class="chart-container">
        <canvas id="domainsChart"></canvas>
      </div>
    </div>

    <!-- Analisi Qualitativa dei Domini -->
    <div class="report-card">
      <h3>Analisi Qualitativa dei Domini</h3>
      <div class="qualitative-analysis">
        ${qualitativeAnalysis}
      </div>
    </div>

    <!-- Dettaglio Facet -->
    <div class="report-card">
      <h3>Analisi delle Facet di Personalità</h3>
      <p>Le 25 facet del PID-5 forniscono una valutazione dettagliata dei tratti di personalità.</p>
      
      <table class="facet-table">
        <thead>
          <tr>
            <th>Facet</th>
            <th>Punteggio Medio</th>
            <th>Interpretazione</th>
            <th>Dominio</th>
          </tr>
        </thead>
        <tbody>
          ${sortedFacets.map(([facetId, score]: any) => {
            const facet = pid5Facets.find(f => f.id === facetId);
            const interpretation = getScoreInterpretation(score.mean);
            const domain = pid5Domains.find(d => d.facets.includes(facetId));
            return `
              <tr>
                <td><strong>${facet?.name || facetId}</strong></td>
                <td style="text-align: center;">${score.mean.toFixed(2)}</td>
                <td style="text-align: center;">
                  <span class="interpretation-badge badge-${interpretation.color}">
                    ${interpretation.label}
                  </span>
                </td>
                <td>${domain?.name || '-'}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>

    <!-- Raccomandazioni Cliniche -->
    <div class="report-card">
      <h3>Raccomandazioni Cliniche</h3>
      <div class="recommendations">
        ${generateRecommendations(sortedDomains, sortedFacets)}
      </div>
    </div>

    <!-- Note e Avvertenze -->
    <div class="report-card">
      <h3>Note Importanti</h3>
      
      <div class="disclaimer-box">
        <strong>Avvertenza</strong>
        Questo report è generato automaticamente sulla base delle risposte fornite al questionario PID-5.
        I risultati devono essere interpretati da un professionista qualificato nel contesto di una valutazione
        clinica completa. Non utilizzare questi risultati per l'autodiagnosi.
      </div>
      
      <div class="analysis-note">
        <strong>Interpretazione dei Punteggi:</strong><br>
        • <strong>Molto Basso (0.0-0.5):</strong> Tratto non presente o minimo<br>
        • <strong>Basso (0.5-1.0):</strong> Tratto presente in misura lieve<br>
        • <strong>Medio (1.0-1.5):</strong> Tratto presente in misura moderata<br>
        • <strong>Elevato (1.5-2.0):</strong> Tratto presente in misura significativa<br>
        • <strong>Molto Elevato (>2.0):</strong> Tratto presente in misura molto significativa
      </div>
    </div>
  </div>

  <script>
    // Dati per il grafico
    const domainLabels = ${JSON.stringify(domainLabels)};
    const domainData = ${JSON.stringify(domainData)};
    
    // Attendi che Chart.js sia caricato
    window.addEventListener('load', function() {
      if (typeof Chart !== 'undefined') {
        // Grafico dei domini
        const domainsCtx = document.getElementById('domainsChart').getContext('2d');
        new Chart(domainsCtx, {
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
    });
  </script>
</body>
</html>
  `;
}

function getScoreInterpretation(score: number) {
  if (score < 0.5) return { label: 'Molto Basso', color: 'success' };
  if (score < 1.0) return { label: 'Basso', color: 'info' };
  if (score < 1.5) return { label: 'Medio', color: 'warning' };
  if (score < 2.0) return { label: 'Elevato', color: 'danger' };
  return { label: 'Molto Elevato', color: 'danger' };
}

function generateQualitativeAnalysis(sortedDomains: any[], sortedFacets: any[]): string {
  let analysis = '';
  
  // Analisi per ogni dominio
  sortedDomains.forEach(([domainId, score]: any) => {
    const domain = pid5Domains.find(d => d.id === domainId);
    const interpretation = getScoreInterpretation(score.mean);
    
    if (score.mean >= 1.0) { // Solo domini con punteggi significativi
      analysis += `
        <div class="domain-analysis-item">
          <h4>${domain?.name || domainId} - <span class="${
            interpretation.color === 'danger' ? 'high-score' : 
            interpretation.color === 'warning' ? 'medium-score' : 'low-score'
          }">${interpretation.label} (${score.mean.toFixed(2)})</span></h4>
          
          <em>${getDomainDescription(domainId)}</em>
          
          <p>${getDomainInterpretation(domainId, score.mean)}</p>
          
          <p><strong>Facet principali in questo dominio:</strong></p>
          <ul>
            ${domain?.facets.map(facetId => {
              const facet = pid5Facets.find(f => f.id === facetId);
              const facetScore = sortedFacets.find(([id]) => id === facetId)?.[1];
              if (facetScore && facetScore.mean >= 1.0) {
                return `<li>${facet?.name}: ${facetScore.mean.toFixed(2)} - ${getScoreInterpretation(facetScore.mean).label}</li>`;
              }
              return '';
            }).filter(Boolean).join('') || '<li>Nessuna facet significativamente elevata</li>'}
          </ul>
        </div>
      `;
    }
  });
  
  return analysis || '<p>Tutti i domini mostrano punteggi nella norma.</p>';
}

function getDomainDescription(domainId: string): string {
  const descriptions: { [key: string]: string } = {
    'affettivita_negativa': 'Questo dominio valuta la tendenza a sperimentare emozioni negative intense e frequenti.',
    'distacco': 'Questo dominio misura l\'evitamento delle interazioni sociali e il ritiro emotivo.',
    'antagonismo': 'Questo dominio riflette comportamenti che mettono l\'individuo in conflitto con gli altri.',
    'disinibizione': 'Questo dominio valuta la tendenza all\'impulsività e alla difficoltà nel controllo comportamentale.',
    'psicoticismo': 'Questo dominio misura esperienze e comportamenti insoliti o eccentrici.'
  };
  
  return descriptions[domainId] || '';
}

function getDomainInterpretation(domainId: string, score: number): string {
  const level = score >= 2.0 ? 'molto elevato' : score >= 1.5 ? 'elevato' : score >= 1.0 ? 'moderato' : 'basso';
  
  const interpretations: { [key: string]: { [level: string]: string } } = {
    'affettivita_negativa': {
      'molto elevato': 'Il punteggio indica una marcata tendenza a sperimentare emozioni negative intense, con possibili difficoltà nella regolazione emotiva.',
      'elevato': 'Si evidenzia una significativa propensione a stati emotivi negativi che potrebbero interferire con il funzionamento quotidiano.',
      'moderato': 'Presenza di alcune difficoltà nella gestione delle emozioni negative, ma entro limiti gestibili.',
      'basso': 'Buona capacità di gestione emotiva con limitata presenza di stati affettivi negativi.'
    },
    'distacco': {
      'molto elevato': 'Marcato ritiro sociale ed emotivo che potrebbe compromettere significativamente le relazioni interpersonali.',
      'elevato': 'Significativa tendenza all\'isolamento e difficoltà nel coinvolgimento emotivo con gli altri.',
      'moderato': 'Alcune difficoltà nelle relazioni interpersonali con tendenza al ritiro in situazioni sociali.',
      'basso': 'Adeguata capacità di coinvolgimento sociale ed emotivo.'
    },
    'antagonismo': {
      'molto elevato': 'Pattern pervasivo di comportamenti che creano conflitti significativi nelle relazioni interpersonali.',
      'elevato': 'Frequenti difficoltà relazionali dovute a comportamenti antagonisti o manipolativi.',
      'moderato': 'Occasionali conflitti interpersonali legati a tratti di personalità antagonisti.',
      'basso': 'Buone capacità relazionali con limitati comportamenti conflittuali.'
    },
    'disinibizione': {
      'molto elevato': 'Grave compromissione del controllo comportamentale con significativa impulsività e difficoltà organizzative.',
      'elevato': 'Marcate difficoltà nel controllo degli impulsi e nella pianificazione delle attività.',
      'moderato': 'Alcune difficoltà nel controllo comportamentale e nell\'organizzazione.',
      'basso': 'Buon controllo comportamentale e capacità organizzative adeguate.'
    },
    'psicoticismo': {
      'molto elevato': 'Presenza significativa di esperienze percettive o cognitive insolite che potrebbero richiedere attenzione clinica.',
      'elevato': 'Frequenti esperienze o comportamenti eccentrici che potrebbero interferire con il funzionamento.',
      'moderato': 'Occasionali esperienze insolite o comportamenti eccentrici.',
      'basso': 'Pensiero e percezione generalmente nella norma.'
    }
  };
  
  return interpretations[domainId]?.[level] || 'Punteggio nel range di normalità per questo dominio.';
}

function generateRecommendations(sortedDomains: any[], sortedFacets: any[]): string {
  const recommendations: string[] = [];
  
  // Raccomandazioni basate sui domini elevati
  sortedDomains.forEach(([domainId, score]: any) => {
    if (score.mean >= 1.5) {
      const domain = pid5Domains.find(d => d.id === domainId);
      
      switch(domainId) {
        case 'affettivita_negativa':
          recommendations.push(`
            <div class="recommendation-item">
              <strong>Gestione dell'Affettività Negativa</strong>
              <p>Si consiglia di esplorare strategie di regolazione emotiva, come tecniche di mindfulness, 
              terapia cognitivo-comportamentale focalizzata sulle emozioni, e sviluppo di competenze di coping adattive.</p>
            </div>
          `);
          break;
          
        case 'distacco':
          recommendations.push(`
            <div class="recommendation-item">
              <strong>Interventi per il Distacco Sociale</strong>
              <p>Potrebbe essere utile un approccio terapeutico che favorisca gradualmente il coinvolgimento sociale, 
              come la terapia interpersonale o interventi di social skills training.</p>
            </div>
          `);
          break;
          
        case 'antagonismo':
          recommendations.push(`
            <div class="recommendation-item">
              <strong>Miglioramento delle Relazioni Interpersonali</strong>
              <p>Si suggerisce un lavoro terapeutico focalizzato sull'empatia, la prospettiva dell'altro e 
              lo sviluppo di pattern relazionali più collaborativi.</p>
            </div>
          `);
          break;
          
        case 'disinibizione':
          recommendations.push(`
            <div class="recommendation-item">
              <strong>Potenziamento del Controllo Comportamentale</strong>
              <p>Interventi mirati al miglioramento delle funzioni esecutive, tecniche di autocontrollo e 
              strategie di pianificazione potrebbero essere particolarmente benefici.</p>
            </div>
          `);
          break;
          
        case 'psicoticismo':
          recommendations.push(`
            <div class="recommendation-item">
              <strong>Valutazione Approfondita delle Esperienze Insolite</strong>
              <p>Si raccomanda un'esplorazione clinica approfondita delle esperienze percettive e cognitive insolite 
              per determinare la loro natura e impatto sul funzionamento.</p>
            </div>
          `);
          break;
      }
    }
  });
  
  // Raccomandazione generale se tutti i punteggi sono bassi
  if (recommendations.length === 0) {
    recommendations.push(`
      <div class="recommendation-item">
        <strong>Profilo nella Norma</strong>
        <p>Il profilo di personalità non evidenzia aree di particolare criticità. Si suggerisce di mantenere 
        le attuali strategie di coping e continuare a monitorare il benessere psicologico generale.</p>
      </div>
    `);
  }
  
  // Aggiungi sempre una raccomandazione per il follow-up
  recommendations.push(`
    <div class="recommendation-item">
      <strong>Follow-up e Monitoraggio</strong>
      <p>Si consiglia una rivalutazione periodica per monitorare l'evoluzione del profilo di personalità 
      e l'efficacia degli eventuali interventi terapeutici implementati.</p>
    </div>
  `);
  
  return recommendations.join('');
} 