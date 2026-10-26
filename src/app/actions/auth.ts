'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { getResend } from '@/lib/resend'
import { FROM_EMAIL, escapeHtml, notifyOwner } from '@/lib/email'
import { plans } from '@/lib/plans'
import { routes } from '@/lib/routes'
import { LINK_MINUTES, createSession, deleteSession, safeNext, sign, verify, type LoginLink } from '@/lib/session'

export type LinkState =
  | { status: 'idle' }
  | { status: 'error'; message: string; email?: string; name?: string }
  | { status: 'sent'; email: string; devLink?: string }

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Emails a one-time sign-in link. Used by both the sign-up and the login forms. */
export async function requestLink(_prev: LinkState, formData: FormData): Promise<LinkState> {
  const intent = formData.get('intent') === 'signup' ? 'signup' : 'login'
  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  const rawName = String(formData.get('name') ?? '').trim()
  const next = safeNext(formData.get('next'))
  const routeSlug = String(formData.get('route') ?? '')
  const route = routes[routeSlug] ? routeSlug : undefined

  if (!EMAIL_RE.test(email) || email.length > 254) {
    return { status: 'error', message: 'Please enter a valid email address.', email, name: rawName }
  }
  if (intent === 'signup' && (rawName.length < 1 || rawName.length > 100)) {
    return { status: 'error', message: 'Please tell us your name.', email, name: rawName }
  }
  const name = rawName || email.split('@')[0]

  const link: LoginLink = { email, name, intent, next, route }
  const h = await headers()
  const origin = `${h.get('x-forwarded-proto') ?? 'https'}://${h.get('host')}`
  const url = `${origin}/auth/verify?token=${encodeURIComponent(sign('link', link, LINK_MINUTES * 60))}`

  if (!process.env.RESEND_API_KEY) {
    // Without an email provider, previews and local development show the link on screen so
    // the flow can still be tried. Production must be able to send email.
    if (process.env.VERCEL_ENV === 'production') {
      console.error('RESEND_API_KEY is not set; cannot send sign-in links')
      return { status: 'error', message: 'We could not send your sign-in email. Please try again later.', email, name: rawName }
    }
    return { status: 'sent', email, devLink: url }
  }

  const routeName = route ? routes[route].name : null
  try {
    const { error } = await getResend().emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: intent === 'signup' ? 'Confirm your email — A Pilgrim\'s Tour' : 'Your sign-in link — A Pilgrim\'s Tour',
      html: `
        <h2>${intent === 'signup' ? `Welcome, ${escapeHtml(name)}` : 'Sign in to A Pilgrim\'s Tour'}</h2>
        <p>${intent === 'signup'
          ? `Confirm your email to start your free ${escapeHtml(plans.free.name.toLowerCase())} plan${routeName ? ` and watch the 3D flythrough of <strong>${escapeHtml(routeName)}</strong>` : ''}.`
          : 'Use the button below to sign in.'}</p>
        <p><a href="${escapeHtml(url)}" style="display:inline-block;background:#5C6B54;color:#fff;padding:12px 22px;border-radius:6px;text-decoration:none">${intent === 'signup' ? 'Confirm and continue' : 'Sign in'}</a></p>
        <p style="color:#777;font-size:13px">This link works for ${LINK_MINUTES} minutes. If you didn't ask for it, you can ignore this email.</p>
      `,
    })
    if (error) throw new Error(error.message)
  } catch (err) {
    console.error('Failed to send sign-in link:', err)
    return { status: 'error', message: 'We could not send your sign-in email. Please try again.', email, name: rawName }
  }
  return { status: 'sent', email }
}

/** Completes sign-in from an emailed link. A button press rather than the GET itself, so email
 *  scanners that open links don't sign people in or send duplicate notifications. */
export async function completeLogin(formData: FormData) {
  const link = verify<LoginLink>('link', String(formData.get('token') ?? ''))
  if (!link) redirect('/login?expired=1')

  await createSession({ email: link.email, name: link.name, plan: 'free' })
  if (link.intent === 'signup') {
    await notifyOwner(`New free sign-up: ${link.name}`, [
      ['Name', link.name],
      ['Email', link.email],
      ['Plan', plans.free.name],
      ['Route', link.route ? routes[link.route]?.name : null],
      ['Signed up', new Date().toUTCString()],
    ])
  }
  redirect(safeNext(link.next))
}

export async function signOut() {
  await deleteSession()
  redirect('/')
}
