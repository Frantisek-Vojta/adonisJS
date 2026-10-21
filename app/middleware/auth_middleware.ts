import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import type { Authenticators } from '@adonisjs/auth/types'

/**
 * MIDDLEWARE = mezivrstva, která běží MEZI přijetím requestu a controllerem.
 * Může request propustit dál (`next()`), nebo ho zastavit a vrátit odpověď.
 *
 * Tenhle hlídá, že na routu smí jen přihlášený uživatel.
 * Vygeneroval ho `node ace add @adonisjs/auth --guard=session`,
 * přiřazuju ho routám ve start/routes.ts jako `middleware.auth()`.
 */
export default class AuthMiddleware {
  /**
   * Kam přesměrovat, když uživatel přihlášený není.
   */
  redirectTo = '/login'

  async handle(
    ctx: HttpContext,
    next: NextFn,
    options: {
      guards?: (keyof Authenticators)[]
    } = {}
  ) {
    /**
     * authenticateUsing() vytáhne z session cookie ID uživatele, načte ho
     * z databáze a uloží do `ctx.auth.user` – díky tomu k němu v controlleru
     * přistupuju přes `auth.getUserOrFail()`.
     *
     * Když session chybí nebo je neplatná, vyhodí výjimku a AdonisJS podle
     * `loginRoute` přesměruje na /login. Controller se vůbec nespustí.
     *
     * `options.guards` je nepovinné – když se nepředá, použije se výchozí
     * guard z config/auth.ts, tedy 'web'.
     */
    await ctx.auth.authenticateUsing(options.guards, { loginRoute: this.redirectTo })

    /**
     * Zavolání next() pustí request dál na controller. Kdybych ho zapomněl,
     * požadavek by se „zasekl“ a nikdy nedostal odpověď.
     */
    return next()
  }
}
