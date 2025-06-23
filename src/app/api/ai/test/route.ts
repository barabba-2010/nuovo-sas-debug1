import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function GET(request: NextRequest) {
  try {
    console.log("Testing OpenAI connection...");
    console.log("API Key prefix:", process.env.OPENAI_API_KEY?.substring(0, 10) + "...");
    
    // Simple test query to OpenAI
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant."
        },
        {
          role: "user",
          content: "Say hello in Italian"
        }
      ],
      max_tokens: 50
    });
    
    return NextResponse.json({
      success: true,
      message: "OpenAI API connection successful",
      response: response.choices[0].message.content
    });
  } catch (error) {
    console.error("OpenAI connection error:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      message: "OpenAI API connection failed"
    }, { status: 500 });
  }
} 