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

    const reports = await prisma.report.findMany({
      include: {
        user: {
          include: {
            organizationMemberships: {
              include: {
                organization: true,
                team: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Sanitizza i dati utente
    const sanitizedReports = reports.map(report => ({
      ...report,
      user: {
        id: report.user.id,
        name: report.user.name,
        email: report.user.email,
        organizationMemberships: report.user.organizationMemberships
      }
    }));

    return NextResponse.json({ reports: sanitizedReports });
  } catch (error) {
    console.error('Errore nel recupero dei report:', error);
    return NextResponse.json(
      { message: 'Errore nel recupero dei report' },
      { status: 500 }
    );
  }
} 