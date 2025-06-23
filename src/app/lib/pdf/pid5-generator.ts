import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { pid5Domains, pid5Facets } from '../pid5-data';

interface PID5PDFData {
  results: any;
  testState: any;
  patientInfo: {
    firstName: string;
    lastName: string;
    age: string;
    therapistName: string;
  };
  reportDate: Date;
}

export async function generatePID5PDF(data: PID5PDFData): Promise<Buffer> {
  const { results, testState, patientInfo, reportDate } = data;
  const { domainScores, facetScores } = results.scores;
  
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
  doc.text('Report Test PID-5', 105, yPosition + 20, { align: 'center' });
  
  yPosition += 40;
  doc.setFontSize(18);
  doc.setFont('helvetica', 'normal');
  doc.text('Personality Inventory for DSM-5', 105, yPosition, { align: 'center' });
  
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
    doc.text(`Età: ${patientInfo.age}`, 20, yPosition);
    yPosition += 10;
  }
  doc.text(`Terapeuta: ${patientInfo.therapistName}`, 20, yPosition);
  yPosition += 10;
  doc.text(`Data completamento: ${new Date(reportDate).toLocaleDateString('it-IT', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })}`, 20, yPosition);

  // Nuova pagina - Introduzione e metodologia
  doc.addPage();
  yPosition = 20;
  
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Introduzione al Report PID-5', 20, yPosition);
  
  yPosition += 15;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  
  const introText = 'Il Personality Inventory for DSM-5 (PID-5) è uno strumento di valutazione dimensionale della personalità ' +
                   'sviluppato per il DSM-5. Questo questionario di 220 item valuta 25 facet (sfaccettature) di personalità ' +
                   'raggruppate in 5 domini principali. L\'approccio dimensionale permette di catturare le sfumature della ' +
                   'personalità piuttosto che categorizzare rigidamente i tratti. I punteggi elevati indicano la presenza ' +
                   'significativa di determinati tratti che potrebbero influenzare il funzionamento psicologico e interpersonale.';
  
  const introLines = doc.splitTextToSize(introText, 170);
  introLines.forEach((line: string) => {
    doc.text(line, 20, yPosition);
    yPosition += 5;
  });

  // Riepilogo Domini
  yPosition += 15;
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Riepilogo Domini di Personalità', 20, yPosition);
  
  yPosition += 10;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('Panoramica dei 5 domini principali valutati dal PID-5:', 20, yPosition);
  
  yPosition += 15;

  // Ordina i domini per punteggio
  const sortedDomains = Object.entries(domainScores)
    .sort(([,a]: any, [,b]: any) => b.mean - a.mean);

  // Tabella dei domini con descrizioni estese
  const domainData = sortedDomains.map(([domainId, score]: any) => {
    const domain = pid5Domains.find(d => d.id === domainId);
    const interpretation = getScoreInterpretation(score.mean);
    return [
      domain?.name || domainId,
      score.mean.toFixed(2),
      interpretation.label,
      getShortDomainDescription(domainId)
    ];
  });

  autoTable(doc, {
    startY: yPosition,
    head: [['Dominio', 'Punteggio', 'Livello', 'Descrizione']],
    body: domainData,
    theme: 'grid',
    headStyles: {
      fillColor: lightGray,
      textColor: textColor,
      fontStyle: 'bold',
      fontSize: 10
    },
    styles: {
      fontSize: 9,
      cellPadding: 4
    },
    columnStyles: {
      0: { cellWidth: 40 },
      1: { cellWidth: 20, halign: 'center' },
      2: { cellWidth: 25, halign: 'center' },
      3: { cellWidth: 85 }
    }
  });

  // Analisi Qualitativa Approfondita per ogni dominio
  doc.addPage();
  yPosition = 20;
  
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Analisi Dettagliata dei Domini', 20, yPosition);
  
  yPosition += 20;

  // Analisi approfondita per ogni dominio
  sortedDomains.forEach(([domainId, score]: any, index) => {
    if (yPosition > 200) {
      doc.addPage();
      yPosition = 20;
    }
    
    const domain = pid5Domains.find(d => d.id === domainId);
    const interpretation = getScoreInterpretation(score.mean);
    
    // Titolo del dominio con box colorato
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(20, yPosition - 5, 170, 12, 'F');
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(`${index + 1}. ${domain?.name || domainId}`, 25, yPosition + 3);
    
    yPosition += 15;
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    
    // Punteggio e interpretazione
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Punteggio: ${score.mean.toFixed(2)} - `, 25, yPosition);
    
    // Colore per l'interpretazione
    const interpretationColor = interpretation.color === 'danger' ? [220, 53, 69] :
                               interpretation.color === 'warning' ? [255, 193, 7] :
                               interpretation.color === 'info' ? [23, 162, 184] : [40, 167, 69];
    doc.setTextColor(interpretationColor[0], interpretationColor[1], interpretationColor[2]);
    doc.setFont('helvetica', 'bold');
    doc.text(interpretation.label, 65, yPosition);
    
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.setFont('helvetica', 'normal');
    
    yPosition += 10;
    
    // Descrizione estesa del dominio
    doc.setFontSize(11);
    doc.setFont('helvetica', 'italic');
    const domainDesc = getExtendedDomainDescription(domainId);
    const descLines = doc.splitTextToSize(domainDesc, 165);
    descLines.forEach((line: string) => {
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 20;
      }
      doc.text(line, 25, yPosition);
      yPosition += 5;
    });
    
    yPosition += 5;
    
    // Interpretazione clinica dettagliata
    doc.setFont('helvetica', 'normal');
    const clinicalInterp = getDetailedClinicalInterpretation(domainId, score.mean);
    const clinicalLines = doc.splitTextToSize(clinicalInterp, 165);
    clinicalLines.forEach((line: string) => {
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 20;
      }
      doc.text(line, 25, yPosition);
      yPosition += 5;
    });
    
    yPosition += 5;
    
    // Facet associate al dominio
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Facet associate a questo dominio:', 25, yPosition);
    yPosition += 7;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    
    const domainFacets = domain?.facets || [];
    domainFacets.forEach(facetId => {
      const facet = pid5Facets.find(f => f.id === facetId);
      const facetScore = facetScores[facetId];
      if (facet && facetScore) {
        if (yPosition > 270) {
          doc.addPage();
          yPosition = 20;
        }
        
        const facetInterp = getScoreInterpretation(facetScore.mean);
        doc.text(`• ${facet.name}: ${facetScore.mean.toFixed(2)} (${facetInterp.label})`, 30, yPosition);
        yPosition += 5;
      }
    });
    
    yPosition += 15;
  });

  // Analisi delle Facet più significative
  doc.addPage();
  yPosition = 20;
  
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Analisi Approfondita delle Facet', 20, yPosition);
  
  yPosition += 15;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  
  const facetIntroText = 'Le facet rappresentano aspetti specifici della personalità che compongono i domini più ampi. ' +
                        'Un\'analisi dettagliata delle facet con punteggi elevati fornisce indicazioni precise sui ' +
                        'pattern di personalità che potrebbero richiedere attenzione clinica.';
  
  const facetIntroLines = doc.splitTextToSize(facetIntroText, 170);
  facetIntroLines.forEach((line: string) => {
    doc.text(line, 20, yPosition);
    yPosition += 5;
  });
  
  yPosition += 10;

  // Ordina le facet per punteggio
  const sortedFacets = Object.entries(facetScores)
    .sort(([,a]: any, [,b]: any) => b.mean - a.mean);

  // Analisi dettagliata delle facet più elevate (top 10)
  const significantFacets = sortedFacets.filter(([,score]: any) => score.mean >= 1.0).slice(0, 10);
  
  if (significantFacets.length === 0) {
    doc.text('Nessuna facet presenta punteggi clinicamente significativi (≥ 1.0).', 20, yPosition);
  } else {
    significantFacets.forEach(([facetId, score]: any, index) => {
      if (yPosition > 200) {
        doc.addPage();
        yPosition = 20;
      }
      
      const facet = pid5Facets.find(f => f.id === facetId);
      const domain = pid5Domains.find(d => d.facets.includes(facetId));
      const interpretation = getScoreInterpretation(score.mean);
      
      // Box per ogni facet
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.5);
      doc.roundedRect(20, yPosition - 3, 170, 50, 3, 3, 'S');
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`${index + 1}. ${facet?.name || facetId}`, 25, yPosition + 5);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Dominio: ${domain?.name || 'N/A'}`, 25, yPosition + 12);
      doc.text(`Punteggio: ${score.mean.toFixed(2)} - ${interpretation.label}`, 25, yPosition + 19);
      
      // Descrizione clinica della facet
      const facetDesc = getFacetClinicalDescription(facetId, score.mean);
      const facetDescLines = doc.splitTextToSize(facetDesc, 160);
      let lineY = yPosition + 28;
      facetDescLines.slice(0, 3).forEach((line: string) => {
        doc.text(line, 25, lineY);
        lineY += 5;
      });
      
      yPosition += 55;
    });
  }

  // Raccomandazioni Cliniche Dettagliate
  doc.addPage();
  yPosition = 20;
  
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Raccomandazioni Cliniche e Terapeutiche', 20, yPosition);
  
  yPosition += 20;

  const detailedRecommendations = generateDetailedRecommendations(sortedDomains, sortedFacets);
  
  detailedRecommendations.forEach((rec, index) => {
    if (yPosition > 220) {
      doc.addPage();
      yPosition = 20;
    }
    
    // Titolo della raccomandazione
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`${index + 1}. ${rec.title}`, 20, yPosition);
    
    yPosition += 8;
    
    // Contenuto della raccomandazione
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    const recLines = doc.splitTextToSize(rec.content, 170);
    recLines.forEach((line: string) => {
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 20;
      }
      doc.text(line, 25, yPosition);
      yPosition += 5;
    });
    
    yPosition += 10;
  });

  // Considerazioni per il Trattamento
  doc.addPage();
  yPosition = 20;
  
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Considerazioni per il Trattamento', 20, yPosition);
  
  yPosition += 15;
  
  const treatmentConsiderations = generateTreatmentConsiderations(sortedDomains, sortedFacets);
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  
  treatmentConsiderations.forEach((consideration) => {
    if (yPosition > 240) {
      doc.addPage();
      yPosition = 20;
    }
    
    doc.setFont('helvetica', 'bold');
    doc.text(`• ${consideration.area}:`, 20, yPosition);
    yPosition += 6;
    
    doc.setFont('helvetica', 'normal');
    const consLines = doc.splitTextToSize(consideration.text, 165);
    consLines.forEach((line: string) => {
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 20;
      }
      doc.text(line, 25, yPosition);
      yPosition += 5;
    });
    
    yPosition += 8;
  });

  // Note Finali e Avvertenze
  doc.addPage();
  yPosition = 20;
  
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Note Importanti e Limitazioni', 20, yPosition);
  
  yPosition += 15;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  const disclaimerText = 'Questo report è generato automaticamente sulla base delle risposte fornite al questionario PID-5. ' +
                        'I risultati devono essere interpretati da un professionista qualificato nel contesto di una valutazione ' +
                        'clinica completa che includa colloquio clinico, osservazione diretta e altre fonti di informazione. ' +
                        'Il PID-5 è uno strumento di screening e non sostituisce una diagnosi clinica formale. ' +
                        'I punteggi devono essere considerati come indicatori dimensionali di tratti di personalità piuttosto ' +
                        'che come diagnosi categoriali. La presenza di punteggi elevati non implica necessariamente la presenza ' +
                        'di un disturbo di personalità ma suggerisce aree che meritano ulteriore esplorazione clinica.';
  
  const disclaimerLines = doc.splitTextToSize(disclaimerText, 170);
  disclaimerLines.forEach((line: string) => {
    doc.text(line, 20, yPosition);
    yPosition += 5;
  });
  
  yPosition += 15;
  
  // Box con interpretazione dei punteggi
  doc.setDrawColor(200, 200, 200);
  doc.setFillColor(245, 245, 245);
  doc.roundedRect(20, yPosition, 170, 60, 3, 3, 'FD');
  
  yPosition += 10;
  doc.setFont('helvetica', 'bold');
  doc.text('Guida all\'Interpretazione dei Punteggi:', 25, yPosition);
  yPosition += 7;
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('• 0.00-0.49: Molto Basso - Tratto assente o minimo', 25, yPosition);
  yPosition += 5;
  doc.text('• 0.50-0.99: Basso - Tratto presente in misura lieve, generalmente adattivo', 25, yPosition);
  yPosition += 5;
  doc.text('• 1.00-1.49: Medio - Tratto presente in misura moderata, possibile area di attenzione', 25, yPosition);
  yPosition += 5;
  doc.text('• 1.50-1.99: Elevato - Tratto significativo che potrebbe interferire con il funzionamento', 25, yPosition);
  yPosition += 5;
  doc.text('• ≥2.00: Molto Elevato - Tratto molto pronunciato, probabile impatto clinico', 25, yPosition);

  // Restituisci il PDF come Buffer
  const pdfOutput = doc.output('arraybuffer');
  return Buffer.from(pdfOutput);
}

