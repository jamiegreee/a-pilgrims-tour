import type { PilgrimageOption } from '@/lib/pilgrimage-options'

// Prices per person in pounds, set from what UK walking-holiday operators charged for these
// routes in 2026 (self-guided with luggage transfer: about £130–150 a night). Walk Light and
// Guided Pilgrimage are "from" prices, sharing a room; the final price comes in the proposal,
// and a deposit secures it.
//
// The links are Stripe payment links on the business's account. Each carries the route and
// option in its metadata, so paying one unlocks the route's flythrough (see purchases.ts).

export interface RoutePricing {
  nights: number
  independent: { price: number; buyUrl: string }
  'walk-light': { from: number; depositUrl: string }
  guided: { from: number; depositUrl: string }
}

export const DEPOSIT = { 'walk-light': 150, guided: 250 } as const
export const SINGLE_SUPPLEMENT_PER_NIGHT = 45

export const routePricing: Record<string, RoutePricing> = {
  'st-michaels-way': {
    nights: 3,
    independent: { price: 19, buyUrl: 'https://buy.stripe.com/00w5kD5Gtd7MaxF4Go8IU01' },
    'walk-light': { from: 475, depositUrl: 'https://buy.stripe.com/bJe9AT5Gt7Ns6hpegY8IU07' },
    guided: { from: 695, depositUrl: 'https://buy.stripe.com/28E14nc4R6Jo35d0q88IU0d' },
  },
  'the-saints-way': {
    nights: 4,
    independent: { price: 19, buyUrl: 'https://buy.stripe.com/bJedR9fh37Ns35d3Ck8IU02' },
    'walk-light': { from: 595, depositUrl: 'https://buy.stripe.com/dRm9AT9WJ7Ns35ddcU8IU08' },
    guided: { from: 875, depositUrl: 'https://buy.stripe.com/4gMcN57OBgjYbBJegY8IU0e' },
  },
  'st-hildas-way': {
    nights: 5,
    independent: { price: 29, buyUrl: 'https://buy.stripe.com/8x214nd8V7Ns9tB8WE8IU03' },
    'walk-light': { from: 725, depositUrl: 'https://buy.stripe.com/fZubJ13yl0l0fRZegY8IU09' },
    guided: { from: 1050, depositUrl: 'https://buy.stripe.com/6oU8wP3yl6Jo2192yg8IU0f' },
  },
  'st-cuthberts-way': {
    nights: 6,
    independent: { price: 29, buyUrl: 'https://buy.stripe.com/eVqdR94CpebQfRZa0I8IU00' },
    'walk-light': { from: 865, depositUrl: 'https://buy.stripe.com/5kQdR97OB4BgdJRa0I8IU06' },
    guided: { from: 1250, depositUrl: 'https://buy.stripe.com/9B628r2uh4Bg0X5dcU8IU0c' },
  },
  'the-pilgrims-way': {
    nights: 10,
    independent: { price: 39, buyUrl: 'https://buy.stripe.com/8x25kDfh3aZEeNVegY8IU04' },
    'walk-light': { from: 1450, depositUrl: 'https://buy.stripe.com/6oU4gzfh31p40X58WE8IU0a' },
    guided: { from: 2050, depositUrl: 'https://buy.stripe.com/4gMeVd2uh3xc0X55Ks8IU0g' },
  },
  'north-wales-pilgrims-way': {
    nights: 12,
    independent: { price: 39, buyUrl: 'https://buy.stripe.com/dRm14n4Cp8Rw5dlegY8IU05' },
    'walk-light': { from: 1595, depositUrl: 'https://buy.stripe.com/bJefZhb0N8RweNVgp68IU0b' },
    guided: { from: 2350, depositUrl: 'https://buy.stripe.com/5kQ8wPgl73xccFNegY8IU0h' },
  },
}

export function formatPounds(n: number) {
  return `£${n.toLocaleString('en-GB')}`
}

/** The price shown on an option's card for a route, e.g. "From £865" and "per person, 6 nights". */
export function priceLine(slug: string, option: PilgrimageOption['id']) {
  const p = routePricing[slug]
  if (!p) return null
  if (option === 'independent') return { main: formatPounds(p.independent.price), sub: 'route pack' }
  return { main: `From ${formatPounds(p[option].from)}`, sub: `per person, ${p.nights} nights` }
}
