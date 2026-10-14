import type { HttpContext } from '@adonisjs/core/http'

export default class DashboardController {
  /**
   * Page shown to the logged-in user
   */
  async index({ view, auth }: HttpContext) {
    return view.render('pages/dashboard', { user: auth.getUserOrFail() })
  }
}