function getScoreInterpretation(score: number) {
  if (score < 0.5) return { label: 'Molto Basso', color: 'success' };
  if (score < 1.0) return { label: 'Basso', color: 'info' };
  if (score < 1.5) return { label: 'Medio', color: 'warning' };
  if (score < 2.0) return { label: 'Elevato', color: 'danger' };
  return { label: 'Molto Elevato', color: 'danger' };
}

function getShortDomainDescription(domainId: string): string {
  const descriptions: { [key: string]: string } = {
    'affettivita_negativa': 'Affettività Negativa',
    'distacco': 'Distacco',
    'antagonismo': 'Antagonismo',
    'disinibizione': 'Disinibizione',
    'psicoticismo': 'Psicoticismo'
  };
  
  return descriptions[domainId] || domainId;
}

function getExtendedDomainDescription(domainId: string): string {
  const descriptions: { [key: string]: string } = {
    'affettivita_negativa': 'L\'Affettività Negativa rappresenta la propensione a sperimentare un\'ampia gamma di emozioni negative ' +
                           'con frequenza e intensità elevate. Questo dominio include esperienze emotive come ansia, depressione, ' +
                           'preoccupazione, rabbia, vulnerabilità e instabilità emotiva. Gli individui con punteggi elevati in questo ' +
                           'dominio tendono a reagire in modo eccessivo agli stress quotidiani, hanno difficoltà a recuperare da ' +
                           'esperienze negative e possono sentirsi sopraffatti dalle proprie emozioni. Questo pattern può influenzare ' +
                           'significativamente le relazioni interpersonali, le prestazioni lavorative e il benessere generale.',
                           
    'distacco': 'Il Distacco caratterizza un pattern pervasivo di ritiro sociale ed emotivo. Include l\'evitamento dell\'intimità ' +
                'interpersonale, la ridotta capacità di provare e esprimere emozioni positive, la preferenza per la solitudine ' +
                'e la limitata ricerca di esperienze gratificanti. Le persone con elevati livelli di distacco spesso appaiono ' +
                'fredde, distanti e disinteressate agli altri. Possono avere difficoltà a formare e mantenere relazioni strette, ' +
                'mostrare poco interesse per le attività sociali e sperimentare una gamma ristretta di emozioni. Questo dominio ' +
                'può compromettere significativamente la qualità della vita sociale e affettiva.',
                
    'antagonismo': 'L\'Antagonismo riflette comportamenti che mettono l\'individuo in opposizione agli altri. Comprende tratti come ' +
                   'manipolazione, disonestà, grandiosità, ricerca di attenzione, ostilità e insensibilità. Le persone con alti ' +
                   'livelli di antagonismo tendono a sfruttare gli altri per i propri scopi, mostrano scarsa empatia, possono ' +
                   'essere arroganti e presuntuose, e spesso entrano in conflitto con gli altri. Questo pattern comportamentale ' +
                   'può portare a relazioni superficiali e conflittuali, problemi legali e difficoltà nel mantenere impegni ' +
                   'lavorativi o sociali stabili.',
                   
    'disinibizione': 'La Disinibizione è caratterizzata da una tendenza all\'impulsività, alla ricerca di gratificazione immediata ' +
                     'e alla difficoltà nel pianificare e organizzare il comportamento. Include tratti come irresponsabilità, ' +
                     'impulsività, distraibilità e propensione al rischio. Gli individui con elevata disinibizione agiscono spesso ' +
                     'senza considerare le conseguenze, hanno difficoltà a mantenere l\'attenzione su compiti a lungo termine, ' +
                     'possono essere disorganizzati e caotici nella vita quotidiana. Questo dominio può portare a decisioni ' +
                     'avventate, problemi finanziari, difficoltà accademiche o lavorative e comportamenti pericolosi.',
                     
    'psicoticismo': 'Il Psicoticismo comprende manifestazioni di pensiero e comportamento bizzarri, eccentrici o insoliti. Include ' +
                    'esperienze percettive anomale, credenze strane, pensiero e linguaggio peculiari e comportamenti eccentrici. ' +
                    'Le persone con punteggi elevati in questo dominio possono avere convinzioni insolite o magiche, esperienze ' +
                    'percettive atipiche (come sentire voci o vedere cose che altri non vedono), modi di pensare e comunicare ' +
                    'idiosincratici. Sebbene non indichi necessariamente la presenza di un disturbo psicotico, alti livelli di ' +
                    'psicoticismo possono interferire con il funzionamento sociale e lavorativo e richiedere valutazione clinica.'
  };
  
  return descriptions[domainId] || '';
}

