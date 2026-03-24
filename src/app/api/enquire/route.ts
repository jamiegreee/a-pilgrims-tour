import { getResend } from '@/lib/resend'

const BUSINESS_EMAIL = process.env.BUSINESS_EMAIL ?? 'green.jcb@gmail.com'

// Resend requires a verified sender domain. During development, use the
// Resend-provided test address; swap to your domain once DNS is configured.
const FROM_EMAIL = 'A Pilgrim\'s Tour <noreply@apilgrimstour.com>'

interface EnquiryBody {
  name: string
  email: string
  phone?: string
  route: string
  dates?: string
  groupSize?: number | string
  pace?: string
  message?: string
}

function validateBody(
  body: unknown
): { data: EnquiryBody; error?: never } | { data?: never; error: string } {
  if (!body || typeof body !== 'object') {
    return { error: 'Request body must be a JSON object' }
  }

  const { name, email, route } = body as Record<string, unknown>

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return { error: 'name is required' }
  }
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return { error: 'A valid email is required' }
  }
  if (!route || typeof route !== 'string' || route.trim().length === 0) {
    return { error: 'route is required' }
  }

  return { data: body as EnquiryBody }
}

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json(
      { success: false, error: 'Invalid JSON body' },
      { status: 400 }
    )
  }

  const result = validateBody(body)
  if ('error' in result) {
    return Response.json(
      { success: false, error: result.error },
      { status: 400 }
    )
  }

  const { name, email, phone, route, dates, groupSize, pace, message } =
    result.data

  try {
    // Send notification to business owner
    const resend = getResend()
    await resend.emails.send({
      from: FROM_EMAIL,
      to: BUSINESS_EMAIL,
      subject: `New Enquiry: ${route} — ${name}`,
      html: `
        <h2>New Pilgrimage Enquiry</h2>
        <table style="border-collapse:collapse;width:100%;max-width:600px">
          <tr><td style="padding:8px;font-weight:bold">Name</td><td style="padding:8px">${escapeHtml(name)}</td></tr>
          <tr><td style="padding:8px;font-weight:bold">Email</td><td style="padding:8px"><a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></td></tr>
          ${phone ? `<tr><td style="padding:8px;font-weight:bold">Phone</td><td style="padding:8px">${escapeHtml(phone)}</td></tr>` : ''}
          <tr><td style="padding:8px;font-weight:bold">Route</td><td style="padding:8px">${escapeHtml(route)}</td></tr>
          ${dates ? `<tr><td style="padding:8px;font-weight:bold">Dates</td><td style="padding:8px">${escapeHtml(dates)}</td></tr>` : ''}
          ${groupSize ? `<tr><td style="padding:8px;font-weight:bold">Group Size</td><td style="padding:8px">${escapeHtml(String(groupSize))}</td></tr>` : ''}
          ${pace ? `<tr><td style="padding:8px;font-weight:bold">Pace</td><td style="padding:8px">${escapeHtml(pace)}</td></tr>` : ''}
        </table>
        ${message ? `<h3>Message</h3><p>${escapeHtml(message)}</p>` : ''}
      `,
    })

    // Send confirmation to enquirer
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: 'Thanks for your enquiry — A Pilgrim\'s Tour',
      html: `
        <h2>Thank you, ${escapeHtml(name)}</h2>
        <p>We've received your enquiry about the <strong>${escapeHtml(route)}</strong> route and will be in touch within 24 hours.</p>
        <p>If you have any urgent questions in the meantime, reply to this email.</p>
        <br/>
        <p>Buen Camino,<br/>A Pilgrim's Tour</p>
      `,
    })

    return Response.json({ success: true })
  } catch (err) {
    console.error('Failed to send enquiry emails:', err)
    return Response.json(
      { success: false, error: 'Failed to send enquiry. Please try again.' },
      { status: 500 }
    )
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
