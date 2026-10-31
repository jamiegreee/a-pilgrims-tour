import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { AuthForm } from '@/components/auth-form';
import { getSession, safeNext } from '@/lib/session';

export const metadata: Metadata = { title: "Sign in — A Pilgrim's Tour" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; expired?: string }> }) {
  const params = await searchParams;
  const next = safeNext(params.next);
  if (await getSession()) redirect(next);

  return (
    <div className="bg-parchment px-6 py-20 sm:py-28">
      <div className="mx-auto max-w-md">
        <h1 className="text-center font-display text-4xl text-slate-deep sm:text-5xl">Sign in</h1>
        {params.expired && (
          <p role="alert" className="mt-6 rounded-md bg-ochre/15 p-4 text-sm text-slate-deep">
            That sign-in link has expired or isn&rsquo;t valid. Enter your email for a new one.
          </p>
        )}
        <div className="mt-10">
          <AuthForm intent="login" next={next} />
        </div>
      </div>
    </div>
  );
}
