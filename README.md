# Psychological Tests Platform

Una piattaforma moderna per test psicologici con generazione assistita dall'IA.

## Caratteristiche

- Generazione di test psicologici con OpenAI
- Supporto per test a scelta multipla, vero/falso, scale Likert
- Dashboard amministrativa per la gestione dei test
- Rapporti dettagliati sui risultati
- Interfaccia utente moderna con Bootstrap
- Autenticazione sicura con NextAuth

## Configurazione

### Prerequisiti

- Node.js 18 o superiore
- Supabase (per database)
- API key OpenAI

### Configurazione variabili d'ambiente

Copia il file `.env.example` in `.env.local`:

```bash
cp .env.example .env.local
```

Aggiorna le variabili con i tuoi valori:

```
# Next Auth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-here

# Supabase
SUPABASE_URL=your-supabase-url
SUPABASE_KEY=your-supabase-anon-key
DATABASE_URL=your-supabase-postgresql-url

# OpenAI
OPENAI_API_KEY=your-openai-api-key
```

### Installazione

```bash
npm install
```

### Sviluppo locale

```bash
npm run dev
```

## Docker

### Avvio con Docker Compose

1. Crea un file `.env` nella radice del progetto con le variabili d'ambiente necessarie.
2. Esegui:

```bash
docker-compose up -d
```

### Ricostruzione dopo modifiche

```bash
docker-compose up -d --build
```

## Accesso Admin

Per creare un account admin:

1. Registrati normalmente
2. Accedi al tuo database Supabase
3. Modifica il ruolo dell'utente in "ADMIN" nella tabella users

## Licenza

MIT 