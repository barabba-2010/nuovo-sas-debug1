import { PrismaClient, TestType } from '@prisma/client';

const prisma = new PrismaClient();

async function seedTests() {
  console.log('=== INSERIMENTO TEST NEL DATABASE ===\n');

  try {
    // Prima trova un utente admin per essere il creatore
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });

    if (!adminUser) {
      console.error('❌ Nessun utente admin trovato. Crea prima un admin.');
      process.exit(1);
    }

    // Verifica se i test esistono già
    const existingTests = await prisma.test.findMany();
    
    if (existingTests.length > 0) {
      console.log('⚠️  I test sono già presenti nel database:');
      existingTests.forEach(test => {
        console.log(`   - ${test.title} (${test.isActive ? 'attivo' : 'disattivo'})`);
      });
      
      console.log('\n✅ I test sono già presenti nel database.');
      process.exit(0);
    }

    // Inserisci i test
    const tests = [
      {
        title: 'S-AS (Scopo-Antiscopo)',
        description: 'Test per valutare gli obiettivi e le preoccupazioni',
        instructions: 'Per ogni coppia di affermazioni, scegli quella che ti descrive meglio.',
        category: 'Personalità',
        type: TestType.PERSONALITY,
        questions: JSON.stringify([]), // Le domande sono gestite nel componente
        creatorId: adminUser.id,
        isActive: true,
        timeLimit: 0,
        scoring: JSON.stringify({
          type: 'sas',
          method: 'paired_comparison'
        }),
        metadata: JSON.stringify({
          isSystemTest: true,
          version: '1.0'
        })
      },
      {
        title: 'PID-5 (Personality Inventory for DSM-5)',
        description: 'Inventario di personalità per DSM-5 con 220 domande',
        instructions: 'Indica quanto ogni affermazione ti descrive utilizzando la scala da 0 a 3.',
        category: 'Personalità Clinica',
        type: TestType.PERSONALITY,
        questions: JSON.stringify([]), // Le domande sono gestite nel componente
        creatorId: adminUser.id,
        isActive: true,
        timeLimit: 0,
        scoring: JSON.stringify({
          type: 'pid5',
          method: 'likert_scale',
          domains: 5,
          facets: 25
        }),
        metadata: JSON.stringify({
          isSystemTest: true,
          version: '1.0',
          totalQuestions: 220
        })
      }
    ];

    for (const test of tests) {
      const created = await prisma.test.create({
        data: test
      });
      console.log(`✅ Test creato: ${created.title}`);
    }

    // Verifica finale
    const finalTests = await prisma.test.findMany();
    console.log(`\n✅ Inserimento completato! Totale test nel database: ${finalTests.length}`);
    
    console.log('\nTest presenti:');
    finalTests.forEach(test => {
      console.log(`   - ${test.title} (ID: ${test.id})`);
    });

  } catch (error) {
    console.error('❌ Errore durante l\'inserimento dei test:', error);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

seedTests(); 