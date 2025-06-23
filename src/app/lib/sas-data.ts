// Dati per il Test S-AS (Scopo-Antiscopo)
// Tratti dal monolita HTML fornito

export interface SASStatement {
  id: string;
  scopo: string;
  antiscopo: string;
}

export interface FactorDefinition {
  name: string;
  items: string[];
  description: string;
}

// 20 coppie di affermazioni S-AS
export const sasStatements: SASStatement[] = [
  { id: "1", scopo: "Voglio essere una persona affermata", antiscopo: "Non voglio essere un fallito" },
  { id: "2", scopo: "Voglio essere perfettamente in forma", antiscopo: "Non voglio avere un brutto aspetto" },
  { id: "3", scopo: "Vorrei godere di un perfetto stato di salute", antiscopo: "Non posso tollerare che il mio corpo sia in qualche senso ammalato" },
  { id: "4", scopo: "Voglio essere una persona amata", antiscopo: "Non vorrei mai essere solo e disprezzato" },
  { id: "5", scopo: "Vorrei essere riconosciuto e sentirmi partecipe in ogni circostanza", antiscopo: "Non voglio sentirmi escluso" },
  { id: "6", scopo: "Voglio essere una persona indipendente dagli altri", antiscopo: "Non voglio essere dipendente dagli altri" },
  { id: "7", scopo: "Vorrei essere capace di non ripetere gli errori commessi dai miei familiari", antiscopo: "Non voglio essere come i miei genitori (almeno uno dei due)" },
  { id: "8", scopo: "Voglio essere una persona giusta", antiscopo: "Non voglio essere colpevole" },
  { id: "9", scopo: "Vorrei essere una persona energica e felice", antiscopo: "Non voglio essere triste e spento" },
  { id: "10", scopo: "Vorrei funzionare meglio", antiscopo: "Non voglio essere inadeguato" },
  { id: "11", scopo: "Vorrei essere una persona calma e rilassata", antiscopo: "Non posso essere agitato" },
  { id: "12", scopo: "Voglio essere una persona speciale", antiscopo: "Non voglio essere una persona qualsiasi" },
  { id: "13", scopo: "Vorrei essere una persona forte", antiscopo: "Non devo essere debole" },
  { id: "14", scopo: "Voglio fare le cose in modo perfetto", antiscopo: "Non posso sbagliare" },
  { id: "15", scopo: "Vorrei avere tutto sotto controllo", antiscopo: "Non devo e non posso perdere il controllo" },
  { id: "16", scopo: "Ho bisogno di essere amato/sostenuto", antiscopo: "Non voglio essere abbandonato" },
  { id: "17", scopo: "Vorrei essere visto a tutti i costi", antiscopo: "Non posso non essere visto" },
  { id: "18", scopo: "Devo accudire e prendermi cura dell'altro", antiscopo: "Non devo ferire gli altri e abbandonarli" },
  { id: "19", scopo: "Voglio essere migliore degli altri", antiscopo: "Non posso essere inferiore agli altri" },
  { id: "20", scopo: "Voglio essere certo che gli altri non mi tradiscono", antiscopo: "Non posso fidarmi degli altri" }
];

// Definizioni dei fattori
export const factorDefinitions: Record<number, FactorDefinition> = {
  1: { 
    name: "Interpersonal prestige", 
    items: ["5S", "12S", "12AS", "16S", "17S", "17AS", "19S", "19AS"],
    description: "Il bisogno di essere riconosciuti e rispettati dagli altri."
  },
  2: { 
    name: "Emotional Stability", 
    items: ["10S", "11S", "11AS", "13S", "13AS"],
    description: "La ricerca di stabilità emotiva e calma interiore."
  },
  3: { 
    name: "Social exclusion", 
    items: ["1AS", "2AS", "5AS", "8AS", "10AS", "16AS"],
    description: "Il timore di essere esclusi o rifiutati socialmente."
  },
  4: { 
    name: "Perfectionis/Controllo", 
    items: ["14S", "14AS", "15S", "15AS"],
    description: "Il desiderio di perfezione e controllo nella vita."
  },
  5: { 
    name: "Defectiveness", 
    items: ["1S", "2S", "3S", "3AS"],
    description: "La preoccupazione per difetti personali."
  },
  6: { 
    name: "Self-Sacrifice", 
    items: ["8S", "18S", "18AS"],
    description: "La tendenza a mettere i bisogni degli altri prima dei propri."
  },
  7: { 
    name: "Individuation/Identity", 
    items: ["7S", "7AS"],
    description: "La ricerca di un'identità personale autentica."
  },
  8: { 
    name: "Trust/Suspiciousness", 
    items: ["20S", "20AS"],
    description: "Il livello di fiducia o sospetto nelle relazioni."
  }
};

// Stati per il test S-AS
export interface SASTestState {
  currentStep: 'intro' | 'part1' | 'part2' | 'part3' | 'results';
  part1: {
    currentPair: number;
    answers: Record<string, number>; // key: "1S" | "1AS", value: 0-4
    completed: boolean;
  };
  part2: {
    currentPair: number;
    answers: Record<string, { type: 'S' | 'AS'; score: number }>; // key: "1", value: {type, score}
    completed: boolean;
  };
  part3: {
    selectedStatements: string[]; // ["1:S", "5:AS"]
    answers: {
      q2: string; // Come cerchi di raggiungere...
      q3: string; // Come cerchi di perseguire o evitare...
      q4: 'yes' | 'no' | ''; // Le strategie funzionano?
      q5: string; // Se sì, in che misura?
      q6: string; // Se no, perché?
    };
    completed: boolean;
  };
  results: {
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
  };
}

// Opzioni per la scala di valutazione
export const ratingOptions = [
  { value: 0, label: "Per niente" },
  { value: 1, label: "Poco" },
  { value: 2, label: "Moderatamente" },
  { value: 3, label: "Molto" },
  { value: 4, label: "Moltissimo" }
]; 