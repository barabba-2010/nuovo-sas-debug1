import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';
import { prisma } from '../../../lib/prisma';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { message: 'Non autenticato' },
        { status: 401 }
      );
    }

    const userId = (session.user as any).id;
    
    if (!userId) {
      return NextResponse.json(
        { message: 'ID utente non trovato nella sessione' },
        { status: 400 }
      );
    }

    // Trova l'associazione utente-organizzazione
    const userOrg = await prisma.userOrganization.findFirst({
      where: {
        userId: userId
      },
      include: {
        team: true,
        organization: true
      }
    });

    if (!userOrg) {
      return NextResponse.json({
        hasTeam: false,
        hasOrganization: false,
        message: 'Utente non associato a nessuna organizzazione'
      });
    }

    return NextResponse.json({
      hasTeam: !!userOrg.teamId,
      hasOrganization: true,
      teamId: userOrg.teamId,
      teamName: userOrg.team?.name,
      organizationId: userOrg.organizationId,
      organizationName: userOrg.organization.name
    });
  } catch (error) {
    console.error('Errore nel controllo dello stato del team:', error);
    return NextResponse.json(
      { message: 'Errore nel controllo dello stato del team' },
      { status: 500 }
    );
  }
} 