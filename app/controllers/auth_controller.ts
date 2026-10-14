import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import { loginValidator } from '#validators/auth'

export default class AuthController {
  /**
   * Display the login form
   */
  async showLogin({ view }: HttpContext) {
    return view.render('pages/auth/login')
  }

  /**
   * Verify the credentials and start a session for the user
   */
  async login({ request, response, auth, session }: HttpContext) {
    const { email, password } = await request.validateUsing(loginValidator)

    try {
      const user = await User.verifyCredentials(email, password)
      await auth.use('web').login(user)
    } catch {
      session.flashErrors({ login: 'Neplatný e-mail nebo heslo.' })
      session.flashOnly(['email'])
      return response.redirect().toRoute('auth.showLogin')
    }

    return response.redirect().toPath('/dashboard')
  }

  /**
   * Destroy the session and send the user back to the login form
   */
  async logout({ response, auth }: HttpContext) {
    await auth.use('web').logout()
    return response.redirect().toPath('/login')
  }
}
