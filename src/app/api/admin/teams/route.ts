import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';
import { prisma } from '../../../lib/prisma';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Non autorizzato' },
        { status: 403 }
      );
    }

    const teams = await prisma.team.findMany({
      include: {
        organization: true,
        manager: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        _count: {
          select: {
            members: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ teams });
  } catch (error) {
    console.error('Errore nel recupero dei team:', error);
    return NextResponse.json(
      { message: 'Errore nel recupero dei team' },
      { status: 500 }
    );
  }
} 