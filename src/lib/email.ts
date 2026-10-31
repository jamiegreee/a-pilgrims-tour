import { getResend } from '@/lib/resend'

export const FROM_EMAIL = 'A Pilgrim\'s Tour <noreply@apilgrimstour.com>'
export const BUSINESS_EMAIL = process.env.BUSINESS_EMAIL ?? 'green.jcb@gmail.com'

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** Emails the business owner. Never throws: a failed notification must not fail the sign-up or payment. */
export async function notifyOwner(subject: string, rows: [string, string | null | undefined][]) {
  const table = rows
    .filter((row): row is [string, string] => !!row[1])
    .map(([k, v]) => `<tr><td style="padding:8px;font-weight:bold">${escapeHtml(k)}</td><td style="padding:8px">${escapeHtml(v)}</td></tr>`)
    .join('')
  if (!process.env.RESEND_API_KEY) {
    console.warn(`RESEND_API_KEY is not set; owner notification not sent: ${subject}`, Object.fromEntries(rows))
    return
  }
  try {
    const { error } = await getResend().emails.send({
      from: FROM_EMAIL,
      to: BUSINESS_EMAIL,
      subject,
      html: `<h2>${escapeHtml(subject)}</h2><table style="border-collapse:collapse;width:100%;max-width:600px">${table}</table>`,
    })
    if (error) throw new Error(error.message)
  } catch (err) {
    console.error('Failed to send owner notification:', err)
  }
}
