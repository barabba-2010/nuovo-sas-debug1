import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';

const prisma = new PrismaClient();

// Definizione dei test di sistema hardcoded
const SYSTEM_TESTS = [
  {
    id: 'sas-system',
    title: 'S-AS (Scopo-Antiscopo)',
    description: 'Test per valutare gli obiettivi e le preoccupazioni',
    instructions: 'Per ogni coppia di affermazioni, scegli quella che ti descrive meglio.',
    category: 'Personalità',
    type: 'PERSONALITY',
    questions: '[]',
    creatorId: 'system',
    isActive: true,
    timeLimit: 0,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    questionsArray: [],
    questionCount: 30,
    metadata: JSON.stringify({ isSystemTest: true })
  },
  {
    id: 'pid5-system',
    title: 'PID-5 (Personality Inventory for DSM-5)',
    description: 'Inventario di personalità per DSM-5 con 220 domande',
    instructions: 'Indica quanto ogni affermazione ti descrive utilizzando la scala da 0 a 3.',
    category: 'Personalità Clinica',
    type: 'PERSONALITY',
    questions: '[]',
    creatorId: 'system',
    isActive: true,
    timeLimit: 0,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    questionsArray: [],
    questionCount: 220,
    metadata: JSON.stringify({ isSystemTest: true })
  }
];

// GET /api/tests - Get all published tests (public) or all tests (admin)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated
    if (!session?.user) {
      // Return system tests for unauthenticated users
      return NextResponse.json({
        tests: SYSTEM_TESTS.filter(t => t.isActive),
        message: 'Showing system tests only'
      }, { status: 200 });
    }
    
    const isAdmin = session.user.role === 'ADMIN';
    
    // Query parameters
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const active = searchParams.get('active');
    
    // Build filter conditions
    const where: any = {};
    
    // If not admin, only show active tests
    if (!isAdmin) {
      where.isActive = true; 
    } else if (active) {
      // Admin can filter by active status
      where.isActive = active === 'true';
    }
    
    // Filter by category if provided
    if (category) {
      where.category = category;
    }
    
    try {
      // Get tests from database
      const tests = await prisma.test.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
      });
      
      // Process tests to parse the questions JSON string
      const processedTests = tests.map(test => {
        try {
          const questionsArray = JSON.parse(test.questions);
          return {
            ...test,
            questionsArray,
            questionCount: questionsArray.length
          };
        } catch (e) {
          // If we can't parse the questions, return with empty array
          return {
            ...test,
            questionsArray: [],
            questionCount: 0
          };
        }
      });
      
      // If no tests found in database, return system tests
      if (processedTests.length === 0) {
        return NextResponse.json({
          tests: SYSTEM_TESTS,
          message: 'Using system tests as fallback'
        });
      }
      
      return NextResponse.json({
        tests: processedTests,
        message: 'Tests retrieved successfully'
      });
    } catch (dbError) {
      console.error('Database error:', dbError);
      // If database error, return system tests as fallback
      return NextResponse.json({
        tests: SYSTEM_TESTS,
        message: 'Using system tests due to database error'
      });
    }
    
  } catch (error) {
    console.error('Error fetching tests:', error);
    // Return system tests as fallback
    return NextResponse.json({
      tests: SYSTEM_TESTS,
      message: 'Using system tests due to error'
    });
  }
}

// POST /api/tests - Create a new test
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const data = await request.json();
    
    // Validate required fields
    if (!data.title || !data.description || !data.category || !data.questions || !Array.isArray(data.questions)) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Convert questions array to JSON string
    const questionsJson = JSON.stringify(data.questions);

    // Only use the fields that we know exist in the model
    const testData = {
      title: data.title,
      description: data.description,
      instructions: data.instructions || 'Please answer all questions honestly.',
      category: data.category,
      type: data.type || 'GENERAL',
      questions: questionsJson,
      creatorId: session.user.id
    };
    
    // Create the test
    const test = await prisma.test.create({ data: testData });
    
    // Return success response
    return NextResponse.json({
      success: true,
      test: {
        ...test,
        questionsArray: data.questions
      }
    });
    
  } catch (error) {
    console.error('Error creating test:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create test',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 