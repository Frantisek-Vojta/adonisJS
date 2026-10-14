/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'

const AuthController = () => import('#controllers/auth_controller')
const DashboardController = () => import('#controllers/dashboard_controller')

router.get('/', ({ response }) => response.redirect().toPath('/dashboard'))

/**
 * Login form, only reachable while logged-out
 */
router
  .group(() => {
    router.get('/login', [AuthController, 'showLogin']).as('auth.showLogin')
    router.post('/login', [AuthController, 'login']).as('auth.login')
  })
  .use(middleware.guest())

/**
 * Routes that require an authenticated session
 */
router
  .group(() => {
    router.get('/dashboard', [DashboardController, 'index']).as('dashboard')
    router.post('/logout', [AuthController, 'logout']).as('auth.logout')
  })
  .use(middleware.auth())