function getDetailedClinicalInterpretation(domainId: string, score: number): string {
  const level = score >= 2.0 ? 'molto elevato' : score >= 1.5 ? 'elevato' : score >= 1.0 ? 'moderato' : 'basso';
  
  const interpretations: { [key: string]: { [level: string]: string } } = {
    'affettivita_negativa': {
      'molto elevato': 'Il punteggio estremamente elevato in questo dominio suggerisce una pervasiva vulnerabilità emotiva con ' +
                      'intense e frequenti esperienze di ansia, depressione, rabbia e instabilità emotiva. Questo livello di ' +
                      'affettività negativa probabilmente interferisce significativamente con il funzionamento quotidiano, le ' +
                      'relazioni interpersonali e la capacità di far fronte allo stress. Si raccomanda una valutazione approfondita ' +
                      'per possibili disturbi dell\'umore o d\'ansia e l\'implementazione di interventi terapeutici intensivi.',
                      
      'elevato': 'Il punteggio elevato indica una significativa propensione a sperimentare emozioni negative che probabilmente ' +
                'causano disagio sostanziale e interferiscono con vari aspetti della vita. La persona potrebbe avere difficoltà ' +
                'a regolare le proprie emozioni, tendere a rimuginare su esperienze negative e avere reazioni emotive sproporzionate ' +
                'agli eventi. È consigliabile esplorare strategie di regolazione emotiva e considerare interventi psicoterapeutici.',
                
      'moderato': 'Il punteggio moderato suggerisce la presenza di alcune difficoltà nella gestione delle emozioni negative. ' +
                 'Sebbene non al livello di compromissione clinica, la persona potrebbe beneficiare di strategie per migliorare ' +
                 'la resilienza emotiva e la capacità di coping. Tecniche di mindfulness, gestione dello stress e sviluppo ' +
                 'di competenze emotive potrebbero essere utili.',
                 
      'basso': 'Il punteggio basso indica una buona stabilità emotiva e capacità di gestire efficacemente le emozioni negative. ' +
              'La persona mostra resilienza di fronte allo stress e mantiene generalmente un equilibrio emotivo positivo. ' +
              'Questo rappresenta un fattore protettivo per la salute mentale.'
    },
    
    'distacco': {
      'molto elevato': 'Il punteggio estremamente elevato suggerisce un grave ritiro sociale ed emotivo che compromette ' +
                      'profondamente la capacità di formare e mantenere relazioni significative. La persona potrebbe sperimentare ' +
                      'un profondo senso di vuoto, incapacità di provare piacere e completo disinteresse per le interazioni sociali. ' +
                      'Questo livello di distacco richiede attenzione clinica immediata e interventi mirati a ristabilire ' +
                      'gradualmente il contatto emotivo e sociale.',
                      
      'elevato': 'Il punteggio elevato indica significative difficoltà nel coinvolgimento emotivo e sociale. La persona ' +
                'probabilmente evita l\'intimità, ha poche relazioni strette e mostra limitata espressività emotiva. ' +
                'Questo pattern può portare a isolamento sociale e ridotta qualità della vita. Interventi terapeutici ' +
                'focalizzati sul miglioramento delle competenze sociali e l\'esplorazione delle barriere all\'intimità ' +
                'sono raccomandati.',
                
      'moderato': 'Il punteggio moderato suggerisce alcune difficoltà nel coinvolgimento sociale ed emotivo. La persona ' +
                 'potrebbe preferire attività solitarie, avere un numero limitato di amici stretti e mostrare riservatezza ' +
                 'emotiva. Sebbene non necessariamente problematico, potrebbe beneficiare di opportunità per espandere ' +
                 'gradualmente la propria rete sociale e esplorare modi per aumentare il coinvolgimento emotivo.',
                 
      'basso': 'Il punteggio basso indica una capacità adeguata di coinvolgimento sociale ed emotivo. La persona è in grado ' +
              'di formare relazioni significative, esprimere e condividere emozioni, e trovare piacere nelle interazioni ' +
              'sociali. Questo rappresenta un funzionamento interpersonale sano.'
    },
    
    'antagonismo': {
      'molto elevato': 'Il punteggio estremamente elevato indica un pattern pervasivo di comportamenti antagonisti che creano ' +
                      'conflitti costanti e danneggiano gravemente le relazioni. La persona potrebbe mostrare manipolazione ' +
                      'cronica, disonestà patologica, grandiosità estrema e totale mancanza di empatia. Questo livello di ' +
                      'antagonismo spesso porta a conseguenze legali, sociali e occupazionali severe. È essenziale un intervento ' +
                      'terapeutico intensivo focalizzato sullo sviluppo dell\'empatia e la modifica dei pattern interpersonali.',
                      
      'elevato': 'Il punteggio elevato suggerisce frequenti comportamenti che mettono la persona in conflitto con gli altri. ' +
                'Potrebbero essere presenti tendenze manipolative, difficoltà a considerare i bisogni altrui, arroganza e ' +
                'comportamenti di sfruttamento. Questo pattern compromette la qualità delle relazioni e può portare a ' +
                'isolamento sociale. La terapia dovrebbe focalizzarsi sul miglioramento delle competenze interpersonali ' +
                'e lo sviluppo di relazioni più collaborative.',
                
      'moderato': 'Il punteggio moderato indica occasionali difficoltà nelle relazioni interpersonali dovute a comportamenti ' +
                 'antagonisti. La persona potrebbe mostrare competitività eccessiva, occasionale insensibilità o tendenza ' +
                 'a mettere i propri bisogni davanti a quelli degli altri. Interventi mirati a migliorare l\'empatia e ' +
                 'la prospettiva dell\'altro potrebbero essere benefici.',
                 
      'basso': 'Il punteggio basso indica buone capacità relazionali con comportamenti generalmente cooperativi e rispettosi. ' +
              'La persona mostra empatia, onestà nelle relazioni e capacità di considerare i bisogni degli altri. ' +
              'Questo rappresenta un funzionamento interpersonale adattivo.'
    },
    
    'disinibizione': {
      'molto elevato': 'Il punteggio estremamente elevato indica una grave compromissione del controllo comportamentale con ' +
                      'impulsività estrema, totale disorganizzazione e incapacità di pianificare o considerare le conseguenze. ' +
                      'Questo livello di disinibizione porta frequentemente a decisioni disastrose, comportamenti pericolosi, ' +
                      'problemi legali e caos nella vita quotidiana. È necessario un intervento immediato che potrebbe includere ' +
                      'supporto strutturato, training delle funzioni esecutive e possibile valutazione per ADHD o altri disturbi.',
                      
      'elevato': 'Il punteggio elevato suggerisce significative difficoltà nel controllo degli impulsi e nell\'organizzazione ' +
                'del comportamento. La persona probabilmente agisce senza pensare, ha difficoltà a completare compiti, ' +
                'è disorganizzata e prende decisioni avventate. Questo pattern interferisce con il successo accademico, ' +
                'lavorativo e personale. Interventi focalizzati sul miglioramento delle funzioni esecutive e strategie ' +
                'di autocontrollo sono fortemente raccomandati.',
                
      'moderato': 'Il punteggio moderato indica alcune difficoltà nel controllo comportamentale e nell\'organizzazione. ' +
                 'La persona potrebbe occasionalmente agire impulsivamente, avere difficoltà con la pianificazione a ' +
                 'lungo termine o mostrare disorganizzazione in alcune aree della vita. Strategie per migliorare ' +
                 'l\'autoregolazione e l\'organizzazione potrebbero essere utili.',
                 
      'basso': 'Il punteggio basso indica buon controllo comportamentale e capacità organizzative. La persona è in grado ' +
              'di pianificare, considerare le conseguenze delle proprie azioni e mantenere un comportamento organizzato. ' +
              'Questo rappresenta un funzionamento esecutivo adeguato.'
    },
    
    'psicoticismo': {
      'molto elevato': 'Il punteggio estremamente elevato indica la presenza di significative esperienze percettive, cognitive ' +
                      'e comportamentali insolite che potrebbero suggerire vulnerabilità psicotica o presenza di sintomi ' +
                      'psicotici attenuati. La persona potrebbe avere convinzioni bizzarre, esperienze percettive anomale ' +
                      'frequenti, pensiero gravemente disorganizzato e comportamenti marcatamente eccentrici. È essenziale ' +
                      'una valutazione psichiatrica completa per escludere disturbi dello spettro psicotico e determinare ' +
                      'l\'appropriato livello di intervento.',
                      
      'elevato': 'Il punteggio elevato suggerisce frequenti esperienze o comportamenti insoliti che si discostano ' +
                'significativamente dalla norma. La persona potrebbe avere credenze peculiari, occasionali esperienze ' +
                'percettive anomale, modi di pensare idiosincratici e comportamenti eccentrici che interferiscono ' +
                'con il funzionamento sociale. Una valutazione clinica approfondita è raccomandata per comprendere ' +
                'la natura e l\'impatto di queste esperienze.',
                
      'moderato': 'Il punteggio moderato indica la presenza di alcune esperienze o comportamenti insoliti che potrebbero ' +
                 'essere percepiti come strani o eccentrici dagli altri. La persona potrebbe avere interessi insoliti, ' +
                 'occasionali esperienze percettive atipiche sotto stress o modi di pensare creativi ma non convenzionali. ' +
                 'Monitoraggio clinico e supporto per gestire lo stress potrebbero essere benefici.',
                 
      'basso': 'Il punteggio basso indica pensiero e percezione generalmente nella norma. La persona ha un solido ' +
              'contatto con la realtà, pensiero organizzato e comportamenti socialmente appropriati. Questo ' +
              'rappresenta un funzionamento cognitivo-percettivo sano.'
    }
  };
  
  return interpretations[domainId]?.[level] || 'Punteggio nel range di normalità per questo dominio.';
}

