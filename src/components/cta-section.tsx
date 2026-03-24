import Link from "next/link";

interface CTASectionProps {
  heading: string;
  subtext: string;
}

export function CTASection({ heading, subtext }: CTASectionProps) {
  return (
    <section className="bg-forest px-6 py-20 text-white">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
          {heading}
        </h2>
        <p className="mt-4 text-lg text-white/80">{subtext}</p>
        <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <input
            type="email"
            placeholder="Your email address"
            className="w-full max-w-sm rounded-md bg-white/10 px-4 py-3 text-sm text-white placeholder-white/50 outline-none ring-1 ring-white/20 transition-colors focus:ring-white/50 sm:w-auto sm:flex-1"
          />
          <Link
            href="/enquire"
            className="w-full rounded-md bg-white px-6 py-3 text-center text-sm font-medium text-forest transition-colors hover:bg-parchment sm:w-auto"
          >
            Get in Touch
          </Link>
        </div>
      </div>
    </section>
  );
}
