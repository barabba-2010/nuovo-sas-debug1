import NextAuth from "next-auth";
import { authOptions } from "../../../lib/auth";

// Log per il debugging
console.log("NextAuth API Route - Inizializzazione");

// Log più approfondito
if (process.env.NODE_ENV === 'development') {
  console.log("NextAuth API Route - Auth Options:", {
    debug: authOptions.debug,
    session: authOptions.session,
    pages: authOptions.pages,
    providers: authOptions.providers.map(provider => provider.name)
  });
  
  // Controlla la connessione al DB
  console.log("NextAuth API Route - Database URL:", 
    process.env.DATABASE_URL ? 
    `${process.env.DATABASE_URL.split('@')[0].split(':')[0]}:****@${process.env.DATABASE_URL.split('@')[1]}` : 
    'Non configurato'
  );
}

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST }; 