function getFacetClinicalDescription(facetId: string, score: number): string {
  const level = score >= 2.0 ? 'molto elevato' : score >= 1.5 ? 'elevato' : score >= 1.0 ? 'moderato' : 'basso';
  
  const descriptions: { [key: string]: { [level: string]: string } } = {
    // Affettività Negativa
    'labilita_emotiva': {
      'molto elevato': 'Estrema instabilità emotiva con rapidi e intensi cambiamenti d\'umore che compromettono significativamente il funzionamento quotidiano.',
      'elevato': 'Marcata instabilità emotiva con frequenti oscillazioni dell\'umore che interferiscono con le relazioni e le attività.',
      'moderato': 'Presenza di fluttuazioni emotive che possono creare difficoltà occasionali nel mantenere la stabilità emotiva.',
      'basso': 'Buona stabilità emotiva con occasionali variazioni dell\'umore entro limiti normali.'
    },
    'ansieta': {
      'molto elevato': 'Ansia pervasiva e debilitante che interferisce gravemente con tutte le aree del funzionamento.',
      'elevato': 'Livelli significativi di ansia che compromettono le attività quotidiane e le relazioni interpersonali.',
      'moderato': 'Presenza di ansia che può interferire occasionalmente con il funzionamento ottimale.',
      'basso': 'Livelli di ansia gestibili che non interferiscono significativamente con la vita quotidiana.'
    },
    'angoscia_di_separazione': {
      'molto elevato': 'Paura estrema e paralizzante di essere soli o abbandonati, con comportamenti di dipendenza patologica.',
      'elevato': 'Forte ansia da separazione che limita l\'autonomia e crea dipendenza nelle relazioni.',
      'moderato': 'Difficoltà moderate nel tollerare la separazione dalle figure di attaccamento.',
      'basso': 'Capacità adeguata di tollerare la separazione con minimo disagio.'
    },
    'sottomissione': {
      'molto elevato': 'Sottomissione estrema con totale incapacità di affermare i propri bisogni o diritti.',
      'elevato': 'Tendenza marcata alla sottomissione che compromette l\'assertività e l\'autonomia personale.',
      'moderato': 'Difficoltà nell\'assertività con tendenza a cedere eccessivamente agli altri.',
      'basso': 'Buon equilibrio tra assertività e capacità di compromesso.'
    },
    'ostilita': {
      'molto elevato': 'Ostilità pervasiva e intensa che crea conflitti costanti e danneggia gravemente le relazioni.',
      'elevato': 'Frequenti sentimenti di rabbia e ostilità che interferiscono con le interazioni sociali.',
      'moderato': 'Presenza di irritabilità e ostilità che possono emergere in situazioni di stress.',
      'basso': 'Gestione adeguata della rabbia con rari episodi di ostilità.'
    },
    'perseverazione': {
      'molto elevato': 'Rigidità estrema nel pensiero e nel comportamento con incapacità di adattarsi ai cambiamenti.',
      'elevato': 'Marcata tendenza alla perseverazione che limita la flessibilità cognitiva e comportamentale.',
      'moderato': 'Alcune difficoltà nel modificare schemi di pensiero o comportamento quando necessario.',
      'basso': 'Buona flessibilità cognitiva e comportamentale.'
    },
    
    // Distacco
    'ritiro': {
      'molto elevato': 'Isolamento sociale estremo con evitamento totale delle interazioni interpersonali.',
      'elevato': 'Marcato ritiro sociale che compromette significativamente le relazioni e le opportunità sociali.',
      'moderato': 'Tendenza al ritiro sociale che limita le interazioni ma non le impedisce completamente.',
      'basso': 'Partecipazione sociale adeguata con occasionale preferenza per la solitudine.'
    },
    'evitamento_dellintimita': {
      'molto elevato': 'Evitamento totale dell\'intimità emotiva e fisica, con incapacità di formare legami stretti.',
      'elevato': 'Significative difficoltà nell\'intimità che impediscono la formazione di relazioni profonde.',
      'moderato': 'Alcune barriere all\'intimità che possono limitare la profondità delle relazioni.',
      'basso': 'Capacità adeguata di intimità con normale cautela iniziale.'
    },
    'anedonia': {
      'molto elevato': 'Totale incapacità di provare piacere o interesse per qualsiasi attività o esperienza.',
      'elevato': 'Marcata riduzione della capacità di provare piacere che compromette la motivazione e il coinvolgimento.',
      'moderato': 'Riduzione parziale del piacere e dell\'interesse che può influenzare alcune aree della vita.',
      'basso': 'Capacità normale di provare piacere e interesse nelle attività.'
    },
    'depressivita': {
      'molto elevato': 'Depressione grave e pervasiva con sentimenti di disperazione e vuoto esistenziale.',
      'elevato': 'Significativi sintomi depressivi che interferiscono con il funzionamento quotidiano.',
      'moderato': 'Presenza di umore depresso che può influenzare l\'energia e la motivazione.',
      'basso': 'Umore generalmente stabile con occasionali momenti di tristezza.'
    },
    'sospettosita': {
      'molto elevato': 'Sospettosità estrema e paranoia che compromettono totalmente la fiducia negli altri.',
      'elevato': 'Marcata diffidenza che interferisce significativamente con le relazioni interpersonali.',
      'moderato': 'Tendenza alla sospettosità che può creare tensioni nelle relazioni.',
      'basso': 'Livello appropriato di cautela senza eccessiva diffidenza.'
    },
    'affettivita_ridotta': {
      'molto elevato': 'Appiattimento affettivo grave con totale assenza di espressione emotiva.',
      'elevato': 'Marcata riduzione dell\'espressività emotiva che limita la comunicazione affettiva.',
      'moderato': 'Ridotta espressività emotiva che può essere percepita come distanza o freddezza.',
      'basso': 'Espressività emotiva nella norma con appropriata modulazione.'
    },
    
    // Antagonismo
    'manipolativita': {
      'molto elevato': 'Manipolazione costante e calcolata degli altri per ottenere vantaggi personali senza alcun rimorso.',
      'elevato': 'Frequente uso della manipolazione nelle relazioni con scarsa considerazione per gli altri.',
      'moderato': 'Tendenza occasionale alla manipolazione, specialmente sotto stress o per ottenere obiettivi.',
      'basso': 'Interazioni generalmente oneste con raro ricorso a strategie manipolative.'
    },
    'disonesta': {
      'molto elevato': 'Disonestà pervasiva e patologica con costante ricorso a bugie e inganni.',
      'elevato': 'Frequente disonestà che compromette la fiducia e l\'integrità delle relazioni.',
      'moderato': 'Occasionale disonestà o esagerazione, specialmente per evitare conseguenze negative.',
      'basso': 'Generale onestà con rare deviazioni dalla verità.'
    },
    'grandiosita': {
      'molto elevato': 'Senso di superiorità estremo e irrealistico con totale mancanza di umiltà.',
      'elevato': 'Marcata grandiosità che interferisce con relazioni paritarie e feedback realistici.',
      'moderato': 'Tendenza a sopravvalutare le proprie capacità o importanza.',
      'basso': 'Autostima equilibrata con realistica valutazione di sé.'
    },
    'ricerca_di_attenzione': {
      'molto elevato': 'Bisogno compulsivo e costante di essere al centro dell\'attenzione con comportamenti estremi.',
      'elevato': 'Forte bisogno di attenzione che domina le interazioni sociali.',
      'moderato': 'Desiderio accentuato di attenzione che può risultare eccessivo in alcune situazioni.',
      'basso': 'Normale desiderio di riconoscimento senza comportamenti eccessivi.'
    },
    'insensibilita': {
      'molto elevato': 'Totale mancanza di empatia e indifferenza per i sentimenti e il benessere altrui.',
      'elevato': 'Marcata insensibilità che compromette la capacità di relazioni empatiche.',
      'moderato': 'Ridotta sensibilità ai bisogni emotivi degli altri.',
      'basso': 'Adeguata capacità empatica e considerazione per gli altri.'
    },
    
    // Disinibizione
    'irresponsabilita': {
      'molto elevato': 'Totale disprezzo per gli obblighi e le responsabilità con gravi conseguenze personali e sociali.',
      'elevato': 'Frequente negligenza delle responsabilità che crea problemi significativi.',
      'moderato': 'Difficoltà occasionali nel mantenere impegni e responsabilità.',
      'basso': 'Generale affidabilità nel rispettare impegni e responsabilità.'
    },
    'impulsivita': {
      'molto elevato': 'Impulsività estrema e incontrollabile con azioni pericolose senza considerazione delle conseguenze.',
      'elevato': 'Marcata impulsività che porta a decisioni avventate e comportamenti rischiosi.',
      'moderato': 'Tendenza all\'impulsività che può interferire con la pianificazione e il giudizio.',
      'basso': 'Buon controllo degli impulsi con capacità di riflessione prima dell\'azione.'
    },
    'distraibilita': {
      'molto elevato': 'Incapacità totale di mantenere l\'attenzione con grave compromissione del funzionamento.',
      'elevato': 'Significative difficoltà attentive che interferiscono con compiti e obiettivi.',
      'moderato': 'Problemi di concentrazione che possono ridurre l\'efficienza.',
      'basso': 'Capacità adeguata di mantenere attenzione e focus.'
    },
    'assunzione_di_rischi': {
      'molto elevato': 'Ricerca compulsiva di situazioni pericolose con totale disprezzo per la sicurezza.',
      'elevato': 'Frequente coinvolgimento in attività rischiose senza adeguata valutazione dei pericoli.',
      'moderato': 'Tendenza a sottovalutare i rischi in alcune situazioni.',
      'basso': 'Approccio equilibrato al rischio con appropriate precauzioni.'
    },
    'perfezionismo_rigido': {
      'molto elevato': 'Perfezionismo paralizzante che impedisce il completamento dei compiti e crea estrema ansia.',
      'elevato': 'Standard irrealisticamente elevati che causano stress significativo e inefficienza.',
      'moderato': 'Tendenze perfezionistiche che possono rallentare il progresso o creare stress.',
      'basso': 'Standard elevati ma flessibili con capacità di accettare l\'imperfezione.'
    },
    
    // Psicoticismo
    'convinzioni_e_esperienze_insolite': {
      'molto elevato': 'Convinzioni bizarre e esperienze percettive anomale che compromettono il contatto con la realtà.',
      'elevato': 'Frequenti esperienze insolite o credenze eccentriche che influenzano il comportamento.',
      'moderato': 'Occasionali esperienze o credenze insolite che possono sembrare strane agli altri.',
      'basso': 'Pensiero e percezione generalmente convenzionali.'
    },
    'eccentricita': {
      'molto elevato': 'Comportamento estremamente bizzarro e incomprensibile che aliena completamente gli altri.',
      'elevato': 'Marcata eccentricità che rende difficili le interazioni sociali normali.',
      'moderato': 'Comportamenti o interessi insoliti che possono essere percepiti come strani.',
      'basso': 'Comportamento generalmente convenzionale con occasionale originalità.'
    },
    'disregolazione_cognitiva_e_percettiva': {
      'molto elevato': 'Grave disorganizzazione del pensiero e della percezione con possibili sintomi psicotici.',
      'elevato': 'Significative difficoltà nel pensiero chiaro e nella percezione accurata della realtà.',
      'moderato': 'Occasionali confusione o distorsioni percettive sotto stress.',
      'basso': 'Pensiero generalmente chiaro e percezione accurata della realtà.'
    }
  };
  
  const facetDesc = descriptions[facetId]?.[level];
  if (facetDesc) return facetDesc;
  
  // Descrizione generica se non trovata
  if (level === 'molto elevato') return 'Questo tratto è presente in misura estremamente elevata e richiede attenzione clinica immediata.';
  if (level === 'elevato') return 'Questo tratto è significativamente elevato e potrebbe interferire con il funzionamento quotidiano.';
  if (level === 'moderato') return 'Questo tratto è presente in misura moderata e merita monitoraggio clinico.';
  return 'Questo tratto è presente entro limiti normali.';
}

