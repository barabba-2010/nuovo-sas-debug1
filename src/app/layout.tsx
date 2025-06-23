import React from 'react';
import { Inter, Poppins } from 'next/font/google';
import './globals.css';
import { Metadata } from 'next';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import { getServerSession } from 'next-auth';
import SessionProvider from './components/common/SessionProvider';
import SessionKeepAlive from './components/SessionKeepAlive';
import SessionDebug from './components/common/SessionDebug';
import BootstrapClient from './components/BootstrapClient';

// Use Poppins for headings and Inter for body text
const poppins = Poppins({ 
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-poppins',
  display: 'swap'
});

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap'
});

export const metadata: Metadata = {
  title: 'Psychological Tests Platform',
  description: 'A professional platform for conducting and analyzing psychological assessments',
  keywords: 'psychology, tests, assessment, personality, cognitive, mental health',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();
  
  return (
    <html lang="en" className={`h-100 ${poppins.variable} ${inter.variable}`}>
      <head>
        {/* Bootstrap è già importato in globals.css, rimuovo i CDN duplicati */}
      </head>
      <body className="d-flex flex-column h-100">
        <SessionProvider session={session}>
          <BootstrapClient />
          <SessionKeepAlive />
          <SessionDebug />
          <Navbar />
          <main className="flex-shrink-0 flex-grow-1 bg-light">
            {children}
          </main>
          <Footer />
        </SessionProvider>
      </body>
    </html>
  );
} 