import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';
import { prisma } from '../../../../lib/prisma';
import { sasStatements, factorDefinitions } from '../../../../lib/sas-data';
import { analyzePartTwoOrientation, generateOrientationAnalysis, generateQualitativeAnalysis } from '../../../../lib/sas-calculations';

export async function POST(request: NextRequest) {
  try {
    console.log('Ricevuta richiesta POST per salvare risultati S-AS');
    
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
    const { results, completedAt, testState, patientInfo } = body;

    console.log('Dati ricevuti:', {
      hasResults: !!results,
      hasTestState: !!testState,
      hasPatientInfo: !!patientInfo,
      completedAt
    });

    if (!results) {
      return NextResponse.json(
        { error: 'Risultati mancanti' }, 
        { status: 400 }
      );
    }

    // Genera il contenuto del report
    const reportContent = generateSASReportContent(results, testState, patientInfo);
    
    console.log('Report content generato, lunghezza:', reportContent.length);
    
    // Salva direttamente come Report (non come TestResult)
    const report = await prisma.report.create({
      data: {
        userId: session.user.id,
        testResultId: null, // Non collegato a un TestResult specifico
        title: `Test S-AS - ${new Date(completedAt || new Date()).toLocaleDateString('it-IT')}`,
        content: JSON.stringify({
          html: reportContent,
          results: results,
          testState: testState,
          patientInfo: patientInfo
        }),
        metadata: JSON.stringify({
          testType: 'sas', // Minuscolo per coerenza
          completedAt: completedAt || new Date(),
          scopo: results.scopo,
          antiscopo: results.antiscopo,
          balance: results.balance,
          factorScores: results.factorScores,
          topFactors: Object.values(results.factorScores || {})
            .sort((a: any, b: any) => b.score - a.score)
            .slice(0, 3)
            .map((f: any) => ({ id: f.id, name: f.name, score: f.score })),
          interpretation: results.interpretation,
          recommendations: results.recommendations,
          orientationData: analyzePartTwoOrientation(testState)
        })
      }
    });

    console.log('Report salvato con successo, ID:', report.id);

    return NextResponse.json({ 
      success: true, 
      reportId: report.id 
    });

  } catch (error) {
    console.error('Errore nel salvataggio del report S-AS:', error);
    return NextResponse.json(
      { error: 'Errore interno del server', details: error instanceof Error ? error.message : 'Errore sconosciuto' }, 
      { status: 500 }
    );
  }
}

