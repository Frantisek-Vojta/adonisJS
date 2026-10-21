import { BaseCommand, args, flags } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'

/**
 * VLASTNÍ ACE PŘÍKAZ: node ace user:create <email> [jméno] [--password=...]
 *
 * Proč existuje: aplikace zatím nemá registrační formulář (zadání bylo jen
 * přihlašování), takže prvního uživatele je potřeba vytvořit jinak. Mohl
 * bych psát INSERT do SQLite ručně, ale to by nešlo – heslo musí projít
 * hashováním přes model, jinak by se s ním nedalo přihlásit.
 *
 * Ace je CLI nástroj AdonisJS (`node ace`). Stačilo vytvořit tento soubor
 * ve složce commands/ – framework si ho najde sám, protože adonisrc.ts
 * má v `commands` zaregistrovanou celou tuto složku.
 */
export default class CreateUser extends BaseCommand {
  /** Jméno, kterým se příkaz volá v terminálu */
  static commandName = 'user:create'

  /** Popis, který se vypíše v `node ace list` a v nápovědě */
  static description = 'Vytvoří nového uživatele, který se bude moci přihlásit'

  /**
   * `startApp: true` je tu nezbytné: bez něj by ace spustil jen samotný
   * příkaz bez aplikace, takže by neexistovalo připojení k databázi
   * a import modelu User by selhal.
   */
  static options: CommandOptions = {
    startApp: true,
  }

  /**
   * ARGUMENT = hodnota psaná za jméno příkazu, pozičně.
   * Tenhle je povinný (výchozí chování).
   */
  @args.string({ description: 'E-mail uživatele' })
  declare email: string

  /** Nepovinný druhý argument – v databázi je full_name nullable */
  @args.string({ description: 'Jméno uživatele', required: false })
  declare fullName?: string

  /**
   * FLAG = pojmenovaný přepínač (--password=tajne). Na rozdíl od argumentu
   * nezávisí na pořadí.
   *
   * Zadávat heslo takhle je pohodlné pro skript, ale zůstane v historii
   * terminálu – proto je to nepovinné a bez něj se příkaz na heslo zeptá
   * skrytým promptem (viz níže).
   */
  @flags.string({
    description: 'Heslo (pokud ho nezadáte, zeptám se na něj)',
    flagName: 'password',
  })
  declare password?: string

  /**
   * run() je tělo příkazu – spustí se po naparsování argumentů.
   */
  async run() {
    /**
     * Model importuju dynamicky až tady, ne nahoře u ostatních importů.
     * Důvod: na začátku souboru ještě nemusí být aplikace nastartovaná
     * a připojená k databázi; v run() už to platí.
     */
    const { default: User } = await import('#models/user')

    /**
     * Normalizace e-mailu: odstraním mezery a převedu na malá písmena,
     * aby "Admin@Example.com " a "admin@example.com" byl jeden a týž
     * uživatel. Stejnou normalizaci dělá validátor při přihlašování.
     */
    const email = this.email.trim().toLowerCase()

    /**
     * Kontrola duplicity. Sloupec email má v databázi unique index, takže
     * by to databáze zachytila sama – ale výsledkem by byla ošklivá
     * výjimka. Takhle uživatel dostane srozumitelnou zprávu.
     */
    const existing = await User.findBy('email', email)
    if (existing) {
      this.logger.error(`Uživatel s e-mailem "${email}" už existuje (ID ${existing.id})`)
      // Nenulový exit code = příkaz skončil chybou (důležité pro skripty)
      this.exitCode = 1
      return
    }

    /**
     * `??` (nullish coalescing): když flag --password nepřišel, zeptám se
     * interaktivně. `prompt.secure()` při psaní nic nevypisuje, takže
     * heslo nezůstane viditelné na obrazovce.
     */
    const password =
      this.password ??
      (await this.prompt.secure('Zadejte heslo', {
        validate: (value) => (value.length >= 8 ? true : 'Heslo musí mít alespoň 8 znaků'),
      })) ??
      ''

    /**
     * Druhá kontrola délky – validate() výše se totiž uplatní jen při
     * interaktivním dotazu, ne když heslo přijde přes --password.
     */
    if (password.length < 8) {
      this.logger.error('Heslo musí mít alespoň 8 znaků')
      this.exitCode = 1
      return
    }

    /**
     * Vytvoření záznamu. Heslo předávám v čitelné podobě ZÁMĚRNĚ –
     * mixin withAuthFinder v modelu ho před uložením sám zahashuje
     * scryptem. V databázi tedy skončí hash, ne tohle heslo.
     */
    const user = await User.create({
      email,
      fullName: this.fullName ?? null,
      password,
    })

    this.logger.success(`Uživatel "${user.email}" byl vytvořen (ID ${user.id})`)
  }
}
