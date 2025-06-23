import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';
import { prisma } from '../../../../lib/prisma';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const params = await context.params;
    const testId = params.id;

    if (!testId) {
      return NextResponse.json(
        { error: 'Test ID is required' },
        { status: 400 }
      );
    }

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get the test results for this user and test
    const results = await prisma.testResult.findMany({
      where: {
        userId: (session.user as any).id,
        testId: testId,
      },
      orderBy: {
        completedAt: 'desc',
      },
    });

    return NextResponse.json(results);
  } catch (error: any) {
    console.error('Error fetching test results:', error);
    return NextResponse.json(
      {
        error: 'Error fetching test results',
        details: error.message,
      },
      { status: 500 }
    );
  }
} 