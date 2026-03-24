import { getStripe } from '@/lib/stripe'

/**
 * POST /api/stripe/create-payment-link
 *
 * Creates a Stripe Payment Link for a given customer and amount.
 *
 * NOTE: This endpoint is currently unprotected. Before going live, add
 * authentication (e.g. a shared secret header, or admin session check)
 * to prevent unauthorised use.
 */

interface CreateLinkBody {
  email: string
  name: string
  amount: number // in pence (GBP minor units)
  description: string
  routeName: string
}

export async function POST(request: Request) {
  let body: CreateLinkBody
  try {
    body = await request.json()
  } catch {
    return Response.json(
      { success: false, error: 'Invalid JSON body' },
      { status: 400 }
    )
  }

  const { email, name, amount, description, routeName } = body

  if (!email || !name || !amount || !description || !routeName) {
    return Response.json(
      { success: false, error: 'Missing required fields: email, name, amount, description, routeName' },
      { status: 400 }
    )
  }

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

    const paymentLink = await stripe.paymentLinks.create({
      line_items: [{ price: price.id, quantity: 1 }],
      metadata: {
        customerEmail: email,
        customerName: name,
        routeName,
      },
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
