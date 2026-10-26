'use client';

import dynamic from 'next/dynamic';

// three.js needs the browser (WebGL, window), so skip prerendering the scene.
const FlythroughScene = dynamic(() => import('./flythrough-scene'), {
  ssr: false,
  loading: () => <div className="h-[calc(100svh-65px)] min-h-[560px] w-full bg-[#e7dfd2]" />,
});

export default FlythroughScene;