function generateDetailedRecommendations(sortedDomains: any[], sortedFacets: any[]): any[] {
  let recommendations = [];
  
  // Raccomandazioni basate sui domini elevati
  sortedDomains.forEach(([domainId, score]: any) => {
    if (score.mean >= 1.5) {
      switch(domainId) {
        case 'affettivita_negativa':
          recommendations.push({
            title: 'Gestione dell\'Affettività Negativa',
            content: 'Data l\'elevata presenza di affettività negativa, si raccomanda un approccio terapeutico multidimensionale:\n\n' +
                     '1. Terapia Cognitivo-Comportamentale (CBT): Focalizzata sull\'identificazione e modifica dei pattern di pensiero ' +
                     'negativi, sviluppo di strategie di coping adattive e ristrutturazione cognitiva.\n\n' +
                     '2. Tecniche di Regolazione Emotiva: Training specifico in tecniche di mindfulness, respirazione diaframmatica, ' +
                     'rilassamento muscolare progressivo e altre strategie di autoregolazione emotiva.\n\n' +
                     '3. Terapia Dialettico-Comportamentale (DBT): Particolarmente utile per l\'instabilità emotiva, con focus su ' +
                     'tolleranza del disagio, efficacia interpersonale e regolazione emotiva.\n\n' +
                     '4. Valutazione Farmacologica: Considerare la consultazione psichiatrica per valutare l\'opportunità di un ' +
                     'supporto farmacologico, specialmente se sono presenti sintomi ansiosi o depressivi significativi.\n\n' +
                     '5. Interventi sullo Stile di Vita: Promuovere attività fisica regolare, igiene del sonno, alimentazione ' +
                     'equilibrata e riduzione di sostanze stimolanti.'
          });
          break;
          
        case 'distacco':
          recommendations.push({
            title: 'Interventi per il Distacco Sociale ed Emotivo',
            content: 'Il significativo distacco richiede interventi graduali e sensibili:\n\n' +
                     '1. Terapia Interpersonale (IPT): Focalizzata sul miglioramento delle relazioni interpersonali, elaborazione ' +
                     'di lutti o perdite, e sviluppo di nuove competenze relazionali.\n\n' +
                     '2. Attivazione Comportamentale: Programmazione graduale di attività piacevoli e sociali, con monitoraggio ' +
                     'dell\'umore e rinforzo positivo per i progressi.\n\n' +
                     '3. Social Skills Training: Sviluppo sistematico di competenze sociali attraverso role-playing, modeling e ' +
                     'pratica guidata in contesti protetti.\n\n' +
                     '4. Terapia di Gruppo: Quando appropriato, l\'inserimento in gruppi terapeutici può fornire un ambiente ' +
                     'sicuro per praticare l\'interazione sociale e ricevere feedback.\n\n' +
                     '5. Esplorazione delle Barriere all\'Intimità: Lavoro psicoterapeutico profondo per identificare e elaborare ' +
                     'le paure e le difese che mantengono il distacco emotivo.'
          });
          break;
          
        case 'antagonismo':
          recommendations.push({
            title: 'Miglioramento delle Relazioni Interpersonali e Riduzione dell\'Antagonismo',
            content: 'L\'elevato antagonismo richiede interventi specifici per sviluppare relazioni più sane:\n\n' +
                     '1. Terapia Focalizzata sulla Mentalizzazione: Sviluppo della capacità di comprendere gli stati mentali ' +
                     'propri e altrui, aumentando l\'empatia e la comprensione interpersonale.\n\n' +
                     '2. Terapia Cognitiva per i Disturbi di Personalità: Focus sulla modifica delle credenze disfunzionali ' +
                     'su sé stessi e gli altri che mantengono i pattern antagonisti.\n\n' +
                     '3. Training dell\'Empatia: Esercizi specifici per sviluppare la capacità di perspective-taking e ' +
                     'riconoscimento delle emozioni altrui.\n\n' +
                     '4. Gestione della Rabbia: Tecniche specifiche per il controllo dell\'ostilità e dell\'aggressività, ' +
                     'incluse strategie di de-escalation e comunicazione assertiva.\n\n' +
                     '5. Contratto Terapeutico: Stabilire chiari limiti e aspettative nel setting terapeutico, con focus ' +
                     'sulla responsabilità personale e le conseguenze dei comportamenti.'
          });
          break;
          
        case 'disinibizione':
          recommendations.push({
            title: 'Potenziamento del Controllo Comportamentale e delle Funzioni Esecutive',
            content: 'L\'elevata disinibizione richiede interventi strutturati e pratici:\n\n' +
                     '1. Training delle Funzioni Esecutive: Programmi specifici per migliorare pianificazione, organizzazione, ' +
                     'controllo inibitorio e memoria di lavoro attraverso esercizi cognitivi strutturati.\n\n' +
                     '2. Terapia Cognitivo-Comportamentale per l\'Impulsività: Focus su tecniche di "stop and think", ' +
                     'identificazione dei trigger dell\'impulsività e sviluppo di risposte alternative.\n\n' +
                     '3. Strutturazione dell\'Ambiente: Creazione di routine, uso di promemoria e organizzatori, eliminazione ' +
                     'di distrazioni e implementazione di sistemi di ricompensa.\n\n' +
                     '4. Valutazione per ADHD: Considerare screening per Disturbo da Deficit di Attenzione/Iperattività e ' +
                     'altri disturbi del neurosviluppo che potrebbero contribuire alla disinibizione.\n\n' +
                     '5. Interventi di Mindfulness: Pratiche di consapevolezza per aumentare l\'auto-osservazione e la capacità ' +
                     'di pausa tra stimolo e risposta.'
          });
          break;
          
        case 'psicoticismo':
          recommendations.push({
            title: 'Valutazione e Gestione delle Esperienze Insolite',
            content: 'L\'elevato psicoticismo richiede un\'attenta valutazione e interventi specifici:\n\n' +
                     '1. Valutazione Psichiatrica Completa: Essenziale per escludere disturbi dello spettro psicotico, ' +
                     'valutare il rischio e determinare la necessità di interventi farmacologici.\n\n' +
                     '2. Terapia Cognitiva per Sintomi Psicotici: Se appropriata, focus sulla normalizzazione delle esperienze, ' +
                     'testing di realtà e sviluppo di strategie di coping per gestire esperienze percettive anomale.\n\n' +
                     '3. Psicoeducazione: Informazione su stress e vulnerabilità, riconoscimento precoce dei sintomi e ' +
                     'strategie di gestione dello stress.\n\n' +
                     '4. Supporto Familiare: Coinvolgimento dei familiari per creare un ambiente supportivo e ridurre ' +
                     'lo stress interpersonale.\n\n' +
                     '5. Monitoraggio Continuo: Follow-up regolari per valutare l\'evoluzione dei sintomi e l\'efficacia ' +
                     'degli interventi, con particolare attenzione ai periodi di stress.'
          });
          break;
      }
    }
  });
  
  // Analisi delle facet più elevate per raccomandazioni specifiche
  const topFacets = sortedFacets.filter(([,score]: any) => score.mean >= 1.5).slice(0, 5);
  if (topFacets.length > 0) {
    let facetRecommendations = 'Basandosi sulle facet più elevate, si suggeriscono inoltre i seguenti interventi mirati:\n\n';
    
    topFacets.forEach(([facetId, score]: any) => {
      const facetSpecificRecs = getFacetSpecificRecommendations(facetId, score.mean);
      if (facetSpecificRecs) {
        facetRecommendations += `• ${facetSpecificRecs}\n\n`;
      }
    });
    
    recommendations.push({
      title: 'Interventi Specifici per le Facet Elevate',
      content: facetRecommendations
    });
  }
  
  // Raccomandazione generale se tutti i punteggi sono bassi
  if (recommendations.length === 0) {
    recommendations.push({
      title: 'Profilo nella Norma - Mantenimento del Benessere',
      content: 'Il profilo di personalità non evidenzia aree di particolare criticità clinica. Si suggerisce:\n\n' +
               '1. Mantenimento delle Strategie Adattive: Continuare con le attuali strategie di coping che si sono ' +
               'dimostrate efficaci nel mantenere l\'equilibrio psicologico.\n\n' +
               '2. Prevenzione e Promozione della Salute: Focus su attività che promuovono il benessere come esercizio ' +
               'fisico regolare, relazioni sociali positive, hobbies gratificanti.\n\n' +
               '3. Consapevolezza e Auto-monitoraggio: Mantenere consapevolezza dei propri stati emotivi e cercare ' +
               'supporto tempestivo in caso di cambiamenti significativi.\n\n' +
               '4. Check-up Periodici: Considerare valutazioni periodiche del benessere psicologico come forma di ' +
               'prevenzione e mantenimento della salute mentale.'
    });
  }
  
  // Aggiungi sempre una raccomandazione per il follow-up
  recommendations.push({
    title: 'Piano di Follow-up e Monitoraggio',
    content: 'Indipendentemente dal profilo emerso, si raccomanda:\n\n' +
             '1. Rivalutazione a 6 mesi: Ripetizione del PID-5 per monitorare l\'evoluzione del profilo di personalità ' +
             'e l\'efficacia degli interventi implementati.\n\n' +
             '2. Valutazioni Complementari: Considerare l\'uso di altri strumenti di assessment per approfondire aree ' +
             'specifiche emerse dal profilo (es. scale per ansia, depressione, funzionamento interpersonale).\n\n' +
             '3. Documentazione dei Progressi: Mantenere un diario terapeutico o registro dei cambiamenti osservati ' +
             'nel funzionamento quotidiano e nelle relazioni.\n\n' +
             '4. Coinvolgimento del Sistema di Supporto: Quando appropriato, coinvolgere familiari o persone significative ' +
             'nel processo di monitoraggio e supporto.\n\n' +
             '5. Flessibilità del Trattamento: Essere pronti ad adattare l\'approccio terapeutico basandosi sui progressi ' +
             'e sulle nuove informazioni che emergono nel corso del trattamento.'
  });
  
  return recommendations;
}

