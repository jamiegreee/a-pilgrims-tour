import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { completeLogin } from '@/app/actions/auth';
import { verify, type LoginLink } from '@/lib/session';

export const metadata: Metadata = { title: "Confirm your email — A Pilgrim's Tour", robots: { index: false } };

export default async function VerifyPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  const link = verify<LoginLink>('link', token);
  if (!link) redirect('/login?expired=1');

  return (
    <div className="bg-parchment px-6 py-28 sm:py-36">
      <form action={completeLogin} className="mx-auto max-w-md text-center">
        <input type="hidden" name="token" value={token} />
        <h1 className="font-display text-4xl text-slate-deep">
          {link.intent === 'signup' ? `Welcome, ${link.name}` : 'Welcome back'}
        </h1>
        <p className="mt-4 text-stone">{link.email}</p>
        <button
          type="submit"
          className="mt-8 w-full rounded-md bg-forest px-8 py-3.5 text-base font-medium text-white transition-colors hover:bg-forest/90"
        >
          {link.intent === 'signup' ? 'Confirm and continue' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}
