import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import { prisma } from '@/app/lib/prisma';

// GET /api/reports - Get reports for the current user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Devi essere autenticato per accedere ai report' },
        { status: 401 }
      );
    }
    
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const testResultId = searchParams.get('testResultId');
    const testType = searchParams.get('testType');
    
    // Define the query based on parameters
    const query: any = {
      where: {
        userId: session.user.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
    };
    
    // Add testResultId filter if provided
    if (testResultId) {
      query.where.testResultId = testResultId;
    }
    
    // Get reports that match the criteria
    let reports = await prisma.report.findMany(query);
    
    // Filter by testType if provided (since it's stored in metadata)
    if (testType) {
      reports = reports.filter(report => {
        if (!report.metadata) return false;
        try {
          const metadata = JSON.parse(report.metadata);
          return metadata.testType?.toLowerCase() === testType.toLowerCase();
        } catch {
          return false;
        }
      });
    }
    
    return NextResponse.json(reports);
    
  } catch (error: any) {
    console.error('Errore nel recupero dei report:', error);
    
    return NextResponse.json(
      { 
        error: 'Si è verificato un errore nel recupero dei report',
        details: error.message
      },
      { status: 500 }
    );
  }
}

// POST /api/reports - Create a new report
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const data = await request.json();
    
    // Validate required fields
    if (!data.testResultId || !data.title) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Verify that the test result belongs to the user
    const testResult = await prisma.testResult.findUnique({
      where: { 
        id: data.testResultId,
        userId: session.user.id, // Ensure this test result belongs to the user
      },
    });
    
    if (!testResult) {
      return NextResponse.json(
        { error: 'Test result not found or does not belong to you' },
        { status: 404 }
      );
    }
    
    // Create the report
    const report = await prisma.report.create({
      data: {
        userId: session.user.id,
        testResultId: data.testResultId,
        title: data.title,
        content: data.content,
        metadata: data.metadata,
      },
    });
    
    return NextResponse.json(report);
    
  } catch (error: any) {
    console.error('Error creating report:', error);
    return NextResponse.json(
      { error: 'Failed to create report', details: error.message },
      { status: 500 }
    );
  }
} 