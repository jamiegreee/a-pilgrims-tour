import Link from 'next/link';
import { routes, routeSlugs } from '@/lib/routes';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Routes — A Pilgrim's Tour",
  description:
    'Explore our pilgrimage routes across Europe and beyond. Self-guided and group tours available.',
};

export default function RoutesPage() {
  return (
    <main className="bg-parchment px-6 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <p className="text-sm font-medium uppercase tracking-widest text-ochre">
            Choose Your Path
          </p>
          <h1
            className="mt-3 text-4xl sm:text-5xl text-slate-deep"
            style={{ fontFamily: 'var(--font-eb-garamond)' }}
          >
            Our Routes
          </h1>
          <p className="mt-4 text-lg text-stone max-w-xl mx-auto leading-relaxed">
            Ancient paths, modern logistics. Each route is planned and supported
            so you can focus entirely on the walk.
          </p>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {routeSlugs.map((slug) => {
            const route = routes[slug];
            return (
              <Link
                key={slug}
                href={`/routes/${slug}`}
                className="group block bg-white rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="relative h-48 overflow-hidden" style={{ backgroundColor: route.heroColor }}>
                  <img
                    src={route.image}
                    alt={route.name}
                    className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500"
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
                    {route.country} &middot; {route.distance} &middot; {route.duration}
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
    </main>
  );
}
