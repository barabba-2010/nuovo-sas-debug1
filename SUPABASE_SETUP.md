# Configurazione Supabase per PsychAssess

## Il problema
Il tuo `.env.local` attualmente punta a localhost invece che a Supabase. Ecco perché ricevi l'errore di connessione.

## Come recuperare la tua connection string di Supabase:

1. **Vai su Supabase Dashboard**
   - https://app.supabase.com/
   - Accedi con il tuo account

2. **Seleziona il tuo progetto**

3. **Vai su Settings → Database**

4. **Trova "Connection string"**
   - Cerca la sezione "Connection string" 
   - Seleziona "Prisma" dal dropdown
   - Copia l'URL che appare (inizia con `postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres`)

5. **Aggiorna il tuo `.env.local`**
   ```env
   # Sostituisci questa riga con il tuo URL di Supabase
   DATABASE_URL="postgresql://postgres:[LA-TUA-PASSWORD]@db.[IL-TUO-PROJECT-REF].supabase.co:5432/postgres"
   
   # Altre variabili necessarie
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="una-stringa-casuale-sicura"
   ```

## Esempio di URL Supabase (NON usare questo, usa il tuo!):
```
DATABASE_URL="postgresql://postgres:tuaPasswordSupabase@db.abcdefghijklmnop.supabase.co:5432/postgres"
```

## Dopo aver aggiornato il file:

1. **Salva il file `.env.local`**

2. **Riavvia il server Next.js**
   ```bash
   # Premi Ctrl+C per fermare il server
   # Poi riavvialo
   npm run dev
   ```

## Se continui ad avere problemi:

### Verifica che Supabase sia attivo:
1. Vai su https://app.supabase.com/
2. Controlla che il tuo progetto sia "Active" (non in pausa)
3. I progetti gratuiti vanno in pausa dopo 1 settimana di inattività

### Per riattivare un progetto in pausa:
1. Clicca sul progetto
2. Clicca su "Restore project" se appare il messaggio

### Test rapido della connessione:
```bash
npx prisma db push
```

Se questo comando funziona, la connessione è OK!

## Nota importante
Il file `.env.local` che ho creato prima era solo un esempio. Devi sostituire l'URL con quello reale di Supabase! 