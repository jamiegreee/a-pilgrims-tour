import { getResend } from '@/lib/resend'
import { getPilgrimageOption } from '@/lib/pilgrimage-options'

const BUSINESS_EMAIL = process.env.BUSINESS_EMAIL ?? 'green.jcb@gmail.com'

// Resend requires a verified sender domain. During development, use the
// Resend-provided test address; swap to your domain once DNS is configured.
const FROM_EMAIL = 'A Pilgrim\'s Tour <noreply@apilgrimstour.com>'

interface EnquiryBody {
  name: string
  email: string
  phone?: string
  route: string
  tourType?: string
  dates?: string
  groupSize?: number | string
  pace?: string
  message?: string
}

function validateBody(
  body: unknown
): { data: EnquiryBody; error?: never } | { data?: never; error: string } {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { error: 'Request body must be a JSON object' }
  }

  const fields = body as Record<string, unknown>
  const { name, email, route, tourType } = fields

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return { error: 'name is required' }
  }
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return { error: 'A valid email is required' }
  }
  if (!route || typeof route !== 'string' || route.trim().length === 0) {
    return { error: 'route is required' }
  }

  if (tourType !== undefined && (
    typeof tourType !== 'string' ||
    (tourType !== '' && !getPilgrimageOption(tourType))
  )) {
    return { error: 'Choose a valid pilgrimage option' }
  }

  for (const field of ['phone', 'dates', 'pace', 'message']) {
    if (fields[field] !== undefined && typeof fields[field] !== 'string') {
      return { error: `${field} must be text` }
    }
  }
  if (fields.groupSize !== undefined &&
    typeof fields.groupSize !== 'string' &&
    (typeof fields.groupSize !== 'number' || !Number.isFinite(fields.groupSize))) {
    return { error: 'groupSize must be text or a number' }
  }

  return { data: { ...fields, name: name.trim(), email: email.trim(), route: route.trim(),
    tourType: typeof tourType === 'string' ? getPilgrimageOption(tourType)?.id ?? '' : '',
  } as EnquiryBody }
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

  const { name, email, phone, route, tourType, dates, groupSize, pace, message } =
    result.data
  const option = getPilgrimageOption(tourType)
  const optionName = option?.name ?? 'No preference'

  try {
    // Send notification to business owner
    const resend = getResend()
    const notification = await resend.emails.send({
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
          <tr><td style="padding:8px;font-weight:bold">Pilgrimage Option</td><td style="padding:8px">${escapeHtml(optionName)}</td></tr>
          ${dates ? `<tr><td style="padding:8px;font-weight:bold">Dates</td><td style="padding:8px">${escapeHtml(dates)}</td></tr>` : ''}
          ${groupSize ? `<tr><td style="padding:8px;font-weight:bold">Group Size</td><td style="padding:8px">${escapeHtml(String(groupSize))}</td></tr>` : ''}
          ${pace ? `<tr><td style="padding:8px;font-weight:bold">Pace</td><td style="padding:8px">${escapeHtml(pace)}</td></tr>` : ''}
        </table>
        ${message ? `<h3>Message</h3><p>${escapeHtml(message)}</p>` : ''}
      `,
    })
    if (notification.error) throw new Error('Enquiry notification was not accepted')

    // The enquiry is accepted once the owner notification succeeds. A failed
    // acknowledgement must not invite a retry that duplicates the enquiry.
    try {
      const confirmation = await resend.emails.send({
        from: FROM_EMAIL,
        to: email,
        subject: 'Thanks for your enquiry — A Pilgrim\'s Tour',
        html: `
          <h2>Thank you, ${escapeHtml(name)}</h2>
          <p>We've received your enquiry about <strong>${escapeHtml(route)}</strong> and will be in touch to discuss your journey.</p>
          <p><strong>Pilgrimage option:</strong> ${escapeHtml(optionName)}</p>
          ${option ? `<p>${escapeHtml(option.description)}</p><p>${escapeHtml(option.support)}</p>` : ''}
          <br/>
          <p>With best wishes,<br/>A Pilgrim's Tour</p>
        `,
      })
      if (confirmation.error) throw new Error('Enquiry confirmation was not accepted')
    } catch (err) {
      console.error('Failed to send enquiry confirmation:', err)
    }

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
