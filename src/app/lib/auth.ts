import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from './prisma';
import bcryptjs from 'bcryptjs';

// Cache semplice per ridurre le chiamate al DB
const tokenCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minuti

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        organizationCode: { label: "Organization Code", type: "text" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email e password sono obbligatori');
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: {
            organizationMemberships: {
              include: {
                organization: true
              }
            }
          }
        });

        if (!user || !user.password) {
          throw new Error('Credenziali non valide');
        }

        const isPasswordValid = await bcryptjs.compare(credentials.password, user.password);
        if (!isPasswordValid) {
          throw new Error('Credenziali non valide');
        }

        // Per utenti non admin, verifica il codice organizzazione
        if (user.role !== 'ADMIN' && credentials.organizationCode) {
          const hasValidOrg = user.organizationMemberships.some(
            membership => membership.organization.code === credentials.organizationCode
          );
          
          if (!hasValidOrg) {
            throw new Error('Codice organizzazione non valido');
          }
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 giorni
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 giorni
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // Gestione errori JWT
      try {
        if (user) {
          token.id = user.id;
          token.role = user.role;
        }
        
        // Se il trigger è "update", aggiorna il token con i nuovi dati di sessione
        if (trigger === "update" && session) {
          token.role = session.user.role;
        }
        
        // Se manca il ruolo ma c'è l'id, recuperalo dal database
        if (token.id && !token.role) {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { role: true }
          });
          if (dbUser) {
            token.role = dbUser.role;
          }
        }
        
        return token;
      } catch (error) {
        console.error('JWT callback error:', error);
        // In caso di errore, ritorna un token vuoto per forzare il re-login
        return token;
      }
    },
    async session({ session, token }) {
      try {
        if (token && session.user) {
          session.user.id = token.id as string;
          
          // Recupera sempre il ruolo dal database per essere sicuri
          if (token.id) {
            const user = await prisma.user.findUnique({
              where: { id: token.id as string },
              select: { role: true, name: true }
            });
            
            if (user) {
              session.user.role = user.role;
              session.user.name = user.name || session.user.name;
              console.log('Session - Role from DB:', user.role);
            }
          }
        }
        
        return session;
      } catch (error) {
        console.error('Session callback error:', error);
        // In caso di errore, ritorna una sessione vuota
        return {
          ...session,
          user: undefined
        };
      }
    }
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
  },
  debug: process.env.NODE_ENV === 'development',
  // Aggiungi secret esplicito per evitare problemi JWT
  secret: process.env.NEXTAUTH_SECRET,
};

// Helper function to check if user is admin
export const isAdmin = (session: any) => {
  return session?.user?.role === "ADMIN";
};

// Helper function to check if user is manager
export const isManager = (session: any) => {
  return session?.user?.role === "MANAGER";
};

// Helper function to check if user is employee
export const isEmployee = (session: any) => {
  return session?.user?.role === "EMPLOYEE";
};

// Funzione per aggiornare manualmente i dati utente dalla cache o DB (da usare raramente)
export async function refreshUserData(userId: string) {
  try {
    // Controlla prima la cache
    const cached = tokenCache.get(userId);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }
    
    // Solo se necessario, fa una chiamata al DB
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, name: true, email: true }
    });
    
    if (user) {
      // Aggiorna la cache
      tokenCache.set(userId, {
        data: user,
        timestamp: Date.now()
      });
      return user;
    }
    
    return null;
  } catch (error) {
    console.error("Error refreshing user data:", error);
    return null;
  }
} 