function generateSASReportContent(results: any, testState: any, patientInfo: any): string {
  const date = new Date().toLocaleDateString('it-IT', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  // Controlli di sicurezza per i dati
  if (!testState || !testState.part1 || !testState.part2 || !testState.part3) {
    console.error('TestState incompleto:', testState);
    throw new Error('TestState incompleto');
  }
  
  const orientationData = analyzePartTwoOrientation(testState);
  const orderedFactors = Object.values(results.factorScores || {})
    .sort((a: any, b: any) => a.id - b.id);
  
  // Genera tabella Parte I
  let tablePart1 = '<table>' +
    '<tr>' +
    '<th>Coppia</th>' +
    '<th>Affermazione Scopo</th>' +
    '<th>Punteggio Scopo</th>' +
    '<th>Affermazione Antiscopo</th>' +
    '<th>Punteggio Antiscopo</th>' +
    '</tr>';
  
  for(let i = 0; i < sasStatements.length; i++){
    const stmt = sasStatements[i];
    const scoreS = testState.part1.answers?.[stmt.id + "S"] !== undefined ? testState.part1.answers[stmt.id + "S"] : "-";
    const scoreAS = testState.part1.answers?.[stmt.id + "AS"] !== undefined ? testState.part1.answers[stmt.id + "AS"] : "-";
    tablePart1 += '<tr>' +
      '<td>' + stmt.id + '</td>' +
      '<td>' + stmt.scopo + '</td>' +
      '<td>' + scoreS + '</td>' +
      '<td>' + stmt.antiscopo + '</td>' +
      '<td>' + scoreAS + '</td>' +
      '</tr>';
  }
  tablePart1 += '</table>';
  
  // Genera tabella Parte II - SOLO SCELTE, SENZA PUNTEGGI
  let tablePart2 = '<table>' +
    '<tr>' +
    '<th>Coppia</th>' +
    '<th>Scelta</th>' +
    '<th>Affermazione Scelta</th>' +
    '</tr>';
  
  for(let i = 0; i < sasStatements.length; i++){
    const stmt = sasStatements[i];
    if(testState.part2.answers?.[stmt.id]) {
      const choice = testState.part2.answers[stmt.id].type;
      const text = (choice === "S") ? stmt.scopo : stmt.antiscopo;
      const choiceText = (choice === "S") ? "Scopo" : "Antiscopo";
      tablePart2 += '<tr>' +
        '<td>' + stmt.id + '</td>' +
        '<td>' + choiceText + '</td>' +
        '<td>' + text + '</td>' +
        '</tr>';
    } else {
      tablePart2 += '<tr>' +
        '<td>' + stmt.id + '</td>' +
        '<td>-</td>' +
        '<td>-</td>' +
        '</tr>';
    }
  }
  tablePart2 += '</table>';
  
  // Sezione Domande Aperte
  let openQuestions = '<div class="open-questions">' +
    '<h4>Domande Aperte (Parte III)</h4>' +
    '<div class="question-answer"><strong>Affermazioni selezionate:</strong>';
  
  if (testState.part3.selectedStatements && Array.isArray(testState.part3.selectedStatements)) {
  testState.part3.selectedStatements.forEach((sel: string) => {
    const parts = sel.split(":");
    if(parts.length === 2) {
      const stmt = sasStatements.find((s: any) => s.id === parts[0]);
      if(stmt) {
        const text = parts[1] === "S" ? stmt.scopo : stmt.antiscopo;
        const type = parts[1] === "S" ? "Scopo" : "Antiscopo";
          openQuestions += '<p class="selected-statement"><span class="statement-type">' + type + ':</span> ' + text + '</p>';
      }
    }
  });
  }
  
  openQuestions += '</div>';
  openQuestions += '<div class="question-answer"><strong>Domanda 2:</strong> <p>' + (testState.part3.answers?.q2 || "-") + '</p></div>';
  openQuestions += '<div class="question-answer"><strong>Domanda 3:</strong> <p>' + (testState.part3.answers?.q3 || "-") + '</p></div>';
  openQuestions += '<div class="question-answer"><strong>Domanda 4:</strong> <p>' + (testState.part3.answers?.q4 === "yes" ? "Sì" : (testState.part3.answers?.q4 === "no" ? "No" : "-")) + '</p></div>';
  
  if(testState.part3.answers?.q4 === "yes") {
    openQuestions += '<div class="question-answer"><strong>Domanda 5:</strong> <p>' + (testState.part3.answers?.q5 || "-") + '</p></div>';
  } else if(testState.part3.answers?.q4 === "no") {
    openQuestions += '<div class="question-answer"><strong>Domanda 6:</strong> <p>' + (testState.part3.answers?.q6 || "-") + '</p></div>';
  }
  openQuestions += '</div>';
  
  // Genera analisi qualitativa dei fattori
  const qualitativeAnalysis = generateQualitativeAnalysis(orderedFactors);
  
  // Prepara i dati per i grafici
  const factorLabels = orderedFactors.map((f: any) => f.id + '. ' + f.name);
  const factorData = orderedFactors.map((f: any) => f.score.toFixed(1));
  
  return `
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Report Test S-AS - ${patientInfo?.firstName || ''} ${patientInfo?.lastName || ''}</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <style>
    /* Reset e variabili CSS - IDENTICHE AL MONOLITA */
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
    
    .sas-report {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
    
    /* Stili per le card del report - IDENTICI AL MONOLITA */
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
      grid-template-columns: repeat(3, 1fr);
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
    
    .score-card.scopo { border-color: #6a4c93; }
    .score-card.antiscopo { border-color: #6c757d; }
    .score-card.balance { border-color: #17a2b8; }
    
    .score-number {
      font-size: 36px;
      font-weight: bold;
      margin: 10px 0;
    }
    
    /* Stili per l'analisi dei fattori */
    .factor-table {
      width: 100%;
      margin: 20px 0;
    }
    
    .factor-table th {
      background: #8f70b7;
      color: white;
      padding: 10px;
    }
    
    .factor-table td {
      padding: 10px;
      border-bottom: 1px solid #ddd;
    }
    
    /* Stili per l'analisi qualitativa - IDENTICI AL MONOLITA */
    .factors-analysis-container {
      padding: 5px;
    }
    
    .factor-analysis-item {
      margin-bottom: 25px;
      padding: 18px;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      background-color: #fcfcfc;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
      page-break-inside: avoid;
      break-inside: avoid;
    }
    
    .factor-analysis-item h4 {
      font-size: 1.15rem;
      margin-bottom: 15px;
      padding-bottom: 10px;
      border-bottom: 1px solid #eee;
      color: #6a4c93;
      font-weight: 600;
    }
    
    .factor-analysis-item p {
      margin-bottom: 15px;
      line-height: 1.6;
      font-size: 1rem;
    }
    
    .factor-analysis-item em {
      display: block;
      margin-bottom: 15px;
      padding: 12px;
      background-color: #f8f5ff;
      border-left: 4px solid #6a4c93;
      font-style: normal;
      font-weight: 500;
      border-radius: 0 4px 4px 0;
    }
    
    .factor-analysis-item .high-factor {
      color: #4CAF50;
      font-weight: 600;
    }
    
    .factor-analysis-item .medium-factor {
      color: #2196F3;
      font-weight: 600;
    }
    
    .factor-analysis-item .low-factor {
      color: #FFC107;
      font-weight: 600;
    }
    
    /* Stili per orientamento */
    .orientation-box {
      background: #e8f4fd;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
    }
    
    .orientation-analysis {
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid #eee;
      line-height: 1.6;
      font-size: 1rem;
    }
    
    /* Stili per le domande aperte */
    .open-questions {
      background: #f0f0f0;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
    }
    
    .open-questions h4 {
      color: #6a4c93;
      margin-top: 20px;
    }
    
    .open-questions p {
      margin: 10px 0;
    }
    
    .question-answer {
      margin-bottom: 20px;
    }
    
    .question-answer strong {
      color: #6a4c93;
      display: block;
      margin-bottom: 5px;
    }
    
    .selected-statement {
      background: white;
      padding: 10px;
      border-radius: 4px;
      margin: 5px 0;
    }
    
    .statement-type {
      font-weight: bold;
      color: #6a4c93;
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
      
      .factor-analysis-item {
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
  <div class="sas-report">
    <div class="report-card">
      <h3>Report Test S-AS (Scopo-Antiscopo)</h3>
    <p><strong>Paziente:</strong> ${patientInfo?.firstName || ''} ${patientInfo?.lastName || ''}</p>
      <p><strong>Età:</strong> ${patientInfo?.age || ''}</p>
      <p><strong>Terapeuta:</strong> ${patientInfo?.therapistName || 'Non specificato'}</p>
    <p><strong>Data completamento:</strong> ${date}</p>
  </div>
  

  
  <div class="report-card">
    <h3>Analisi dei Fattori (Parte I)</h3>
    <p>Questa analisi è basata sui punteggi assegnati nella Parte I del test.</p>
    <table class="factor-table">
        <tr>
          <th>Fattore</th>
          <th>Punteggio Medio</th>
          <th>Descrizione</th>
        </tr>
      ${orderedFactors.map((factor: any) => `
        <tr>
          <td><strong>${factor.id}. ${factor.name}</strong></td>
            <td style="text-align: center;">${factor.score.toFixed(1)}</td>
          <td>${factorDefinitions[factor.id]?.description || ''}</td>
        </tr>
      `).join('')}
    </table>
      <div class="chart-container">
        <canvas id="factorsChart"></canvas>
      </div>
  </div>
  
  <div class="report-card">
    <h3>Analisi Qualitativa dei Fattori</h3>
    <div class="qualitative-analysis">
      ${qualitativeAnalysis}
    </div>
  </div>
  
  <div class="report-card">
    <h3>Orientamento Scopi vs Antiscopi (Parte II)</h3>
      <p>Questa analisi mostra la tendenza a scegliere Scopi o Antiscopi nella Parte II del test.</p>
    <div class="orientation-box">
      <p><strong>Scelte Scopi:</strong> ${orientationData.scopi.count}</p>
      <p><strong>Scelte Antiscopi:</strong> ${orientationData.antiscopi.count}</p>
      ${generateOrientationAnalysis(orientationData)}
    </div>
      <div class="chart-container">
        <canvas id="orientationChart"></canvas>
    </div>
  </div>
  
  <div class="report-card">
    <h3>Parte I - Valutazione delle Coppie</h3>
    ${tablePart1}
  </div>
  

  
  <div class="report-card">
    <h3>Parte III - Domande Aperte</h3>
    ${openQuestions}
  </div>
  
  <div class="report-card">
    <h3>Raccomandazioni</h3>
    <div class="recommendations">
        ${results.recommendations && Array.isArray(results.recommendations) ? 
          results.recommendations.map((rec: any) => `
        <div class="recommendation-item">
          <strong>${rec.title}</strong>
          <p>${rec.description}</p>
        </div>
          `).join('') : 
          '<p>Nessuna raccomandazione disponibile</p>'
        }
      </div>
    </div>
  </div>
  
  <script>
    // Grafico dei fattori
    const factorsCtx = document.getElementById('factorsChart').getContext('2d');
    new Chart(factorsCtx, {
      type: 'bar',
      data: {
        labels: ${JSON.stringify(factorLabels)},
        datasets: [{
          label: 'Punteggio Medio',
          data: ${JSON.stringify(factorData)},
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
          borderColor: [
            'rgba(106,76,147,1)',
            'rgba(79,157,166,1)',
            'rgba(247,172,166,1)',
            'rgba(151,202,114,1)',
            'rgba(255,194,102,1)',
            'rgba(255,130,130,1)',
            'rgba(149,125,173,1)',
            'rgba(100,181,190,1)'
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
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return 'Punteggio: ' + context.parsed.y;
              }
            }
          }
        }
      }
    });
    
    // Grafico orientamento
    const orientationCtx = document.getElementById('orientationChart').getContext('2d');
    new Chart(orientationCtx, {
      type: 'pie',
      data: {
        labels: ['Scopi', 'Antiscopi'],
        datasets: [{
          data: [${orientationData.scopi.count}, ${orientationData.antiscopi.count}],
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
              label: function(context) {
                const label = context.label || '';
                const value = context.parsed || 0;
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const percentage = Math.round((value / total) * 100);
                return label + ': ' + value + ' (' + percentage + '%)';
              }
            }
          }
        }
      }
    });
  </script>
</body>
</html>
  `.trim();
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non autenticato' }, 
        { status: 401 }
      );
    }

    // Recupera tutti i report S-AS dell'utente
    const reports = await prisma.report.findMany({
      where: {
        userId: session.user.id,
        metadata: {
          contains: '"testType":"SAS"'
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        id: true,
        title: true,
        createdAt: true,
        metadata: true,
        content: true
      }
    });

    // Parse dei JSON fields
    const parsedResults = reports.map(report => {
      const metadata = report.metadata ? JSON.parse(report.metadata) : {};
      return {
        id: report.id,
        testTitle: report.title,
        completedAt: metadata.completedAt || report.createdAt,
        score: metadata.balance || 0,
        maxScore: 8,
        metadata: metadata
      };
    });

    return NextResponse.json({ 
      success: true, 
      results: parsedResults 
    });

  } catch (error) {
    console.error('Errore nel recupero dei report S-AS:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' }, 
      { status: 500 }
    );
  }
} 