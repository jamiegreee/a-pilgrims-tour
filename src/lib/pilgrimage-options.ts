export const pilgrimageOptions = [
  {
    id: 'independent',
    name: 'Independent Pilgrimage',
    tagline: 'Your plans. Your pace.',
    description:
      'A route pack for a journey you arrange yourself. Follow the path with practical notes, local stories and space for reflection.',
    inclusions: [
      'Day-by-day itinerary, route notes, maps and GPX files',
      'Sacred places, local stories and suggested reflections',
      'You choose and book your accommodation',
      'You carry your own luggage',
    ],
    support: 'Route pack only. You manage your journey without on-trip assistance.',
  },
  {
    id: 'walk-light',
    name: 'Walk Light',
    tagline: 'Your walk. The arrangements made.',
    description:
      'Walk independently with a daypack. We book your overnight stays and arrange for your bags to move on each day.',
    inclusions: [
      'Day-by-day itinerary, route notes, maps and GPX files',
      'Sacred places, local stories and suggested reflections',
      'Accommodation with breakfast booked for you',
      'Daily baggage transfers between agreed overnight stops',
    ],
    support: 'A contact for accommodation and baggage arrangements. No accompanying guide.',
  },
  {
    id: 'guided',
    name: 'Guided Pilgrimage',
    tagline: 'A shared path. Time to reflect.',
    description:
      'Join a small group with an accompanying pilgrimage guide, combining walking leadership with local history and spiritual reflection.',
    inclusions: [
      'Day-by-day itinerary, route notes, maps and GPX files',
      'Accommodation with breakfast booked for you',
      'Daily baggage transfers between agreed overnight stops',
      'A pilgrimage guide accompanying the walking group',
      'Local stories, reflection, conversation and quiet',
    ],
    support: 'A guide leads the walk. The spiritual focus and shared practices are explained before booking.',
  },
] as const;

export type PilgrimageOption = (typeof pilgrimageOptions)[number];

export function getPilgrimageOption(value: string | null | undefined) {
  // Keep links from the previous two-option site useful.
  const id = value === 'self-guided' ? 'walk-light' : value === 'group' ? 'guided' : value;
  return pilgrimageOptions.find((option) => option.id === id || option.name === value);
}

export function pilgrimageEnquiryHref(optionId: PilgrimageOption['id'], routeName?: string) {
  const params = new URLSearchParams({ type: optionId });
  if (routeName) params.set('route', routeName);
  return `/enquire?${params.toString()}`;
}
