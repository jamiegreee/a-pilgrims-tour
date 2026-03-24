import Link from 'next/link';
import { notFound } from 'next/navigation';
import { routes, routeSlugs } from '@/lib/routes';
import type { Metadata } from 'next';

export async function generateStaticParams() {
  return routeSlugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const route = routes[slug];
  if (!route) return {};
  return {
    title: `${route.name} — A Pilgrim's Tour`,
    description: route.shortDescription,
  };
}

export default async function RoutePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const route = routes[slug];

  if (!route) {
    notFound();
  }

  return (
    <main>
      {/* Hero */}
      <section
        className="relative px-6 py-28 sm:py-36 overflow-hidden"
        style={{ backgroundColor: route.heroColor }}
      >
        <img
          src={route.image}
          alt={route.name}
          className="absolute inset-0 w-full h-full object-cover opacity-50"
        />
        <div className="relative mx-auto max-w-4xl">
          <p className="text-sm font-medium uppercase tracking-widest text-parchment/80">
            {route.country} · {route.distance}
          </p>
          <h1
            className="mt-3 text-4xl sm:text-5xl lg:text-6xl text-parchment leading-tight"
            style={{ fontFamily: 'var(--font-eb-garamond)' }}
          >
            {route.name}
          </h1>
        </div>
      </section>

      {/* Intro + Sidebar */}
      <section className="bg-white px-6 py-24">
        <div className="mx-auto max-w-5xl grid gap-12 lg:grid-cols-[1fr_320px]">
          <div>
            <p className="text-lg text-stone leading-relaxed">{route.intro}</p>
            <p className="mt-6 text-lg text-stone leading-relaxed">
              {route.body}
            </p>
          </div>

          {/* At a Glance Card */}
          <aside className="lg:mt-0">
            <div className="bg-card rounded-lg p-6">
              <h2
                className="text-lg text-slate-deep mb-4"
                style={{ fontFamily: 'var(--font-eb-garamond)' }}
              >
                At a Glance
              </h2>
              <dl className="space-y-3 text-sm">
                {[
                  ['Distance', route.distance],
                  ['Duration', route.duration],
                  ['Difficulty', route.difficulty],
                  ['Best months', route.bestMonths],
                  ['Start point', route.startPoint],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="flex justify-between border-b border-stone/10 pb-3"
                  >
                    <dt className="text-stone">{label}</dt>
                    <dd className="text-slate-deep font-medium">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </aside>
        </div>
      </section>

      {/* Stages */}
      <section className="bg-parchment px-6 py-24">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-16">
            <p className="text-sm font-medium uppercase tracking-widest text-ochre">
              The Route
            </p>
            <h2
              className="mt-3 text-3xl sm:text-4xl text-slate-deep"
              style={{ fontFamily: 'var(--font-eb-garamond)' }}
            >
              Stage by Stage
            </h2>
          </div>

          <div className="space-y-8">
            {route.stages.map((stage) => (
              <div
                key={stage.label}
                className="bg-white rounded-lg p-6 sm:p-8 flex flex-col sm:flex-row gap-6"
              >
                <div className="shrink-0 sm:w-32">
                  <span className="text-sm font-medium uppercase tracking-widest text-ochre">
                    {stage.label}
                  </span>
                  <span className="block mt-1 text-sm text-stone">
                    {stage.km}
                  </span>
                </div>
                <div>
                  <h3
                    className="text-xl text-slate-deep"
                    style={{ fontFamily: 'var(--font-eb-garamond)' }}
                  >
                    {stage.name}
                  </h3>
                  <p className="mt-2 text-stone leading-relaxed">
                    {stage.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What's Included */}
      <section className="bg-slate-deep px-6 py-24">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-16">
            <p className="text-sm font-medium uppercase tracking-widest text-ochre">
              Your Package
            </p>
            <h2
              className="mt-3 text-3xl sm:text-4xl text-parchment"
              style={{ fontFamily: 'var(--font-eb-garamond)' }}
            >
              What&apos;s Included
            </h2>
          </div>

          <div className="grid gap-12 sm:grid-cols-2">
            <div>
              <h3 className="text-sm font-medium uppercase tracking-widest text-ochre mb-6">
                Included
              </h3>
              <ul className="space-y-3">
                {route.inclusions.included.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="mt-1.5 block h-1.5 w-1.5 shrink-0 rounded-full bg-forest" />
                    <span className="text-parchment/90 leading-relaxed">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-medium uppercase tracking-widest text-ochre mb-6">
                Not Included
              </h3>
              <ul className="space-y-3">
                {route.inclusions.notIncluded.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="mt-1.5 block h-1.5 w-1.5 shrink-0 rounded-full bg-stone/40" />
                    <span className="text-parchment/60 leading-relaxed">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-forest px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2
            className="text-3xl sm:text-4xl text-white"
            style={{ fontFamily: 'var(--font-eb-garamond)' }}
          >
            {route.cta.heading}
          </h2>
          <p className="mt-4 text-white/80 text-lg">
            Tell us your dates, your pace, and any special requirements. We will
            build a personalised itinerary just for you.
          </p>
          <Link
            href="/enquire"
            className="mt-8 inline-block bg-white text-forest px-8 py-3.5 rounded-md text-base font-medium hover:bg-parchment transition-colors"
          >
            {route.cta.button}
          </Link>
        </div>
      </section>
    </main>
  );
}
