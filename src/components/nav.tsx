"use client";

import { useState } from "react";
import Link from "next/link";

const navLinks = [
  { href: "/routes", label: "Routes" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/about", label: "About" },
];

export function Nav() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-deep/10 bg-parchment/95 backdrop-blur-sm">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        {/* Wordmark */}
        <Link
          href="/"
          className="font-display text-xl font-semibold tracking-tight text-slate-deep"
        >
          A Pilgrim&rsquo;s Tour
        </Link>

        {/* Desktop links */}
        <div className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-stone transition-colors hover:text-slate-deep"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/enquire"
            className="rounded-md bg-forest px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-forest/90"
          >
            Begin Your Journey
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex flex-col gap-1.5 md:hidden"
          aria-label="Toggle menu"
        >
          <span
            className={`block h-0.5 w-6 bg-slate-deep transition-transform ${menuOpen ? "translate-y-2 rotate-45" : ""}`}
          />
          <span
            className={`block h-0.5 w-6 bg-slate-deep transition-opacity ${menuOpen ? "opacity-0" : ""}`}
          />
          <span
            className={`block h-0.5 w-6 bg-slate-deep transition-transform ${menuOpen ? "-translate-y-2 -rotate-45" : ""}`}
          />
        </button>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="border-t border-slate-deep/10 bg-parchment px-6 pb-6 pt-4 md:hidden">
          <div className="flex flex-col gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="text-sm font-medium text-stone transition-colors hover:text-slate-deep"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/enquire"
              onClick={() => setMenuOpen(false)}
              className="mt-2 rounded-md bg-forest px-5 py-2.5 text-center text-sm font-medium text-white transition-colors hover:bg-forest/90"
            >
              Begin Your Journey
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
