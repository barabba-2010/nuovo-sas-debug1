// Funzioni per calcolare i risultati del test S-AS
// Tratte dal monolita HTML fornito

import { factorDefinitions, sasStatements, type SASTestState } from './sas-data';

export interface CalculatedResults {
  scopo: number;
  antiscopo: number;
  balance: number;
  factorScores: Record<number, {
    id: number;
    name: string;
    score: number;
    count: number;
    items: string[];
  }>;
  interpretation: string;
  recommendations: Array<{
    icon: string;
    title: string;
    description: string;
  }>;
}

export function calculateSASResults(testState: SASTestState): CalculatedResults {
  // Calcola i punteggi totali per Scopo e Antiscopo
  let scopoTotal = 0, antiscopoTotal = 0, scopoCount = 0, antiscopoCount = 0;
  
  // Somma i punteggi della Parte I
  Object.entries(testState.part1.answers).forEach(([key, value]) => {
    if (key.endsWith("S")) { 
      scopoTotal += value; 
      scopoCount++; 
    } else if (key.endsWith("AS")) { 
      antiscopoTotal += value; 
      antiscopoCount++; 
    }
  });
  
  // Somma i punteggi della Parte II
  Object.values(testState.part2.answers).forEach(ans => {
    if (ans.type === "S") { 
      scopoTotal += ans.score; 
      scopoCount++; 
    } else if (ans.type === "AS") { 
      antiscopoTotal += ans.score; 
      antiscopoCount++; 
    }
  });
  
  // Calcola le medie arrotondate
  const scopoAvg = scopoCount > 0 ? Math.round(scopoTotal / scopoCount) : 0;
  const antiscopoAvg = antiscopoCount > 0 ? Math.round(antiscopoTotal / antiscopoCount) : 0;
  const balance = scopoAvg - antiscopoAvg;
  
  // Calcola i punteggi dei fattori
  const factorScores = calculateFactorScores(testState);
  
  // Genera interpretazione e raccomandazioni
  const interpretation = generateInterpretation(testState, factorScores);
  const recommendations = generateRecommendations(balance, factorScores);
  
  return {
    scopo: scopoAvg,
    antiscopo: antiscopoAvg,
    balance,
    factorScores,
    interpretation,
    recommendations
  };
}

export function calculateFactorScores(testState: SASTestState): Record<number, {
  id: number;
  name: string;
  score: number;
  count: number;
  items: string[];
}> {
  const factorScores: Record<number, any> = {};
  
  // Calcola i punteggi per ogni fattore utilizzando SOLO la parte 1
  Object.entries(factorDefinitions).forEach(([factorId, factor]) => {
    let total = 0;
    let count = 0;
    
    factor.items.forEach(item => {
      // Estrai numero domanda e tipo (S o AS)
      const qNumber = item.replace(/[SA]/g, "");
      const type = item.includes("AS") ? "AS" : "S";
      const key = qNumber + type;
      
      // Verifica che l'elemento non sia tra quelli da escludere
      const excludedItems = ["4S", "4AS", "6S", "6AS", "9S", "9AS"];
      if (!excludedItems.includes(key)) {
        // Usa SOLO i punteggi dalla parte 1
        if (testState.part1.answers[key] !== undefined) {
          total += parseInt(testState.part1.answers[key].toString());
          count++;
        }
      }
    });
    
    // IMPORTANTE: Calcoliamo la MEDIA invece della somma
    // Se count è 0, il punteggio è 0
    const averageScore = count > 0 ? total / count : 0;
    
    factorScores[parseInt(factorId)] = {
      id: parseInt(factorId),
      name: factor.name,
      count: count,
      score: Math.round(averageScore * 10) / 10, // Arrotondiamo a 1 decimale per maggiore precisione
      items: factor.items.filter(item => {
        const key = item.replace(/[SA]/g, "") + (item.includes("AS") ? "AS" : "S");
        return !["4S", "4AS", "6S", "6AS", "9S", "9AS"].includes(key);
      })
    };
  });
  
  return factorScores;
}

