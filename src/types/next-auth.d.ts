import NextAuth, { DefaultSession } from "next-auth"
import { JWT } from "next-auth/jwt"

// Estende il modulo next-auth
declare module "next-auth" {
  /**
   * Estende l'oggetto User di default
   */
  interface User {
    id: string
    role: string
    // ... altri campi utente
  }

  /**
   * Estende l'oggetto Session di default
   */
  interface Session {
    user: {
      id: string
      role: string
    } & DefaultSession["user"]
  }
}

// Estende il modulo next-auth/jwt
declare module "next-auth/jwt" {
  /** Estende il JWT Token */
  interface JWT {
    id: string
    role: string
  }
} 