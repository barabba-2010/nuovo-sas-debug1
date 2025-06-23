const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedTestSAS() {
  try {
    console.log('Creazione del Test S-AS...');
    
    // Definizione delle 20 coppie di affermazioni
    const sasQuestionPairs = [
      {
        scopo: "Voglio essere una persona affermata",
        antiScopo: "Non voglio essere un fallito"
      },
      {
        scopo: "Voglio essere perfettamente in forma",
        antiScopo: "Non voglio avere un brutto aspetto"
      },
      {
        scopo: "Vorrei godere di un perfetto stato di salute",
        antiScopo: "Non posso tollerare che il mio corpo sia in qualche senso ammalato"
      },
      {
        scopo: "Voglio essere una persona amata",
        antiScopo: "Non vorrei mai essere solo e disprezzato"
      },
      {
        scopo: "Vorrei essere riconosciuto e sentirmi partecipe in ogni circostanza",
        antiScopo: "Non voglio sentirmi escluso"
      },
      {
        scopo: "Voglio essere una persona indipendente dagli altri",
        antiScopo: "Non voglio essere dipendente dagli altri"
      },
      {
        scopo: "Vorrei essere capace di non ripetere gli errori commessi dai miei familiari",
        antiScopo: "Non voglio essere come i miei genitori (almeno uno dei due)"
      },
      {
        scopo: "Voglio essere una persona giusta",
        antiScopo: "Non voglio essere colpevole"
      },
      {
        scopo: "Vorrei essere una persona energica e felice",
        antiScopo: "Non voglio essere triste e spento"
      },
      {
        scopo: "Vorrei funzionare meglio",
        antiScopo: "Non voglio essere inadeguato"
      },
      {
        scopo: "Vorrei essere una persona calma e rilassata",
        antiScopo: "Non posso essere agitato"
      },
      {
        scopo: "Voglio essere una persona speciale",
        antiScopo: "Non voglio essere una persona qualsiasi"
      },
      {
        scopo: "Vorrei essere una persona forte",
        antiScopo: "Non devo essere debole"
      },
      {
        scopo: "Voglio fare le cose in modo perfetto",
        antiScopo: "Non posso sbagliare"
      },
      {
        scopo: "Vorrei avere tutto sotto controllo",
        antiScopo: "Non devo e non posso perdere il controllo"
      },
      {
        scopo: "Ho bisogno di essere amato/sostenuto",
        antiScopo: "Non voglio essere abbandonato"
      },
      {
        scopo: "Vorrei essere visto a tutti i costi",
        antiScopo: "Non posso non essere visto"
      },
      {
        scopo: "Devo accudire e prendermi cura dell'altro",
        antiScopo: "Non devo ferire gli altri e abbandonarli"
      },
      {
        scopo: "Voglio essere migliore degli altri",
        antiScopo: "Non posso essere inferiore agli altri"
      },
      {
        scopo: "Voglio essere certo che gli altri non mi tradiscono",
        antiScopo: "Non posso fidarmi degli altri"
      }
    ];

    // Costruzione delle sezioni del test
    const sections = [
      {
        title: "Parte I: Valutazione delle affermazioni",
        description: "Per ciascuna coppia, assegna un punteggio da 0 a 4. I punteggi per l'affermazione 'Scopo' e per quella 'Antiscopo' sono indipendenti. Il punteggio selezionato verrà evidenziato in viola.",
        questions: []
      },
      {
        title: "Parte II: Scelta tra Scopo e Antiscopo",
        description: "Per ciascuna delle 20 coppie, scegli solo una delle due affermazioni, quella che ti rappresenta di più.",
        questions: []
      },
      {
        title: "Parte III: Riflessione aperta",
        description: "Seleziona 2 affermazioni (tra le 40 viste prima) e rispondi alle domande seguenti.",
        questions: []
      }
    ];

    // Costruzione delle domande per la Sezione I
    sasQuestionPairs.forEach((pair, index) => {
      // Domanda per Scopo
      sections[0].questions.push({
        id: `s1_${index+1}_s`,
        text: `${index+1}. (S) ${pair.scopo}`,
        type: "SCALE",
        options: [
          { value: "0", label: "Per niente" },
          { value: "1", label: "Poco" },
          { value: "2", label: "Moderatamente" },
          { value: "3", label: "Molto" },
          { value: "4", label: "Moltissimo" }
        ],
        metadata: { type: "scopo", pair: index+1 }
      });

      // Domanda per Anti-Scopo
      sections[0].questions.push({
        id: `s1_${index+1}_as`,
        text: `${index+1}a. (AS) ${pair.antiScopo}`,
        type: "SCALE",
        options: [
          { value: "0", label: "Per niente" },
          { value: "1", label: "Poco" },
          { value: "2", label: "Moderatamente" },
          { value: "3", label: "Molto" },
          { value: "4", label: "Moltissimo" }
        ],
        metadata: { type: "antiscopo", pair: index+1 }
      });
    });

    // Costruzione delle domande per la Sezione II
    sasQuestionPairs.forEach((pair, index) => {
      sections[1].questions.push({
        id: `s2_${index+1}`,
        text: `Coppia ${index+1}. Scegli l'affermazione che ti rappresenta di più:`,
        type: "MULTIPLE_CHOICE",
        options: [
          { value: "scopo", label: `(S) ${pair.scopo}` },
          { value: "antiscopo", label: `(AS) ${pair.antiScopo}` }
        ],
        metadata: { pair: index+1 }
      });
    });

    // Costruzione delle domande per la Sezione III
    // Prima domanda: selezione di 2 affermazioni tra le 40
    const allStatements = [];
    sasQuestionPairs.forEach((pair, index) => {
      allStatements.push({
        value: `s_${index+1}`,
        label: `${index+1}. (S) ${pair.scopo}`
      });
      allStatements.push({
        value: `as_${index+1}`,
        label: `${index+1}a. (AS) ${pair.antiScopo}`
      });
    });

    sections[2].questions.push({
      id: "s3_select",
      text: "Scegli due affermazioni tra le seguenti:",
      type: "MULTIPLE_CHOICE",
      options: allStatements,
      metadata: { multiselect: true, max: 2 }
    });

    // Domande di riflessione
    const reflectionQuestions = [
      "Come cerchi di raggiungerle o evitarle?",
      "Come persegui o ti difendi rispetto a esse?",
      "Queste strategie funzionano?",
      "Se sì, in che misura?",
      "Se no, perché?"
    ];

    reflectionQuestions.forEach((question, index) => {
      if (index === 2) {
        // Domanda con risposta Sì/No
        sections[2].questions.push({
          id: `s3_q${index+2}`,
          text: question,
          type: "MULTIPLE_CHOICE",
          options: [
            { value: "si", label: "Sì" },
            { value: "no", label: "No" }
          ]
        });
      } else {
        // Domanda con risposta testuale
        sections[2].questions.push({
          id: `s3_q${index+2}`,
          text: question,
          type: "TEXT",
          options: []
        });
      }
    });

    // Creazione del test nel database
    const createdTest = await prisma.test.create({
      data: {
        title: "Test S-AS",
        description: "Valutazione di obiettivi (Scopo) e preoccupazioni (Antiscopo)",
        instructions: "Il test S-AS (Scopo vs Anti-Scopo) è uno strumento psicologico utile per analizzare le motivazioni profonde di una persona. Il test è composto da 3 sezioni e 20 coppie di affermazioni. Ogni coppia contiene: 1 affermazione Scopo (S) e 1 affermazione Anti-Scopo (AS).",
        category: "PERSONALITY",
        type: "PERSONALITY",
        questions: JSON.stringify(sections),
        creatorId: "cm9ix4c0z0002qpqo5xl51twg", // ID dell'admin
        isActive: true,
        timeLimit: 15, // 15 minuti
        metadata: JSON.stringify({
          sections: 3,
          pairs: 20,
          scoringMethod: "individual_comparison"
        })
      }
    });

    console.log('Test S-AS creato con successo:', createdTest.id);
    return createdTest;
  } catch (error) {
    console.error('Errore durante la creazione del Test S-AS:', error);
    throw error;
  }
}

async function main() {
  try {
    await seedTestSAS();
    console.log('Seed completato con successo!');
  } catch (error) {
    console.error('Errore durante il seed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 