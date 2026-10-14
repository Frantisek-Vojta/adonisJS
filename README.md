# Správa uživatelů – přihlašování (AdonisJS 6)

Webová aplikace v **AdonisJS 6** se session přihlašováním a databází **SQLite**.
Zatím je hotová jen část „přihlášení“ (registrace a správa uživatelů přijdou později).

## Technologie

- AdonisJS 6 (web starter kit – Edge šablony, Vite, Shield, Session)
- `@adonisjs/lucid` + `better-sqlite3` – databáze SQLite
- `@adonisjs/auth` – session guard (`web`)
- VineJS – validace formuláře (české chybové zprávy)
- Tailwind CSS (CDN)

## Spuštění

```bash
npm install
node ace migration:run   # vytvoří tabulku users
node ace db:seed         # vloží testovací uživatele
npm run dev              # http://localhost:3333
```

Databázový soubor je `tmp/db.sqlite3` (nastaveno v `config/database.ts`).

## Testovací účty

| E-mail                  | Heslo        |
| ----------------------- | ------------ |
| `admin@example.com`     | `admin1234`  |
| `jan.novak@example.com` | `tajneheslo` |

## Vytvoření dalšího uživatele

Nejjednodušeji přes ace příkaz (`commands/create_user.ts`):

```bash
node ace user:create novy@example.com "Nový Uživatel" --password=heslo1234

# bez --password se na heslo zeptá skrytým promptem
node ace user:create novy@example.com "Nový Uživatel"

# jméno je nepovinné
node ace user:create novy@example.com --password=heslo1234
```

Heslo musí mít alespoň 8 znaků, duplicitní e-mail příkaz odmítne.

Další možnosti:

```bash
# víc uživatelů naráz – přidej je do database/seeders/user_seeder.ts a spusť
node ace db:seed

# jednorázově v REPL
node ace repl
> const { default: User } = await import('#models/user')
> await User.create({ fullName: 'Nový', email: 'novy@example.com', password: 'heslo1234' })
```

Heslo se vždy automaticky zahashuje (scrypt) díky mixinu `withAuthFinder` v modelu `User` –
nikdy se neukládá v čitelné podobě.

## Routy

| Metoda | URL          | Middleware | Popis                              |
| ------ | ------------ | ---------- | ---------------------------------- |
| GET    | `/`          | –          | přesměruje na `/dashboard`         |
| GET    | `/login`     | `guest`    | přihlašovací formulář              |
| POST   | `/login`     | `guest`    | ověří údaje a vytvoří session      |
| GET    | `/dashboard` | `auth`     | stránka pro přihlášeného uživatele |
| POST   | `/logout`    | `auth`     | zruší session a vrátí na `/login`  |

Nepřihlášený uživatel je z `/dashboard` přesměrován na `/login`
(middleware `app/middleware/auth_middleware.ts`), přihlášený uživatel se
na `/login` nedostane (middleware `guest_middleware.ts`).

## Důležité soubory

```
app/controllers/auth_controller.ts       přihlášení / odhlášení
app/controllers/dashboard_controller.ts  stránka po přihlášení
app/validators/auth.ts                   validace formuláře (VineJS)
app/models/user.ts                        model User (hashování hesla)
app/middleware/auth_middleware.ts         ochrana routes
config/database.ts                        připojení k SQLite
config/auth.ts                            session guard
database/migrations/*_create_users_table.ts
database/seeders/user_seeder.ts
resources/views/components/layout.edge    společná šablona
resources/views/pages/auth/login.edge     formulář
resources/views/pages/dashboard.edge
start/routes.ts                           definice routes
start/validator.ts                        české chybové zprávy
```

## Další příkazy

```bash
npm run typecheck   # kontrola typů
npm run lint        # ESLint
node ace list       # seznam všech ace příkazů
```
