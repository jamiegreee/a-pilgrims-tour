import { cache } from 'react'
import type Stripe from 'stripe'
import { getStripe } from '@/lib/stripe'
import { BUSINESS_EMAIL } from '@/lib/email'
import { getPilgrimageOption, pilgrimageOptions, type PilgrimageOption } from '@/lib/pilgrimage-options'
import { routes } from '@/lib/routes'

// Stripe is the record of what each pilgrim has bought, so there is no database to keep in
// step. A paid checkout unlocks a route's flythrough for the email it was paid with (or the
// email a payment link was made out to) when it names the route, either in its metadata
// (links from /api/stripe/create-payment-link) or in the name of a product bought, e.g. a
// product called "St Cuthbert's Way \u2013 Walk Light" sold through a Dashboard payment link.

export interface Purchase {
  routeSlug: string
  option?: PilgrimageOption['id']
}

/** The route a payment's metadata names, by slug or by name. */
export function routeSlugFor(metadata: Stripe.Metadata | null | undefined) {
  if (!metadata) return undefined
  if (metadata.routeSlug && routes[metadata.routeSlug]) return metadata.routeSlug
  const name = metadata.routeName?.trim().toLowerCase()
  return Object.keys(routes).find((slug) => routes[slug].name.toLowerCase() === name)
}

/** A purchase named in a product name: the route, and the pilgrimage option if it says. */
function purchaseFromName(name: string): Purchase | null {
  const text = name.toLowerCase().replace(/[\u2018\u2019]/g, "'")
  const routeSlug = Object.keys(routes).find((slug) => text.includes(routes[slug].name.toLowerCase().replace(/[\u2018\u2019]/g, "'")))
  if (!routeSlug) return null
  const option = pilgrimageOptions.find((o) => text.includes(o.name.toLowerCase()))
  return { routeSlug, option: option?.id }
}

function purchaseFrom(metadata: Stripe.Metadata | null | undefined): Purchase | null {
  const routeSlug = routeSlugFor(metadata)
  return routeSlug ? { routeSlug, option: getPilgrimageOption(metadata?.optionId)?.id } : null
}

/** The routes an email has paid for. Cached for the length of a request. */
export const getPurchases = cache(async (email: string): Promise<Purchase[]> => {
  if (!process.env.STRIPE_SECRET_KEY) {
    console.warn('STRIPE_SECRET_KEY is not set; no purchases can be found')
    return []
  }
  const stripe = getStripe()
  const found: Purchase[] = []
  try {
    for await (const s of stripe.checkout.sessions.list({ customer_details: { email }, status: 'complete', limit: 100 })) {
      if (s.payment_status !== 'paid') continue
      const p = purchaseFrom(s.metadata)
      if (p) {
        found.push(p)
        continue
      }
      for (const item of (await stripe.checkout.sessions.listLineItems(s.id, { limit: 20 })).data) {
        const named = purchaseFromName(item.description ?? '')
        if (named) found.push(named)
      }
    }
    const quoted = email.replace(/\\/g, '\\\\').replace(/'/g, "\\'")
    const intents = await stripe.paymentIntents.search({
      query: `metadata['customerEmail']:'${quoted}' AND status:'succeeded'`,
      limit: 100,
    })
    for (const pi of intents.data) {
      const p = purchaseFrom(pi.metadata)
      if (p) found.push(p)
    }
  } catch (err) {
    console.error('Failed to look up purchases in Stripe:', err)
  }
  return found
})

export function isOwner(email: string) {
  return email.toLowerCase() === BUSINESS_EMAIL.toLowerCase()
}

/** Whether an email may watch a route's flythrough, and with which pilgrimage option. The
 *  business owner can watch them all, to check them before anyone buys. */
export async function flythroughAccess(email: string, slug: string) {
  if (isOwner(email)) return { allowed: true, owner: true, option: undefined }
  const purchase = (await getPurchases(email)).find((p) => p.routeSlug === slug)
  return { allowed: !!purchase, owner: false, option: purchase?.option }
}
