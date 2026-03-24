import Link from 'next/link';
import { routes } from '@/lib/routes';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "A Pilgrim's Tour — Self-Guided Pilgrimage Planning",
  description:
    'We plan the route, book the beds, and carry your bags. You walk, reflect, and arrive — at your own pace, in your own time.',
};

const routeCards = [
  { slug: 'camino-de-santiago', color: '#D4C9B8' },
  { slug: 'via-francigena', color: '#C8B8A0' },
  { slug: 'kumano-kodo', color: '#A8B8A0' },
  { slug: 'st-olavs-way', color: '#B0BEC5' },
];

export default function LandingPage() {
  return (
    <main>
      {/* Hero */}
      <section className="bg-parchment px-6 py-28 sm:py-36 text-center">
        <div className="mx-auto max-w-3xl">
          <h1
            className="text-4xl sm:text-5xl lg:text-6xl text-slate-deep leading-tight"
            style={{ fontFamily: 'var(--font-eb-garamond)' }}
          >
            The path is ancient.
            <br />
            The journey is yours.
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-stone max-w-2xl mx-auto leading-relaxed">
            We plan the route, book the beds, and carry your bags. You walk,
            reflect, and arrive — at your own pace, in your own time.
          </p>
          <a
            href="#routes"
            className="mt-10 inline-block bg-forest text-white px-8 py-3.5 rounded-md text-base font-medium hover:bg-forest/90 transition-colors"
          >
            Explore Routes
          </a>
        </div>
      </section>

      {/* Philosophy */}
      <section className="bg-white px-6 py-24">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-medium uppercase tracking-widest text-ochre">
            Our Philosophy
          </p>
          <blockquote
            className="mt-8 text-2xl sm:text-3xl text-slate-deep leading-snug"
            style={{ fontFamily: 'var(--font-eb-garamond)' }}
          >
            &ldquo;A pilgrimage is not a holiday. It is a transformation
            disguised as a walk. The blisters, the silence, the unexpected
            kindness of strangers — these are not inconveniences. They are the
            point.&rdquo;
          </blockquote>
          <p className="mt-8 text-stone text-lg leading-relaxed max-w-xl mx-auto">
            We handle every detail of logistics so that you are free to be fully
            present — to the landscape, to the rhythm of your steps, and to
            whatever you came to find.
          </p>
        </div>
      </section>

      {/* Routes */}
      <section id="routes" className="bg-parchment px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <p className="text-sm font-medium uppercase tracking-widest text-ochre">
              Choose Your Path
            </p>
            <h2
              className="mt-3 text-3xl sm:text-4xl text-slate-deep"
              style={{ fontFamily: 'var(--font-eb-garamond)' }}
            >
              Four Ancient Routes
            </h2>
          </div>

          <div className="grid gap-8 sm:grid-cols-2">
            {routeCards.map(({ slug, color }) => {
              const route = routes[slug];
              return (
                <Link
                  key={slug}
                  href={`/routes/${slug}`}
                  className="group block bg-card rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div
                    className="h-48 sm:h-56 flex items-end p-6"
                    style={{ backgroundColor: color }}
                  >
                    <h3
                      className="text-2xl text-slate-deep"
                      style={{ fontFamily: 'var(--font-eb-garamond)' }}
                    >
                      {route.name}
                    </h3>
                  </div>
                  <div className="p-6">
                    <p className="text-sm text-ochre font-medium">
                      {route.country} · {route.distance}
                    </p>
                    <p className="mt-2 text-stone leading-relaxed">
                      {route.shortDescription}
                    </p>
                    <span className="mt-4 inline-block text-forest text-sm font-medium group-hover:underline">
                      View route details &rarr;
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-slate-deep px-6 py-24">
        <div className="mx-auto max-w-5xl text-center">
          <p className="text-sm font-medium uppercase tracking-widest text-ochre">
            How It Works
          </p>
          <h2
            className="mt-3 text-3xl sm:text-4xl text-parchment"
            style={{ fontFamily: 'var(--font-eb-garamond)' }}
          >
            Three simple steps
          </h2>

          <div className="mt-16 grid gap-12 sm:grid-cols-3">
            {[
              {
                num: '01',
                title: 'Choose your route',
                desc: 'Pick from four ancient pilgrimage routes across Europe and Japan. Each one has its own character, its own landscape, and its own story.',
              },
              {
                num: '02',
                title: 'We plan everything',
                desc: 'Accommodation, luggage transfers, route notes, and local support. We take care of every logistical detail so you can focus on the walk.',
              },
              {
                num: '03',
                title: 'You walk',
                desc: 'At your own pace, on your own schedule. No group to keep up with, no guide to follow. Just the path, your thoughts, and the open road.',
              },
            ].map((step) => (
              <div key={step.num} className="relative">
                <span
                  className="block text-7xl font-bold text-parchment/10"
                  style={{ fontFamily: 'var(--font-eb-garamond)' }}
                >
                  {step.num}
                </span>
                <h3
                  className="mt-2 text-xl text-parchment"
                  style={{ fontFamily: 'var(--font-eb-garamond)' }}
                >
                  {step.title}
                </h3>
                <p className="mt-3 text-stone leading-relaxed text-base">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="bg-white px-6 py-24">
        <div className="mx-auto max-w-3xl text-center">
          <blockquote
            className="text-2xl sm:text-3xl text-slate-deep leading-snug"
            style={{ fontFamily: 'var(--font-eb-garamond)' }}
          >
            &ldquo;I arrived in Santiago a different person from the one who left
            Saint-Jean five weeks earlier. Not because the walk changed me, but
            because it showed me who I already was. A Pilgrim&apos;s Tour took
            care of everything — all I had to do was put one foot in front of
            the other.&rdquo;
          </blockquote>
          <p className="mt-6 text-stone">
            <span className="font-medium text-slate-deep">Sarah M.</span>{' '}
            &middot; Camino de Santiago, September 2024
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-forest px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2
            className="text-3xl sm:text-4xl text-white"
            style={{ fontFamily: 'var(--font-eb-garamond)' }}
          >
            Ready to begin?
          </h2>
          <p className="mt-4 text-white/80 text-lg">
            Tell us where you want to walk, and we&apos;ll take it from there.
          </p>
          <Link
            href="/enquire"
            className="mt-8 inline-block bg-white text-forest px-8 py-3.5 rounded-md text-base font-medium hover:bg-parchment transition-colors"
          >
            Start Planning
          </Link>
        </div>
      </section>
    </main>
  );
}
