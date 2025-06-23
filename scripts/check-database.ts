import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    console.log('\n=== VERIFICA DATABASE SUPABASE ===\n');
    
    // 1. Verifica connessione
    console.log('1. Verifica connessione al database...');
    await prisma.$connect();
    console.log('✅ Connessione al database riuscita!\n');
    
    // 2. Conta utenti
    console.log('2. Utenti nel database:');
    const userCount = await prisma.user.count();
    console.log(`   Totale utenti: ${userCount}`);
    
    const adminCount = await prisma.user.count({
      where: { role: 'ADMIN' }
    });
    console.log(`   Utenti admin: ${adminCount}\n`);
    
    // 3. Conta test
    console.log('3. Test nel database:');
    const testCount = await prisma.test.count();
    console.log(`   Totale test: ${testCount}`);
    
    const activeTests = await prisma.test.findMany({
      where: { isActive: true },
      select: { title: true, type: true, category: true }
    });
    console.log(`   Test attivi: ${activeTests.length}`);
    activeTests.forEach(test => {
      console.log(`   - ${test.title} (${test.type} - ${test.category})`);
    });
    console.log('');
    
    // 4. Conta report
    console.log('4. Report salvati:');
    const reportCount = await prisma.report.count();
    console.log(`   Totale report: ${reportCount}`);
    
    // Report per tipo
    const sasReports = await prisma.report.count({
      where: {
        metadata: {
          contains: '"testType":"sas"'
        }
      }
    });
    console.log(`   Report S-AS: ${sasReports}`);
    
    const pid5Reports = await prisma.report.count({
      where: {
        metadata: {
          contains: '"testType":"pid5"'
        }
      }
    });
    console.log(`   Report PID-5: ${pid5Reports}\n`);
    
    // 5. Ultimi 5 report
    console.log('5. Ultimi 5 report salvati:');
    const recentReports = await prisma.report.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        createdAt: true,
        user: {
          select: { email: true }
        }
      }
    });
    
    if (recentReports.length === 0) {
      console.log('   Nessun report trovato');
    } else {
      recentReports.forEach(report => {
        console.log(`   - ${report.title}`);
        console.log(`     ID: ${report.id}`);
        console.log(`     Utente: ${report.user.email}`);
        console.log(`     Data: ${report.createdAt.toLocaleString('it-IT')}\n`);
      });
    }
    
    // 6. Verifica struttura report
    if (recentReports.length > 0) {
      console.log('6. Struttura primo report:');
      const firstReport = await prisma.report.findFirst({
        orderBy: { createdAt: 'desc' }
      });
      
      if (firstReport) {
        const content = JSON.parse(firstReport.content);
        const metadata = firstReport.metadata ? JSON.parse(firstReport.metadata) : {};
        
        console.log('   Content keys:', Object.keys(content));
        console.log('   Metadata keys:', Object.keys(metadata));
        console.log('   Test type:', metadata.testType);
      }
    }
    
    console.log('\n✅ Verifica completata con successo!');
    
  } catch (error) {
    console.error('\n❌ Errore durante la verifica:', error);
    console.error('\nAssicurati che:');
    console.error('1. Il file .env.local contenga il DATABASE_URL corretto di Supabase');
    console.error('2. Il progetto Supabase sia attivo (non in pausa)');
    console.error('3. Le credenziali siano corrette');
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase(); 