import { notFound, redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { routes } from '@/lib/routes';
import { flythroughs, flythroughSlugs, staysFor } from '@/lib/flythroughs';
import { getSession } from '@/lib/session';
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

  // Flythroughs come with the free plan, so a sign-up is all it takes.
  const session = await getSession();
  if (!session) redirect(`/signup?next=${encodeURIComponent(`/routes/${slug}/flythrough`)}`);

  return (
    <FlythroughScene
      slug={slug}
      routeName={route.name}
      flythrough={{ ...flythrough, stays: staysFor(flythrough, session.plan) }}
      stages={route.stages}
      ctaLabel={route.cta.button}
    />
  );
}
