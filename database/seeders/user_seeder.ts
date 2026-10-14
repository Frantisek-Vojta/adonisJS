import { BaseSeeder } from '@adonisjs/lucid/seeders'
import User from '#models/user'

export default class extends BaseSeeder {
  async run() {
    /**
     * Demo accounts for logging in. Passwords are hashed by the
     * AuthFinder mixin on the User model.
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