function getFacetSpecificRecommendations(facetId: string, score: number): string {
  const recommendations: { [key: string]: string } = {
    'labilita_emotiva': 'Per l\'instabilità emotiva: implementare un diario emotivo quotidiano, tecniche di grounding per i momenti di intensa emotività, e sviluppo di un "kit di sopravvivenza emotiva" con strategie personalizzate.',
    
    'ansieta': 'Per l\'ansia elevata: training di rilassamento sistematico, esposizione graduale alle situazioni temute, ristrutturazione cognitiva dei pensieri catastrofici, e possibile valutazione per terapia farmacologica ansiolitica.',
    
    'angoscia_di_separazione': 'Per l\'angoscia di separazione: lavoro terapeutico sull\'attaccamento, esposizione graduale a periodi di solitudine, sviluppo dell\'autonomia emotiva, e rafforzamento del senso di sicurezza interiore.',
    
    'sottomissione': 'Per la sottomissione eccessiva: training assertivo strutturato, lavoro sull\'autostima e il valore personale, pratica del dire "no" in contesti sicuri, e esplorazione delle paure legate all\'affermazione di sé.',
    
    'ostilita': 'Per l\'ostilità: tecniche di gestione della rabbia, identificazione dei trigger, sviluppo di strategie di de-escalation, e lavoro sulle ferite emotive sottostanti che alimentano la rabbia.',
    
    'perseverazione': 'Per la perseverazione: tecniche di flessibilità cognitiva, esposizione a situazioni che richiedono adattamento, mindfulness per interrompere i loop di pensiero, e strategie per tollerare l\'incertezza.',
    
    'ritiro': 'Per il ritiro sociale: attivazione comportamentale graduale, identificazione di attività sociali a basso stress, uso di tecnologie per mantenere connessioni, e lavoro sulle paure sociali sottostanti.',
    
    'evitamento_dellintimita': 'Per l\'evitamento dell\'intimità: esplorazione delle paure legate alla vicinanza emotiva, esercizi graduali di condivisione emotiva, lavoro sui traumi relazionali passati, e sviluppo della fiducia.',
    
    'anedonia': 'Per l\'anedonia: programmazione di attività piacevoli anche senza motivazione iniziale, esplorazione di nuovi interessi, attivazione comportamentale sistematica, e possibile valutazione per depressione.',
    
    'depressivita': 'Per la depressività: terapia cognitiva per la depressione, attivazione comportamentale, valutazione per terapia farmacologica antidepressiva, e sviluppo di routine che supportino l\'umore.',
    
    'sospettosita': 'Per la sospettosità: lavoro sulla fiducia graduale, testing di realtà per i pensieri paranoici, esplorazione delle esperienze che hanno generato diffidenza, e sviluppo di relazioni sicure.',
    
    'affettivita_ridotta': 'Per l\'affettività ridotta: esercizi di riconoscimento ed espressione emotiva, uso di arte o musica per facilitare l\'espressione, lavoro corporeo per riconnettere con le sensazioni, e pratica graduale di condivisione emotiva.',
    
    'manipolativita': 'Per la manipolatività: esplorazione dei bisogni sottostanti che guidano la manipolazione, sviluppo di strategie dirette per soddisfare i bisogni, lavoro sull\'empatia e le conseguenze delle proprie azioni sugli altri.',
    
    'disonesta': 'Per la disonestà: esplorazione delle paure legate all\'onestà, pratica graduale di comunicazione veritiera, lavoro sulle conseguenze positive dell\'onestà, e sviluppo di un senso di integrità personale.',
    
    'grandiosita': 'Per la grandiosità: lavoro sull\'autostima realistica, esplorazione delle vulnerabilità mascherate dalla grandiosità, sviluppo della capacità di ricevere feedback, e pratica dell\'umiltà.',
    
    'ricerca_di_attenzione': 'Per la ricerca eccessiva di attenzione: esplorazione dei bisogni emotivi sottostanti, sviluppo di fonti interne di validazione, lavoro sull\'autostima, e pratica di attività gratificanti non legate all\'attenzione altrui.',
    
    'insensibilita': 'Per l\'insensibilità: training dell\'empatia attraverso esercizi specifici, esposizione a storie emotive, pratica del perspective-taking, e esplorazione delle difese che bloccano l\'empatia.',
    
    'irresponsabilita': 'Per l\'irresponsabilità: sviluppo di sistemi di accountability, uso di promemoria e strutture esterne, lavoro sulle conseguenze dei comportamenti, e graduale assunzione di responsabilità.',
    
    'impulsivita': 'Per l\'impulsività: tecniche di "pausa e rifletti", identificazione dei trigger dell\'impulsività, sviluppo di risposte alternative pre-pianificate, e possibile valutazione per ADHD.',
    
    'distraibilita': 'Per la distraibilità: tecniche di gestione dell\'attenzione, strutturazione dell\'ambiente per minimizzare le distrazioni, uso di timer e tecniche di pomodoro, e possibile valutazione per disturbi attentivi.',
    
    'assunzione_di_rischi': 'Per l\'assunzione eccessiva di rischi: esplorazione delle motivazioni sottostanti, sviluppo di fonti alternative di eccitazione, lavoro sulle conseguenze a lungo termine, e identificazione di attività stimolanti ma sicure.',
    
    'perfezionismo_rigido': 'Per il perfezionismo rigido: lavoro sull\'accettazione dell\'imperfezione, esposizione graduale a risultati "abbastanza buoni", sfida delle credenze perfezionistiche, e sviluppo di standard flessibili.',
    
    'convinzioni_e_esperienze_insolite': 'Per le esperienze insolite: normalizzazione delle esperienze nel contesto dello stress, sviluppo di strategie di coping, testing di realtà gentile, e monitoraggio dell\'impatto sul funzionamento.',
    
    'eccentricita': 'Per l\'eccentricità: bilanciamento tra espressione autentica e adattamento sociale, sviluppo di consapevolezza dell\'impatto sui altri, identificazione di contesti appropriati per l\'espressione, e valorizzazione della creatività.',
    
    'disregolazione_cognitiva_e_percettiva': 'Per la disregolazione cognitiva: tecniche di grounding e orientamento, strutturazione della routine quotidiana, riduzione dello stress, e possibile valutazione per interventi farmacologici di supporto.'
  };
  
  return recommendations[facetId] || '';
}

