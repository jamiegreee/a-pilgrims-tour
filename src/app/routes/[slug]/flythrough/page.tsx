import { notFound, redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { routes } from '@/lib/routes';
import { flythroughs, flythroughSlugs, staysFor } from '@/lib/flythroughs';
import { getSession } from '@/lib/session';
import { flythroughAccess } from '@/lib/purchases';
import { FlythroughLocked } from '@/components/flythrough/flythrough-locked';
import FlythroughScene from '@/components/flythrough/flythrough-loader';

export const dynamicParams = false;

export async function generateStaticParams() {
  return flythroughSlugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const route = routes[slug];
  if (!route) return {};
  return {
    title: `${route.name} 3D Flythrough — A Pilgrim's Tour`,
    description: `Fly the full ${route.distance} of the ${route.name} over real terrain, stage by stage.`,
  };
}

export default async function FlythroughPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const route = routes[slug];
  const flythrough = flythroughs[slug];

  if (!route || !flythrough) {
    notFound();
  }

  // A flythrough comes with a pilgrimage on its route: sign in, then it is checked against
  // what that email has paid for.
  const session = await getSession();
  if (!session) redirect(`/login?next=${encodeURIComponent(`/routes/${slug}/flythrough`)}`);
  const access = await flythroughAccess(session.email, slug);
  if (!access.allowed) return <FlythroughLocked slug={slug} routeName={route.name} email={session.email} />;

  return (
    <FlythroughScene
      slug={slug}
      routeName={route.name}
      flythrough={{ ...flythrough, stays: access.owner ? flythrough.stays ?? [] : staysFor(flythrough, access.option ?? 'free') }}
      stages={route.stages}
      ctaLabel={route.cta.button}
    />
  );
}
