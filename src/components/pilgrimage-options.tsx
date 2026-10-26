import Link from 'next/link';
import { pilgrimageOptions, pilgrimageEnquiryHref } from '@/lib/pilgrimage-options';

export function PilgrimageOptions({
  routeName,
  dark = false,
}: {
  routeName?: string;
  dark?: boolean;
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {pilgrimageOptions.map((option, index) => (
        <article
          key={option.id}
          className={`flex flex-col rounded-lg border p-6 sm:p-8 ${
            dark ? 'border-white/15 bg-white/5 text-parchment' : 'border-slate-deep/10 bg-white text-slate-deep'
          }`}
        >
          <p className={`text-sm font-medium ${dark ? 'text-parchment/65' : 'text-forest'}`}>
            0{index + 1} / {index < 2 ? 'Self-guided' : 'Small group'}
          </p>
          <h3 className="mt-5 font-display text-3xl leading-tight">{option.name}</h3>
          <p className={`mt-2 text-sm font-medium ${dark ? 'text-parchment/80' : 'text-forest'}`}>
            {option.tagline}
          </p>
          <p className={`mt-5 leading-relaxed ${dark ? 'text-parchment/80' : 'text-stone'}`}>
            {option.description}
          </p>
          <ul className="my-6 space-y-3 text-sm leading-relaxed">
            {option.inclusions.map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span aria-hidden="true" className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${dark ? 'bg-ochre' : 'bg-forest'}`} />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <p className={`mt-auto border-t pt-5 text-sm leading-relaxed ${dark ? 'border-white/15 text-parchment/75' : 'border-slate-deep/10 text-stone'}`}>
            {option.support}
          </p>
          <Link
            href={pilgrimageEnquiryHref(option.id, routeName)}
            className={`mt-6 rounded-md px-5 py-3 text-center text-sm font-medium transition-colors ${
              dark ? 'bg-parchment text-slate-deep hover:bg-white' : 'bg-forest text-white hover:bg-forest/90'
            }`}
            aria-label={`Enquire about ${option.name}${routeName ? ` on ${routeName}` : ''}`}
          >
            Enquire about this option <span aria-hidden="true">&rarr;</span>
          </Link>
        </article>
      ))}
    </div>
  );
}
