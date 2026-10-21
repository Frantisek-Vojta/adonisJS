import vine from '@vinejs/vine'

/**
 * VALIDÁTOR přihlašovacího formuláře (knihovna VineJS).
 *
 * K čemu to je: data z formuláře přicházejí od uživatele, takže jim nesmím
 * věřit. Validátor je jediné místo, kde definuju, jak musí vstup vypadat.
 * V controlleru pak stačí `request.validateUsing(loginValidator)` a dál už
 * pracuju s daty, o kterých vím, že mají správný typ a tvar.
 *
 * `vine.compile()` pravidla jednou přeloží do optimalizované funkce,
 * která se pak používá při každém requestu – proto je validátor v konstantě
 * na úrovni modulu a ne uvnitř controlleru.
 *
 * Když validace selže, VineJS vyhodí výjimku, AdonisJS ji odchytí,
 * uloží chyby do session (flash messages) a vrátí uživatele na formulář.
 * Nemusím to tedy nikde ošetřovat ručně – viz @inputError v login.edge.
 *
 * České texty chyb nastavuju centrálně v start/validator.ts.
 */
export const loginValidator = vine.compile(
  vine.object({
    /**
     * trim()           – odstraní mezery na krajích (časté při kopírování)
     * email()          – ověří formát e-mailu
     * normalizeEmail() – sjednotí zápis (např. zmenší velká písmena),
     *                    aby se "Admin@Example.com" přihlásil stejně
     *                    jako "admin@example.com"
     */
    email: vine.string().trim().email().normalizeEmail(),

    /**
     * U hesla kontroluju jen to, že vůbec přišlo jako text. Minimální délku
     * tu záměrně NEhlídám: při přihlašování není co radit, heslo prostě buď
     * sedí, nebo ne. Pravidlo na délku patří k registraci / změně hesla
     * (u mě je v commands/create_user.ts).
     */
    password: vine.string(),

    /**
     * Příprava na checkbox „zůstat přihlášen“. accepted() = musí být
     * zaškrtnuto, optional() = nemusí přijít vůbec.
     * Zatím to nikde nepoužívám – formulář ten checkbox neobsahuje
     * a v config/auth.ts mám `useRememberMeTokens: false`.
     */
    rememberMe: vine.accepted().optional(),
  })
)
