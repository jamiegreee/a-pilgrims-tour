import Link from 'next/link';
import Image from 'next/image';
import { routes, ukRouteSlugs } from '@/lib/routes';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "UK Pilgrimage Routes — A Pilgrim's Tour",
  description:
    'Explore pilgrimage routes in Britain. Choose an Independent Pilgrimage route pack, Walk Light with accommodation and bags arranged, or a Guided Pilgrimage.',
};

export default function RoutesPage() {
  return (
    <div className="bg-parchment px-6 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <p className="text-sm font-medium uppercase tracking-widest text-ochre">
            Choose Your Path
          </p>
          <h1
            className="mt-3 text-4xl sm:text-5xl text-slate-deep"
            style={{ fontFamily: 'var(--font-eb-garamond)' }}
          >
            Pilgrimage routes in Britain
          </h1>
          <p className="mt-4 text-lg text-stone max-w-xl mx-auto leading-relaxed">
            Explore the paths that inspire our UK pilgrimages. Make your own
            arrangements, walk with accommodation and baggage transfers arranged,
            or join a group with a pilgrimage guide.
          </p>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {ukRouteSlugs.map((slug) => {
            const route = routes[slug];
            return (
              <Link
                key={slug}
                href={`/routes/${slug}`}
                className="group block bg-white rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="relative h-48 overflow-hidden" style={{ backgroundColor: route.heroColor }}>
                  <Image
                    src={route.image}
                    alt=""
                    fill
                    unoptimized
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover opacity-80 motion-safe:group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  <h2
                    className="absolute bottom-4 left-4 text-2xl text-parchment drop-shadow"
                    style={{ fontFamily: 'var(--font-eb-garamond)' }}
                  >
                    {route.name}
                  </h2>
                </div>
                <div className="p-6">
                  <p className="text-xs font-medium uppercase tracking-widest text-ochre">
                    {route.country}
                  </p>
                  <p className="mt-2 text-stone text-sm leading-relaxed">
                    {route.shortDescription}
                  </p>
                  <span className="mt-4 inline-block text-forest text-sm font-medium group-hover:underline">
                    View route &rarr;
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
