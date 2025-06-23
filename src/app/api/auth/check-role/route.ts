import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import { prisma } from '@/app/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ role: null }, { status: 401 });
    }
    
    const userId = (session.user as any).id;
    
    if (!userId) {
      return NextResponse.json({ role: null }, { status: 401 });
    }
    
    // Recupera il ruolo dal database
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });
    
    if (!user) {
      return NextResponse.json({ role: null }, { status: 404 });
    }
    
    console.log(`Check-role API: User ${userId} has role ${user.role}`);
    
    return NextResponse.json({ role: user.role });
  } catch (error) {
    console.error('Error checking user role:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 