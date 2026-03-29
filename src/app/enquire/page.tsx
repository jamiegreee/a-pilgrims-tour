'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import type { FormEvent } from 'react';

const routeOptions = [
  'Camino de Santiago',
  'Via Francigena',
  'Kumano Kodo',
  "St Olav\u2019s Way",
  "St Cuthbert\u2019s Way",
  "The Pilgrims\u2019 Way",
  "St Michael\u2019s Way",
  "North Wales Pilgrim\u2019s Way",
  "St Hilda\u2019s Way",
  "The Saints\u2019 Way",
  'Not sure yet',
];

const tourTypeOptions = ['Self-Guided', 'Group Tour'];
const groupSizes = ['1', '2', '3\u20134', '5+'];
const paceOptions = ['Relaxed', 'Moderate', 'Challenging'];

function EnquireForm() {
  const searchParams = useSearchParams();
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    route: '',
    tourType: '',
    dates: '',
    groupSize: '1',
    pace: 'Moderate',
    message: '',
  });

  useEffect(() => {
    const routeParam = searchParams.get('route') ?? '';
    const typeParam = searchParams.get('type') ?? '';
    const tourType =
      typeParam === 'group' ? 'Group Tour' :
      typeParam === 'self-guided' ? 'Self-Guided' : '';
    if (routeParam || tourType) {
      setForm((prev) => ({
        ...prev,
        route: routeParam || prev.route,
        tourType: tourType || prev.tourType,
      }));
    }
  }, [searchParams]);

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/enquire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        throw new Error('Something went wrong. Please try again.');
      }

      setSubmitted(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Something went wrong. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <main className="bg-parchment px-6 py-28 sm:py-36">
        <div className="mx-auto max-w-xl text-center">
          <h1
            className="text-4xl text-slate-deep"
            style={{ fontFamily: 'var(--font-eb-garamond)' }}
          >
            Thank you.
          </h1>
          <p className="mt-6 text-lg text-stone leading-relaxed">
            We have received your enquiry and will be in touch within 48 hours.
            In the meantime, you might like to read more about{' '}
            <a href="/how-it-works" className="text-forest underline">
              how our service works
            </a>
            .
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-parchment px-6 py-20 sm:py-28">
      <div className="mx-auto max-w-2xl">
        <div className="text-center mb-12">
          <h1
            className="text-4xl sm:text-5xl text-slate-deep"
            style={{ fontFamily: 'var(--font-eb-garamond)' }}
          >
            Begin your journey
          </h1>
          <p className="mt-4 text-lg text-stone">
            Tell us a little about yourself and the pilgrimage you have in mind.
            We will come back to you with a personalised proposal.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name */}
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-slate-deep mb-1.5"
            >
              Name <span className="text-ochre">*</span>
            </label>
            <input
              id="name"
              type="text"
              required
              value={form.name}
              onChange={(e) => updateField('name', e.target.value)}
              className="w-full rounded-md border border-stone/20 bg-white px-4 py-3 text-slate-deep placeholder:text-stone/50 focus:border-forest focus:ring-1 focus:ring-forest outline-none"
              placeholder="Your full name"
            />
          </div>

          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-slate-deep mb-1.5"
            >
              Email <span className="text-ochre">*</span>
            </label>
            <input
              id="email"
              type="email"
              required
              value={form.email}
              onChange={(e) => updateField('email', e.target.value)}
              className="w-full rounded-md border border-stone/20 bg-white px-4 py-3 text-slate-deep placeholder:text-stone/50 focus:border-forest focus:ring-1 focus:ring-forest outline-none"
              placeholder="you@example.com"
            />
          </div>

          {/* Phone */}
          <div>
            <label
              htmlFor="phone"
              className="block text-sm font-medium text-slate-deep mb-1.5"
            >
              Phone{' '}
              <span className="text-stone text-xs font-normal">(optional)</span>
            </label>
            <input
              id="phone"
              type="tel"
              value={form.phone}
              onChange={(e) => updateField('phone', e.target.value)}
              className="w-full rounded-md border border-stone/20 bg-white px-4 py-3 text-slate-deep placeholder:text-stone/50 focus:border-forest focus:ring-1 focus:ring-forest outline-none"
              placeholder="+44 7700 900000"
            />
          </div>

          {/* Route Interest + Tour Type */}
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label
                htmlFor="route"
                className="block text-sm font-medium text-slate-deep mb-1.5"
              >
                Route interest <span className="text-ochre">*</span>
              </label>
              <select
                id="route"
                required
                value={form.route}
                onChange={(e) => updateField('route', e.target.value)}
                className="w-full rounded-md border border-stone/20 bg-white px-4 py-3 text-slate-deep focus:border-forest focus:ring-1 focus:ring-forest outline-none"
              >
                <option value="" disabled>
                  Select a route
                </option>
                {routeOptions.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="tourType"
                className="block text-sm font-medium text-slate-deep mb-1.5"
              >
                Tour type
              </label>
              <select
                id="tourType"
                value={form.tourType}
                onChange={(e) => updateField('tourType', e.target.value)}
                className="w-full rounded-md border border-stone/20 bg-white px-4 py-3 text-slate-deep focus:border-forest focus:ring-1 focus:ring-forest outline-none"
              >
                <option value="">No preference</option>
                {tourTypeOptions.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Preferred Dates */}
          <div>
            <label
              htmlFor="dates"
              className="block text-sm font-medium text-slate-deep mb-1.5"
            >
              Preferred dates
            </label>
            <input
              id="dates"
              type="text"
              value={form.dates}
              onChange={(e) => updateField('dates', e.target.value)}
              className="w-full rounded-md border border-stone/20 bg-white px-4 py-3 text-slate-deep placeholder:text-stone/50 focus:border-forest focus:ring-1 focus:ring-forest outline-none"
              placeholder="e.g. September 2026, flexible"
            />
          </div>

          {/* Group Size + Pace */}
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label
                htmlFor="groupSize"
                className="block text-sm font-medium text-slate-deep mb-1.5"
              >
                Group size
              </label>
              <select
                id="groupSize"
                value={form.groupSize}
                onChange={(e) => updateField('groupSize', e.target.value)}
                className="w-full rounded-md border border-stone/20 bg-white px-4 py-3 text-slate-deep focus:border-forest focus:ring-1 focus:ring-forest outline-none"
              >
                {groupSizes.map((s) => (
                  <option key={s} value={s}>
                    {s} {s === '1' ? 'person' : 'people'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="pace"
                className="block text-sm font-medium text-slate-deep mb-1.5"
              >
                Pace preference
              </label>
              <select
                id="pace"
                value={form.pace}
                onChange={(e) => updateField('pace', e.target.value)}
                className="w-full rounded-md border border-stone/20 bg-white px-4 py-3 text-slate-deep focus:border-forest focus:ring-1 focus:ring-forest outline-none"
              >
                {paceOptions.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Message */}
          <div>
            <label
              htmlFor="message"
              className="block text-sm font-medium text-slate-deep mb-1.5"
            >
              Message
            </label>
            <textarea
              id="message"
              rows={5}
              value={form.message}
              onChange={(e) => updateField('message', e.target.value)}
              className="w-full rounded-md border border-stone/20 bg-white px-4 py-3 text-slate-deep placeholder:text-stone/50 focus:border-forest focus:ring-1 focus:ring-forest outline-none resize-y"
              placeholder="Tell us anything else — fitness level, special requirements, what you hope to get from the experience..."
            />
          </div>

          {error && (
            <p className="text-red-600 text-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-forest text-white px-8 py-3.5 rounded-md text-base font-medium hover:bg-forest/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? 'Sending...' : 'Send Enquiry'}
          </button>
        </form>
      </div>
    </main>
  );
}

export default function EnquirePage() {
  return (
    <Suspense>
      <EnquireForm />
    </Suspense>
  );
}
