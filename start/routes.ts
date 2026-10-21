/*
|--------------------------------------------------------------------------
| Routy – mapa celé aplikace
|--------------------------------------------------------------------------
|
| Tady se říká „na tuhle URL a tuhle HTTP metodu zavolej tuhle metodu
| controlleru“. Je to první soubor, který bych u obhajoby otevřel – je
| z něj vidět, že aplikace má jen pět rout.
|
*/

import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'

/**
 * Controllery importuju jako funkci vracející import (tzv. lazy import).
 * Díky tomu se soubor controlleru načte až při prvním požadavku na jeho
 * routu, ne při startu aplikace – server startuje rychleji.
 */
const AuthController = () => import('#controllers/auth_controller')
const DashboardController = () => import('#controllers/dashboard_controller')
const UsersController = () => import('#controllers/users_controller')

/**
 * Kořen webu nemá vlastní stránku, jen pošle uživatele na /dashboard.
 * Pokud přihlášený není, odtamtud ho middleware `auth` přesměruje
 * na /login – takže „/“ funguje pro oba stavy správně.
 *
 * Tohle je jediná routa, kde mám logiku přímo v closure, protože je to
 * jeden řádek a nemá smysl pro něj zakládat controller.
 */
router.get('/', ({ response }) => response.redirect().toPath('/dashboard'))

/**
 * Přihlašovací formulář – dostupný jen pro NEpřihlášené.
 *
 * `.group()` sdruží routy, aby se middleware psal jednou pro obě.
 * Middleware `guest` přihlášeného uživatele přesměruje pryč (na „/“),
 * takže se nemůže stát, že by se někdo přihlašoval podruhé.
 *
 * `.as('auth.login')` pojmenuje routu. Díky tomu můžu v šabloně psát
 * `route('auth.login')` místo pevného "/login" – když URL změním,
 * změní se na jednom místě.
 *
 * Dvě routy na stejné URL nejsou chyba: GET zobrazí formulář,
 * POST zpracuje odeslaná data.
 */
router
  .group(() => {
    router.get('/login', [AuthController, 'showLogin']).as('auth.showLogin')
    router.post('/login', [AuthController, 'login']).as('auth.login')
  })
  .use(middleware.guest())

/**
 * Routy, které vyžadují platnou session.
 *
 * Middleware `auth` ověří session ještě před spuštěním controlleru
 * a nepřihlášeného pošle na /login. Je to to podstatné, co bych u
 * obhajoby zdůraznil: ochrana stránek je jeden řádek u grupy rout,
 * ne `if (!user)` v každé metodě controlleru – nejde na ni zapomenout.
 */
router
  .group(() => {
    router.get('/dashboard', [DashboardController, 'index']).as('dashboard')
    router.post('/logout', [AuthController, 'logout']).as('auth.logout')

    /**
     * CRUD uživatelů. Routy drží konvenci, kterou používá i Laravel:
     * cesta je v množném čísle a akce se pozná z HTTP metody.
     *
     * Dvě věci, které stojí za vysvětlení:
     *
     * 1) Úprava a mazání jsou POST, i když „správně“ podle REST by to měl
     *    být PUT a DELETE. Důvod je praktický: HTML formulář umí jen GET
     *    a POST. Obejít to jde přepínačem `allowMethodSpoofing` v
     *    config/app.ts (skryté pole _method), ale ten je vypnutý a nechtěl
     *    jsem ho zapínat kvůli kosmetice. Podstatné je, že žádná akce
     *    měnící data není na GET – takže všechny projdou CSRF kontrolou.
     *
     * 2) `/users/create` je zaregistrovaná před `/users/:id/edit`. Tady
     *    ke kolizi dojít nemůže (tvary cest jsou různé), ale je zvyk psát
     *    konkrétní cesty před parametrické – kdybych později přidal
     *    `/users/:id`, zachytilo by `:id` i slovo "create".
     */
    router.get('/users', [UsersController, 'index']).as('users.index')
    router.get('/users/create', [UsersController, 'create']).as('users.create')
    router.post('/users', [UsersController, 'store']).as('users.store')
    router.get('/users/:id/edit', [UsersController, 'edit']).as('users.edit')
    router.post('/users/:id', [UsersController, 'update']).as('users.update')
    router.post('/users/:id/delete', [UsersController, 'destroy']).as('users.destroy')
  })
  .use(middleware.auth())