function generateTreatmentConsiderations(sortedDomains: any[], sortedFacets: any[]): any[] {
  let considerations = [];
  
  // Considerazioni basate sui domini elevati
  sortedDomains.forEach(([domainId, score]: any) => {
    if (score.mean >= 1.5) {
      switch(domainId) {
        case 'affettivita_negativa':
          considerations.push({
            area: 'Affettività Negativa',
            text: 'Si consiglia di esplorare strategie di regolazione emotiva, come tecniche di mindfulness, terapia cognitivo-comportamentale focalizzata sulle emozioni, ' +
                  'e sviluppo di competenze di coping adattive.\n\n'
          });
          break;
          
        case 'distacco':
          considerations.push({
            area: 'Distacco Sociale',
            text: 'Si suggerisce di esplorare strategie terapeutiche che favoriscano gradualmente il coinvolgimento sociale, come la terapia interpersonale o interventi di social skills training.\n\n'
          });
          break;
          
        case 'antagonismo':
          considerations.push({
            area: 'Antagonismo',
            text: 'Si suggerisce di lavorare sull\'empatia, la prospettiva dell\'altro e lo sviluppo di pattern relazionali più collaborativi.\n\n'
          });
          break;
          
        case 'disinibizione':
          considerations.push({
            area: 'Disinibizione',
            text: 'Si suggerisce di lavorare sul miglioramento delle funzioni esecutive, tecniche di autocontrollo e strategie di pianificazione.\n\n'
          });
          break;
          
        case 'psicoticismo':
          considerations.push({
            area: 'Psicoticismo',
            text: 'Si suggerisce di esplorare una valutazione clinica approfondita delle esperienze percettive e cognitive insolite per determinare la loro natura e impatto sul funzionamento.\n\n'
          });
          break;
      }
    }
  });
  
  // Considerazione generale se tutti i punteggi sono bassi
  if (considerations.length === 0) {
    considerations.push({
      area: 'Benessere Psicologico Generale',
      text: 'Si suggerisce di mantenere le attuali strategie di coping e continuare a monitorare il benessere psicologico generale.'
    });
  }
  
  return considerations;
} 