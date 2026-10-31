import Link from 'next/link';

/** Shown in place of a flythrough to a signed-in visitor who hasn't bought this route. */
export function FlythroughLocked({ slug, routeName, email }: { slug: string; routeName: string; email: string }) {
  return (
    <div className="bg-parchment px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-xl text-center">
        <p className="text-sm font-medium uppercase tracking-widest text-forest">3D flythrough</p>
        <h1 className="mt-3 font-display text-4xl leading-tight text-slate-deep sm:text-5xl">
          Fly {routeName} once your pilgrimage is booked
        </h1>
        <p className="mt-6 text-lg leading-relaxed text-stone">
          The 3D flythrough comes with every pilgrimage on this route: the whole way over real terrain, stage by stage, with
          its landmarks and, for Walk Light and Guided Pilgrimage, your overnight stops.
        </p>
        <p className="mt-4 text-sm leading-relaxed text-stone">
          You&rsquo;re signed in as <strong className="text-slate-deep">{email}</strong>. If you&rsquo;ve already paid with
          another email address, sign in with that one.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href={`/routes/${slug}#ways-to-walk`}
            className="rounded-md bg-forest px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-forest/90"
          >
            Choose your pilgrimage
          </Link>
          <Link
            href={`/enquire?route=${encodeURIComponent(routeName)}`}
            className="rounded-md border border-slate-deep/15 px-6 py-3 text-sm font-medium text-slate-deep transition-colors hover:border-forest"
          >
            Ask us about it
          </Link>
        </div>
      </div>
    </div>
  );
}
