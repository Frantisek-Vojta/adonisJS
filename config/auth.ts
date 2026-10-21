import { defineConfig } from '@adonisjs/auth'
import { sessionGuard, sessionUserProvider } from '@adonisjs/auth/session'
import type { InferAuthenticators, InferAuthEvents, Authenticators } from '@adonisjs/auth/types'

/**
 * NASTAVENÍ PŘIHLAŠOVÁNÍ – vygeneroval
 * `node ace add @adonisjs/auth --guard=session`.
 *
 * Dvě pojmy, které je dobré umět vysvětlit:
 *
 *  GUARD    = JAK se pozná přihlášený uživatel. Zvolil jsem `sessionGuard`,
 *             tedy session + cookie – standard pro klasický web, kde se
 *             přihlašuje přes formulář a stav si pamatuje server.
 *             Alternativy v AdonisJS jsou access tokeny (pro API, kde
 *             klient posílá token v hlavičce) nebo basic auth.
 *
 *  PROVIDER = ODKUD se uživatel načte. `sessionUserProvider` sáhne do
 *             databáze přes zadaný Lucid model.
 */
const authConfig = defineConfig({
  /**
   * Výchozí guard. Když v controlleru napíšu `auth.use('web')`, odkazuju
   * se právě sem. Protože je jediný a zároveň default, fungovalo by i
   * samotné `auth.authenticate()`.
   */
  default: 'web',

  guards: {
    web: sessionGuard({
      /**
       * Vypnuté „zůstat přihlášen“. Kdybych ho zapnul, Adonis by potřeboval
       * další tabulku na remember-me tokeny a dlouhodobou cookie.
       * Session mi vydrží 2 hodiny nečinnosti (config/session.ts), což pro
       * zadání stačí.
       */
      useRememberMeTokens: false,

      provider: sessionUserProvider({
        /**
         * Model, ve kterém se hledá uživatel podle ID ze session.
         * Opět lazy import – model se načte, až když je potřeba.
         */
        model: () => import('#models/user'),
      }),
    }),
  },
})

export default authConfig

/**
 * Tahle část je čistě pro TypeScript, za běhu nic nedělá.
 *
 * `declare module` doplní typy frameworku podle MÉ konfigurace – díky tomu
 * editor zná, že existuje guard 'web', a napovídá, že `auth.user` je typu
 * User. Kdybych napsal `auth.use('api')`, TypeScript to označí za chybu
 * ještě před spuštěním.
 */
declare module '@adonisjs/auth/types' {
  export interface Authenticators extends InferAuthenticators<typeof authConfig> {}
}
declare module '@adonisjs/core/types' {
  interface EventsList extends InferAuthEvents<Authenticators> {}
}