export function generateInterpretation(
  testState: SASTestState, 
  factorScores: Record<number, any>
): string {
  let interp = "";
  
  interp += "<p><strong>Fattori principali:</strong></p><ul>";
  
  // Ottieni i fattori ordinati per punteggio
  const sortedFactors = Object.values(factorScores)
    .sort((a: any, b: any) => b.score - a.score)
    .slice(0, 3);
  
  // Aggiungi i fattori principali
  sortedFactors.forEach((factor: any) => {
    const score = factor.score.toFixed(1);
    const info = factorDefinitions[factor.id];
    if (info) {
      interp += `<li><strong>${info.name} (${score})</strong>: ${info.description}</li>`;
    }
  });
  
  interp += "</ul>";
  
  // Aggiungi le risposte delle domande aperte
  if (testState.part3.answers.q2) {
    interp += `<p><strong>Domanda 2:</strong> ${testState.part3.answers.q2}</p>`;
  }
  if (testState.part3.answers.q3) {
    interp += `<p><strong>Domanda 3:</strong> ${testState.part3.answers.q3}</p>`;
  }
  if (testState.part3.answers.q4 === "yes" && testState.part3.answers.q5) {
    interp += `<p><strong>Domanda 4:</strong> Strategie funzionano: ${testState.part3.answers.q5}</p>`;
  } else if (testState.part3.answers.q4 === "no" && testState.part3.answers.q6) {
    interp += `<p><strong>Domanda 4:</strong> Strategie non funzionano: ${testState.part3.answers.q6}</p>`;
  }
  
  return interp;
}

export function generateRecommendations(
  balance: number, 
  factorScores: Record<number, any>
): Array<{
  icon: string;
  title: string;
  description: string;
}> {
  const recs: Array<{
    icon: string;
    title: string;
    description: string;
  }> = [];
  
  // Raccomandazioni basate sul bilanciamento
  if (balance < -1) {  // Aggiustato per scale 0-4
    recs.push({ 
      icon: "fa-balance-scale", 
      title: "Riequilibra la motivazione", 
      description: "Dedica maggiore attenzione agli obiettivi positivi." 
    });
  } else if (balance > 1) {  // Aggiustato per scale 0-4
    recs.push({ 
      icon: "fa-exclamation-triangle", 
      title: "Attenzione ai rischi", 
      description: "Considera possibili ostacoli nella realizzazione dei tuoi obiettivi." 
    });
  }
  
  // Ordina i fattori per punteggio decrescente
  const sortedFactors = Object.values(factorScores)
    .sort((a: any, b: any) => b.score - a.score);
  
  if (sortedFactors.length > 0) {
    const top = sortedFactors[0] as any;
    const topId = top.id;
    
    // Aggiungiamo raccomandazioni solo per fattori con punteggio significativo
    // Soglia aggiustata per punteggi medi (era 5, ora 2.5 che è sopra la media della scala 0-4)
    if (top.score > 2.5) {
      switch (topId) {
        case 1:
          recs.push({ 
            icon: "fa-users", 
            title: "Valorizzazione personale", 
            description: "Bilancia il bisogno di riconoscimento con un'adeguata autovalutazione." 
          });
          break;
        case 2:
          recs.push({ 
            icon: "fa-heart", 
            title: "Stabilità emotiva", 
            description: "Sviluppa strumenti di regolazione emotiva per gestire meglio stress e ansia." 
          });
          break;
        case 3:
          recs.push({ 
            icon: "fa-user-friends", 
            title: "Connessione sociale", 
            description: "Lavora sulla fiducia in te stesso per ridurre la paura del rifiuto sociale." 
          });
          break;
        case 4:
          recs.push({ 
            icon: "fa-check-double", 
            title: "Gestione del perfezionismo", 
            description: "Impara ad accettare che non tutto deve essere perfetto, sviluppa flessibilità." 
          });
          break;
        case 5:
          recs.push({ 
            icon: "fa-thumbs-up", 
            title: "Autostima", 
            description: "Concentrati sulle tue qualità e successi per bilanciare l'autocritica." 
          });
          break;
        case 6:
          recs.push({ 
            icon: "fa-handshake", 
            title: "Cura di sé", 
            description: "Bilancia l'attenzione per gli altri con la cura dei tuoi bisogni personali." 
          });
          break;
        case 7:
          recs.push({ 
            icon: "fa-fingerprint", 
            title: "Identità personale", 
            description: "Esplora le tue passioni individuali per rafforzare il tuo senso di identità." 
          });
          break;
        case 8:
          recs.push({ 
            icon: "fa-shield-alt", 
            title: "Fiducia relazionale", 
            description: "Cerca di sviluppare fiducia graduale nelle relazioni significative." 
          });
          break;
      }
    }
  }
  
  return recs;
}

