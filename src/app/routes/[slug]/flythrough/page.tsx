import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { routes } from '@/lib/routes';
import { flythroughs, flythroughSlugs } from '@/lib/flythroughs';
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

  return (
    <FlythroughScene
      slug={slug}
      routeName={route.name}
      flythrough={flythrough}
      stages={route.stages}
      ctaLabel={route.cta.button}
    />
  );
}
