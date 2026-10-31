import { timingSafeEqual } from 'node:crypto'
import { getStripe } from '@/lib/stripe'
import { getPilgrimageOption } from '@/lib/pilgrimage-options'
import { routes } from '@/lib/routes'

/**
 * POST /api/stripe/create-payment-link
 *
 * Creates a Stripe Payment Link for a given customer and amount. Paying it unlocks the
 * route's 3D flythrough for that customer (see src/lib/purchases.ts), so only the business
 * may call it: send the ADMIN_API_SECRET in an `x-admin-secret` header.
 */

interface CreateLinkBody {
  email: string
  name: string
  amount: number // in pence (GBP minor units)
  description: string
  routeName?: string
  /** The route's slug, e.g. "the-pilgrims-way". Either this or routeName must name a route. */
  routeSlug?: string
  /** independent, walk-light or guided: decides which hotel stays the flythrough shows. */
  optionId?: string
}

function authorised(request: Request) {
  const secret = process.env.ADMIN_API_SECRET
  const given = request.headers.get('x-admin-secret')
  if (!secret || !given) return false
  const a = Buffer.from(given)
  const b = Buffer.from(secret)
  return a.length === b.length && timingSafeEqual(a, b)
}

export async function POST(request: Request) {
  if (!authorised(request)) {
    return Response.json({ success: false, error: 'Not authorised' }, { status: 401 })
  }

  let body: CreateLinkBody
  try {
    body = await request.json()
  } catch {
    return Response.json(
      { success: false, error: 'Invalid JSON body' },
      { status: 400 }
    )
  }

  const { email, name, amount, description } = body
  const routeSlug = body.routeSlug && routes[body.routeSlug]
    ? body.routeSlug
    : Object.keys(routes).find((slug) => routes[slug].name.toLowerCase() === body.routeName?.trim().toLowerCase())

  if (!email || !name || !amount || !description) {
    return Response.json(
      { success: false, error: 'Missing required fields: email, name, amount, description' },
      { status: 400 }
    )
  }
  if (!routeSlug) {
    return Response.json(
      { success: false, error: 'routeSlug (or routeName) must name one of our routes' },
      { status: 400 }
    )
  }
  const routeName = routes[routeSlug].name
  const optionId = getPilgrimageOption(body.optionId)?.id

  if (typeof amount !== 'number' || amount <= 0) {
    return Response.json(
      { success: false, error: 'amount must be a positive number (in pence)' },
      { status: 400 }
    )
  }

  try {
    const stripe = getStripe()

    const product = await stripe.products.create({
      name: routeName,
      description,
    })

    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: amount,
      currency: 'gbp',
    })

    const metadata: Record<string, string> = {
      customerEmail: email.trim().toLowerCase(),
      customerName: name,
      routeName,
      routeSlug,
      ...(optionId ? { optionId } : {}),
    }
    const paymentLink = await stripe.paymentLinks.create({
      line_items: [{ price: price.id, quantity: 1 }],
      metadata,
      // Also on the payment, so a purchase is found under the email the link was made out to
      // even if the customer pays with another one.
      payment_intent_data: { metadata },
    })

    return Response.json({
      success: true,
      url: paymentLink.url,
      id: paymentLink.id,
    })
  } catch (err) {
    console.error('Stripe create-payment-link error:', err)
    const message =
      err instanceof Error ? err.message : 'Unexpected Stripe error'
    return Response.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}