// Analizza l'orientamento verso scopi o antiscopi nella Parte 2
export function analyzePartTwoOrientation(testState: SASTestState) {
  let scopiCount = 0;
  let antiscopiCount = 0;
  let scopiTotal = 0;
  let antiscopiTotal = 0;
  
  // Analizza le scelte della parte 2
  Object.entries(testState.part2.answers).forEach(([questionId, answer]) => {
    const score = parseInt(answer.score.toString());
    if (answer.type === "S") {
      scopiCount++;
      scopiTotal += score;
    } else if (answer.type === "AS") {
      antiscopiCount++;
      antiscopiTotal += score;
    }
  });
  
  return {
    scopi: { 
      count: scopiCount, 
      total: scopiTotal, 
      avg: scopiCount > 0 ? Math.round(scopiTotal / scopiCount) : 0 
    },
    antiscopi: { 
      count: antiscopiCount, 
      total: antiscopiTotal, 
      avg: antiscopiCount > 0 ? Math.round(antiscopiTotal / antiscopiCount) : 0 
    }
  };
}

export function generateOrientationAnalysis(orientationData: ReturnType<typeof analyzePartTwoOrientation>): string {
  let analysis = "";
  const totalAnswers = orientationData.scopi.count + orientationData.antiscopi.count;
  
  if (totalAnswers === 0) {
    return "<p>Non ci sono dati sufficienti per analizzare l'orientamento.</p>";
  }
  
  const scopiPercentage = Math.round((orientationData.scopi.count / totalAnswers) * 100);
  const antiscopiPercentage = Math.round((orientationData.antiscopi.count / totalAnswers) * 100);
  
  if (orientationData.scopi.count > orientationData.antiscopi.count) {
    analysis += `<p>Mostra un <strong>orientamento prevalente verso gli Scopi</strong> (${scopiPercentage}% delle scelte). `;
    if (scopiPercentage > 70) {
      analysis += "Questo forte orientamento suggerisce una tendenza significativa a concentrarsi principalmente sugli obiettivi positivi da raggiungere piuttosto che sulle situazioni da evitare.</p>";
    } else {
      analysis += "Questo leggero orientamento suggerisce una moderata tendenza a formulare i propri obiettivi in termini positivi, pur mantenendo attenzione anche agli aspetti da evitare.</p>";
    }
  } else if (orientationData.antiscopi.count > orientationData.scopi.count) {
    analysis += `<p>Mostra un <strong>orientamento prevalente verso gli Antiscopi</strong> (${antiscopiPercentage}% delle scelte). `;
    if (antiscopiPercentage > 70) {
      analysis += "Questo forte orientamento suggerisce una tendenza significativa a focalizzarsi su ciò che si vuole evitare piuttosto che sugli obiettivi positivi da raggiungere.</p>";
    } else {
      analysis += "Questo leggero orientamento suggerisce una moderata tendenza a formulare i propri obiettivi in termini di situazioni da evitare, pur mantenendo attenzione anche agli obiettivi positivi.</p>";
    }
  } else {
    analysis += "<p>Mostra un <strong>orientamento equilibrato</strong> tra Scopi e Antiscopi (50% per entrambi). Questo equilibrio suggerisce una capacità di bilanciare obiettivi positivi da raggiungere e situazioni da evitare nella formulazione della propria motivazione.</p>";
  }
  
  analysis += "<p>La capacità di orientarsi verso gli Scopi è generalmente associata a una migliore regolazione emotiva e a una più efficace capacità di perseguire obiettivi a lungo termine.</p>";
  
  return analysis;
}

