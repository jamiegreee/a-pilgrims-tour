import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { AuthForm } from '@/components/auth-form';
import { plans } from '@/lib/plans';
import { routes } from '@/lib/routes';
import { getSession, safeNext } from '@/lib/session';

export const metadata: Metadata = { title: "Sign up free — A Pilgrim's Tour" };

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ next?: string; route?: string }> }) {
  const params = await searchParams;
  const next = safeNext(params.next);
  if (await getSession()) redirect(next);
  // A flythrough link names its route; keep it so we know which route someone signed up for.
  const route = params.route ?? next.match(/^\/routes\/([^/]+)\/flythrough/)?.[1];
  const routeName = route ? routes[route]?.name : undefined;

  return (
    <div className="bg-parchment px-6 py-20 sm:py-28">
      <div className="mx-auto grid max-w-4xl gap-12 md:grid-cols-[1fr_380px]">
        <div>
          <p className="text-sm font-medium uppercase tracking-widest text-forest">Your account</p>
          <h1 className="mt-3 font-display text-4xl leading-tight text-slate-deep sm:text-5xl">
            {routeName ? `Fly ${routeName} before you walk it` : plans.free.tagline}
          </h1>
          <ul className="mt-8 space-y-3 leading-relaxed">
            {plans.free.inclusions.map((item) => (
              <li key={item} className="flex items-start gap-3 text-slate-deep">
                <span aria-hidden="true" className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-forest" />
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-8 leading-relaxed text-stone">
            Creating an account is free. A route&rsquo;s flythrough unlocks when you book a pilgrimage on it: a route pack, Walk Light or a Guided Pilgrimage. Use the same email address you pay with.
          </p>
        </div>
        <AuthForm intent="signup" next={next} route={route && routes[route] ? route : undefined} />
      </div>
    </div>
  );
}
