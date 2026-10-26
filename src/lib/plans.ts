/**
 * What each plan unlocks. Everyone who signs up starts on `free`; paid plans are the
 * pilgrimage options in pilgrimage-options.ts and are granted after payment.
 */
export const plans = {
  free: {
    name: 'Free',
    tagline: 'Walk it from the air first.',
    inclusions: [
      'The 3D flythrough of the route, stage by stage',
      'Landmarks and pilgrim stops along the way',
      'An overview of each stage before you commit',
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
