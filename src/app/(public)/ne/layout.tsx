import Link from "next/link";

const LINKS = [
  { href: "/ne", label: "गृहपृष्ठ" },
  { href: "/ne/live", label: "लाइभ स्कोर" },
  { href: "/ne/fixtures", label: "खेल तालिका" },
  { href: "/ne/results", label: "नतिजा" },
  { href: "/ne/points-table", label: "अंक तालिका" },
  { href: "/ne/teams", label: "टोली" },
  { href: "/ne/players", label: "खेलाडी" },
  { href: "/ne/statistics", label: "तथ्याङ्क" },
  { href: "/ne/news", label: "समाचार" },
  { href: "/ne/fan-zone", label: "फ्यान जोन" },
];

export default function NepaliLayout({ children }: { children: React.ReactNode }) {
  return (
    <div lang="ne">
      <nav aria-label="नेपाली नेभिगेसन" className="border-b border-border bg-surface">
        <div className="container-page flex gap-1 overflow-x-auto py-2 scrollbar-none">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              hrefLang="ne"
              className="shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-primary"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </nav>
      {children}
    </div>
  );
}
