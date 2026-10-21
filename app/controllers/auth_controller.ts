import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import { loginValidator } from '#validators/auth'

/**
 * CONTROLLER = třída, která obsluhuje HTTP požadavky. Jedna metoda = jedna
 * akce (routa). Tady je celá logika přihlášení a odhlášení.
 *
 * `#models/user` a `#validators/auth` jsou tzv. subpath imports – aliasy
 * nastavené v package.json v sekci "imports". Díky nim nikde nepíšu
 * relativní cesty typu `../../models/user.js`.
 *
 * Objekt v parametrech ({ request, response, auth, session }) je HttpContext:
 * AdonisJS do každé akce předá kontext aktuálního požadavku a já si z něj
 * destrukturalizací vytáhnu jen to, co potřebuju.
 */
export default class AuthController {
  /**
   * GET /login – jen vykreslí formulář, žádná logika.
   */
  async showLogin({ view }: HttpContext) {
    return view.render('pages/auth/login')
  }

  /**
   * POST /login – ověří údaje a založí session.
   */
  async login({ request, response, auth, session }: HttpContext) {
    /**
     * 1) VALIDACE
     * Zkontroluje tvar vstupu podle pravidel ve validators/auth.ts.
     * Když neprojde, vyhodí výjimku, kterou odchytí AdonisJS, uloží chyby
     * do flash messages a sám vrátí uživatele na formulář – proto to tady
     * nemám v try/catch. Po tomto řádku mám zaručeně `email` a `password`
     * jako stringy správného formátu.
     */
    const { email, password } = await request.validateUsing(loginValidator)

    try {
      /**
       * 2) OVĚŘENÍ ÚDAJŮ
       * verifyCredentials() přidal do modelu mixin withAuthFinder.
       * Najde uživatele podle e-mailu, porovná scrypt hash hesla a když
       * cokoli nesedí, vyhodí InvalidCredentialsException.
       * Hashování ani porovnávání tedy nepíšu sám – to je hlavní důvod,
       * proč používám @adonisjs/auth.
       */
      const user = await User.verifyCredentials(email, password)

      /**
       * 3) PŘIHLÁŠENÍ
       * Uloží ID uživatele do session a pošle prohlížeči podepsanou
       * session cookie. Při dalších requestech podle ní middleware `auth`
       * uživatele znovu najde v databázi.
       * `use('web')` = session guard z config/auth.ts (mám jen jeden,
       * ale píšu to explicitně, aby bylo vidět, o který jde).
       */
      await auth.use('web').login(user)
    } catch {
      /**
       * 4) CHYBNÉ ÚDAJE
       * Záměrně nerozlišuju „e-mail neexistuje“ a „špatné heslo“ – obojí
       * dostane stejnou zprávu, aby se z aplikace nedalo zjistit, které
       * e-maily jsou registrované.
       *
       * flashErrors() uloží chybu do session do tzv. errorsBag, odkud ji
       * v šabloně vytáhne tag @error('login').
       * flashOnly(['email']) vrátí zpět jen vyplněný e-mail, aby ho
       * uživatel nemusel psát znovu. Heslo se do session nikdy nevrací.
       *
       * Flash message = data, která přežijí jedno přesměrování a pak se
       * ze session samy smažou.
       */
      session.flashErrors({ login: 'Neplatný e-mail nebo heslo.' })
      session.flashOnly(['email'])
      return response.redirect().toRoute('auth.showLogin')
    }

    /**
     * 5) ÚSPĚCH
     * Přesměrování (ne vykreslení stránky) je tu schválně – vzor
     * POST → redirect → GET. Kdybych po POSTu stránku jen vykreslil,
     * uživatel by při refreshi posílal formulář znovu.
     */
    return response.redirect().toPath('/dashboard')
  }

  /**
   * POST /logout – smaže session.
   *
   * Proč POST a ne GET? Odhlášení mění stav, takže musí projít přes
   * formulář s CSRF tokenem. Na GET odkaz by stačilo, aby uživatel někde
   * klikl na cizí odkaz (nebo se načetl obrázek s tím URL) a odhlásil se.
   */
  async logout({ response, auth }: HttpContext) {
    await auth.use('web').logout()
    return response.redirect().toPath('/login')
  }
}
