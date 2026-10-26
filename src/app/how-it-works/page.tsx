import Link from 'next/link';
import type { Metadata } from 'next';
import { PilgrimageOptions } from '@/components/pilgrimage-options';

export const metadata: Metadata = {
  title: "How It Works — A Pilgrim's Tour",
  description:
    'Compare Independent Pilgrimage, Walk Light and Guided Pilgrimage. Find out who books your accommodation, carries your bags and accompanies your walk.',
};

const steps = [
  {
    num: '01',
    title: 'Find your path',
    description:
      'Explore our British pilgrimage routes and consider the distance, terrain and time you would like to spend walking. The places along the way, and what they mean to you, are part of choosing the right journey.',
    details: [
      'Ask about daily distances, suggested stages and walking demands',
      'Explore the history and sacred places along each path',
      'Tell us your preferred dates, pace and room requirements when you enquire',
    ],
  },
  {
    num: '02',
    title: 'Choose how much we arrange',
    description:
      'Choose an Independent Pilgrimage route pack if you want to make your own arrangements. With Walk Light, we book your accommodation with breakfast and arrange daily baggage transfers. Guided Pilgrimage adds an accompanying pilgrimage guide and the company of a small group.',
    details: [
      'Independent Pilgrimage: you book your stays and carry your bags',
      'Walk Light: we arrange the overnight stops and move your bags',
      'Guided Pilgrimage: walk together with a guide and space for spiritual reflection',
    ],
  },
  {
    num: '03',
    title: 'Prepare for your journey',
    description:
      'We confirm the arrangements and what is included before you book. Your route information sets out the daily walking stages, practical details and places to pause. On a guided journey, you will also know the group itinerary and the spiritual approach of your guide.',
    details: [
      'Review your itinerary, inclusions and price before committing',
      'Receive route notes, maps and GPX files for your walk',
      'Check accommodation, baggage allowances and contact details for an arranged holiday',
    ],
  },
];

const faqs = [
  {
    question: 'Do you book my accommodation?',
    answer:
      'Yes, for Walk Light and Guided Pilgrimage. Accommodation with breakfast is included, and your proposal will set out the overnight stops and room arrangements. With Independent Pilgrimage, you choose and book your own accommodation.',
  },
  {
    question: 'Who carries my bags?',
    answer:
      'With Independent Pilgrimage, you carry your own luggage. Walk Light and Guided Pilgrimage include daily baggage transfers between the agreed overnight stops, leaving you to carry what you need for the day. We confirm bag allowances and collection arrangements before booking.',
  },
  {
    question: 'What support is included?',
    answer:
      'Independent Pilgrimage is a route pack for a journey you manage yourself, without on-trip assistance. Walk Light includes a contact for accommodation and baggage arrangements; you navigate and walk independently. Guided Pilgrimage also includes a guide accompanying the walking group.',
  },
  {
    question: 'What does a pilgrimage guide do?',
    answer:
      'Your guide leads the walking journey, shares local history and creates space for spiritual reflection, conversation and quiet. Each guided journey will explain its spiritual focus and any shared practices before you book, so you can choose an experience that suits you.',
  },
  {
    question: 'How do I choose a suitable walk?',
    answer:
      'Consider the daily distances, terrain, ascent and the weight you will carry, alongside your experience of walking on consecutive days. Read the route details and tell us about your preferred pace when you enquire. On guided departures, the group follows a shared itinerary.',
  },
  {
    question: 'How much does it cost, and when can I go?',
    answer:
      'Prices and availability depend on your route, dates and chosen option. For Walk Light and Guided Pilgrimage, room arrangements and group size also affect the price. Send an enquiry and we will confirm the proposed itinerary, inclusions, availability and price before you book.',
  },
];

export default function HowItWorksPage() {
  return (
    <div>
      <section className="bg-parchment px-6 py-24 sm:py-32 text-center">
        <div className="mx-auto max-w-3xl">
          <p className="text-sm font-medium uppercase tracking-widest text-ochre">How It Works</p>
          <h1 className="mt-4 font-display text-4xl sm:text-5xl text-slate-deep leading-tight">
            Choose your path.<br />Choose how you walk.
          </h1>
          <p className="mt-6 text-lg text-stone max-w-2xl mx-auto leading-relaxed">
            A route pack for your own adventure, an arranged holiday with lighter
            bags, or a shared journey with a pilgrimage guide.
          </p>
        </div>
      </section>

      <section className="bg-white px-6 py-20 sm:py-24">
        <div className="mx-auto max-w-4xl space-y-16">
          {steps.map((step) => (
            <div key={step.num} className="flex flex-col sm:flex-row gap-6 sm:gap-12">
              <span className="shrink-0 font-display text-6xl text-ochre/60" aria-hidden="true">{step.num}</span>
              <div>
                <h2 className="font-display text-2xl sm:text-3xl text-slate-deep">{step.title}</h2>
                <p className="mt-4 text-stone text-lg leading-relaxed">{step.description}</p>
                <ul className="mt-6 space-y-3">
                  {step.details.map((detail) => (
                    <li key={detail} className="flex items-start gap-3">
                      <span className="mt-2 block h-1.5 w-1.5 shrink-0 rounded-full bg-forest" aria-hidden="true" />
                      <span className="text-stone leading-relaxed">{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-parchment px-6 py-20 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <p className="text-sm font-medium uppercase tracking-widest text-ochre">Your Options</p>
            <h2 className="mt-3 font-display text-3xl sm:text-4xl text-slate-deep">Three ways to make your pilgrimage</h2>
          </div>
          <PilgrimageOptions />
        </div>
      </section>

      <section className="bg-white px-6 py-20 sm:py-24">
        <div className="mx-auto max-w-3xl">
          <div className="text-center mb-12">
            <p className="text-sm font-medium uppercase tracking-widest text-ochre">Common Questions</p>
            <h2 className="mt-3 font-display text-3xl sm:text-4xl text-slate-deep">Before you set out</h2>
          </div>
          <div className="divide-y divide-slate-deep/10">
            {faqs.map((faq) => (
              <div key={faq.question} className="py-7 first:pt-0 last:pb-0">
                <h3 className="font-display text-xl text-slate-deep">{faq.question}</h3>
                <p className="mt-3 text-stone leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-forest px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl sm:text-4xl text-white">Find the right journey for you.</h2>
          <p className="mt-4 text-white/80 text-lg">Tell us where you would like to walk and how much you would like us to arrange.</p>
          <Link href="/enquire" className="mt-8 inline-block bg-white text-forest px-8 py-3.5 rounded-md text-base font-medium hover:bg-parchment transition-colors">Send an Enquiry</Link>
        </div>
      </section>
    </div>
  );
}
