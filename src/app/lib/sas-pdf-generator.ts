import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { sasStatements, factorDefinitions } from './sas-data';
import { analyzePartTwoOrientation, generateOrientationAnalysis } from './sas-calculations';

interface PatientInfo {
  firstName: string;
  lastName: string;
  age: string;
}

export function generateSASReportPDF(results: any, testState: any, patientInfo: PatientInfo): Uint8Array {
  const doc = new jsPDF();
  let yPosition = 20;
  
  // Configurazione font e colori
  const primaryColor: [number, number, number] = [106, 76, 147]; // #6a4c93
  const textColor: [number, number, number] = [51, 51, 51]; // #333333
  const lightGray: [number, number, number] = [245, 245, 245]; // #f5f5f5

  
  // Prima pagina - Solo titolo e informazioni
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('Report Test S-AS', 105, yPosition + 20, { align: 'center' });
  
  yPosition += 40;
  doc.setFontSize(18);
  doc.setFont('helvetica', 'normal');
  doc.text('Scopo-Antiscopo', 105, yPosition, { align: 'center' });
  
  yPosition += 60;
  
  // Informazioni paziente
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.text('Informazioni Paziente', 20, yPosition);
  
  yPosition += 15;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  
  if (patientInfo.firstName || patientInfo.lastName) {
    doc.text(`Paziente: ${patientInfo.firstName} ${patientInfo.lastName}`, 20, yPosition);
    yPosition += 10;
  }
  if (patientInfo.age) {
    doc.text(`Età: ${patientInfo.age} anni`, 20, yPosition);
    yPosition += 10;
  }
  
  const date = new Date().toLocaleDateString('it-IT', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  doc.text(`Data completamento: ${date}`, 20, yPosition);
  
  // Nuova pagina per l'analisi dei fattori
  doc.addPage();
  yPosition = 20;
  
  // Titolo sezione
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Analisi dei Fattori (Parte I)', 20, yPosition);
  
  yPosition += 10;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('Questa analisi è basata sui punteggi assegnati nella Parte I del test.', 20, yPosition);
  
  yPosition += 15;
  
  // Tabella dei fattori
  const factorData = Object.values(results.factorScores || {})
    .sort((a: any, b: any) => a.id - b.id)
    .map((factor: any) => [
      factor.id + '. ' + factor.name,
      factor.score.toFixed(1) // Punteggio con 1 decimale per la media
    ]);
  
  autoTable(doc, {
    startY: yPosition,
    head: [['Fattore', 'Punteggio Medio']],
    body: factorData,
    theme: 'grid',
    headStyles: {
      fillColor: lightGray,
      textColor: textColor,
      fontStyle: 'bold'
    },
    styles: {
      fontSize: 10,
      cellPadding: 5
    }
  });
  
  yPosition = (doc as any).lastAutoTable.finalY + 20;
  
  // Grafico a barre (simulato con rettangoli)
  const maxScore = 4;
  const barWidth = 18;
  const barSpacing = 22;
  const chartHeight = 60;
  const chartStartX = 25;
  const chartStartY = yPosition + 20;
  
  // Disegna asse Y e griglia
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  
  // Linee orizzontali della griglia
  for (let i = 0; i <= 4; i++) {
    const y = chartStartY + chartHeight - (i / 4) * chartHeight;
    doc.line(chartStartX - 5, y, chartStartX + (barSpacing * 8), y);
    // Etichette asse Y
    doc.setFontSize(8);
    doc.text(i.toString(), chartStartX - 10, y + 2);
  }
  
  // Linea base del grafico
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(1);
  doc.line(chartStartX - 5, chartStartY + chartHeight, chartStartX + (barSpacing * 8), chartStartY + chartHeight);
  
  // Disegna le barre
  factorData.forEach((factor: any[], index: number) => {
    const score = parseFloat(factor[1]);
    const barHeight = (score / maxScore) * chartHeight;
    const x = chartStartX + (index * barSpacing);
    const y = chartStartY + chartHeight - barHeight;
    
    // Colori alternati per le barre
    const colors = [
      [147, 112, 219], // Mediumpurple
      [135, 206, 235], // Skyblue
      [255, 182, 193], // Lightpink
      [144, 238, 144], // Lightgreen
      [255, 218, 185], // Peachpuff
      [255, 192, 203], // Pink
      [221, 160, 221], // Plum
      [176, 224, 230]  // Powderblue
    ];
    
    const color = colors[index % colors.length];
    doc.setFillColor(color[0], color[1], color[2]);
    doc.rect(x, y, barWidth, barHeight, 'F');
    
    // Bordo della barra
    doc.setDrawColor(100, 100, 100);
    doc.setLineWidth(0.5);
    doc.rect(x, y, barWidth, barHeight, 'S');
    
    // Valore sopra la barra
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(factor[1], x + barWidth/2, y - 3, { align: 'center' });
  });
  
  // Etichette sotto il grafico
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  factorData.forEach((factor: any[], index: number) => {
    const x = chartStartX + (index * barSpacing) + barWidth/2;
    const label = 'F' + (index + 1);
    doc.text(label, x, chartStartY + chartHeight + 8, { align: 'center' });
  });
  
  // Aggiorna yPosition dopo il grafico
  yPosition = chartStartY + chartHeight + 30;
  
  // Nuova pagina per l'analisi qualitativa
  doc.addPage();
  yPosition = 20;
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Analisi dei Fattori', 20, yPosition);
  
  yPosition += 15;
  
  // Analisi qualitativa per ogni fattore
  const orderedFactors = Object.values(results.factorScores || {})
    .sort((a: any, b: any) => a.id - b.id);
  
  orderedFactors.forEach((factor: any) => {
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }
    
    // Titolo del fattore
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(factor.id + '. ' + factor.name + ' (' + factor.score.toFixed(1) + ')', 20, yPosition);
    
    yPosition += 8;
    
    // Descrizione del fattore
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    const description = 'Punteggio ' + getScoreLevel(factor.score) + ' (punteggio significativamente sopra la tua media personale)';
    const descLines = doc.splitTextToSize(description, 170);
    descLines.forEach((line: string) => {
      doc.text(line, 20, yPosition);
      yPosition += 5;
    });
    
    yPosition += 5;
    
    // Testo dell'analisi
    doc.setFont('helvetica', 'normal');
    const analysis = getFactorAnalysis(factor.id, factor.score);
    const analysisLines = doc.splitTextToSize(analysis, 170);
    analysisLines.forEach((line: string) => {
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 20;
      }
      doc.text(line, 20, yPosition);
      yPosition += 5;
    });
    
    yPosition += 10;
  });
  
  // Nuova pagina per Orientamento Scopi vs Antiscopi
  doc.addPage();
  yPosition = 20;
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Orientamento Scopi vs Antiscopi (Parte II)', 20, yPosition);
  
  yPosition += 10;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('Questa analisi mostra la tendenza a scegliere Scopi o Antiscopi nella Parte II del test.', 20, yPosition);
  
  yPosition += 20;
  
  // Calcola orientamento
  const orientationData = analyzePartTwoOrientation(testState);
  
  // Box riepilogativo con bordo
  doc.setDrawColor(106, 76, 147);
  doc.setLineWidth(1);
  doc.roundedRect(20, yPosition, 170, 40, 3, 3, 'S');
  
  // Contenuto del box
  yPosition += 15;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 123, 255); // Blu per Scopi
  doc.text('Scelte Scopi: ' + orientationData.scopi.count, 40, yPosition);
  doc.setTextColor(255, 105, 180); // Rosa per Antiscopi
  doc.text('Scelte Antiscopi: ' + orientationData.antiscopi.count, 110, yPosition);
  
  yPosition += 35;
  
  // Grafico a barre orizzontali per orientamento
  const maxChoices = 20;
  const barWidth2 = 120;
  const barHeight2 = 20;
  
  // Barra Scopi
  doc.setFillColor(135, 206, 235); // Skyblue
  const scopiWidth = (orientationData.scopi.count / maxChoices) * barWidth2;
  doc.rect(30, yPosition, scopiWidth, barHeight2, 'F');
  doc.setDrawColor(100, 100, 100);
  doc.rect(30, yPosition, barWidth2, barHeight2, 'S');
  
  // Etichetta Scopi
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 51, 51);
  doc.text('Scopi', 155, yPosition + 13);
  
  yPosition += 30;
  
  // Barra Antiscopi
  doc.setFillColor(255, 182, 193); // Lightpink
  const antiscopiWidth = (orientationData.antiscopi.count / maxChoices) * barWidth2;
  doc.rect(30, yPosition, antiscopiWidth, barHeight2, 'F');
  doc.setDrawColor(100, 100, 100);
  doc.rect(30, yPosition, barWidth2, barHeight2, 'S');
  
  // Etichetta Antiscopi
  doc.text('Antiscopi', 155, yPosition + 13);
  
  yPosition += 40;
  
  // Grafico a torta migliorato
  const centerX = 105;
  const centerY = yPosition + 35;
  const radius = 30;
  
  // Calcola angoli per il grafico a torta
  const total = orientationData.scopi.count + orientationData.antiscopi.count;
  const scopiAngle = (orientationData.scopi.count / total) * 2 * Math.PI;
  const antiscopiAngle = (orientationData.antiscopi.count / total) * 2 * Math.PI;
  
  // Disegna settore Scopi
  doc.setFillColor(135, 206, 235);
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(2);
  
  // Usa un approccio semplificato per il grafico a torta
  // Disegna prima il cerchio completo con il colore degli Antiscopi
  doc.setFillColor(255, 182, 193);
  doc.ellipse(centerX, centerY, radius, radius, 'F');
  
  // Poi disegna il settore degli Scopi sopra
  if (orientationData.scopi.count > 0) {
    doc.setFillColor(135, 206, 235);
    // Approssimazione del settore con triangoli
    const segments = 20;
    const anglePerSegment = scopiAngle / segments;
    for (let i = 0; i < segments; i++) {
      const angle1 = -Math.PI/2 + i * anglePerSegment;
      const angle2 = -Math.PI/2 + (i + 1) * anglePerSegment;
      const x1 = centerX + radius * Math.cos(angle1);
      const y1 = centerY + radius * Math.sin(angle1);
      const x2 = centerX + radius * Math.cos(angle2);
      const y2 = centerY + radius * Math.sin(angle2);
      doc.triangle(centerX, centerY, x1, y1, x2, y2, 'F');
    }
  }
  
  // Bordo del cerchio
  doc.setDrawColor(100, 100, 100);
  doc.setLineWidth(1);
  doc.ellipse(centerX, centerY, radius, radius, 'S');
  
  // Percentuali accanto al grafico
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  const scopiPerc = Math.round((orientationData.scopi.count / total) * 100);
  const antiscopiPerc = Math.round((orientationData.antiscopi.count / total) * 100);
  
  doc.setTextColor(0, 123, 255);
  doc.text(`Scopi: ${scopiPerc}%`, centerX + radius + 10, centerY - 10);
  doc.setTextColor(255, 105, 180);
  doc.text(`Antiscopi: ${antiscopiPerc}%`, centerX + radius + 10, centerY + 10);
  
  // Testo dell'analisi
  yPosition = centerY + radius + 30;
  doc.setTextColor(51, 51, 51);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  const orientationAnalysis = generateOrientationAnalysis(orientationData);
  const orientationLines = doc.splitTextToSize(orientationAnalysis, 170);
  orientationLines.forEach((line: string) => {
    if (yPosition > 270) {
      doc.addPage();
      yPosition = 20;
    }
    doc.text(line, 20, yPosition);
    yPosition += 5;
  });
  
  // Nuova pagina per Parte I - Valutazione delle Coppie
  doc.addPage();
  yPosition = 20;
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Parte I - Valutazione delle Coppie', 20, yPosition);
  
  yPosition += 15;
  
  // Tabella delle valutazioni
  const part1Data = sasStatements.map((stmt: any) => {
    const scoreS = testState.part1.answers?.[stmt.id + "S"] || 0;
    const scoreAS = testState.part1.answers?.[stmt.id + "AS"] || 0;
    return [
      stmt.id,
      stmt.scopo,
      scoreS.toString(),
      stmt.antiscopo,
      scoreAS.toString()
    ];
  });
  
  autoTable(doc, {
    startY: yPosition,
    head: [['Coppia', 'Affermazione Scopo', 'Punteggio Scopo', 'Affermazione Antiscopo', 'Punteggio Antiscopo']],
    body: part1Data,
    theme: 'grid',
    headStyles: {
      fillColor: lightGray,
      textColor: textColor,
      fontStyle: 'bold',
      fontSize: 9
    },
    styles: {
      fontSize: 8,
      cellPadding: 3
    },
    columnStyles: {
      0: { cellWidth: 15 },
      1: { cellWidth: 60 },
      2: { cellWidth: 20, halign: 'center' },
      3: { cellWidth: 60 },
      4: { cellWidth: 20, halign: 'center' }
    }
  });
  
  // Nuova pagina per Domande Aperte
  doc.addPage();
  yPosition = 20;
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Domande Aperte (Parte III)', 20, yPosition);
  
  yPosition += 15;
  
  // Affermazioni selezionate con wrapping migliorato
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Affermazioni selezionate:', 20, yPosition);
  
  yPosition += 10;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  
  if (testState.part3.selectedStatements && Array.isArray(testState.part3.selectedStatements)) {
    testState.part3.selectedStatements.forEach((sel: string) => {
      const parts = sel.split(":");
      if(parts.length === 2) {
        const stmt = sasStatements.find((s: any) => s.id === parts[0]);
        if(stmt) {
          const text = parts[1] === "S" ? stmt.scopo : stmt.antiscopo;
          const type = parts[1] === "S" ? "Scopo" : "Antiscopo";
          
          // Controlla se serve nuova pagina
          if (yPosition > 250) {
            doc.addPage();
            yPosition = 20;
          }
          
          // Tipo in grassetto
          doc.setFont('helvetica', 'bold');
          doc.text(type + ':', 20, yPosition);
          
          // Testo con wrapping
          doc.setFont('helvetica', 'normal');
          const lines = doc.splitTextToSize(text, 160);
          lines.forEach((line: string, idx: number) => {
            if (idx === 0) {
              doc.text(line, 50, yPosition);
            } else {
              yPosition += 5;
              doc.text(line, 50, yPosition);
            }
          });
          yPosition += 8;
        }
      }
    });
  }
  
  yPosition += 10;
  
  // Domande e risposte con box
  const questions = [
    { num: '2', label: 'Cosa pensi di queste affermazioni?', text: testState.part3.answers?.q2 || '' },
    { num: '3', label: 'Come ti fanno sentire?', text: testState.part3.answers?.q3 || '' },
    { num: '4', label: 'Hai raggiunto i tuoi obiettivi?', text: testState.part3.answers?.q4 === 'yes' ? 'Sì' : (testState.part3.answers?.q4 === 'no' ? 'No' : '') }
  ];
  
  if (testState.part3.answers?.q4 === 'yes' && testState.part3.answers?.q5) {
    questions.push({ num: '5', label: 'Quali obiettivi hai raggiunto?', text: testState.part3.answers.q5 });
  } else if (testState.part3.answers?.q4 === 'no' && testState.part3.answers?.q6) {
    questions.push({ num: '6', label: 'Perché non li hai raggiunti?', text: testState.part3.answers.q6 });
  }
  
  questions.forEach((q) => {
    if (yPosition > 230) {
      doc.addPage();
      yPosition = 20;
    }
    
    // Box per la domanda
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    const boxHeight = 8 + (doc.splitTextToSize(q.text, 160).length * 5);
    doc.roundedRect(20, yPosition - 3, 170, boxHeight, 2, 2, 'S');
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Domanda ' + q.num + ': ' + q.label, 25, yPosition + 3);
    yPosition += 8;
    
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(q.text, 160);
    lines.forEach((line: string) => {
      doc.text(line, 25, yPosition);
      yPosition += 5;
    });
    
    yPosition += 10;
  });
  
  // Restituisci il PDF come Uint8Array
  return doc.output('arraybuffer') as Uint8Array;
}

