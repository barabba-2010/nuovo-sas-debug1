import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';
import { prisma } from '../../../lib/prisma';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { message: 'Non autenticato' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { teamId } = body;

    if (!teamId) {
      return NextResponse.json(
        { message: 'Team ID obbligatorio' },
        { status: 400 }
      );
    }

    const userId = (session.user as any).id;
    
    if (!userId) {
      return NextResponse.json(
        { message: 'ID utente non trovato nella sessione' },
        { status: 400 }
      );
    }

    // Aggiorna l'associazione utente-organizzazione con il team
    const userOrg = await prisma.userOrganization.findFirst({
      where: {
        userId: userId
      }
    });

    if (!userOrg) {
      return NextResponse.json(
        { message: 'Utente non associato a nessuna organizzazione' },
        { status: 404 }
      );
    }

    // Verifica che il team appartenga alla stessa organizzazione
    const team = await prisma.team.findFirst({
      where: {
        id: teamId,
        organizationId: userOrg.organizationId
      }
    });

    if (!team) {
      return NextResponse.json(
        { message: 'Team non valido' },
        { status: 404 }
      );
    }

    // Aggiorna l'associazione con il team
    await prisma.userOrganization.update({
      where: {
        id: userOrg.id
      },
      data: {
        teamId: teamId
      }
    });

    return NextResponse.json({ 
      message: 'Assegnazione al team completata',
      teamId: teamId 
    });
  } catch (error) {
    console.error('Errore nell\'assegnazione al team:', error);
    return NextResponse.json(
      { message: 'Errore nell\'assegnazione al team' },
      { status: 500 }
    );
  }
} 