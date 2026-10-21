import env from '#start/env'
import app from '@adonisjs/core/services/app'
import { defineConfig, stores } from '@adonisjs/session'

/**
 * NASTAVENÍ SESSION.
 *
 * Session je to, čím si server pamatuje, že jsem přihlášený. Po úspěšném
 * `auth.use('web').login(user)` se do session uloží ID uživatele
 * a prohlížeč dostane podepsanou cookie s odkazem na tuto session.
 * Při dalším požadavku podle ní middleware `auth` uživatele znovu načte
 * z databáze.
 */
const sessionConfig = defineConfig({
  enabled: true,

  /** Název cookie, kterou uvidím v prohlížeči v DevTools → Application */
  cookieName: 'adonis-session',

  /**
   * false = session cookie přežije zavření prohlížeče (platí `age` níže).
   * true by znamenalo odhlášení při každém zavření okna.
   */
  clearWithBrowser: false,

  /**
   * Jak dlouho session vydrží bez aktivity. Po 2 hodinách nečinnosti
   * uživatele aplikace odhlásí – pojistka u nezamčeného počítače.
   */
  age: '2h',

  cookie: {
    path: '/',

    /**
     * httpOnly = cookie není přístupná z JavaScriptu (document.cookie).
     * Kdyby se do stránky dostal cizí skript (XSS), nemůže session ukrást.
     */
    httpOnly: true,

    /**
     * secure = cookie se posílá jen přes HTTPS. Zapnuté jen v produkci,
     * protože na localhostu běžím na http a jinak by se cookie neuložila.
     */
    secure: app.inProduction,

    /**
     * sameSite: 'lax' = cookie se nepřipojí k požadavkům, které vyvolá
     * cizí web (např. odeslání formuláře z jiné domény). Druhá vrstva
     * ochrany proti CSRF vedle tokenu ze Shieldu.
     */
    sameSite: 'lax',
  },

  /**
   * Kde se data session fyzicky ukládají – čte se z .env proměnné
   * SESSION_DRIVER (mám tam `cookie`).
   */
  store: env.get('SESSION_DRIVER'),

  /**
   * Varianta `cookie` ukládá data session zašifrovaně a podepsaně přímo
   * do cookie u klienta – nepotřebuju tedy žádné další úložiště.
   * Podpis se dělá klíčem APP_KEY z .env, takže data nejde zfalšovat.
   * Pro větší aplikaci by se použil store `redis` nebo `file`.
   */
  stores: {
    cookie: stores.cookie(),
  },
})

export default sessionConfig
