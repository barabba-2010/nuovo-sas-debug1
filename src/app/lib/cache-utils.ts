// Utility per gestire la cache e migliorare le performance

// Cache per le sessioni utente
const sessionCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minuti

// Pulisci la cache periodicamente
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of sessionCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      sessionCache.delete(key);
    }
  }
}, 60 * 1000); // Ogni minuto

export const cacheUtils = {
  // Ottieni dalla cache o esegui la funzione
  async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl: number = CACHE_TTL
  ): Promise<T> {
    const cached = sessionCache.get(key);
    
    if (cached && Date.now() - cached.timestamp < ttl) {
      return cached.data as T;
    }
    
    const data = await fetchFn();
    sessionCache.set(key, { data, timestamp: Date.now() });
    return data;
  },
  
  // Invalida una chiave specifica
  invalidate(key: string) {
    sessionCache.delete(key);
  },
  
  // Invalida tutte le chiavi che iniziano con un prefisso
  invalidatePrefix(prefix: string) {
    for (const key of sessionCache.keys()) {
      if (key.startsWith(prefix)) {
        sessionCache.delete(key);
      }
    }
  },
  
  // Pulisci tutta la cache
  clear() {
    sessionCache.clear();
  }
}; 