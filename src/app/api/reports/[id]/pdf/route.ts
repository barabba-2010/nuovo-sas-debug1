import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';
import { prisma } from '../../../../lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non autenticato' }, 
        { status: 401 }
      );
    }

    // Recupera il report
    const report = await prisma.report.findUnique({
      where: {
        id: id,
        userId: session.user.id // Assicurati che l'utente possa accedere solo ai suoi report
      }
    });

    if (!report) {
      return NextResponse.json(
        { error: 'Report non trovato' }, 
        { status: 404 }
      );
    }

    // Genera il contenuto HTML per il PDF
    const htmlContent = generatePDFContent(report);
    
    // Per ora restituisco l'HTML che potrà essere convertito in PDF lato client
    // In futuro si potrebbe usare puppeteer per generare PDF lato server
    return new NextResponse(htmlContent, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `attachment; filename="Report_SAS_${report.id}.html"`
      }
    });

  } catch (error) {
    console.error('Errore nella generazione del PDF:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' }, 
      { status: 500 }
    );
  }
}

function generatePDFContent(report: any): string {
  // Restituisce direttamente il contenuto HTML completo salvato nel database
  // che è già formattato esattamente come il monolita
  return report.content;
} 