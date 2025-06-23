import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { pid5Facets, pid5Domains } from './pid5-data';

interface PatientInfo {
  firstName: string;
  lastName: string;
  age: string;
  therapistName?: string;
}

export function generatePID5ReportPDF(results: any, testState: any, patientInfo: PatientInfo): Uint8Array {
  const doc = new jsPDF();
  let yPosition = 20;
  
  // Configurazione font e colori
  const primaryColor = [106, 76, 147]; // #6a4c93
  const textColor = [51, 51, 51]; // #333333
  const lightGray = [245, 245, 245]; // #f5f5f5
  
  // Prima pagina - Intestazione con box
  doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setLineWidth(2);
  doc.roundedRect(15, 15, 180, 60, 3, 3, 'S');
  
  // Titolo principale
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('Report Test PID-5', 105, yPosition + 10, { align: 'center' });
  
  yPosition += 20;
  doc.setFontSize(14);
  doc.text('Personality Inventory for DSM-5', 105, yPosition, { align: 'center' });
  
  yPosition += 15;
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.text(patientInfo.firstName + ' ' + patientInfo.lastName, 105, yPosition, { align: 'center' });
  
  yPosition += 25;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  
  // Info paziente in formato tabella
  const infoStartX = 30;
  doc.text('Età:', infoStartX, yPosition);
  doc.text(patientInfo.age + ' anni', infoStartX + 40, yPosition);
  
  const date = new Date().toLocaleDateString('it-IT', {
    day: '2-digit',
    month: '2-digit', 
    year: 'numeric'
  });
  doc.text('Data:', 120, yPosition);
  doc.text(date, 120 + 40, yPosition);
  
  yPosition += 10;
  doc.text('Terapeuta:', infoStartX, yPosition);
  doc.text(patientInfo.therapistName || 'Non specificato', infoStartX + 40, yPosition);
  
  // Nuova pagina per i domini
  doc.addPage();
  yPosition = 20;
  
  // Titolo sezione
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Riepilogo Domini di Personalità', 20, yPosition);
  
  yPosition += 10;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('Il PID-5 valuta 5 domini principali della personalità secondo il modello dimensionale del DSM-5.', 20, yPosition);
  
  yPosition += 15;
  
  // Tabella dei domini
  const { domainScores, facetScores } = results.scores;
  const sortedDomains = Object.entries(domainScores)
    .sort(([,a]: any, [,b]: any) => b.mean - a.mean);
  
  const domainData = sortedDomains.map(([domainId, score]: any) => {
    const domain = pid5Domains.find(d => d.id === domainId);
    const interpretation = getScoreInterpretation(score.mean);
    return [
      domain?.name || domainId,
      score.mean.toFixed(2),
      interpretation.label
    ];
  });
  
  autoTable(doc, {
    startY: yPosition,
    head: [['Dominio', 'Punteggio Medio', 'Interpretazione']],
    body: domainData,
    theme: 'grid',
    headStyles: {
      fillColor: primaryColor as [number, number, number],
      textColor: [255, 255, 255] as [number, number, number],
      fontStyle: 'bold'
    },
    styles: {
      fontSize: 10,
      cellPadding: 5
    },
    columnStyles: {
      2: {
        cellWidth: 40,
        halign: 'center'
      }
    },
    didDrawCell: (data: any) => {
      // Colora le celle di interpretazione
      if (data.column.index === 2 && data.cell.section === 'body') {
        const interpretation = data.cell.text[0];
        let color;
        if (interpretation === 'Molto Elevato' || interpretation === 'Elevato') {
          color = [255, 235, 238]; // Rosso chiaro
        } else if (interpretation === 'Medio') {
          color = [255, 249, 196]; // Giallo chiaro
        } else {
          color = [232, 245, 233]; // Verde chiaro
        }
        doc.setFillColor(color[0], color[1], color[2]);
        doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'F');
        doc.setTextColor(0, 0, 0);
        doc.text(data.cell.text[0], data.cell.x + data.cell.width / 2, data.cell.y + data.cell.height / 2 + 1, { align: 'center' });
      }
    }
  });
  
  yPosition = (doc as any).lastAutoTable.finalY + 20;
  
  // Grafico radar dei domini (simulato con barre)
  const maxScore = 3;
  const barWidth = 30;
  const barSpacing = 35;
  const chartHeight = 60;
  const chartStartX = 25;
  const chartStartY = yPosition + 20;
  
  // Disegna asse Y e griglia
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  
  // Linee orizzontali della griglia
  for (let i = 0; i <= 3; i++) {
    const y = chartStartY + chartHeight - (i / 3) * chartHeight;
    doc.line(chartStartX - 5, y, chartStartX + (barSpacing * 5), y);
    // Etichette asse Y
    doc.setFontSize(8);
    doc.text(i.toString(), chartStartX - 10, y + 2);
  }
  
  // Linea base del grafico
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(1);
  doc.line(chartStartX - 5, chartStartY + chartHeight, chartStartX + (barSpacing * 5), chartStartY + chartHeight);
  
  // Disegna le barre per i domini
  sortedDomains.forEach(([domainId, score]: any, index: number) => {
    const barHeight = (score.mean / maxScore) * chartHeight;
    const x = chartStartX + (index * barSpacing);
    const y = chartStartY + chartHeight - barHeight;
    
    // Colore basato sul punteggio
    let color;
    if (score.mean >= 2.0) {
      color = [220, 53, 69]; // Rosso
    } else if (score.mean >= 1.5) {
      color = [255, 152, 0]; // Arancione
    } else if (score.mean >= 1.0) {
      color = [255, 193, 7]; // Giallo
    } else {
      color = [40, 167, 69]; // Verde
    }
    
    doc.setFillColor(color[0], color[1], color[2]);
    doc.rect(x, y, barWidth, barHeight, 'F');
    
    // Bordo della barra
    doc.setDrawColor(100, 100, 100);
    doc.setLineWidth(0.5);
    doc.rect(x, y, barWidth, barHeight, 'S');
    
    // Valore sopra la barra
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(score.mean.toFixed(2), x + barWidth/2, y - 3, { align: 'center' });
    
    // Nome del dominio sotto (abbreviato)
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    const domain = pid5Domains.find(d => d.id === domainId);
    const abbrev = domain?.name.substring(0, 8) || domainId.substring(0, 8);
    doc.text(abbrev, x + barWidth/2, chartStartY + chartHeight + 8, { align: 'center' });
  });
  
  // Nuova pagina per l'analisi qualitativa
  doc.addPage();
  yPosition = 20;
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Analisi Qualitativa dei Domini', 20, yPosition);
  
  yPosition += 15;
  
  // Analisi per ogni dominio con punteggio significativo
  sortedDomains.forEach(([domainId, score]: any) => {
    if (score.mean >= 1.0) { // Solo domini con punteggi significativi
      if (yPosition > 240) {
        doc.addPage();
        yPosition = 20;
      }
      
      const domain = pid5Domains.find(d => d.id === domainId);
      const interpretation = getScoreInterpretation(score.mean);
      
      // Titolo del dominio
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`${domain?.name || domainId} - ${interpretation.label} (${score.mean.toFixed(2)})`, 20, yPosition);
      
      yPosition += 8;
      
      // Descrizione del dominio
      doc.setFontSize(10);
      doc.setFont('helvetica', 'italic');
      const description = getDomainDescription(domainId);
      const descLines = doc.splitTextToSize(description, 170);
      descLines.forEach((line: string) => {
        doc.text(line, 20, yPosition);
        yPosition += 5;
      });
      
      yPosition += 5;
      
      // Interpretazione
      doc.setFont('helvetica', 'normal');
      const analysis = getDomainInterpretation(domainId, score.mean);
      const analysisLines = doc.splitTextToSize(analysis, 170);
      analysisLines.forEach((line: string) => {
        if (yPosition > 270) {
          doc.addPage();
          yPosition = 20;
        }
        doc.text(line, 20, yPosition);
        yPosition += 5;
      });
      
      // Facet principali del dominio
      yPosition += 5;
      doc.setFont('helvetica', 'bold');
      doc.text('Facet principali:', 20, yPosition);
      yPosition += 5;
      
      doc.setFont('helvetica', 'normal');
      domain?.facets.forEach(facetId => {
        const facet = pid5Facets.find(f => f.id === facetId);
        const facetScore = facetScores[facetId];
        if (facetScore && facetScore.mean >= 1.0) {
          doc.text(`• ${facet?.name}: ${facetScore.mean.toFixed(2)} - ${getScoreInterpretation(facetScore.mean).label}`, 25, yPosition);
          yPosition += 5;
        }
      });
      
      yPosition += 10;
    }
  });
  
  // Nuova pagina per le facet
  doc.addPage();
  yPosition = 20;
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Analisi delle Facet di Personalità', 20, yPosition);
  
  yPosition += 10;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('Le 25 facet del PID-5 forniscono una valutazione dettagliata dei tratti di personalità.', 20, yPosition);
  
  yPosition += 15;
  
  // Tabella delle facet (solo quelle con punteggi significativi)
  const sortedFacets = Object.entries(facetScores)
    .sort(([,a]: any, [,b]: any) => b.mean - a.mean)
    .filter(([,score]: any) => score.mean >= 1.0);
  
  const facetData = sortedFacets.map(([facetId, score]: any) => {
    const facet = pid5Facets.find(f => f.id === facetId);
    const domain = pid5Domains.find(d => d.facets.includes(facetId));
    const interpretation = getScoreInterpretation(score.mean);
    return [
      facet?.name || facetId,
      score.mean.toFixed(2),
      interpretation.label,
      domain?.name || '-'
    ];
  });
  
  if (facetData.length > 0) {
    autoTable(doc, {
      startY: yPosition,
      head: [['Facet', 'Punteggio', 'Interpretazione', 'Dominio']],
      body: facetData,
      theme: 'grid',
      headStyles: {
        fillColor: primaryColor as [number, number, number],
        textColor: [255, 255, 255] as [number, number, number],
        fontStyle: 'bold',
        fontSize: 9
      },
      styles: {
        fontSize: 8,
        cellPadding: 3
      },
      columnStyles: {
        1: { cellWidth: 25, halign: 'center' },
        2: { cellWidth: 35, halign: 'center' }
      }
    });
  }
  
  // Nuova pagina per raccomandazioni
  doc.addPage();
  yPosition = 20;
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Raccomandazioni Cliniche', 20, yPosition);
  
  yPosition += 15;
  
  // Box per le raccomandazioni
  doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setLineWidth(1);
  
  const recommendations = generateRecommendations(sortedDomains, sortedFacets);
  const recLines = doc.splitTextToSize(recommendations, 165);
  
  const boxHeight = recLines.length * 5 + 20;
  doc.roundedRect(20, yPosition, 170, boxHeight, 3, 3, 'S');
  
  yPosition += 10;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  recLines.forEach((line: string) => {
    doc.text(line, 25, yPosition);
    yPosition += 5;
  });
  
  // Note finali
  yPosition += 20;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(100, 100, 100);
  const disclaimer = 'Questo report è generato automaticamente sulla base delle risposte fornite al questionario PID-5. I risultati devono essere interpretati da un professionista qualificato nel contesto di una valutazione clinica completa.';
  const disclaimerLines = doc.splitTextToSize(disclaimer, 170);
  disclaimerLines.forEach((line: string) => {
    if (yPosition > 270) {
      doc.addPage();
      yPosition = 20;
    }
    doc.text(line, 20, yPosition);
    yPosition += 4;
  });
  
  // Genera il PDF come Uint8Array
  const pdfOutput = doc.output('arraybuffer');
  return new Uint8Array(pdfOutput);
}

