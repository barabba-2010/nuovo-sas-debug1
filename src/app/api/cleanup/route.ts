import { NextResponse } from 'next/server';
import { prisma } from '../../lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../lib/auth';

export async function POST(request: Request) {
  try {
    // Verifica che solo gli amministratori possano eseguire questa operazione
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ 
        message: 'Accesso non autorizzato' 
      }, { status: 403 });
    }
    
    console.log('Pulizia database - Inizio pulizia dei dati storici dei test');
    
    // Elimina prima i report poiché dipendono dai test results
    console.log('Pulizia database - Eliminazione reports');
    const deletedReports = await prisma.report.deleteMany({});
    console.log(`Pulizia database - Eliminati ${deletedReports.count} reports`);
    
    // Elimina i risultati dei test
    console.log('Pulizia database - Eliminazione risultati dei test');
    const deletedTestResults = await prisma.testResult.deleteMany({});
    console.log(`Pulizia database - Eliminati ${deletedTestResults.count} risultati dei test`);

    // Opzionale: pulisci anche i test stessi se vuoi ricominciare da zero
    // Decommenta il codice qui sotto solo se vuoi eliminare tutti i test esistenti
    /*
    console.log('Pulizia database - Eliminazione tests');
    const deletedTests = await prisma.test.deleteMany({});
    console.log(`Pulizia database - Eliminati ${deletedTests.count} tests`);
    */
    
    return NextResponse.json({
      message: 'Pulizia completata con successo',
      stats: {
        reports: deletedReports.count,
        testResults: deletedTestResults.count,
      }
    }, { status: 200 });
    
  } catch (error: any) {
    console.error('Pulizia database - Errore:', error);
    return NextResponse.json({
      message: 'Si è verificato un errore durante la pulizia del database',
      error: error.message
    }, { status: 500 });
  }
} 