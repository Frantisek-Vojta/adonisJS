import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

/**
 * „Tiché“ zjištění, jestli je uživatel přihlášený – request pokračuje dál
 * v obou případech, nic neblokuje ani nepřesměrovává.
 *
 * Hodilo by se na veřejnou stránku, která má jen přepnout menu mezi
 * „Přihlásit se“ a „Odhlásit se“.
 *
 * POZOR (dobré vědět u obhajoby): tento soubor vygeneroval instalátor
 * @adonisjs/auth, ale v mé aplikaci se NEPOUŽÍVÁ – není registrovaný
 * ve start/kernel.ts ani přiřazený žádné routě. Všechny moje stránky jsou
 * buď jen pro přihlášené (middleware auth), nebo jen pro nepřihlášené
 * (middleware guest), takže ho nepotřebuju.
 */
export default class SilentAuthMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    // check() vrací true/false a nikdy nevyhodí výjimku
    await ctx.auth.check()

    return next()
  }
}
