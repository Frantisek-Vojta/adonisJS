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
    'required': 'Pole {{ field }} je povinné',
    'string': 'Pole {{ field }} musí být text',
    'email': 'Zadejte platnou e-mailovou adresu',
    'accepted': 'Pole {{ field }} musí být potvrzeno',

    /**
     * Pravidla na délku používají formuláře CRUD uživatelů.
     *
     * Klíč ve tvaru `pole.pravidlo` má přednost před obecným `pravidlo`,
     * takže si můžu u každého pole napsat zprávu zvlášť. Dělám to kvůli
     * české gramatice: po dvojce je „2 znaky“, ale po osmičce „8 znaků“.
     * Jedna šablona s `{{ min }}` by vždycky jeden z těch případů
     * zkomolila („alespoň 2 znaků“).
     */
    'fullName.minLength': 'Jméno musí mít alespoň 2 znaky',
    'fullName.maxLength': 'Jméno může mít nejvýše 100 znaků',
    'password.minLength': 'Heslo musí mít alespoň 8 znaků',
    'password.maxLength': 'Heslo může mít nejvýše 180 znaků',

    /**
     * Obecný záskok pro pole, která výše vyjmenovaná nejsou. Je naschvál
     * formulovaný bez podstatného jména za číslem, aby byl správný pro
     * jakoukoli hodnotu.
     */
    'minLength': 'Pole {{ field }} je příliš krátké (minimum je {{ min }})',
    'maxLength': 'Pole {{ field }} je příliš dlouhé (maximum je {{ max }})',
  },

  /**
   * 2. parametr: jak se jednotlivá pole jmenují česky. Bez toho by se
   * v chybě objevil název z kódu, tedy „Pole password je povinné“.
   */
  {
    email: 'e-mail',
    password: 'heslo',
    fullName: 'jméno',
  }
)
