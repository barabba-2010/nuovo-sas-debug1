import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';
import { prisma } from '../../../lib/prisma';

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

    // Parse del metadata JSON
    const parsedReport = {
      ...report,
      metadata: report.metadata ? JSON.parse(report.metadata) : null
    };

    return NextResponse.json({ 
      success: true, 
      report: parsedReport 
    });

  } catch (error) {
    console.error('Errore nel recupero del report:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' }, 
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    // Elimina il report
    const deletedReport = await prisma.report.delete({
      where: {
        id: id,
        userId: session.user.id // Assicurati che l'utente possa eliminare solo i suoi report
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Report eliminato con successo' 
    });

  } catch (error) {
    console.error('Errore nell\'eliminazione del report:', error);
    return NextResponse.json(
      { error: 'Errore nell\'eliminazione del report' }, 
      { status: 500 }
    );
  }
} 