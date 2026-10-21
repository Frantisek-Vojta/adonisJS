import app from '@adonisjs/core/services/app'
import { defineConfig } from '@adonisjs/lucid'

/**
 * PŘIPOJENÍ K DATABÁZI (ORM Lucid).
 * Vygeneroval `node ace add @adonisjs/lucid --db=sqlite`.
 *
 * Zadání říkalo SQLite, což je pro tento projekt výhoda: databáze je jeden
 * soubor, nemusí běžet žádný server a stačí ji smazat a pustit migrace
 * znovu. Kdybych přecházel na PostgreSQL, měnil bych jen tento soubor –
 * modely, migrace ani controllery se nezmění, protože Lucid generuje SQL
 * podle zvoleného klienta.
 */
const dbConfig = defineConfig({
  /** Které z níže uvedených připojení se použije, když neurčím jinak */
  connection: 'sqlite',

  connections: {
    sqlite: {
      /**
       * Ovladač. `better-sqlite3` je nativní modul (kompiluje se při
       * instalaci do binárky) – právě s ním jsem měl problém popsaný
       * v DOKUMENTACE.md: nové npm blokuje install skripty, takže se
       * binárka nezkompilovala a databáze nešla otevřít.
       */
      client: 'better-sqlite3',

      connection: {
        /**
         * Cesta k souboru databáze: tmp/db.sqlite3.
         * `app.tmpPath()` ji skládá od korene projektu, takže funguje
         * bez ohledu na to, odkud aplikaci spustím.
         * Složka tmp/ je v .gitignore – databáze s uživateli nepatří do Gitu.
         */
        filename: app.tmpPath('db.sqlite3'),
      },

      /**
       * SQLite nerozumí hodnotě DEFAULT u INSERTu, tohle za ni pošle NULL.
       * Doporučené nastavení přímo z dokumentace Knexu.
       */
      useNullAsDefault: true,

      migrations: {
        /** Řadí migrace přirozeně podle čísla v názvu, ne abecedně */
        naturalSort: true,
        /** Kde Lucid hledá migrace při `node ace migration:run` */
        paths: ['database/migrations'],
      },
    },
  },
})

export default dbConfig