function getScoreInterpretation(score: number) {
  if (score < 0.5) return { label: 'Molto Basso', color: 'success' };
  if (score < 1.0) return { label: 'Basso', color: 'info' };
  if (score < 1.5) return { label: 'Medio', color: 'warning' };
  if (score < 2.0) return { label: 'Elevato', color: 'danger' };
  return { label: 'Molto Elevato', color: 'danger' };
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
          recommendations.push('• Gestione dell\'Affettività Negativa: Si consiglia di esplorare strategie di regolazione emotiva, come tecniche di mindfulness e terapia cognitivo-comportamentale.');
          break;
        case 'distacco':
          recommendations.push('• Interventi per il Distacco Sociale: Potrebbe essere utile un approccio terapeutico che favorisca gradualmente il coinvolgimento sociale.');
          break;
        case 'antagonismo':
          recommendations.push('• Miglioramento delle Relazioni: Si suggerisce un lavoro terapeutico focalizzato sull\'empatia e lo sviluppo di pattern relazionali collaborativi.');
          break;
        case 'disinibizione':
          recommendations.push('• Potenziamento del Controllo: Interventi mirati al miglioramento delle funzioni esecutive e strategie di autocontrollo.');
          break;
        case 'psicoticismo':
          recommendations.push('• Valutazione delle Esperienze Insolite: Si raccomanda un\'esplorazione clinica approfondita delle esperienze percettive e cognitive.');
          break;
      }
    }
  });
  
  if (recommendations.length === 0) {
    recommendations.push('• Il profilo di personalità non evidenzia aree di particolare criticità. Si suggerisce di mantenere le attuali strategie di coping.');
  }
  
  recommendations.push('• Si consiglia una rivalutazione periodica per monitorare l\'evoluzione del profilo di personalità.');
  
  return recommendations.join('\n\n');
} 