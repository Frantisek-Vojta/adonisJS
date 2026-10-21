/*
|--------------------------------------------------------------------------
| HTTP kernel – registrace middlewaru
|--------------------------------------------------------------------------
|
| Tady se určuje, které middleware běží a v jakém POŘADÍ. Pořadí je
| podstatné: každý řádek je jedna vrstva, kterou request projde cestou
| k controlleru (a odpověď pak zpátky).
|
| Soubor je součástí starter kitu, sám jsem do něj jen nechal doplnit
| `guest` a `auth` instalátorem @adonisjs/auth.
|
*/

import router from '@adonisjs/core/services/router'
import server from '@adonisjs/core/services/server'

/**
 * Handler, který převádí výjimky na HTTP odpovědi. Díky němu se při chybě
 * nevypíše stack trace, ale stránka 404 / 500
 * (resources/views/pages/errors/).
 */
server.errorHandler(() => import('#exceptions/handler'))

/**
 * SERVER middleware běží na KAŽDÉM požadavku – i na takovém, pro který
 * žádná routa neexistuje. Proto je tu statický server souborů: obrázek
 * z public/ se vyřeší tady a vůbec se neřeší routy.
 */
server.use([
  () => import('#middleware/container_bindings_middleware'),
  () => import('@adonisjs/static/static_middleware'),
  () => import('@adonisjs/vite/vite_middleware'),
])

/**
 * ROUTER middleware běží jen na požadavcích, které mají odpovídající routu.
 *
 * Pořadí tady je přesně to, na co se u obhajoby dá dobře ukázat, jak
 * přihlašování funguje – každá vrstva staví na té předchozí:
 *
 *  1. bodyparser – naparsuje tělo requestu, takže ve controlleru existuje
 *     `request.input('email')`. Bez něj by formulářová data nebyla vidět.
 *  2. session    – přečte session cookie a zpřístupní `ctx.session`.
 *     Musí být před auth, protože auth z session čte přihlášeného uživatele,
 *     a před shield, protože CSRF token se ukládá právě do session.
 *  3. shield     – bezpečnostní hlavičky a ověření CSRF tokenu u POST
 *     požadavků (viz config/shield.ts).
 *  4. initialize_auth – připraví `ctx.auth`. Samo ještě nikoho nepřihlašuje
 *     ani nic neblokuje, jen dá k dispozici objekt, se kterým pak pracuje
 *     pojmenovaný middleware `auth` / `guest`.
 */
router.use([
  () => import('@adonisjs/core/bodyparser_middleware'),
  () => import('@adonisjs/session/session_middleware'),
  () => import('@adonisjs/shield/shield_middleware'),
  () => import('@adonisjs/auth/initialize_auth_middleware'),
])

/**
 * POJMENOVANÝ middleware se na rozdíl od seznamů výše nespouští sám –
 * musím ho výslovně přiřadit routě nebo grupě rout ve start/routes.ts
 * (`middleware.auth()`, `middleware.guest()`).
 *
 * Právě proto je ochrana stránek vidět v routách: z jednoho souboru je
 * poznat, která URL je veřejná a která ne.
 */
export const middleware = router.named({
  guest: () => import('#middleware/guest_middleware'),
  auth: () => import('#middleware/auth_middleware'),
})
