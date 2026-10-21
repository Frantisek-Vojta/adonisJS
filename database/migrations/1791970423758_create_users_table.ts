import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * MIGRACE = struktura databáze popsaná v kódu a verzovaná v Gitu.
 *
 * Proč migrace a ne tabulka naklikaná ručně?
 * Tabulku popíšu jednou v TypeScriptu a `node ace migration:run` ji vytvoří
 * všude stejně (u mě, u spolužáka, na serveru). Lucid si navíc do své vlastní
 * tabulky `adonis_schema` zapisuje, které migrace už proběhly, takže se
 * žádná nespustí dvakrát.
 *
 * Tento soubor jsem nepsal ručně – vygeneroval ho příkaz
 * `node ace add @adonisjs/auth --guard=session`.
 * Číslo na začátku názvu souboru je timestamp a určuje pořadí spouštění.
 */
export default class extends BaseSchema {
  /** Název tabulky; držím ho v proměnné, aby byl v up() i down() stejný */
  protected tableName = 'users'

  /**
   * up() = „dopředu“. Spustí se při `node ace migration:run`.
   */
  async up() {
    this.schema.createTable(this.tableName, (table) => {
      // Primární klíč. increments() = celé číslo, které si databáze
      // sama zvyšuje (1, 2, 3, ...), takže ID nikdy neřeším v kódu.
      table.increments('id').notNullable()

      // Jméno je nepovinné – uživatel může existovat i jen s e-mailem.
      // Proto je v modelu typ `string | null`.
      table.string('full_name').nullable()

      // 254 znaků = maximální délka e-mailu podle RFC 5321.
      // unique() je tu klíčové: e-mailem se uživatel přihlašuje, takže
      // v tabulce nesmí být dvakrát. Hlídá to databáze, ne jen můj kód –
      // to je důležité, protože validace v aplikaci se dá obejít, omezení
      // v databázi ne.
      table.string('email', 254).notNullable().unique()

      // Pozor: tady se NIKDY neukládá heslo v čitelné podobě, ale jeho
      // scrypt hash. Délka sloupce stačí, protože hash má konstantní délku.
      table.string('password').notNullable()

      // Časy vyplňuje Lucid sám – viz dekorátory autoCreate / autoUpdate
      // v app/models/user.ts.
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  /**
   * down() = „zpátky“. Spustí se při `node ace migration:rollback`.
   * Každá migrace musí umět obojí, aby se dalo vrátit o verzi databáze zpět.
   */
  async down() {
    this.schema.dropTable(this.tableName)
  }
}
