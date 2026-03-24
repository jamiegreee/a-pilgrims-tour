import type Stripe from 'stripe'
import { getStripe } from '@/lib/stripe'
import { getResend } from '@/lib/resend'

const FROM_EMAIL = 'A Pilgrim\'s Tour <noreply@apilgrimstour.com>'

export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return new Response('Missing stripe-signature header', { status: 400 })
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not set')
    return new Response('Server configuration error', { status: 500 })
  }

  let event: Stripe.Event
  try {
    const stripe = getStripe()
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('Webhook signature verification failed:', message)
    return new Response(`Webhook Error: ${message}`, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session

    console.log('Payment completed:', {
      id: session.id,
      email: session.customer_details?.email,
      name: session.customer_details?.name,
      amount: session.amount_total,
      currency: session.currency,
      metadata: session.metadata,
    })

    const email = session.customer_details?.email
    const name = session.customer_details?.name ?? 'Pilgrim'
    const routeName = session.metadata?.routeName ?? 'your pilgrimage'

    if (email) {
      try {
        const resend = getResend()
        await resend.emails.send({
          from: FROM_EMAIL,
          to: email,
          subject: 'Payment Confirmed — A Pilgrim\'s Tour',
          html: `
            <h2>Payment Received</h2>
            <p>Thank you, ${escapeHtml(name)}. Your payment for <strong>${escapeHtml(routeName)}</strong> has been confirmed.</p>
            <p>We'll follow up shortly with your full itinerary and preparation guide.</p>
            <br/>
            <p>Buen Camino,<br/>A Pilgrim's Tour</p>
          `,
        })
      } catch (err) {
        console.error('Failed to send payment confirmation email:', err)
      }
    }
  }

  return new Response('OK', { status: 200 })
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
