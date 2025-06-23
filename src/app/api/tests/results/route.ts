import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import { prisma } from '@/app/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    // Verifica che l'utente sia autenticato
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Devi essere autenticato per inviare i risultati del test' },
        { status: 401 }
      );
    }
    
    // Ottiene i dati inviati nella richiesta
    const data = await request.json();
    
    // Verifica i dati richiesti
    if (!data.testId || !data.answers) {
      return NextResponse.json(
        { error: 'Dati mancanti per il salvataggio dei risultati' },
        { status: 400 }
      );
    }
    
    // Verifica se il test esiste
    const test = await prisma.test.findUnique({
      where: { id: data.testId }
    });
    
    if (!test) {
      return NextResponse.json(
        { error: 'Test non trovato' },
        { status: 404 }
      );
    }
    
    // Salva i risultati del test
    const testResult = await prisma.testResult.create({
      data: {
        userId: session.user.id,
        testId: data.testId,
        answers: JSON.stringify(data.answers),
        metadata: JSON.stringify({
          duration: data.duration || 0,
          completedAt: data.completedAt || new Date().toISOString()
        })
      }
    });
    
    // Genera un report semplice per il test
    const reportTitle = `Report del test ${test.title}`;
    const reportContent = `
      <h2>Risultati del test: ${test.title}</h2>
      <p>Completato il: ${new Date().toLocaleDateString()} alle ${new Date().toLocaleTimeString()}</p>
      <p>Durata: ${Math.floor((data.duration || 0) / 60)} minuti</p>
      
      <h3>Riepilogo delle risposte:</h3>
      <p>Le tue risposte sono state registrate con successo. Un analista esaminerà i risultati per fornirti un feedback dettagliato.</p>
    `;
    
    const report = await prisma.report.create({
      data: {
        userId: session.user.id,
        testResultId: testResult.id,
        title: reportTitle,
        content: reportContent,
        metadata: JSON.stringify({
          generatedAt: new Date().toISOString(),
          testTitle: test.title,
          testType: test.type
        })
      }
    });
    
    return NextResponse.json({
      success: true,
      testResultId: testResult.id,
      reportId: report.id,
      message: 'Risultati salvati con successo e report generato'
    });
    
  } catch (error: any) {
    console.error('Errore nel salvataggio dei risultati del test:', error);
    
    return NextResponse.json(
      { 
        error: 'Si è verificato un errore nel salvataggio dei risultati',
        details: error.message
      },
      { status: 500 }
    );
  }
} 