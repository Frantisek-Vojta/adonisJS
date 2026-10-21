import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import { createUserValidator, updateUserValidator } from '#validators/user'

/**
 * CRUD UŽIVATELŮ – Create, Read, Update, Delete.
 *
 * Jedna metoda = jedna routa (viz start/routes.ts). Pojmenování metod
 * drží konvenci, kterou používá i Laravel, takže je z názvu hned jasné,
 * co která dělá:
 *
 *   index   – GET  /users            výpis všech (Read)
 *   create  – GET  /users/create     zobrazí formulář pro nového
 *   store   – POST /users            uloží nového (Create)
 *   edit    – GET  /users/:id/edit   zobrazí formulář s předvyplněnými údaji
 *   update  – POST /users/:id        uloží změny (Update)
 *   destroy – POST /users/:id/delete smaže (Delete)
 *
 * Celý controller je dostupný jen přihlášeným – routy jsou ve skupině
 * s middlewarem `auth`, takže tady nikde nekontroluju, kdo je přihlášený.
 */
export default class UsersController {
  /**
   * READ – výpis všech uživatelů.
   */
  async index({ view }: HttpContext) {
    /**
     * `User.query()` je dotazovač Lucidu (query builder). Řadím podle ID,
     * aby měl výpis stabilní pořadí – bez orderBy není pořadí zaručené
     * a řádky by mohly po úpravě „poskakovat“.
     *
     * Heslo se z databáze načte taky, ale do šablony se nedostane:
     * v modelu má sloupec `serializeAs: null` a v šabloně ho nevypisuju.
     */
    const users = await User.query().orderBy('id', 'asc')

    return view.render('pages/users/index', { users })
  }

  /**
   * Formulář pro nového uživatele. Žádná data nepotřebuje.
   */
  async create({ view }: HttpContext) {
    return view.render('pages/users/create')
  }

  /**
   * CREATE – uložení nového uživatele.
   */
  async store({ request, response, session }: HttpContext) {
    /**
     * Validace. Když selže, VineJS vyhodí výjimku, AdonisJS uloží chyby
     * i vyplněné hodnoty do session a vrátí uživatele na formulář –
     * nemusím to řešit v try/catch. Součástí validace je i kontrola,
     * že e-mail v databázi ještě není (vlastní pravidlo isEmailUnique).
     */
    const data = await request.validateUsing(createUserValidator)

    /**
     * Heslo předávám v čitelné podobě záměrně – mixin withAuthFinder
     * v modelu ho před uložením zahashuje scryptem (viz app/models/user.ts).
     *
     * `?? null` u jména: prázdné pole přijde jako undefined, ale sloupec
     * v databázi je nullable, takže do něj patří null.
     */
    const user = await User.create({
      fullName: data.fullName ?? null,
      email: data.email,
      password: data.password,
    })

    /**
     * Potvrzení pro uživatele. flash() uloží zprávu do session, ta přežije
     * přesměrování a v šabloně ji vypíše tag @flashMessage('success').
     */
    session.flash('success', `Uživatel „${user.email}“ byl vytvořen.`)

    return response.redirect().toRoute('users.index')
  }

  /**
   * Formulář s předvyplněnými údaji existujícího uživatele.
   */
  async edit({ params, view }: HttpContext) {
    /**
     * `findOrFail` vyhodí výjimku, když uživatel s daným ID neexistuje –
     * AdonisJS z ní udělá stránku 404. Kdybych použil `find`, musel bych
     * sám řešit, že je výsledek null.
     */
    const user = await User.findOrFail(params.id)

    return view.render('pages/users/edit', { user })
  }

  /**
   * UPDATE – uložení změn.
   */
  async update({ params, request, response, session }: HttpContext) {
    const user = await User.findOrFail(params.id)

    /**
     * `meta: { userId: user.id }` posílá do validace ID editovaného
     * uživatele, aby kontrola unikátnosti e-mailu vyloučila jeho vlastní
     * záznam. Bez toho by uložení beze změny e-mailu hlásilo duplicitu.
     * TypeScript mi tento parametr vynutí, protože validátor je vyroben
     * přes `withMetaData()`.
     */
    const data = await request.validateUsing(updateUserValidator, {
      meta: { userId: user.id },
    })

    /**
     * `merge()` nastaví hodnoty na modelu, `save()` je zapíše do databáze.
     * Lucid pošle UPDATE jen se sloupci, které se opravdu změnily.
     */
    user.merge({
      fullName: data.fullName ?? null,
      email: data.email,
    })

    /**
     * Heslo přepíšu jen tehdy, když ho někdo vyplnil. Prázdné pole
     * znamená „nech staré heslo“ – jinak bych ho při každé úpravě jména
     * přepsal prázdnou hodnotou a uživatel by se nepřihlásil.
     */
    if (data.password) {
      user.password = data.password
    }

    await user.save()

    session.flash('success', `Uživatel „${user.email}“ byl upraven.`)

    return response.redirect().toRoute('users.index')
  }

  /**
   * DELETE – smazání uživatele.
   */
  async destroy({ params, response, auth, session }: HttpContext) {
    const user = await User.findOrFail(params.id)

    /**
     * POJISTKA: nikdo nesmí smazat sám sebe.
     *
     * Bez toho by si přihlášený uživatel mohl smazat vlastní účet, zůstal
     * by s platnou session odkazující na neexistující řádek a při dalším
     * requestu by ho middleware `auth` odhlásil. V krajním případě by si
     * takhle poslední uživatel zavřel přístup do aplikace (registrace
     * ve webu není, šel by vytvořit jen přes `node ace user:create`).
     *
     * Kontroluju to v controlleru, ne ve validátoru – není to otázka
     * tvaru vstupu, ale pravidlo aplikace.
     */
    if (auth.user!.id === user.id) {
      session.flash('error', 'Nemůžete smazat účet, pod kterým jste přihlášeni.')

      return response.redirect().toRoute('users.index')
    }

    await user.delete()

    session.flash('success', `Uživatel „${user.email}“ byl smazán.`)

    return response.redirect().toRoute('users.index')
  }
}
