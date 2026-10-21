import vine from '@vinejs/vine'
import db from '@adonisjs/lucid/services/db'

/**
 * VLASTNÍ VALIDAČNÍ PRAVIDLO: e-mail nesmí být v databázi podruhé.
 *
 * Proč vlastní pravidlo: VineJS nemá o databázi ponětí, takže kontrolu
 * unikátnosti musím dopsat sám. `vine.createRule()` z obyčejné funkce
 * udělá pravidlo, které se pak přidá k poli přes `.use(...)`.
 *
 * Druhý parametr `{ isAsync: true }` je povinný, protože se uvnitř ptám
 * do databáze (await). Bez něj by VineJS funkci zavolal synchronně
 * a nepočkal na výsledek.
 *
 * Vtip je v `field.meta.userId`:
 *  - při VYTVÁŘENÍ se meta nepředává → kontroluje se celá tabulka
 *  - při ÚPRAVĚ se předá ID editovaného uživatele → ten se z kontroly
 *    vyloučí, aby si vlastní e-mail mohl nechat
 * Díky tomu stačí jedno pravidlo pro oba formuláře.
 *
 * Pozn.: unikátnost hlídá i databáze (unique index v migraci). Tohle
 * pravidlo je tu proto, aby uživatel dostal srozumitelnou chybu
 * u formuláře místo výjimky z databáze.
 */
const isEmailUnique = vine.createRule(
  async (value: unknown, _options: undefined, field) => {
    // Když pole neprošlo předchozími pravidly (není to string), nemá smysl
    // chodit do databáze – chybu už nahlásilo pravidlo před námi.
    if (typeof value !== 'string') {
      return
    }

    const query = db.from('users').where('email', value)

    const editedUserId = field.meta.userId
    if (editedUserId) {
      query.whereNot('id', editedUserId)
    }

    const existing = await query.select('id').first()
    if (existing) {
      /**
       * report(zpráva, název pravidla, pole) přidá chybu do výsledku.
       * Zprávu píšu přímo sem, protože je to moje vlastní pravidlo –
       * obecné texty mám v start/validator.ts.
       */
      field.report('Uživatel s tímto e-mailem už existuje', 'unique', field)
    }
  },
  { isAsync: true }
)

/**
 * Pravidla pro jméno a e-mail jsou v obou formulářích stejná, takže si je
 * vytáhnu do funkcí a neopisuju je dvakrát.
 *
 * Musí to být funkce (ne konstanty): každé pole validátoru potřebuje
 * vlastní instanci schématu, sdílení jedné by vedlo k podivnému chování.
 */
const fullNameRule = () => vine.string().trim().minLength(2).maxLength(100).optional()
const emailRule = () => vine.string().trim().email().normalizeEmail().use(isEmailUnique())

/**
 * VALIDÁTOR PRO VYTVOŘENÍ uživatele.
 *
 * Heslo je povinné – nový uživatel se bez něj nemůže přihlásit.
 * minLength(8) je stejná hranice jako v příkazu `node ace user:create`.
 */
export const createUserValidator = vine.compile(
  vine.object({
    fullName: fullNameRule(),
    email: emailRule(),
    password: vine.string().minLength(8).maxLength(180),
  })
)

/**
 * VALIDÁTOR PRO ÚPRAVU uživatele.
 *
 * Dva rozdíly proti vytváření:
 *
 *  1) `withMetaData<{ userId: number }>()` – díky tomu můžu do validace
 *     poslat ID editovaného uživatele a pravidlo isEmailUnique ho vyloučí
 *     z kontroly duplicity. V controlleru se předává jako
 *     `request.validateUsing(updateUserValidator, { meta: { userId } })`
 *     a TypeScript si vynutí, že to tam nezapomenu.
 *
 *  2) Heslo je `optional()` – prázdné pole znamená „nech staré heslo“.
 *     Kdyby bylo povinné, musel bych uživateli měnit heslo při každé
 *     úpravě jména. Ošetření prázdné hodnoty je v controlleru.
 */
export const updateUserValidator = vine.withMetaData<{ userId: number }>().compile(
  vine.object({
    fullName: fullNameRule(),
    email: emailRule(),
    password: vine.string().minLength(8).maxLength(180).optional(),
  })
)
