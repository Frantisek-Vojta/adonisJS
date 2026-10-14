# Přihlašování v AdonisJS – dokumentace

**Zadání:** webová aplikace se správou uživatelů, zatím jen přihlašování, databáze SQLite.

## Jak jsem to udělal

Projekt jsem vygeneroval z oficiálního **web starter kitu** AdonisJS 6
(`npm init adonisjs@latest`) a doinstaloval dva balíčky:

- `node ace add @adonisjs/lucid --db=sqlite` – ORM a připojení k SQLite
- `node ace add @adonisjs/auth --guard=session` – přihlašování přes session

Druhý příkaz mi sám vygeneroval migraci tabulky `users`, model `User`
a middleware `auth` / `guest`. Zbytek jsem dopsal:

| Soubor                                  | Co dělá                             |
| --------------------------------------- | ----------------------------------- |
| `app/controllers/auth_controller.ts`    | ověří údaje a vytvoří/zruší session |
| `app/validators/auth.ts`                | validace formuláře (VineJS)         |
| `resources/views/pages/auth/login.edge` | přihlašovací formulář               |
| `resources/views/pages/dashboard.edge`  | stránka po přihlášení               |
| `start/routes.ts`                       | routy + přiřazení middleware        |
| `commands/create_user.ts`               | ace příkaz `user:create`            |

Jádro celého přihlášení jsou tři řádky v controlleru:

```ts
const user = await User.verifyCredentials(email, password)
await auth.use('web').login(user)
```

Routy `/login` chrání middleware `guest` (přihlášený se tam nedostane),
`/dashboard` a `/logout` middleware `auth` (nepřihlášeného pošle na `/login`).

## Co byly problémy

- **Nativní modul se nezkompiloval.** Nové npm (11.19) blokuje install skripty, takže
  `better-sqlite3` zůstal bez zkompilované binárky a databáze nešla otevřít. Řešení:
  `npm install-scripts approve better-sqlite3` a `npm rebuild`.
- **Generátor odmítl neprázdnou složku** (byla tam `.idea` od PhpStormu). Vygeneroval jsem
  projekt do vedlejší složky a obsah pak přesunul.
- **Chybové zprávy byly anglicky.** Dohledal jsem, že VineJS má `SimpleMessagesProvider`,
  a nastavil české texty v `start/validator.ts`.
- **První odeslání formuláře mi padalo na CSRF.** Shield je zapnutý by default, do formuláře
  patří `{{ csrfField() }}`.
- **Chyba „špatné heslo“ se nezobrazovala.** Flash zprávy se ukládají do `errorsBag`,
  takže je potřeba `session.flashErrors()` a v šabloně tag `@error('login')`.

## Co bylo parádní

- **Heslo se hashuje samo.** Mixin `withAuthFinder` v modelu hashuje scryptem při každém
  uložení a `verifyCredentials` ho ověří – nikde jsem nemusel řešit hashování ručně.
- **Middleware místo if-ů.** Ochrana stránek je jeden řádek u grupy rout, ne kontrola
  v každém controlleru.
- **Vlastní ace příkaz.** `node ace user:create mail@example.com "Jméno"` – stačilo vytvořit
  soubor v `commands/`, AdonisJS si ho našel sám a heslo se zadává skrytým promptem.
- **Hotové testování.** `npm run typecheck` a `npm run lint` odchytily chyby,
  celý průchod přihlášení jsem si proklikal a ověřil přes `curl`.
