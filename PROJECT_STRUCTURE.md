# Struttura del Progetto - Psychological Tests Platform

## Panoramica
Questo progetto è una piattaforma web per test psicologici costruita con Next.js, TypeScript, PostgreSQL e Prisma.

## Struttura delle Cartelle

```
nuovo-sas/
├── src/
│   ├── app/
│   │   ├── api/                    # API Routes
│   │   │   ├── auth/              # Autenticazione
│   │   │   ├── tests/             # API per i test
│   │   │   │   └── sas/          # API specifiche per test S-AS
│   │   │   │       ├── results/  # Gestione risultati
│   │   │   │       └── reports/  # Generazione report
│   │   │   ├── reports/           # API per i report
│   │   │   ├── ai/               # Integrazione AI
│   │   │   ├── health/           # Health check
│   │   │   └── cleanup/          # Pulizia dati
│   │   │
│   │   ├── components/            # Componenti React
│   │   │   ├── common/           # Componenti comuni/condivisi
│   │   │   │   ├── Navbar.tsx
│   │   │   │   ├── Footer.tsx
│   │   │   │   ├── SessionProvider.tsx
│   │   │   │   └── AdminGuard.tsx
│   │   │   └── tests/            # Componenti specifici per test
│   │   │       └── sas/         # Componenti test S-AS
│   │   │           └── SASTest.tsx
│   │   │
│   │   ├── tests/                # Pagine dei test
│   │   │   ├── sas/             # Test S-AS
│   │   │   │   ├── page.tsx     # Pagina principale test
│   │   │   │   └── results/     # Risultati test
│   │   │   ├── create/          # Creazione test personalizzati
│   │   │   ├── manage/          # Gestione test
│   │   │   └── debug/           # Debug test
│   │   │
│   │   ├── reports/              # Pagine dei report
│   │   │   ├── [id]/            # Dettaglio report
│   │   │   ├── manage/          # Gestione report
│   │   │   └── pdf/             # Generazione PDF
│   │   │
│   │   ├── auth/                 # Pagine autenticazione
│   │   ├── profile/              # Profilo utente
│   │   ├── lib/                  # Librerie e utilità
│   │   ├── layout.tsx            # Layout principale
│   │   ├── page.tsx              # Homepage
│   │   └── globals.css           # Stili globali
│   │
│   ├── types/                    # Definizioni TypeScript
│   └── generated/                # File generati (Prisma)
│
├── prisma/                       # Schema database
├── public/                       # Asset pubblici
│   └── images/
├── docker-compose.yml            # Configurazione Docker
├── Dockerfile
├── package.json
├── tsconfig.json
├── next.config.js
└── README.md
```

## Componenti Principali

### Componenti Comuni (`/components/common/`)
- **Navbar**: Barra di navigazione principale
- **Footer**: Footer del sito
- **SessionProvider**: Gestione sessione utente
- **AdminGuard**: Protezione route amministrative

### Test S-AS (`/tests/sas/`)
- Test psicologico Scopo-Antiscopo
- Calcolo automatico dei punteggi fattoriali (media dei punteggi)
- Generazione report dettagliati
- Salvataggio automatico del progresso

## API Endpoints

### Test S-AS
- `POST /api/tests/sas/results` - Salva i risultati del test
- `GET /api/tests/sas/results` - Recupera i risultati salvati

### Report
- `GET /api/reports` - Lista report
- `POST /api/reports` - Crea nuovo report
- `GET /api/reports/[id]` - Dettaglio report
- `DELETE /api/reports/[id]` - Elimina report

## Database
- PostgreSQL con Prisma ORM
- Schema definito in `/prisma/schema.prisma`

## Tecnologie Utilizzate
- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: Bootstrap 5, Bootstrap Icons
- **Database**: PostgreSQL, Prisma ORM
- **Autenticazione**: NextAuth.js
- **PDF**: jsPDF per generazione report 