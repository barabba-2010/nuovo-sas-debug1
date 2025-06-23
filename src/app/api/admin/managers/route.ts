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

    const managers = await prisma.user.findMany({
      where: {
        role: 'MANAGER'
      },
      include: {
        organizationMemberships: {
          include: {
            organization: true
          }
        },
        _count: {
          select: {
            managedTeams: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Rimuovi le password dai risultati
    const sanitizedManagers = managers.map(manager => {
      const { password, ...managerWithoutPassword } = manager;
      return managerWithoutPassword;
    });

    return NextResponse.json({ managers: sanitizedManagers });
  } catch (error) {
    console.error('Errore nel recupero dei manager:', error);
    return NextResponse.json(
      { message: 'Errore nel recupero dei manager' },
      { status: 500 }
    );
  }
} 