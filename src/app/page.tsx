import Link from 'next/link';
import Image from 'next/image';
import { routes, ukRouteSlugs } from '@/lib/routes';
import { PilgrimageOptions } from '@/components/pilgrimage-options';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "A Pilgrim's Tour — Pilgrimages in Britain",
  description:
    'Explore Britain on an Independent Pilgrimage, Walk Light with accommodation and baggage transfers, or join a Guided Pilgrimage with a spiritual guide.',
};

export default function LandingPage() {
  return (
    <>
      <section className="bg-parchment px-6 py-16 sm:py-24">
        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
          <div>
            <p className="text-sm font-medium uppercase tracking-widest text-ochre">Pilgrimages in Britain</p>
            <h1 className="mt-6 font-display text-5xl leading-[1.08] text-slate-deep sm:text-6xl lg:text-7xl">
              The path is ancient.<br />The journey is yours.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-stone">
              Walk Britain&apos;s pilgrimage paths, with time for reflection.
              Make your own arrangements, let us book the beds and move your bags,
              or share the journey with a pilgrimage guide.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-5">
              <a href="#ways-to-walk" className="rounded-md bg-forest px-6 py-3.5 font-medium text-white transition-colors hover:bg-forest/90">
                Choose your pilgrimage
              </a>
              <Link href="/routes" className="py-3 text-sm font-medium text-forest underline underline-offset-4">
                Explore UK routes <span aria-hidden="true">&rarr;</span>
              </Link>
            </div>
          </div>
          <div className="relative min-h-72 overflow-hidden rounded-t-[8rem] rounded-b-lg sm:min-h-96 lg:min-h-[32rem]">
            <Image src="/images/hero.jpg" alt="A narrow walking path through open hills beneath a cloudy sky" fill priority sizes="(min-width: 1024px) 45vw, 100vw" className="object-cover" />
          </div>
        </div>
      </section>

      <section id="ways-to-walk" className="scroll-mt-24 bg-parchment px-6 pb-20 sm:pb-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 max-w-2xl">
            <p className="text-sm font-medium uppercase tracking-widest text-ochre">Find your way</p>
            <h2 className="mt-3 font-display text-4xl text-slate-deep sm:text-5xl">Three ways to make your pilgrimage</h2>
            <p className="mt-4 text-lg leading-relaxed text-stone">Choose how much you would like us to arrange. The space to walk, notice and reflect belongs to every journey.</p>
          </div>
          <PilgrimageOptions />
        </div>
      </section>

      <section id="routes" className="bg-white px-6 py-20 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-widest text-ochre">Closer to home</p>
              <h2 className="mt-3 font-display text-4xl text-slate-deep sm:text-5xl">Discover Britain on foot</h2>
              <p className="mt-4 max-w-xl leading-relaxed text-stone">From Cornish crossings to the Scottish Borders, explore the routes that inspire our UK pilgrimages.</p>
            </div>
            <Link href="/routes" className="shrink-0 text-sm font-medium text-forest underline underline-offset-4">Explore all UK routes <span aria-hidden="true">&rarr;</span></Link>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {ukRouteSlugs.map((slug) => {
              const route = routes[slug];
              return (
                <Link key={slug} href={`/routes/${slug}`} className="group block overflow-hidden rounded-lg bg-parchment transition-shadow hover:shadow-md">
                  <div className="relative h-48 overflow-hidden" style={{ backgroundColor: route.heroColor }}>
                    <Image src={route.image} alt="" fill unoptimized sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" className="object-cover transition-transform duration-500 motion-safe:group-hover:scale-105" />
                  </div>
                  <div className="p-6">
                    <p className="text-xs font-medium uppercase tracking-wider text-forest">{route.country}</p>
                    <h3 className="mt-2 font-display text-2xl text-slate-deep">{route.name}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-stone">{route.shortDescription}</p>
                    <span className="mt-5 inline-block text-sm font-medium text-forest group-hover:underline">Explore the route <span aria-hidden="true">&rarr;</span></span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-slate-deep px-6 py-20 sm:py-24">
        <div className="mx-auto max-w-5xl">
          <p className="text-sm font-medium uppercase tracking-widest text-parchment/70">Room for the journey</p>
          <h2 className="mt-4 max-w-2xl font-display text-4xl leading-tight text-parchment sm:text-5xl">A path to follow.<br />Something to carry home.</h2>
          <div className="mt-10 grid gap-8 sm:grid-cols-2">
            <p className="text-lg leading-relaxed text-parchment/80">Pilgrimage makes room for the places and questions we often pass by. A church door, a stretch of silence, a conversation along the way: each can become part of your journey.</p>
            <div>
              <p className="text-lg leading-relaxed text-parchment/80">Our route packs include stories and suggested reflections. On guided journeys, a pilgrimage guide brings the landscape and its spiritual heritage into the shared experience.</p>
              <Link href="/how-it-works" className="mt-6 inline-block font-medium text-parchment underline underline-offset-4">See how it works <span aria-hidden="true">&rarr;</span></Link>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-forest px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-4xl text-white sm:text-5xl">Where will your pilgrimage begin?</h2>
          <p className="mt-5 text-lg leading-relaxed text-white/85">Tell us the route, the option and the dates you have in mind. We will discuss the arrangements and availability with you.</p>
          <Link href="/enquire" className="mt-8 inline-block rounded-md bg-white px-8 py-3.5 font-medium text-forest transition-colors hover:bg-parchment">Start a conversation</Link>
        </div>
      </section>
    </>
  );
}
