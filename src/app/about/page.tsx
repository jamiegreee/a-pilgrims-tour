import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "About — A Pilgrim's Tour",
  description:
    'Discover our approach to pilgrimage in Britain: thoughtful walking journeys, clear arrangements and time for spiritual reflection.',
};

const values = [
  {
    title: 'Time to notice',
    description:
      'Pilgrimage gives a walk a sense of purpose. A church doorway, a stretch of quiet woodland or a conversation along the way can become a moment to pause. Our route material brings together practical information, local stories and suggested reflections to help you engage with the places you pass through.',
  },
  {
    title: 'Clear arrangements',
    description:
      'You should know what you are choosing. Independent Pilgrimage gives you the route pack to make your own arrangements. With Walk Light and Guided Pilgrimage, we book accommodation with breakfast and arrange daily baggage transfers. We set out your itinerary and inclusions before you book.',
  },
  {
    title: 'A journey that feels right for you',
    description:
      'Some people value walking alone or with a friend; others welcome the company of a small group. Our guided journeys bring together walking leadership, local history and spiritual reflection. The spiritual focus of each departure is explained in advance, so you can choose the approach that fits your reasons for walking.',
  },
];

export default function AboutPage() {
  return (
    <div>
      <section className="bg-parchment px-6 py-24 sm:py-32">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-medium uppercase tracking-widest text-ochre">About A Pilgrim&apos;s Tour</p>
          <h1 className="mt-4 font-display text-4xl sm:text-5xl text-slate-deep leading-tight">A little space to walk with purpose.</h1>
          <p className="mt-8 text-lg text-stone leading-relaxed max-w-2xl mx-auto">
            We are building A Pilgrim&apos;s Tour around Britain&apos;s pilgrimage
            paths: journeys through landscapes, local history and sacred places,
            with time to reflect along the way.
          </p>
          <p className="mt-4 text-lg text-stone leading-relaxed max-w-2xl mx-auto">
            Our approach starts with a choice. Make your own arrangements with an
            Independent Pilgrimage route pack, let us arrange accommodation and
            baggage transfers with Walk Light, or share the journey with a small
            group on a Guided Pilgrimage.
          </p>
          <p className="mt-4 text-lg text-stone leading-relaxed max-w-2xl mx-auto">
            Your reasons for setting out are your own. We want the practical
            arrangements and the character of the journey to be clear, so you can
            choose the experience that suits you.
          </p>
        </div>
      </section>

      <section className="bg-white px-6 py-20 sm:py-24">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-14">
            <p className="text-sm font-medium uppercase tracking-widest text-ochre">Our Approach</p>
            <h2 className="mt-3 font-display text-3xl sm:text-4xl text-slate-deep">What matters along the way</h2>
          </div>
          <div className="space-y-12">
            {values.map((value) => (
              <div key={value.title}>
                <h3 className="font-display text-2xl text-slate-deep">{value.title}</h3>
                <p className="mt-4 text-stone text-lg leading-relaxed">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-deep px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium uppercase tracking-widest text-parchment/70">Beginning In Britain</p>
          <h2 className="mt-4 font-display text-3xl sm:text-4xl text-parchment">Meaningful journeys, closer to home.</h2>
          <p className="mt-6 text-lg leading-relaxed text-parchment/80">
            We are starting with routes across England, Scotland and Wales.
            Explore the paths, consider what you would like from your walk and
            talk to us about the arrangements.
          </p>
          <Link href="/routes" className="mt-8 inline-block border border-parchment/60 text-parchment px-7 py-3 rounded-md text-base font-medium hover:bg-white/10 transition-colors">Explore British Routes</Link>
        </div>
      </section>

      <section className="bg-parchment px-6 py-20 sm:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl sm:text-4xl text-slate-deep">Start a conversation.</h2>
          <p className="mt-4 text-stone text-lg leading-relaxed">
            Whether you have a route in mind or are just beginning to explore,
            tell us what you hope to find in your journey.
          </p>
          <Link href="/enquire" className="mt-8 inline-block bg-forest text-white px-8 py-3.5 rounded-md text-base font-medium hover:bg-forest/90 transition-colors">Get in Touch</Link>
        </div>
      </section>
    </div>
  );
}
