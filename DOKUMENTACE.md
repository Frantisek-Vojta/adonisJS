# Přihlašování v AdonisJS – dokumentace

**Zadání:** webová aplikace se správou uživatelů, databáze SQLite.
První část bylo přihlašování, druhá správa uživatelů (CRUD).

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

Pro druhou část (CRUD) jsem přidal:

| Soubor                                | Co dělá                                   |
| ------------------------------------- | ----------------------------------------- |
| `app/controllers/users_controller.ts` | výpis, vytvoření, úprava a mazání         |
| `app/validators/user.ts`              | validace + vlastní pravidlo na unikátnost |
| `resources/views/pages/users/*.edge`  | výpis a oba formuláře                     |
| `resources/views/components/*.edge`   | společná hlavička, formulář, flash zprávy |

Jádro celého přihlášení jsou tři řádky v controlleru:

```ts
const user = await User.verifyCredentials(email, password)
await auth.use('web').login(user)
```

Routy `/login` chrání middleware `guest` (přihlášený se tam nedostane),
`/dashboard` a `/logout` middleware `auth` (nepřihlášeného pošle na `/login`).

## Správa uživatelů (CRUD)

Druhá část zadání. Routy drží konvenci, kterou používá i Laravel – cesta
v množném čísle a akce se pozná z HTTP metody:

| Metoda | Cesta               | Akce                            |
| ------ | ------------------- | ------------------------------- |
| GET    | `/users`            | výpis všech uživatelů           |
| GET    | `/users/create`     | formulář pro nového             |
| POST   | `/users`            | uložení nového                  |
| GET    | `/users/:id/edit`   | formulář s předvyplněnými údaji |
| POST   | `/users/:id`        | uložení změn                    |
| POST   | `/users/:id/delete` | smazání                         |

Všech šest rout je ve skupině s middlewarem `auth`, takže v controlleru
nikde nekontroluju, kdo je přihlášený.

Tři rozhodnutí, která stojí za vysvětlení:

- **Úprava a mazání jsou POST, ne PUT a DELETE.** HTML formulář umí jen GET
  a POST. Obejít to jde přepínačem `allowMethodSpoofing` v `config/app.ts`,
  ale nechtěl jsem ho zapínat kvůli kosmetice. Podstatné je, že žádná akce
  měnící data není na GET, takže všechny projdou CSRF kontrolou.
- **Unikátnost e-mailu hlídá vlastní validační pravidlo.** VineJS o databázi
  nic neví, takže jsem si napsal pravidlo přes `vine.createRule()`. Při
  úpravě mu přes `withMetaData()` posílám ID editovaného uživatele, aby se
  z kontroly vyloučil – jinak by uložení beze změny e-mailu hlásilo
  duplicitu. Index `unique` v databázi zůstává jako pojistka.
- **Nikdo nesmí smazat sám sebe.** Jinak by si přihlášený uživatel smazal
  účet, zůstal se session na neexistující řádek a v krajním případě by si
  poslední uživatel zavřel přístup do aplikace (registrace ve webu není).
  Kontrola je na serveru v controlleru; `confirm()` v prohlížeči je jen
  pohodlí, JavaScript se dá vypnout.

Prázdné pole „heslo“ u úpravy znamená „nech staré heslo“ – validátor ho má
jako `optional()` a controller ho přepíše jen tehdy, když něco přišlo.

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
- **Chybové zprávy o délce byly gramaticky špatně.** Jedna šablona
  s `{{ min }}` dává „alespoň 2 znaků“. Musel jsem použít klíče ve tvaru
  `pole.pravidlo` (např. `password.minLength`) a napsat text pro každé pole
  zvlášť, protože čeština skloňuje podle čísla.

## Co bylo parádní

- **Heslo se hashuje samo.** Mixin `withAuthFinder` v modelu hashuje scryptem při každém
  uložení a `verifyCredentials` ho ověří – nikde jsem nemusel řešit hashování ručně.
- **Middleware místo if-ů.** Ochrana stránek je jeden řádek u grupy rout, ne kontrola
  v každém controlleru.
- **Vlastní ace příkaz.** `node ace user:create mail@example.com "Jméno"` – stačilo vytvořit
  soubor v `commands/`, AdonisJS si ho našel sám a heslo se zadává skrytým promptem.
- **Hotové testování.** `npm run typecheck` a `npm run lint` odchytily chyby,
  celý průchod přihlášení i CRUD jsem si proklikal a ověřil přes `curl`.
- **Typy drží i validaci.** Validátor pro úpravu je vyrobený přes
  `withMetaData<{ userId: number }>()`, takže mi TypeScript sám nedovolí
  zapomenout předat ID – chybu bych jinak našel až v prohlížeči.
