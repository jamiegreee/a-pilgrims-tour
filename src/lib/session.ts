import { createHmac, timingSafeEqual } from 'node:crypto'
import { cookies } from 'next/headers'
import { isPlanId, type PlanId } from '@/lib/plans'

// Stateless sessions: a payload signed with HMAC-SHA256 under AUTH_SECRET, so no database is
// needed to stay signed in. The same signing makes the one-time links in sign-up emails.

export const SESSION_COOKIE = 'apt_session'
const SESSION_DAYS = 30
export const LINK_MINUTES = 30

export interface Session {
  email: string
  name: string
  plan: PlanId
}

export interface LoginLink {
  email: string
  name: string
  /** Sign-ups notify the owner when the link is first used; logins don't. */
  intent: 'signup' | 'login'
  next: string
  route?: string
}

function secret() {
  const value = process.env.AUTH_SECRET
  if (!value || value.length < 32) throw new Error('AUTH_SECRET must be set to at least 32 characters')
  return value
}

function hmac(data: string) {
  return createHmac('sha256', secret()).update(data).digest('base64url')
}

export function sign(kind: string, payload: object, ttlSeconds: number) {
  const body = Buffer.from(JSON.stringify({ ...payload, kind, exp: Math.floor(Date.now() / 1000) + ttlSeconds })).toString('base64url')
  return `${body}.${hmac(body)}`
}

export function verify<T>(kind: string, token: string | undefined): T | null {
  if (!token) return null
  const [body, sig] = token.split('.')
  if (!body || !sig) return null
  const expected = hmac(body)
  if (sig.length !== expected.length || !timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null
  try {
    const data = JSON.parse(Buffer.from(body, 'base64url').toString())
    if (data.kind !== kind || typeof data.exp !== 'number' || data.exp < Date.now() / 1000) return null
    return data as T
  } catch {
    return null
  }
}

export async function getSession(): Promise<Session | null> {
  const data = verify<Session>('session', (await cookies()).get(SESSION_COOKIE)?.value)
  return data && isPlanId(data.plan) ? { email: data.email, name: data.name, plan: data.plan } : null
}

export async function createSession(session: Session) {
  const maxAge = SESSION_DAYS * 24 * 3600
  ;(await cookies()).set(SESSION_COOKIE, sign('session', session, maxAge), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge,
  })
}

export async function deleteSession() {
  ;(await cookies()).delete(SESSION_COOKIE)
}

/** Only follow redirects to paths on this site. */
export function safeNext(value: unknown, fallback = '/account') {
  return typeof value === 'string' && value.startsWith('/') && !value.startsWith('//') && !value.startsWith('/\\') ? value : fallback
}
