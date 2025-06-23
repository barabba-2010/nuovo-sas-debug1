import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

async function verifySupabaseSync() {
  try {
    console.log('\n=== VERIFICA SINCRONIZZAZIONE SUPABASE ===\n');
    
    // 1. Test di scrittura
    console.log('1. Test di scrittura nel database...');
    const testData = {
      email: `test-${Date.now()}@example.com`,
      name: 'Test User',
      password: 'test123',
      role: Role.EMPLOYEE // <-- 130625 MAX - usa l'enum, non la stringa (di EMPLOYEE non USER)
    };
    
    const newUser = await prisma.user.create({
      data: testData
    });
    console.log(`✅ Utente di test creato: ${newUser.email}`);
    
    // 2. Test di lettura
    console.log('\n2. Test di lettura dal database...');
    const readUser = await prisma.user.findUnique({
      where: { id: newUser.id }
    });
    console.log(`✅ Utente letto correttamente: ${readUser?.email}`);
    
    // 3. Test di aggiornamento
    console.log('\n3. Test di aggiornamento nel database...');
    const updatedUser = await prisma.user.update({
      where: { id: newUser.id },
      data: { name: 'Updated Test User' }
    });
    console.log(`✅ Utente aggiornato: ${updatedUser.name}`);
    
    // 4. Test di eliminazione
    console.log('\n4. Test di eliminazione dal database...');
    await prisma.user.delete({
      where: { id: newUser.id }
    });
    console.log('✅ Utente di test eliminato');
    
    // 5. Verifica report recenti
    console.log('\n5. Verifica report recenti con dettagli...');
    const recentReport = await prisma.report.findFirst({
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            email: true,
            name: true
          }
        }
      }
    });
    
    if (recentReport) {
      console.log('Report più recente:');
      console.log(`- ID: ${recentReport.id}`);
      console.log(`- Titolo: ${recentReport.title}`);
      console.log(`- Utente: ${recentReport.user.email} (${recentReport.user.name})`);
      console.log(`- Data: ${recentReport.createdAt.toLocaleString('it-IT')}`);
      
      const metadata = JSON.parse(recentReport.metadata || '{}');
      console.log(`- Tipo test: ${metadata.testType}`);
      console.log(`- Completato: ${metadata.completedAt ? new Date(metadata.completedAt).toLocaleString('it-IT') : 'N/A'}`);
    }
    
    console.log('\n✅ Tutti i test completati con successo!');
    console.log('\n📌 Per verificare su Supabase:');
    console.log('1. Vai su https://app.supabase.com/');
    console.log('2. Seleziona il tuo progetto');
    console.log('3. Vai su "Table Editor" nel menu laterale');
    console.log('4. Controlla le tabelle User e Report');
    console.log('5. I dati dovrebbero essere sincronizzati in tempo reale');
    
  } catch (error) {
    console.error('\n❌ Errore durante la verifica:', error);
    console.error('\nPossibili cause:');
    console.error('1. Il progetto Supabase potrebbe essere in pausa');
    console.error('2. Le credenziali potrebbero essere scadute');
    console.error('3. Problemi di rete o firewall');
  } finally {
    await prisma.$disconnect();
  }
}

verifySupabaseSync(); 