export function generateQualitativeAnalysis(factors: any[]): string {
  // Calcoliamo la media e deviazione standard dei punteggi
  const allScores = factors.map(f => f.score);
  const avgScore = allScores.reduce((a, b) => a + b, 0) / allScores.length;
  
  // Calcolo deviazione standard
  const variance = allScores.reduce((a, b) => a + Math.pow(b - avgScore, 2), 0) / allScores.length;
  const stdDev = Math.sqrt(variance);
  
  // Definiamo soglie basate su media e deviazione standard
  const lowThreshold = avgScore - 0.5 * stdDev;
  const highThreshold = avgScore + 0.5 * stdDev;
  
  let analysis = '<div class="factors-analysis-container">';
  analysis += `<p>L'analisi del profilo S-AS evidenzia le seguenti tendenze, basate sul confronto di ciascun fattore con la media personale (media = ${avgScore.toFixed(1)}):</p>`;
  
  // Processiamo tutti i fattori in ordine
  factors.forEach(factor => {
    let interpretation = "";
    const score = factor.score; // Non arrotondiamo più a intero, manteniamo il decimale
    
    // Forza relativa del fattore
    let strength = "";
    if (score === 0) {
      strength = "<strong style='color: #FFC107'>Fattore assente</strong> (punteggio pari a zero)";
    } else if (score > highThreshold) {
      strength = "<strong style='color: #4CAF50'>Fattore fortemente presente</strong> (punteggio significativamente sopra la media personale)";
    } else if (score < lowThreshold) {
      strength = "<strong style='color: #FFC107'>Fattore poco presente</strong> (punteggio significativamente sotto la media personale)";
    } else {
      strength = "<strong style='color: #2196F3'>Fattore mediamente presente</strong> (punteggio in linea con la media personale)";
    }
    
    // Interpretazioni specifiche per ogni fattore
    switch(factor.id) {
      case 1:
        interpretation = score === 0 ?
          "Assenza di interesse per il prestigio sociale. Non sei affatto orientato/a alla ricerca di affermazione o riconoscimento da parte degli altri." :
          score > highThreshold ? 
          "Forte bisogno di affermazione sociale e prestigio. La tua motivazione è orientata verso il riconoscimento e l'ammirazione da parte degli altri. Tendi a dare molta importanza al tuo status sociale e alla percezione che gli altri hanno di te." :
          score >= lowThreshold ?
          "Moderato interesse per il prestigio sociale. Sei in grado di bilanciare il bisogno di riconoscimento esterno con altre motivazioni personali, mantenendo un equilibrio tra l'approvazione sociale e la tua autovalutazione." :
          "Interesse contenuto per il prestigio sociale. Non sei particolarmente orientato/a alla ricerca di affermazione o riconoscimento da parte degli altri e valorizzi maggiormente altri aspetti della tua vita.";
        break;
      case 2:
        interpretation = score === 0 ?
          "Nessuna preoccupazione per la stabilità emotiva. Non percepisci alcuna necessità particolare di ricercare equilibrio psicologico." :
          score > highThreshold ?
          "Elevata sensibilità emotiva e forte ricerca di stabilità psicologica. Avverti un intenso bisogno di equilibrio interiore e potresti sentire che la tua serenità emotiva è significativamente influenzata dagli eventi esterni. Tendi a investire molte energie nel mantenere la tua stabilità." :
          score >= lowThreshold ?
          "Buona capacità di regolazione emotiva. Sei consapevole dell'importanza della stabilità psicologica e generalmente riesci a mantenere un buon equilibrio emotivo, pur riconoscendo i momenti di maggiore vulnerabilità." :
          "Solida stabilità emotiva. Generalmente ti senti psicologicamente capace di affrontare le sfide della vita senza eccessivi turbamenti emotivi, e possiedi buone risorse interne per gestire lo stress.";
        break;
      case 3:
        interpretation = score === 0 ?
          "Nessun timore di esclusione sociale. Non mostri alcuna preoccupazione riguardo all'essere accettato/a o rifiutato/a dagli altri." :
          score > highThreshold ?
          "Significativo timore di esclusione sociale. Provi una forte preoccupazione rispetto al rischio di essere rifiutato/a o emarginato/a dagli altri. Questo timore può influenzare in modo importante le tue scelte relazionali e sociali." :
          score >= lowThreshold ?
          "Moderata sensibilità all'esclusione sociale. Sei attento/a alle dinamiche di inclusione e accettazione nei gruppi sociali, ma generalmente mantieni un buon equilibrio tra il desiderio di appartenenza e la tua autonomia personale." :
          "Bassa preoccupazione per l'esclusione sociale. Ti senti generalmente a tuo agio nelle situazioni sociali e non tendi a preoccuparti eccessivamente del giudizio o del rifiuto da parte degli altri.";
        break;
      case 4:
        interpretation = score === 0 ?
          "Completa assenza di perfezionismo. Non mostri alcuna tendenza a ricercare perfezione o controllo nelle tue attività." :
          score > highThreshold ?
          "Spiccata tendenza al perfezionismo e al controllo. Avverti un forte bisogno di fare le cose in modo impeccabile e di mantenere il controllo sulle situazioni. Questo può portarti a dedicare molta energia nel prevenire errori o imperfezioni." :
          score >= lowThreshold ?
          "Tendenza equilibrata alla precisione e all'ordine. Apprezzi la qualità e l'attenzione ai dettagli, ma riesci a mantenere una flessibilità che ti permette di adattarti anche a situazioni meno strutturate." :
          "Approccio rilassato verso la perfezione e il controllo. Non sei particolarmente preoccupato/a di raggiungere standard elevati in ogni attività e accetti con serenità le imperfezioni come parte naturale della vita.";
        break;
      case 5:
        interpretation = score === 0 ?
          "Nessuna preoccupazione per difetti personali. Non percepisci alcuna criticità nella tua persona che ti causa preoccupazione." :
          score > highThreshold ?
          "Significativa preoccupazione per i propri difetti. Tendi a percepire intensamente le tue imperfezioni e potresti essere molto autocritico/a, con una tendenza a focalizzarti sugli aspetti negativi di te stesso/a piuttosto che sui tuoi punti di forza." :
          score >= lowThreshold ?
          "Moderata consapevolezza dei propri limiti. Riconosci le tue imperfezioni ma generalmente mantieni una visione equilibrata di te stesso/a, valorizzando anche le tue qualità e competenze." :
          "Visione positiva di te stesso/a. Generalmente non sei preoccupato/a per potenziali difetti e mantieni una buona autostima, riuscendo a valorizzare i tuoi punti di forza.";
        break;
      case 6:
        interpretation = score === 0 ?
          "Assenza di attitudine all'auto-sacrificio. Non mostri alcuna tendenza a mettere i bisogni degli altri prima dei tuoi." :
          score > highThreshold ?
          "Forte tendenza all'auto-sacrificio. Metti costantemente i bisogni degli altri prima dei tuoi, con un'elevata disponibilità ad accantonare le tue necessità per prenderti cura di chi ti circonda. Questo può portare a trascurare il tuo benessere personale." :
          score >= lowThreshold ?
          "Equilibrato senso di responsabilità verso gli altri. Sei attento/a ai bisogni delle persone che ti circondano, ma generalmente riesci a bilanciare questa attenzione con la cura di te stesso/a." :
          "Capacità di stabilire priorità personali. Non tendi a sacrificare eccessivamente le tue necessità per gli altri e mantieni un sano equilibrio tra l'altruismo e l'attenzione al tuo benessere.";
        break;
      case 7:
        interpretation = score === 0 ?
          "Nessuna ricerca di identità personale. Non mostri alcuna preoccupazione riguardo alla definizione della tua individualità o differenziazione dai modelli familiari." :
          score > highThreshold ?
          "Intensa ricerca di identità personale. Avverti un forte bisogno di definire e affermare la tua individualità, possibilmente in contrasto con modelli familiari o sociali. Questo può manifestarsi come un desiderio di differenziazione e autonomia." :
          score >= lowThreshold ?
          "Processo di individuazione in corso. Stai lavorando alla costruzione della tua identità personale, integrando influenze familiari con le tue caratteristiche individuali, in un percorso di crescita equilibrato." :
          "Identità personale ben definita. Hai un buon senso di chi sei e non avverti un particolare bisogno di differenziarti dai modelli familiari o sociali.";
        break;
      case 8:
        interpretation = score === 0 ?
          "Totale assenza di sospettosità nelle relazioni. Non mostri alcuna cautela o vigilanza nei rapporti con gli altri." :
          score > highThreshold ?
          "Marcata cautela nelle relazioni interpersonali. Tendi a mantenere un atteggiamento di significativa vigilanza e sospettosità nei rapporti con gli altri, probabilmente come meccanismo di protezione da potenziali delusioni o tradimenti." :
          score >= lowThreshold ?
          "Equilibrio tra fiducia e prudenza nelle relazioni. Sei in grado di stabilire relazioni di fiducia mantenendo comunque un sano livello di cautela, senza cadere in estremi di ingenuità o sospettosità." :
          "Attitudine fiduciosa nelle relazioni. Tendi a vedere gli altri in modo positivo e ad approcciarti alle relazioni con apertura, senza eccessive preoccupazioni riguardo a possibili tradimenti.";
        break;
    }
    
    // Aggiungiamo al paragrafo la valutazione relativa del fattore
    analysis += `<div class="factor-analysis-item">
      <h4>${factor.id}. ${factor.name} (${score.toFixed(1)})</h4>
      <p><em>${strength}</em></p>
      <p>${interpretation}</p>
    </div>`;
  });
  
  analysis += `<p style="margin-top: 20px; padding: 15px; background: #f5f5f5; border-radius: 5px; font-style: italic; color: #666;">
    <strong>Nota:</strong> Questa analisi si basa sull'elaborazione delle tue risposte alla Parte I del test, che esplora le tue tendenze di fondo. 
    I punteggi sono relativi al tuo profilo personale, non a confronto con altri individui.
  </p>`;
  
  // Disclaimer professionale
  analysis += `<div style="margin-top: 25px; padding: 15px; background: #fbf0e5; border-radius: 5px; border: 1px solid #ffeeba;">
    <strong style="color: #856404; display: block; margin-bottom: 5px;">Nota per l'utente:</strong>
    <p style="color: #856404; margin: 0;">
      La presente analisi è stata generata tramite un sistema automatizzato e offre un'interpretazione preliminare dei risultati del test. 
      Si raccomanda di consultare un professionista qualificato per una valutazione completa e personalizzata. 
      Il terapeuta potrà confermare, integrare o modificare questa interpretazione sulla base di ulteriori elementi clinici e contestuali.
    </p>
  </div>`;
  
  analysis += '</div>';
  
  return analysis;
} 