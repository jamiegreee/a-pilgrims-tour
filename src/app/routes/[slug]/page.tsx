import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { routes, routeSlugs, ukRouteSlugs } from '@/lib/routes';
import { flythroughs } from '@/lib/flythroughs';
import { pilgrimageOptions } from '@/lib/pilgrimage-options';
import { PilgrimageOptions } from '@/components/pilgrimage-options';
import type { Metadata } from 'next';

export async function generateStaticParams() {
  return routeSlugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const route = routes[slug];
  if (!route) return {};
  return { title: `${route.name} — A Pilgrim's Tour`, description: route.shortDescription };
}

export default async function RoutePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const route = routes[slug];
  if (!route) notFound();
  const isUKRoute = ukRouteSlugs.includes(slug);

  return (
    <>
      <section className="relative overflow-hidden px-6 py-24 sm:py-32" style={{ backgroundColor: route.heroColor }}>
        <Image src={route.image} alt="" fill unoptimized priority sizes="100vw" className="object-cover" />
        <div className="absolute inset-0 bg-slate-deep/65" />
        <div className="relative mx-auto max-w-5xl">
          <Link href="/routes" className="text-sm font-medium text-parchment/85 underline underline-offset-4">Explore UK routes</Link>
          <p className="mt-8 text-sm font-medium uppercase tracking-widest text-parchment/80">{route.country}</p>
          <h1 className="mt-3 font-display text-4xl leading-tight text-parchment sm:text-5xl lg:text-6xl">{route.name}</h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-parchment/90">{route.shortDescription}</p>
          {flythroughs[slug] && (
            <Link
              href={`/routes/${slug}/flythrough`}
              className="mt-8 inline-flex items-center gap-2 rounded-md bg-parchment/90 px-5 py-3 text-sm font-medium text-slate-deep transition-colors hover:bg-parchment"
            >
              Watch the 3D flythrough <span aria-hidden>&rarr;</span>
            </Link>
          )}
        </div>
      </section>

      {!isUKRoute && (
        <section className="bg-card px-6 py-8">
          <div className="mx-auto max-w-5xl">
            <p className="leading-relaxed text-slate-deep">Our launch focuses on pilgrimages in Britain. This overseas route is here for inspiration.</p>
            <Link href="/routes" className="mt-3 inline-block font-medium text-forest underline underline-offset-4">Find a UK pilgrimage <span aria-hidden="true">&rarr;</span></Link>
          </div>
        </section>
      )}

      <section className="bg-white px-6 py-16 sm:py-24">
        <div className="mx-auto grid max-w-5xl gap-12 lg:grid-cols-[1fr_300px]">
          <div>
            <p className="text-lg leading-relaxed text-stone">{route.intro}</p>
            <p className="mt-6 text-lg leading-relaxed text-stone">{route.body}</p>
          </div>
          <aside className="self-start rounded-lg bg-parchment p-6">
            <h2 className="text-xs font-medium uppercase tracking-widest text-forest">The journey</h2>
            <dl className="mt-5 space-y-4 text-sm">
              {[
                ['Location', route.country],
                ['Starting point', route.startPoint],
                ...(route.endPoint ? [['Destination', route.endPoint]] : []),
              ].map(([label, value]) => (
                <div key={label} className="border-b border-slate-deep/10 pb-4">
                  <dt className="text-stone">{label}</dt>
                  <dd className="mt-1 font-medium text-slate-deep">{value}</dd>
                </div>
              ))}
            </dl>
            {isUKRoute && (
              <div className="mt-6">
                <h3 className="text-xs font-medium uppercase tracking-widest text-forest">Ways to walk</h3>
                <ul className="mt-3 space-y-2 text-sm text-slate-deep">
                  {pilgrimageOptions.map((option) => <li key={option.id}>{option.name}</li>)}
                </ul>
              </div>
            )}
          </aside>
        </div>
      </section>

      {isUKRoute ? (
        <>
          <section className="bg-parchment px-6 py-14">
            <div className="mx-auto max-w-5xl">
              <h2 className="font-display text-3xl text-slate-deep">Plan the stages around your journey</h2>
              <p className="mt-4 max-w-3xl leading-relaxed text-stone">Ask us about the stages and walking demands for this route. For Walk Light and Guided Pilgrimage, we will confirm your daily itinerary, overnight stops, baggage arrangements and availability in your proposal. Your Independent Pilgrimage route pack provides the itinerary for you to arrange your own stays.</p>
            </div>
          </section>
          <section id="ways-to-walk" className="bg-slate-deep px-6 py-20 sm:py-24">
            <div className="mx-auto max-w-6xl">
              <p className="text-sm font-medium uppercase tracking-widest text-parchment/70">Choose your arrangements</p>
              <h2 className="mt-3 font-display text-4xl text-parchment sm:text-5xl">Three ways to walk {route.name}</h2>
              <p className="mb-10 mt-5 max-w-2xl text-lg leading-relaxed text-parchment/80">Accommodation with breakfast and daily baggage transfers are included in Walk Light and Guided Pilgrimage. Independent pilgrims make their own arrangements.</p>
              <PilgrimageOptions routeName={route.name} dark />
            </div>
          </section>
          <section className="bg-forest px-6 py-16">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="font-display text-3xl text-white sm:text-4xl">Make this your pilgrimage</h2>
              <p className="mt-4 text-lg leading-relaxed text-white/85">Tell us your preferred dates, walking experience and the arrangements you would like us to make.</p>
              <Link href={`/enquire?route=${encodeURIComponent(route.name)}`} className="mt-7 inline-block rounded-md bg-white px-8 py-3.5 font-medium text-forest transition-colors hover:bg-parchment">Discuss this route</Link>
            </div>
          </section>
        </>
      ) : (
        <section className="bg-parchment px-6 py-16">
          <div className="mx-auto max-w-4xl">
            <h2 className="font-display text-3xl text-slate-deep">Explore the route</h2>
            <div className="mt-8 space-y-6">
              {route.stages.map((stage) => (
                <article key={stage.label} className="rounded-lg bg-white p-6">
                  <p className="text-sm font-medium text-forest">{stage.label}</p>
                  <h3 className="mt-2 font-display text-2xl text-slate-deep">{stage.name}</h3>
                  <p className="mt-3 leading-relaxed text-stone">{stage.desc}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
