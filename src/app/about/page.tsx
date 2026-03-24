import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "About — A Pilgrim's Tour",
  description:
    'We walked the paths first. Learn about our story, values, and why we believe pilgrimage matters.',
};

const values = [
  {
    title: 'Solitude, not isolation',
    description:
      'A self-guided pilgrimage means you set the pace and choose the company. You might walk alone for hours, lost in thought, then share a meal and a conversation with fellow pilgrims at the end of the day. We design itineraries that protect your independence while ensuring you are never truly alone — our local support is always a phone call away, and the pilgrim community on these routes is remarkably welcoming.',
  },
  {
    title: 'Comfort, not luxury',
    description:
      'We book accommodation that is clean, warm, and welcoming — family-run guesthouses, historic inns, traditional ryokan. You will sleep well and eat well without losing the simplicity that makes pilgrimage meaningful. This is not a five-star holiday. It is something better: a genuine experience with a comfortable bed at the end of the day.',
  },
  {
    title: 'Flexibility, always',
    description:
      'No two pilgrims are the same, and no two journeys should be either. We build every itinerary around your pace, your interests, and your fitness level. Want to linger an extra day in Siena? Walk a shorter stage and take the bus for the rest? Add a rest day because the weather is too good to leave a terrace? We make it happen.',
  },
];

const stats = [
  { value: '4', label: 'Routes' },
  { value: '7', label: 'Years' },
  { value: '2,400+', label: 'Pilgrims' },
  { value: '12', label: 'Countries' },
];

export default function AboutPage() {
  return (
    <main>
      {/* Hero */}
      <section className="bg-parchment px-6 py-28 sm:py-36">
        <div className="mx-auto max-w-3xl text-center">
          <h1
            className="text-4xl sm:text-5xl text-slate-deep leading-tight"
            style={{ fontFamily: 'var(--font-eb-garamond)' }}
          >
            We walked the paths first.
          </h1>
          <p className="mt-8 text-lg text-stone leading-relaxed max-w-2xl mx-auto">
            A Pilgrim&apos;s Tour was born on the Camino de Santiago in 2019.
            Our founder walked the Franc&eacute;s route alone, carrying
            everything on his back, booking accommodation night by night. The
            walk was transformative. The logistics were exhausting.
          </p>
          <p className="mt-4 text-lg text-stone leading-relaxed max-w-2xl mx-auto">
            He came home with a simple idea: what if someone took care of all
            the practical details so that pilgrims could focus entirely on the
            experience? Not a guided tour — that would defeat the purpose. But a
            service that planned the route, booked the beds, and carried the
            bags, leaving the pilgrim free to walk, reflect, and arrive at their
            own pace.
          </p>
          <p className="mt-4 text-lg text-stone leading-relaxed max-w-2xl mx-auto">
            Seven years later, we have helped over two thousand pilgrims walk
            four of the world&apos;s great pilgrimage routes. We have walked
            every one of them ourselves — most of them more than once. We know
            the best guesthouses, the quietest trails, the villages where you
            should stop for lunch, and the stretches where you should just keep
            walking because something extraordinary is around the next bend.
          </p>
        </div>
      </section>

      {/* Values */}
      <section className="bg-white px-6 py-24">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-16">
            <p className="text-sm font-medium uppercase tracking-widest text-ochre">
              What We Believe
            </p>
            <h2
              className="mt-3 text-3xl sm:text-4xl text-slate-deep"
              style={{ fontFamily: 'var(--font-eb-garamond)' }}
            >
              Our Values
            </h2>
          </div>

          <div className="space-y-16">
            {values.map((value) => (
              <div key={value.title}>
                <h3
                  className="text-2xl text-slate-deep"
                  style={{ fontFamily: 'var(--font-eb-garamond)' }}
                >
                  {value.title}
                </h3>
                <p className="mt-4 text-stone text-lg leading-relaxed">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-slate-deep px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
            {stats.map((stat) => (
              <div key={stat.label}>
                <span
                  className="block text-4xl sm:text-5xl text-parchment"
                  style={{ fontFamily: 'var(--font-eb-garamond)' }}
                >
                  {stat.value}
                </span>
                <span className="mt-2 block text-sm uppercase tracking-widest text-ochre">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-parchment px-6 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2
            className="text-3xl sm:text-4xl text-slate-deep"
            style={{ fontFamily: 'var(--font-eb-garamond)' }}
          >
            Start a conversation.
          </h2>
          <p className="mt-4 text-stone text-lg leading-relaxed">
            Whether you know exactly which route you want to walk or you are
            just beginning to think about it, we would love to hear from you.
          </p>
          <Link
            href="/enquire"
            className="mt-8 inline-block bg-forest text-white px-8 py-3.5 rounded-md text-base font-medium hover:bg-forest/90 transition-colors"
          >
            Get in Touch
          </Link>
        </div>
      </section>
    </main>
  );
}
