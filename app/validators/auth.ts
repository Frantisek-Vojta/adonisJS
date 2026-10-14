import vine from '@vinejs/vine'

/**
 * Validates the login form payload
 */
export const loginValidator = vine.compile(
  vine.object({
    email: vine.string().trim().email().normalizeEmail(),
    password: vine.string(),
    rememberMe: vine.accepted().optional(),
  })
)
