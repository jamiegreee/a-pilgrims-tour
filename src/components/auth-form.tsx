'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { requestLink, type LinkState } from '@/app/actions/auth';

const inputClass =
  'w-full rounded-md border border-stone/20 bg-white px-4 py-3 text-slate-deep placeholder:text-stone/50 focus:border-forest focus:ring-1 focus:ring-forest outline-none';

export function AuthForm({ intent, next, route }: { intent: 'signup' | 'login'; next: string; route?: string }) {
  const [state, action, pending] = useActionState<LinkState, FormData>(requestLink, { status: 'idle' });

  if (state.status === 'sent') {
    return (
      <div className="rounded-lg border border-slate-deep/10 bg-white p-8 text-center">
        <h2 className="font-display text-3xl text-slate-deep">Check your inbox</h2>
        <p className="mt-4 leading-relaxed text-stone">
          We&rsquo;ve sent a link to <strong className="text-slate-deep">{state.email}</strong>. Open it on this device to{' '}
          {intent === 'signup' ? 'confirm your email and start your free plan' : 'sign in'}.
        </p>
        {state.devLink && (
          <p className="mt-6 rounded-md bg-ochre/15 p-4 text-left text-sm leading-relaxed text-slate-deep">
            Email isn&rsquo;t set up on this preview (no RESEND_API_KEY), so here is the link it would have sent:{' '}
            <a href={state.devLink} className="break-all font-medium text-forest underline">
              open sign-in link
            </a>
          </p>
        )}
      </div>
    );
  }

  const error = state.status === 'error' ? state : null;
  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="intent" value={intent} />
      <input type="hidden" name="next" value={next} />
      {route && <input type="hidden" name="route" value={route} />}
      {intent === 'signup' && (
        <div>
          <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-slate-deep">Name</label>
          <input id="name" name="name" required autoComplete="name" defaultValue={error?.name} className={inputClass} />
        </div>
      )}
      <div>
        <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-deep">Email</label>
        <input id="email" name="email" type="email" required autoComplete="email" defaultValue={error?.email} className={inputClass} />
      </div>
      {error && <p role="alert" className="text-sm text-red-600">{error.message}</p>}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-forest px-8 py-3.5 text-base font-medium text-white transition-colors hover:bg-forest/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? 'Sending…' : intent === 'signup' ? 'Sign up free' : 'Email me a sign-in link'}
      </button>
      <p className="text-center text-sm text-stone">
        {intent === 'signup' ? (
          <>Already signed up? <Link href={`/login?next=${encodeURIComponent(next)}`} className="font-medium text-forest underline">Sign in</Link></>
        ) : (
          <>New here? <Link href={`/signup?next=${encodeURIComponent(next)}`} className="font-medium text-forest underline">Sign up free</Link></>
        )}
      </p>
      <p className="text-center text-xs text-stone/80">No password needed: we email you a link each time you sign in.</p>
    </form>
  );
}
