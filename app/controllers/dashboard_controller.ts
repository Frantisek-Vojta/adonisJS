import type { HttpContext } from '@adonisjs/core/http'

/**
 * Stránka, kterou uživatel vidí po přihlášení.
 *
 * Je to samostatný controller, protože s přihlašováním nemá nic společného –
 * AuthController řeší „jak se dostat dovnitř“, DashboardController už jen
 * zobrazuje obsah pro přihlášeného.
 */
export default class DashboardController {
  async index({ view, auth }: HttpContext) {
    /**
     * `auth.getUserOrFail()` vrátí přihlášeného uživatele (instanci modelu
     * User), nebo vyhodí výjimku, pokud nikdo přihlášený není.
     *
     * Proč si můžu dovolit variantu „OrFail“ a nemusím řešit `null`?
     * Na tuto routu se nedá dostat bez platné session – chrání ji middleware
     * `auth` ve start/routes.ts, který nepřihlášeného přesměruje na /login
     * ještě předtím, než se tento kód vůbec spustí. Výjimka by tu tedy
     * znamenala chybu v konfiguraci rout, ne běžný stav.
     *
     * Druhý parametr view.render() jsou data předaná do šablony – v
     * dashboard.edge se k nim dostanu jako {{ user.email }}.
     */
    return view.render('pages/dashboard', { user: auth.getUserOrFail() })
  }
}
