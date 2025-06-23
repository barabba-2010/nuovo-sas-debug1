import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Percorsi pubblici che non richiedono autenticazione
  const publicPaths = ['/auth/login', '/auth/register', '/api/auth', '/clear-session', '/api/auth/clear-session'];
  const isPublicPath = publicPaths.some(p => path.startsWith(p));

  if (isPublicPath) {
    return NextResponse.next();
  }

  try {
    // Ottieni il token JWT
    const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET 
    });

    // Log per debug
    console.log('Middleware - Token info:', {
      path,
      hasToken: !!token,
      userId: token?.sub,
      role: token?.role
    });

    // Se non c'è token, redirect al login solo per percorsi protetti
    if (!token && (path.startsWith('/admin') || path.startsWith('/dashboard') || path.startsWith('/reports') || path.startsWith('/manager'))) {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }

    // Per percorsi admin, verifica il ruolo
    if (path.startsWith('/admin')) {
      // Se c'è un errore con il token, lascia che la pagina gestisca il redirect
      if (!token || !token.sub) {
        return NextResponse.next();
      }

      // Verifica il ruolo dal database tramite API
      try {
        const checkRoleUrl = new URL('/api/auth/check-role', request.url);
        const roleResponse = await fetch(checkRoleUrl, {
          headers: {
            'Cookie': request.headers.get('cookie') || ''
          }
        });

        if (roleResponse.ok) {
          const data = await roleResponse.json();
          if (data.role !== 'ADMIN') {
            return NextResponse.redirect(new URL('/', request.url));
          }
        }
      } catch (error) {
        console.error('Middleware - Error checking role:', error);
        // In caso di errore, lascia che la pagina gestisca il redirect
        return NextResponse.next();
      }
    }

    // Per percorsi manager, verifica il ruolo
    if (path.startsWith('/manager')) {
      // Se c'è un errore con il token, lascia che la pagina gestisca il redirect
      if (!token || !token.sub) {
        return NextResponse.next();
      }

      // Verifica il ruolo dal database tramite API
      try {
        const checkRoleUrl = new URL('/api/auth/check-role', request.url);
        const roleResponse = await fetch(checkRoleUrl, {
          headers: {
            'Cookie': request.headers.get('cookie') || ''
          }
        });

        if (roleResponse.ok) {
          const data = await roleResponse.json();
          if (data.role !== 'MANAGER') {
            return NextResponse.redirect(new URL('/', request.url));
          }
        }
      } catch (error) {
        console.error('Middleware - Error checking manager role:', error);
        // In caso di errore, lascia che la pagina gestisca il redirect
        return NextResponse.next();
      }
    }

    return NextResponse.next();
  } catch (error) {
    console.error('Middleware - JWT Error:', error);
    
    // Se c'è un errore JWT su percorsi admin, pulisci i cookie e redirect al login
    if (path.startsWith('/admin')) {
      const response = NextResponse.redirect(new URL('/clear-session', request.url));
      
      // Pulisci i cookie di sessione corrotti
      const cookiesToDelete = [
        'next-auth.session-token',
        '__Secure-next-auth.session-token',
        'next-auth.csrf-token',
        '__Secure-next-auth.csrf-token'
      ];
      
      cookiesToDelete.forEach(cookieName => {
        response.cookies.delete(cookieName);
      });
      
      return response;
    }
    
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}; 