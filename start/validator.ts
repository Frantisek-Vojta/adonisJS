/*
|--------------------------------------------------------------------------
| České chybové zprávy pro validaci
|--------------------------------------------------------------------------
|
| VineJS hlásí chyby anglicky ("The email field must be a valid email").
| SimpleMessagesProvider mi dovolí přepsat je centrálně na jednom místě –
| nemusím tedy texty psát ke každému pravidlu v app/validators/auth.ts.
|
| Tento soubor se načítá při startu aplikace, protože je uvedený
| v adonisrc.ts v sekci `preloads`.
|
*/

import vine, { SimpleMessagesProvider } from '@vinejs/vine'

vine.messagesProvider = new SimpleMessagesProvider(
  /**
   * 1. parametr: texty podle názvu PRAVIDLA, které selhalo.
   * `{{ field }}` je zástupný text, který se nahradí jménem pole
   * z druhého parametru.
   */
  {
    required: 'Pole {{ field }} je povinné',
    string: 'Pole {{ field }} musí být text',
    email: 'Zadejte platnou e-mailovou adresu',
    accepted: 'Pole {{ field }} musí být potvrzeno',
  },

  /**
   * 2. parametr: jak se jednotlivá pole jmenují česky. Bez toho by se
   * v chybě objevil název z kódu, tedy „Pole password je povinné“.
   */
  {
    email: 'e-mail',
    password: 'heslo',
  }
)
