import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "How It Works — A Pilgrim's Tour",
  description:
    'You choose the path. We take care of the rest. Learn how our self-guided pilgrimage planning works.',
};

const steps = [
  {
    num: '01',
    title: 'Choose your route',
    description:
      'Start by exploring our four pilgrimage routes. Each has its own character — from the social energy of the Camino de Santiago to the forest solitude of the Kumano Kodo. Not sure which is right for you? Get in touch and we will help you decide based on your interests, fitness level, and the kind of experience you are looking for.',
    details: [
      'Browse detailed route descriptions with day-by-day breakdowns',
      'Compare distances, difficulty levels, and best travel seasons',
      'Read about the history and spiritual traditions of each path',
      'Talk to us — we have walked every route ourselves',
    ],
  },
  {
    num: '02',
    title: 'We plan everything',
    description:
      'Once you have chosen your route, our team builds a fully personalised itinerary. We book your accommodation, arrange daily luggage transfers, prepare detailed walking notes, and set up local support so that if anything changes on the road, help is always a phone call away.',
    details: [
      'Hand-picked accommodation — private rooms in quality guesthouses, family hotels, and historic inns',
      'Daily luggage transfers so you walk with only a daypack',
      'Detailed route notes with maps, elevation profiles, and points of interest',
      'Flexible scheduling — walk as far as you like each day, with options to shorten or extend stages',
      '24/7 local support phone line for on-the-ground assistance',
    ],
  },
  {
    num: '03',
    title: 'You walk',
    description:
      'This is the part that matters. With the logistics handled, you are free to walk at your own pace, stop when something catches your eye, linger over a long lunch, or push on to the next village. There is no group to keep up with, no guide setting the pace. Just you, the path, and whatever you came to find.',
    details: [
      'Walk at your own pace — there is no schedule to keep',
      'Your bags arrive at each night\'s accommodation before you do',
      'Eat where and when you like — our notes include local restaurant recommendations',
      'Rest days built in where you want them',
      'Complete independence with the safety net of professional support',
    ],
  },
];

const faqs = [
  {
    question: 'Do I need to be fit?',
    answer:
      'You need to be able to walk for several hours a day, but you do not need to be an athlete. Most of our pilgrims are regular walkers, not marathon runners. We tailor stage lengths to your fitness level and can build in rest days wherever you need them. The most important preparation is getting comfortable walking 15–20 km in a day with a light daypack, which most people can achieve with a few weeks of regular walking beforehand.',
  },
  {
    question: 'What if I need to change plans on the road?',
    answer:
      'Plans change — we understand that completely. If you need to skip a stage, take an extra rest day, or adjust your route, call our local support line and we will rearrange accommodation and luggage transfers. There may be a small rebooking fee depending on notice, but we will always do our best to accommodate changes. Flexibility is built into our service.',
  },
  {
    question: 'Can I walk with a partner or small group?',
    answer:
      'Absolutely. Many of our pilgrims walk with a partner, friend, or small group. We book shared or adjacent rooms and can tailor the itinerary to accommodate different fitness levels within the group — for example, offering a shorter alternative stage for one person while the other takes the full route. Pricing is per person, with discounts for groups of three or more.',
  },
  {
    question: 'How much does it cost?',
    answer:
      'Pricing depends on the route, the duration, the time of year, and the level of accommodation you prefer. As a guide, the Camino de Santiago (30–35 days) typically costs between £2,800 and £3,600 per person, while the shorter Kumano Kodo (5–7 days) ranges from £1,400 to £1,900. We provide a detailed, transparent quote after your initial enquiry — no hidden fees, no surprises.',
  },
];

export default function HowItWorksPage() {
  return (
    <main>
      {/* Hero */}
      <section className="bg-parchment px-6 py-28 sm:py-36 text-center">
        <div className="mx-auto max-w-3xl">
          <h1
            className="text-4xl sm:text-5xl text-slate-deep leading-tight"
            style={{ fontFamily: 'var(--font-eb-garamond)' }}
          >
            You choose the path.
            <br />
            We take care of the rest.
          </h1>
          <p className="mt-6 text-lg text-stone max-w-2xl mx-auto leading-relaxed">
            A self-guided pilgrimage means total freedom with total support.
            Here is exactly how it works.
          </p>
        </div>
      </section>

      {/* Steps */}
      <section className="bg-white px-6 py-24">
        <div className="mx-auto max-w-4xl space-y-24">
          {steps.map((step) => (
            <div key={step.num} className="flex flex-col sm:flex-row gap-8 sm:gap-16">
              <div className="shrink-0">
                <span
                  className="block text-7xl font-bold text-ochre/30"
                  style={{ fontFamily: 'var(--font-eb-garamond)' }}
                >
                  {step.num}
                </span>
              </div>
              <div>
                <h2
                  className="text-2xl sm:text-3xl text-slate-deep"
                  style={{ fontFamily: 'var(--font-eb-garamond)' }}
                >
                  {step.title}
                </h2>
                <p className="mt-4 text-stone text-lg leading-relaxed">
                  {step.description}
                </p>
                <ul className="mt-6 space-y-3">
                  {step.details.map((detail) => (
                    <li key={detail} className="flex items-start gap-3">
                      <span className="mt-1.5 block h-1.5 w-1.5 shrink-0 rounded-full bg-forest" />
                      <span className="text-stone leading-relaxed">{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-parchment px-6 py-24">
        <div className="mx-auto max-w-3xl">
          <div className="text-center mb-16">
            <p className="text-sm font-medium uppercase tracking-widest text-ochre">
              Common Questions
            </p>
            <h2
              className="mt-3 text-3xl sm:text-4xl text-slate-deep"
              style={{ fontFamily: 'var(--font-eb-garamond)' }}
            >
              Frequently Asked
            </h2>
          </div>

          <div className="space-y-10">
            {faqs.map((faq) => (
              <div key={faq.question}>
                <h3
                  className="text-xl text-slate-deep"
                  style={{ fontFamily: 'var(--font-eb-garamond)' }}
                >
                  {faq.question}
                </h3>
                <p className="mt-3 text-stone leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-forest px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2
            className="text-3xl sm:text-4xl text-white"
            style={{ fontFamily: 'var(--font-eb-garamond)' }}
          >
            Still have questions?
          </h2>
          <p className="mt-4 text-white/80 text-lg">
            We love talking about pilgrimage. Get in touch and we will help you
            find the right path.
          </p>
          <Link
            href="/enquire"
            className="mt-8 inline-block bg-white text-forest px-8 py-3.5 rounded-md text-base font-medium hover:bg-parchment transition-colors"
          >
            Send an Enquiry
          </Link>
        </div>
      </section>
    </main>
  );
}
