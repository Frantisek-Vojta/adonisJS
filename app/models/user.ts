import { DateTime } from 'luxon'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { BaseModel, column } from '@adonisjs/lucid/orm'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'

/**
 * MIXIN withAuthFinder – tohle je srdce celého přihlašování.
 *
 * Přidá do modelu dvě věci:
 *
 *  1) Hook, který PŘED každým uložením zahashuje sloupec `password`
 *     (algoritmem scrypt, nastaveným v config/hash.ts). V databázi proto
 *     nikdy neleží čitelné heslo a já sám ho nedokážu přečíst.
 *
 *  2) Statickou metodu `User.verifyCredentials(email, password)`, kterou
 *     volám v AuthControlleru. Najde uživatele podle `uids`, porovná hash
 *     se zadaným heslem a když nesouhlasí, vyhodí výjimku
 *     InvalidCredentialsException.
 *
 * `uids: ['email']` = podle kterých sloupců se uživatel při přihlášení hledá.
 * Kdybych chtěl přihlašování i přes uživatelské jméno, přidal bych ho sem.
 *
 * Co je dobré zmínit u obhajoby: verifyCredentials porovnává hashe
 * v konstantním čase a i pro NEexistující e-mail provede fiktivní ověření.
 * Útočník tedy z doby odpovědi nepozná, jestli daný e-mail v databázi je –
 * tomu se říká ochrana proti timing attacku a user enumeration.
 */
const AuthFinder = withAuthFinder(() => hash.use('scrypt'), {
  uids: ['email'],
  passwordColumnName: 'password',
})

/**
 * MODEL = jeden řádek tabulky `users` reprezentovaný jako objekt (ORM Lucid).
 * Místo psaní SQL pracuju s `User.find()`, `User.create()` apod.
 *
 * `compose(BaseModel, AuthFinder)` je způsob, jak v AdonisJS vmíchat mixin
 * do třídy – výsledkem je BaseModel obohacený o schopnosti AuthFinderu výše.
 *
 * Klíčové slovo `declare` u sloupců říká TypeScriptu „tahle vlastnost
 * existuje, ale nepřiřazuj jí hodnotu“ – hodnotu doplní Lucid za běhu
 * z databáze. Bez `declare` by TypeScript vlastnost přepsal na undefined.
 */
export default class User extends compose(BaseModel, AuthFinder) {
  /** Primární klíč. Podle něj Lucid pozná, který řádek má při save() upravit. */
  @column({ isPrimary: true })
  declare id: number

  /**
   * Lucid automaticky převádí camelCase v kódu na snake_case v databázi,
   * takže `fullName` odpovídá sloupci `full_name`. Nemusím to nikde mapovat.
   */
  @column()
  declare fullName: string | null

  /** Přihlašovací údaj – v migraci má unique index. */
  @column()
  declare email: string

  /**
   * Obsahuje scrypt hash, ne heslo. `serializeAs: null` znamená, že se
   * tento sloupec vynechá při převodu modelu na JSON – pojistka, aby hash
   * nikdy neunikl do API odpovědi nebo do šablony.
   */
  @column({ serializeAs: null })
  declare password: string

  /** autoCreate = Lucid vyplní čas při vytvoření záznamu */
  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  /** autoCreate + autoUpdate = vyplní při vytvoření a přepíše při každé změně */
  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null
}
