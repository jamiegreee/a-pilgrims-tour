import Link from "next/link";

const footerLinks = [
  { href: "/routes", label: "Routes" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function Footer() {
  return (
    <footer className="bg-slate-deep text-parchment/70">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-8 px-6 py-12 md:flex-row md:justify-between">
        {/* Wordmark */}
        <Link
          href="/"
          className="font-display text-lg font-semibold tracking-tight text-parchment"
        >
          A Pilgrim&rsquo;s Tour
        </Link>

        {/* Links */}
        <nav className="flex flex-wrap justify-center gap-6">
          {footerLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm transition-colors hover:text-parchment"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Copyright */}
        <p className="text-sm">&copy; 2026 A Pilgrim&rsquo;s Tour</p>
      </div>
    </footer>
  );
}
