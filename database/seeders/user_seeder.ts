import { BaseSeeder } from '@adonisjs/lucid/seeders'
import User from '#models/user'

/**
 * SEEDER = skript, který naplní databázi výchozími daty.
 * Spouští se příkazem `node ace db:seed`.
 *
 * Proč to tu je: migrace vytvoří prázdnou tabulku `users`, ale do prázdné
 * aplikace se nemám čím přihlásit. Seeder vytvoří demo účty jedním
 * příkazem – užitečné, když si projekt někdo stáhne z Gitu (databáze
 * v repozitáři není, složka tmp/ je v .gitignore).
 *
 * Rozdíl proti příkazu `node ace user:create`:
 *  - seeder  = pevně dané demo účty, hromadně, pro rozjezd projektu
 *  - user:create = jeden konkrétní uživatel se zadaným heslem, interaktivně
 *
 * Pozor: hesla jsou tady v kódu naschvál, jsou to veřejné testovací účty
 * pro školní projekt. V reálné aplikaci by se takový seeder na produkci
 * nikdy nespouštěl.
 */
export default class extends BaseSeeder {
  async run() {
    /**
     * `updateOrCreateMany('email', [...])` je ZÁMĚRNÁ volba místo
     * `createMany()`: první parametr je sloupec, podle kterého se hledá
     * existující záznam. Když už uživatel s daným e-mailem je, jen se
     * aktualizuje; když není, vytvoří se.
     *
     * Díky tomu se dá seeder spustit víckrát a nespadne na porušení
     * unique indexu u sloupce email.
     *
     * Hesla píšu čitelně – zahashuje je mixin AuthFinder v modelu User
     * při ukládání, takže v databázi skončí scrypt hash.
     */
    await User.updateOrCreateMany('email', [
      {
        fullName: 'Admin',
        email: 'admin@example.com',
        password: 'admin1234',
      },
      {
        fullName: 'Jan Novák',
        email: 'jan.novak@example.com',
        password: 'tajneheslo',
      },
      {
        fullName: 'Jaan Novák',
        email: 'jaan.novak@example.com',
        password: 'atajneheslo',
      },
    ])
  }
}
