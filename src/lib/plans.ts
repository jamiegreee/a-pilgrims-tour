/**
 * Everyone who signs up has a free account. What they can see beyond that comes from what
 * they have bought (see purchases.ts): a route's flythrough comes with any pilgrimage option
 * on that route, and stays in the flythrough are shown to the options listed on them.
 */
export const plans = {
  free: {
    name: 'Free',
    tagline: 'Fly your route before you walk it.',
    inclusions: [
      'The 3D flythrough of your route, stage by stage',
      'Landmarks and pilgrim stops along the way',
      'Your overnight stops, once they are booked',
    ],
  },
  independent: { name: 'Independent Pilgrimage' },
  'walk-light': { name: 'Walk Light' },
  guided: { name: 'Guided Pilgrimage' },
} as const;

export type PlanId = keyof typeof plans;

export function isPlanId(value: unknown): value is PlanId {
  return typeof value === 'string' && value in plans;
}
