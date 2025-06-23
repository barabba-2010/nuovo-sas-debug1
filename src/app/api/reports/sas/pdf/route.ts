import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import { prisma } from '@/app/lib/prisma';
import { generateSASReportPDF } from '@/app/lib/sas-pdf-generator';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const reportId = searchParams.get('reportId');
    
    if (!reportId) {
      return NextResponse.json({ error: 'ID report mancante' }, { status: 400 });
    }
    
    // Recupera il report dal database
    const report = await prisma.report.findUnique({
      where: { id: reportId },
      include: {
        user: true
      }
    });
    
    if (!report) {
      return NextResponse.json({ error: 'Report non trovato' }, { status: 404 });
    }
    
    // Verifica che l'utente abbia accesso al report
    if (report.userId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
    }
    
    // Estrai i dati dal report
    let reportData;
    let results;
    let testState;
    let patientInfo;
    
    try {
      // Prova prima il nuovo formato
      const content = JSON.parse(report.content);
      if (content.html) {
        // Nuovo formato
        results = content.results;
        testState = content.testState;
        patientInfo = content.patientInfo || {
          firstName: report.user.name?.split(' ')[0] || '',
          lastName: report.user.name?.split(' ')[1] || '',
          age: ''
        };
      } else {
        // Formato vecchio - il content è direttamente l'HTML
        // Prova a recuperare i dati dal metadata
        const metadata = JSON.parse(report.metadata || '{}');
        return NextResponse.json({ error: 'Report in formato vecchio non supportato per PDF' }, { status: 400 });
      }
    } catch (e) {
      // Se il parsing fallisce, è probabilmente il vecchio formato HTML
      return NextResponse.json({ error: 'Formato report non valido' }, { status: 400 });
    }
    
    // Genera il PDF
    const pdfBuffer = generateSASReportPDF(results, testState, patientInfo);
    
    // Restituisci il PDF
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Report_SAS_${patientInfo.firstName}_${patientInfo.lastName}.pdf"`
      }
    });
    
  } catch (error) {
    console.error('Errore nella generazione del PDF:', error);
    return NextResponse.json(
      { error: 'Errore nella generazione del PDF', details: error instanceof Error ? error.message : 'Errore sconosciuto' },
      { status: 500 }
    );
  }
} 