// Funzioni helper
function getScoreLevel(score: number): string {
  if (score >= 3.5) return 'elevato';
  if (score >= 2.5) return 'moderato';
  return 'basso';
}

function getFactorAnalysis(factorId: number, score: number): string {
  const analyses: { [key: number]: string } = {
    1: 'Questo fattore riflette la ricerca di prestigio e riconoscimento sociale. Un punteggio elevato indica una forte motivazione a distinguersi e ottenere l\'ammirazione degli altri.',
    2: 'La stabilità emotiva è un fattore chiave per il benessere psicologico. Il tuo punteggio suggerisce una buona capacità di regolazione emotiva.',
    3: 'L\'esclusione sociale è una preoccupazione comune. Il tuo punteggio indica il livello di sensibilità a situazioni di rifiuto o isolamento.',
    4: 'Il perfezionismo può essere sia una risorsa che un limite. Il tuo punteggio riflette la tendenza a porsi standard elevati.',
    5: 'La capacità di difendersi è importante per mantenere confini sani. Il tuo punteggio indica come gestisci le situazioni conflittuali.',
    6: 'L\'autostima è fondamentale per il benessere psicologico. Il tuo punteggio riflette la percezione del tuo valore personale.',
    7: 'L\'individualità rappresenta il bisogno di esprimere la propria unicità. Il tuo punteggio indica quanto valorizzi l\'autonomia personale.',
    8: 'La fiducia negli altri è essenziale per relazioni sane. Il tuo punteggio riflette la tua apertura verso gli altri.'
  };
  
  return analyses[factorId] || 'Analisi non disponibile per questo fattore.';
} 