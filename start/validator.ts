/*
|--------------------------------------------------------------------------
| Validator messages
|--------------------------------------------------------------------------
|
| Czech error messages used by VineJS when a validation rule fails.
|
*/

import vine, { SimpleMessagesProvider } from '@vinejs/vine'

vine.messagesProvider = new SimpleMessagesProvider(
  {
    required: 'Pole {{ field }} je povinné',
    string: 'Pole {{ field }} musí být text',
    email: 'Zadejte platnou e-mailovou adresu',
    accepted: 'Pole {{ field }} musí být potvrzeno',
  },
  {
    email: 'e-mail',
    password: 'heslo',
  }
)
