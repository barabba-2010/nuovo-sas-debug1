# Risoluzione Errore Connessione PostgreSQL

## Errore
```
prisma:error Error in PostgreSQL connection: Error { kind: Io, cause: Some(Os { code: 10054, kind: ConnectionReset, message: "Connessione in corso interrotta forzatamente dall'host remoto." }) }
```

## Possibili Cause e Soluzioni

### 1. Verifica che PostgreSQL sia in esecuzione
```bash
# Su Windows, verifica se il servizio PostgreSQL è attivo
# Apri PowerShell come amministratore e esegui:
Gt-Seervice -Name "postgresql*"

# Se non è in esecuzione, avvialo:
Start-Service -Name "postgresql*"
```

### 2. Configura il file .env.local
Crea o modifica il file `.env.local` nella root del progetto con le tue credenziali PostgreSQL:

```env
# Esempio per PostgreSQL locale
DATABASE_URL="postgresql://postgres:tuapassword@localhost:5432/psychassess?schema=public"

# Se usi un database remoto (es. Supabase, Neon, etc.)
DATABASE_URL="postgresql://user:password@host:port/database?schema=public"

# Altre variabili necessarie
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="genera-una-stringa-casuale-sicura"
```

### 3. Verifica la connessione al database
```bash
# Test della connessione con Prisma
npx prisma db push

# Se hai problemi, prova a resettare Prisma
npx prisma generate
```

### 4. Soluzioni per errori comuni

#### A. Se PostgreSQL non è installato localmente
Opzione 1: Installa PostgreSQL
- Scarica da: https://www.postgresql.org/download/windows/
- Durante l'installazione, ricorda la password per l'utente 'postgres'

Opzione 2: Usa un database cloud gratuito
- **Supabase**: https://supabase.com (gratuito fino a 500MB)
- **Neon**: https://neon.tech (gratuito fino a 3GB)
- **Aiven**: https://aiven.io (trial gratuito)

#### B. Se il firewall blocca la connessione
```powershell
# Apri PowerShell come amministratore
# Aggiungi regola firewall per PostgreSQL
New-NetFirewallRule -DisplayName "PostgreSQL" -Direction Inbound -Protocol TCP -LocalPort 5432 -Action Allow
```

#### C. Se PostgreSQL è configurato solo per localhost
Modifica `postgresql.conf` (solitamente in `C:\Program Files\PostgreSQL\XX\data\`):
```
listen_addresses = '*'  # o specifica gli IP permessi
```

E in `pg_hba.conf`:
```
# Aggiungi questa riga per permettere connessioni locali
host    all             all             127.0.0.1/32            md5
```

### 5. Database Cloud Consigliato (Soluzione più semplice)

Per evitare problemi di configurazione locale, ti consiglio di usare **Supabase**:

1. Vai su https://supabase.com e crea un account gratuito
2. Crea un nuovo progetto
3. Vai su Settings > Database
4. Copia la "Connection string" per Prisma
5. Incollala nel tuo `.env.local` come DATABASE_URL

### 6. Dopo aver configurato il database

```bash
# Sincronizza lo schema Prisma con il database
npx prisma db push

# Genera il client Prisma
npx prisma generate

# (Opzionale) Apri Prisma Studio per verificare
npx prisma studio
```

### 7. Riavvia il server Next.js
```bash
# Ferma il server (Ctrl+C) e riavvialo
npm run dev
```

## Esempio .env.local completo
```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/psychassess?schema=public"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# (Opzionale) Se usi email
EMAIL_SERVER="smtp://username:password@smtp.example.com:587"
EMAIL_FROM="noreply@example.com"
```

## Nota Importante
Non committare mai il file `.env.local` su Git! Assicurati che sia nel `.gitignore`. 