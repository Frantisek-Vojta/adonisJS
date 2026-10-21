import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import type { Authenticators } from '@adonisjs/auth/types'

/**
 * Opak auth middlewaru: pustí dál jen NEpřihlášeného uživatele.
 *
 * Používám ho na /login – nemá smysl, aby se přihlášený uživatel znovu
 * přihlašoval, a kdyby formulář odeslal, přepsal by si session.
 *
 * Soubor vygeneroval `node ace add @adonisjs/auth --guard=session`,
 * přiřazuju ho ve start/routes.ts jako `middleware.guest()`.
 */
export default class GuestMiddleware {
  /**
   * Kam přesměrovat už přihlášeného uživatele. „/“ si pak samo přesměruje
   * na /dashboard (viz start/routes.ts).
   */
  redirectTo = '/'

  async handle(
    ctx: HttpContext,
    next: NextFn,
    options: { guards?: (keyof Authenticators)[] } = {}
  ) {
    /**
     * Projde všechny guardy (u mě jen 'web') a u každého se zeptá `check()`.
     *
     * Rozdíl proti authenticate(): check() jen vrátí true/false a nevyhodí
     * výjimku – přesně to, co tady potřebuju, protože „nepřihlášený“ je
     * na téhle routě žádoucí stav, ne chyba.
     */
    for (let guard of options.guards || [ctx.auth.defaultGuard]) {
      if (await ctx.auth.use(guard).check()) {
        // Druhý parametr `true` = zachovat query string při přesměrování
        return ctx.response.redirect(this.redirectTo, true)
      }
    }

    // Nikdo přihlášený není → pokračuj na controller s formulářem
    return next()
  }
}
