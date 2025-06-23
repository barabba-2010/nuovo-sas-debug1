import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';

// Initialize the OpenAI client with your API key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const prisma = new PrismaClient();

// Definire tipi locali per i dati con cui lavoriamo
type TestAnswerWithQuestion = {
  questionId: string;
  value: string;
  question: {
    text: string;
  };
};

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const session = await getServerSession(authOptions);
    
    // Check if the user is authenticated
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Simple test to see if OpenAI is working
    console.log("OpenAI API Key:", process.env.OPENAI_API_KEY?.substring(0, 10) + "...");
    
    const data = await request.json();
    const { testId, resultId, includeGraphs = true, saveToDb = false } = data;
    
    if (!testId || !resultId) {
      return NextResponse.json(
        { error: 'Test ID and Result ID are required' },
        { status: 400 }
      );
    }
    
    // Check if the test exists
    const test = await prisma.test.findUnique({
      where: { id: testId },
      select: { title: true, category: true }
    });
    
    if (!test) {
      return NextResponse.json(
        { error: 'Test not found' },
        { status: 404 }
      );
    }
    
    // Check if the test result exists and belongs to the user
    const testResult = await prisma.testResult.findUnique({
      where: { 
        id: resultId,
        ...(session.user.role !== 'ADMIN' && { userId: session.user.id }) // Admin can see all results
      }
    });
    
    if (!testResult) {
      return NextResponse.json(
        { error: 'Test result not found or does not belong to you' },
        { status: 404 }
      );
    }
    
    // Check if a report already exists for this test result
    const existingReports = await prisma.report.findMany({
      where: { testResultId: resultId },
      take: 1
    });
    
    if (existingReports.length > 0) {
      return NextResponse.json(
        { 
          success: true,
          message: 'A report already exists for this test result',
          report: existingReports[0]
        }
      );
    }
    
    // Parse answers from JSON string to array
    const answersArray = JSON.parse(testResult.answers || '[]');
    
    // In a real app, we would use actual test result data
    // For this example, we'll combine real test data with some mock answers
    const mockTestResult = {
      id: resultId,
      testId: testId,
      testName: test.title,
      testCategory: test.category,
      userId: testResult.userId,
      userName: session.user.name,
      completedAt: testResult.completedAt?.toISOString() || new Date().toISOString(),
      score: 85, // Default score if not available
      answers: answersArray.length > 0 ? answersArray : [
        { questionId: 'q1', value: '4', questionText: 'I enjoy being the center of attention' },
        { questionId: 'q2', value: '2', questionText: 'I prefer to have a plan rather than be spontaneous' },
        { questionId: 'q3', value: '5', questionText: 'I find it easy to empathize with others\' feelings' },
        { questionId: 'q4', value: '3', questionText: 'I enjoy taking risks' },
        { questionId: 'q5', value: '4', questionText: 'I enjoy meeting new people' },
      ],
    };
    
    // Generate the prompt for OpenAI
    const prompt = `
    Generate a comprehensive psychological assessment report based on the following test result:
    
    TEST INFORMATION:
    Test Name: ${mockTestResult.testName}
    Test Category: ${mockTestResult.testCategory}
    Completed Date: ${mockTestResult.completedAt}
    
    USER INFORMATION:
    User Name: ${mockTestResult.userName}
    Overall Score: ${mockTestResult.score}/100
    
    TEST RESPONSES:
    ${mockTestResult.answers.map((a: { questionText: string; value: string }, i: number) => 
      `${i+1}. ${a.questionText}: ${a.value}/5`).join('\n')}
    
    Please create a professional and detailed psychological assessment report that includes:
    
    1. An executive summary of the results
    2. Detailed analysis of response patterns
    3. Interpretation of results with psychological insights
    4. Personalized recommendations based on the assessment
    5. Areas of strength and potential growth
    
    FORMAT THE RESPONSE AS JSON:
    {
      "title": "Report title",
      "summary": "Executive summary of the results",
      "analysis": {
        "overview": "General analysis",
        "strengths": ["Strength 1", "Strength 2", ...],
        "areas_for_growth": ["Area 1", "Area 2", ...],
        "detailed_interpretation": "Detailed psychological interpretation",
        "key_traits": [
          {
            "trait": "Trait name",
            "score": score,
            "description": "Description of the trait and its implications"
          },
          ...
        ]
      },
      "recommendations": [
        "Recommendation 1",
        "Recommendation 2",
        ...
      ],
      "conclusion": "Concluding remarks"
    }
    
    Make the analysis insightful, evidence-based, and personalized to the individual's responses.
    `;
    
    try {
      // Call OpenAI API with updated parameters
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a professional psychologist with expertise in psychological assessment and report writing."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        response_format: { type: "json_object" }
      });
      
      // Extract the generated report from OpenAI's response
      const generatedReport = JSON.parse(response.choices[0].message.content || '{}');
      
      // Save the report to the database if requested
      let savedReport = null;
      if (saveToDb) {
        // Convert all non-string fields to JSON strings for storage
        const reportContent = JSON.stringify({
          summary: generatedReport.summary,
          analysis: generatedReport.analysis,
          recommendations: generatedReport.recommendations,
          conclusion: generatedReport.conclusion || "Thank you for taking this assessment."
        });
        
        savedReport = await prisma.report.create({
          data: {
            title: generatedReport.title,
            content: reportContent,
            userId: session.user.id,
            testResultId: resultId,
            metadata: JSON.stringify({
              includedGraphs: includeGraphs,
              generatedAt: new Date().toISOString()
            })
          },
        });
      }
      
      return NextResponse.json({
        success: true,
        report: {
          ...generatedReport,
          meta: {
            testId: testId,
            resultId: resultId,
            generatedAt: new Date().toISOString(),
            includesGraphs: includeGraphs,
            savedToDb: !!savedReport,
            reportId: savedReport?.id
          }
        }
      });
    } catch (openaiError: unknown) {
      console.error('OpenAI API Error:', openaiError);
      return NextResponse.json(
        { error: 'Failed to generate report with OpenAI', details: openaiError instanceof Error ? openaiError.message : 'Unknown error' },
        { status: 500 }
      );
    }
    
  } catch (error: unknown) {
    console.error('Error generating report:', error);
    return NextResponse.json(
      { error: 'Failed to generate report', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 