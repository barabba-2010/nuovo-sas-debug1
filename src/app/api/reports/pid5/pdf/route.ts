import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import { prisma } from '@/app/lib/prisma';
import { generatePID5PDF } from '@/app/lib/pdf/pid5-generator';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non autenticato' }, 
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const reportId = searchParams.get('reportId');

    if (!reportId) {
      return NextResponse.json(
        { error: 'ID report mancante' }, 
        { status: 400 }
      );
    }

    // Recupera il report dal database
    const report = await prisma.report.findUnique({
      where: { 
        id: reportId,
        userId: session.user.id // Verifica che il report appartenga all'utente
      }
    });

    if (!report) {
      return NextResponse.json(
        { error: 'Report non trovato' }, 
        { status: 404 }
      );
    }

    // Verifica che sia un report PID-5
    const metadata = JSON.parse(report.metadata || '{}');
    if (metadata.testType !== 'pid5') {
      return NextResponse.json(
        { error: 'Questo endpoint è solo per report PID-5' }, 
        { status: 400 }
      );
    }

    // Parse del contenuto
    const content = JSON.parse(report.content);
    const results = content.results;
    const testState = content.testState;

    // Genera il PDF
    const pdfBuffer = await generatePID5PDF({
      results,
      testState,
      patientInfo: {
        firstName: testState?.patientInfo?.firstName || '',
        lastName: testState?.patientInfo?.lastName || '',
        age: testState?.patientInfo?.age || '',
        therapistName: session.user.name || 'Non specificato'
      },
      reportDate: report.createdAt
    });

    // Restituisci il PDF
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Report_PID5_${new Date().toISOString().split('T')[0]}.pdf"`,
      },
    });

  } catch (error) {
    console.error('Errore nella generazione del PDF PID-5:', error);
    return NextResponse.json(
      { error: 'Errore nella generazione del PDF', details: error instanceof Error ? error.message : 'Errore sconosciuto' }, 
      { status: 500 }
    );
  }
} 