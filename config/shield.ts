import { defineConfig } from '@adonisjs/shield'

/**
 * BEZPEČNOSTNÍ NASTAVENÍ (balíček @adonisjs/shield, součást starter kitu).
 * Shield je zapnutý jako middleware ve start/kernel.ts, takže se tohle
 * nastavení uplatní na všech routách.
 *
 * Z celého souboru je pro můj projekt nejdůležitější sekce `csrf` –
 * právě kvůli ní musí být ve formulářích `{{ csrfField() }}`.
 */
const shieldConfig = defineConfig({
  /**
   * CSP (Content Security Policy) = whitelist zdrojů, odkud smí stránka
   * načítat skripty a styly. Nechávám vypnuté: načítám Tailwind a fonty
   * z CDN, takže by CSP muselo mít výjimky a pro školní projekt by to
   * bylo zbytečné zdržení. Na reálném webu by se zapnout mělo.
   */
  csp: {
    enabled: false,
    directives: {},
    reportOnly: false,
  },

  /**
   * CSRF (Cross-Site Request Forgery) – ochrana proti tomu, aby cizí web
   * mohl jménem přihlášeného uživatele odeslat formulář na moji aplikaci.
   *
   * Jak to funguje: do session se uloží náhodný token, ten se vloží do
   * formuláře (`{{ csrfField() }}` → skryté pole `_csrf`) a Shield u každého
   * POSTu kontroluje, že token z formuláře odpovídá tomu v session.
   * Cizí stránka token nezná, takže její požadavek dostane chybu 403.
   *
   * Tohle je příčina chyby, na kterou jsem narazil při prvním odeslání
   * formuláře (popsáno v DOKUMENTACE.md) – Shield je zapnutý by default.
   */
  csrf: {
    enabled: true,
    /** Routy bez CSRF kontroly – prázdné, žádnou výjimku nepotřebuju */
    exceptRoutes: [],
    /** Varianta tokenu v cookie, potřeba jen pro SPA / AJAX; já mám klasické formuláře */
    enableXsrfCookie: false,
    /** Metody, které mění stav, a proto se kontrolují. GET mezi nimi záměrně není. */
    methods: ['POST', 'PUT', 'PATCH', 'DELETE'],
  },

  /**
   * Hlavička X-Frame-Options: DENY = moji stránku nesmí nikdo vložit do
   * <iframe>. Brání clickjackingu (útočník překryje můj formulář svým).
   */
  xFrame: {
    enabled: true,
    action: 'DENY',
  },

  /**
   * HSTS říká prohlížeči „tento web otevírej vždy přes HTTPS“.
   * Na localhostu se neuplatní, smysl má až na nasazeném webu s certifikátem.
   */
  hsts: {
    enabled: true,
    maxAge: '180 days',
  },

  /**
   * Zakáže prohlížeči hádat typ obsahu podle dat a nutí ho věřit hlavičce
   * content-type. Brání tomu, aby se nahraný soubor vyhodnotil jako skript.
   */
  contentTypeSniffing: {
    enabled: true,
  },
})

export default shieldConfig
