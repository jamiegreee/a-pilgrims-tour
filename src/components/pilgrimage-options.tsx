import Link from 'next/link';
import { pilgrimageOptions, pilgrimageEnquiryHref } from '@/lib/pilgrimage-options';
import { routePricing, priceLine, formatPounds, SINGLE_SUPPLEMENT_PER_NIGHT, DEPOSIT } from '@/lib/pricing';

export function PilgrimageOptions({
  routeName,
  routeSlug,
  dark = false,
}: {
  routeName?: string;
  /** With a route, each card shows its price, and the route pack can be bought outright. */
  routeSlug?: string;
  dark?: boolean;
}) {
  const pricing = routeSlug ? routePricing[routeSlug] : undefined;
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
          {pricing && routeSlug && (
            <div className="mt-5">
              <p className="font-display text-2xl">
                {priceLine(routeSlug, option.id)?.main}{' '}
                <span className={`font-body text-sm ${dark ? 'text-parchment/75' : 'text-stone'}`}>{priceLine(routeSlug, option.id)?.sub}</span>
              </p>
              <p className={`mt-1 text-xs leading-relaxed ${dark ? 'text-parchment/65' : 'text-stone'}`}>
                {option.id === 'independent'
                  ? 'Includes the 3D flythrough. Its price comes off a Walk Light or Guided booking later.'
                  : `Sharing a room; single rooms +${formatPounds(SINGLE_SUPPLEMENT_PER_NIGHT)} a night. Your proposal confirms the price, and a ${formatPounds(DEPOSIT[option.id])} deposit per person secures it.`}
              </p>
            </div>
          )}
          {pricing && option.id === 'independent' && (
            <a
              href={pricing.independent.buyUrl}
              className="mt-5 rounded-md bg-ochre px-5 py-3 text-center text-sm font-medium text-white transition-colors hover:bg-ochre/90"
            >
              Buy the route pack, {formatPounds(pricing.independent.price)} <span aria-hidden="true">&rarr;</span>
            </a>
          )}
          <Link
            href={pilgrimageEnquiryHref(option.id, routeName)}
            className={`${pricing && option.id === 'independent' ? 'mt-3' : 'mt-6'} rounded-md px-5 py-3 text-center text-sm font-medium transition-colors ${
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
