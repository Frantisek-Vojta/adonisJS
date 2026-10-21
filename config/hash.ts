import { defineConfig, drivers } from '@adonisjs/core/hash'

/**
 * NASTAVENÍ HASHOVÁNÍ HESEL.
 *
 * Sem odkazuje mixin withAuthFinder v app/models/user.ts přes
 * `hash.use('scrypt')` – tady je tedy definováno, čím se hesla hashují.
 *
 * Proč hash a ne šifrování: hash je jednosměrný, z databáze se heslo
 * nedá získat zpět. Při přihlášení se zahashuje zadané heslo a porovnají
 * se hashe.
 *
 * Proč scrypt a ne třeba MD5 nebo SHA-256: scrypt je navržený, aby byl
 * ZÁMĚRNĚ pomalý a náročný na paměť. Běžné hashovací funkce jsou rychlé,
 * takže by útočník s ukradenou databází zkoušel miliardy hesel za sekundu.
 * Scrypt mu to zpomalí na zlomek. Scrypt je výchozí volba starter kitu;
 * alternativy v AdonisJS jsou argon2 a bcrypt (ty vyžadují doinstalování).
 */
const hashConfig = defineConfig({
  /** Výchozí hasher – použije se, když v kódu neurčím jiný */
  default: 'scrypt',

  list: {
    /**
     * Parametry určují, jak je hashování náročné. Čím vyšší, tím bezpečnější,
     * ale i pomalejší přihlašování. Nechávám doporučené výchozí hodnoty:
     *  cost            – počet iterací (16384 = 2^14)
     *  blockSize       – velikost bloku, ovlivňuje nároky na paměť
     *  parallelization – kolik výpočtů běží paralelně
     *  maxMemory       – strop paměti na jeden výpočet (32 MB)
     */
    scrypt: drivers.scrypt({
      cost: 16384,
      blockSize: 8,
      parallelization: 1,
      maxMemory: 33554432,
    }),
  },
})

export default hashConfig

/**
 * Jen pro TypeScript: doplní typy podle hasherů nastavených výše, takže
 * `hash.use('scrypt')` editor zná a překlep by označil jako chybu.
 */
declare module '@adonisjs/core/types' {
  export interface HashersList extends InferHashers<typeof hashConfig> {}
}
