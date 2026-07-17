import { randomBytes } from 'node:crypto'

export const INVITE_VALID_DAYS = 3

export function generateInviteToken() {
  return randomBytes(32).toString('hex')
}

export function generateInviteExpiry() {
  return new Date(Date.now() + INVITE_VALID_DAYS * 24 * 60 * 60 * 1000)
}
