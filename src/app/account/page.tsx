import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { signOut } from '@/app/actions/auth';
import { flythroughSlugs } from '@/lib/flythroughs';
import { plans } from '@/lib/plans';
import { routes, ukRouteSlugs } from '@/lib/routes';
import { getSession } from '@/lib/session';

export const metadata: Metadata = { title: "Your account — A Pilgrim's Tour" };

export default async function AccountPage() {
  const session = await getSession();
  if (!session) redirect('/login?next=/account');
  const plan = plans[session.plan];
  // UK routes first, as on the rest of the site.
  const available = [...flythroughSlugs].sort((a, b) => Number(ukRouteSlugs.includes(b)) - Number(ukRouteSlugs.includes(a)));

  return (
    <div className="bg-parchment px-6 py-20 sm:py-28">
      <div className="mx-auto max-w-3xl">
        <p className="text-sm font-medium uppercase tracking-widest text-forest">{plan.name} plan</p>
        <h1 className="mt-3 font-display text-4xl text-slate-deep sm:text-5xl">Hello, {session.name}</h1>
        <p className="mt-3 text-stone">{session.email}</p>

        <h2 className="mt-14 font-display text-2xl text-slate-deep">Your flythroughs</h2>
        <ul className="mt-5 grid gap-4 sm:grid-cols-2">
          {available.map((slug) => (
            <li key={slug}>
              <Link
                href={`/routes/${slug}/flythrough`}
                className="block rounded-lg border border-slate-deep/10 bg-white p-6 transition-colors hover:border-forest"
              >
                <span className="font-display text-xl text-slate-deep">{routes[slug].name}</span>
                <span className="mt-2 block text-sm text-forest">Watch the 3D flythrough &rarr;</span>
              </Link>
            </li>
          ))}
        </ul>

        {session.plan === 'free' && (
          <div className="mt-14 rounded-lg bg-slate-deep p-8 text-parchment">
            <h2 className="font-display text-2xl">Ready to walk it?</h2>
            <p className="mt-3 leading-relaxed text-parchment/80">
              Choose a route pack, Walk Light with your stays and baggage arranged, or a Guided Pilgrimage.
            </p>
            <Link href="/routes" className="mt-6 inline-block rounded-md bg-parchment px-6 py-3 text-sm font-medium text-slate-deep hover:bg-white">
              Explore routes
            </Link>
          </div>
        )}

        <form action={signOut} className="mt-14">
          <button type="submit" className="text-sm font-medium text-stone underline underline-offset-4 hover:text-slate-deep">
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}
