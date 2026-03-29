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

  const isGroupRoute = !!route.groupInclusions;
  const selfGuidedItems = route.selfGuidedInclusions ?? route.inclusions.included;

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
            {route.country} &mdash; {route.distance} &mdash; {route.duration}
          </p>
          <h1
            className="mt-3 text-4xl sm:text-5xl lg:text-6xl text-parchment leading-tight"
            style={{ fontFamily: 'var(--font-eb-garamond)' }}
          >
            {route.name}
          </h1>
          <p className="mt-4 text-lg text-parchment/80 max-w-xl leading-relaxed">
            {route.shortDescription}
          </p>
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
                className="text-xs font-medium uppercase tracking-widest text-stone mb-4"
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
                  ...(route.endPoint ? [['End point', route.endPoint]] : []),
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="flex justify-between border-b border-stone/10 pb-3"
                  >
                    <dt className="text-stone">{label}</dt>
                    <dd className="text-slate-deep font-medium text-right">{value}</dd>
                  </div>
                ))}
              </dl>

              {isGroupRoute && (
                <div className="mt-5 pt-4 border-t border-stone/10">
                  <h3 className="text-xs font-medium uppercase tracking-widest text-stone mb-3">
                    Tour Type
                  </h3>
                  <ul className="space-y-1.5 text-sm text-slate-deep">
                    <li className="flex items-center gap-2">
                      <span className="block h-1.5 w-1.5 shrink-0 rounded-full bg-forest" />
                      Self-Guided
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="block h-1.5 w-1.5 shrink-0 rounded-full bg-ochre" />
                      Group Departures
                    </li>
                  </ul>
                </div>
              )}
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

          {isGroupRoute ? (
            <div className="grid gap-8 sm:grid-cols-2">
              {/* Self-Guided card */}
              <div className="bg-white/5 rounded-lg p-6">
                <span className="inline-block bg-forest/50 text-parchment text-xs font-medium uppercase tracking-wider px-3 py-1 rounded-full mb-4">
                  Self-Guided
                </span>
                {route.selfGuidedDesc && (
                  <p className="text-parchment/70 text-sm mb-5 leading-relaxed">
                    {route.selfGuidedDesc}
                  </p>
                )}
                <ul className="space-y-3">
                  {selfGuidedItems.map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <span className="mt-1.5 block h-1.5 w-1.5 shrink-0 rounded-full bg-forest" />
                      <span className="text-parchment/90 leading-relaxed text-sm">
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Group Tour card */}
              <div className="bg-white/5 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <span className="inline-block bg-ochre/40 text-parchment text-xs font-medium uppercase tracking-wider px-3 py-1 rounded-full">
                    Group Tour
                  </span>
                  {route.groupMaxWalkers && (
                    <span className="text-parchment/50 text-xs">
                      Max {route.groupMaxWalkers} walkers
                    </span>
                  )}
                </div>
                {route.groupDesc && (
                  <p className="text-parchment/70 text-sm mb-5 leading-relaxed">
                    {route.groupDesc}
                  </p>
                )}
                <ul className="space-y-3">
                  {route.groupInclusions!.map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <span className="mt-1.5 block h-1.5 w-1.5 shrink-0 rounded-full bg-ochre/70" />
                      <span className="text-parchment/90 leading-relaxed text-sm">
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
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
          )}
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
            {route.cta.body ??
              'Tell us your dates, your pace, and any special requirements. We will build a personalised itinerary just for you.'}
          </p>
          {isGroupRoute ? (
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href={`/enquire?route=${encodeURIComponent(route.name)}&type=self-guided`}
                className="inline-block border-2 border-white text-white px-8 py-3.5 rounded-md text-base font-medium hover:bg-white/10 transition-colors"
              >
                Enquire &mdash; Self-Guided
              </Link>
              <Link
                href={`/enquire?route=${encodeURIComponent(route.name)}&type=group`}
                className="inline-block bg-white text-forest px-8 py-3.5 rounded-md text-base font-medium hover:bg-parchment transition-colors"
              >
                Enquire &mdash; Group Tour
              </Link>
            </div>
          ) : (
            <Link
              href="/enquire"
              className="mt-8 inline-block bg-white text-forest px-8 py-3.5 rounded-md text-base font-medium hover:bg-parchment transition-colors"
            >
              {route.cta.button}
            </Link>
          )}
        </div>
      </section>
    </main>
  );
}
