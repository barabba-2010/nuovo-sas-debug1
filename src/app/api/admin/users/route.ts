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

    const users = await prisma.user.findMany({
      include: {
        organizationMemberships: {
          include: {
            organization: true,
            team: true
          }
        },
        _count: {
          select: {
            reports: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Rimuovi le password dai risultati
    const sanitizedUsers = users.map(user => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });

    return NextResponse.json({ users: sanitizedUsers });
  } catch (error) {
    console.error('Errore nel recupero degli utenti:', error);
    return NextResponse.json(
      { message: 'Errore nel recupero degli utenti' },
      { status: 500 }
    );
  }
} 