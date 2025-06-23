import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import { redirect } from 'next/navigation';

export default async function ManagerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  
  // Verifica che l'utente sia autenticato e sia un manager
  if (!session || (session.user as any).role !== 'MANAGER') {
    redirect('/');
  }
  
  return (
    <>
      {children}
    </>
  );
} 