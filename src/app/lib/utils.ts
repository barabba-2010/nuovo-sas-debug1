import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

// Prevent multiple instances of Prisma Client in development
declare global {
  var prisma: PrismaClient | undefined;
}

export const prisma = global.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

/**
 * Hash a password with bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

/**
 * Compare a password with a hash
 */
export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Calculate test score based on answers
 * This is a simple example. Real scoring would depend on the test type and questions.
 */
export function calculateTestScore(
  answers: { questionId: string; value: string }[],
  testType: string
): number {
  // This is a simplified scoring example
  // In a real app, you would have different scoring algorithms for different tests
  
  let score = 0;
  
  switch (testType) {
    case 'Personality':
      // For personality tests, we might calculate trait scores
      score = Math.floor(Math.random() * 100); // Placeholder
      break;
      
    case 'Clinical':
      // For clinical tests like anxiety or depression screenings
      // Sum the values (assuming they're numeric)
      score = answers.reduce((total, answer) => {
        return total + parseInt(answer.value, 10);
      }, 0);
      break;
      
    default:
      // Generic scoring
      score = answers.length * 5; // Just a placeholder
  }
  
  return score;
}

/**
 * Format date to a readable format
 */
export function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Generate a unique test session ID
 */
export function generateSessionId(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
} 