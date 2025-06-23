import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  // Pulisci tutti i cookie di sessione
  const cookieStore = await cookies(); // aggiunto await
  
  // Lista dei cookie NextAuth da rimuovere
  const authCookies = [
    'next-auth.session-token',
    '__Secure-next-auth.session-token',
    'next-auth.csrf-token',
    '__Secure-next-auth.csrf-token',
    'next-auth.callback-url',
    '__Secure-next-auth.callback-url'
  ];

  authCookies.forEach(cookieName => {
    cookieStore.delete(cookieName);
  });

  return NextResponse.json({ 
    message: 'Sessione pulita. Effettua nuovamente il login.' 
  });
} 