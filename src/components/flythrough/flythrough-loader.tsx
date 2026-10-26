'use client';

import dynamic from 'next/dynamic';

// MapLibre and three.js need the browser (WebGL, window), so skip prerendering.
const FlythroughMap = dynamic(() => import('./flythrough-map'), {
  ssr: false,
  loading: () => <div className="h-[calc(100svh-65px)] min-h-[560px] w-full bg-[#e7dfd2]" />,
});

export default FlythroughMap;
