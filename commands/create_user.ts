import { BaseCommand, args, flags } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'

export default class CreateUser extends BaseCommand {
  static commandName = 'user:create'
  static description = 'Vytvoří nového uživatele, který se bude moci přihlásit'

  /**
   * The app must be booted so that the database connection
   * and the User model are available
   */
  static options: CommandOptions = {
    startApp: true,
  }

  @args.string({ description: 'E-mail uživatele' })
  declare email: string

  @args.string({ description: 'Jméno uživatele', required: false })
  declare fullName?: string

  @flags.string({
    description: 'Heslo (pokud ho nezadáte, zeptám se na něj)',
    flagName: 'password',
  })
  declare password?: string

  async run() {
    const { default: User } = await import('#models/user')

    const email = this.email.trim().toLowerCase()

    const existing = await User.findBy('email', email)
    if (existing) {
      this.logger.error(`Uživatel s e-mailem "${email}" už existuje (ID ${existing.id})`)
      this.exitCode = 1
      return
    }

    const password =
      this.password ??
      (await this.prompt.secure('Zadejte heslo', {
        validate: (value) => (value.length >= 8 ? true : 'Heslo musí mít alespoň 8 znaků'),
      })) ??
      ''

    if (password.length < 8) {
      this.logger.error('Heslo musí mít alespoň 8 znaků')
      this.exitCode = 1
      return
    }

    const user = await User.create({
      email,
      fullName: this.fullName ?? null,
      password,
    })

    this.logger.success(`Uživatel "${user.email}" byl vytvořen (ID ${user.id})`)
  }
}
