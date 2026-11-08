import Link from "next/link";
import { Rss } from "lucide-react";
import { BrandMark } from "./brand";

const columns = [
  {
    title: "Cricket",
    links: [
      { href: "/live", label: "Live scores" },
      { href: "/fixtures", label: "Fixtures" },
      { href: "/results", label: "Results" },
      { href: "/points-table", label: "Points table" },
      { href: "/statistics", label: "Statistics" },
    ],
  },
  {
    title: "Explore",
    links: [
      { href: "/teams", label: "Teams" },
      { href: "/players", label: "Players" },
      { href: "/compare", label: "Compare players" },
      { href: "/seasons", label: "Seasons" },
      { href: "/venues", label: "Venues" },
    ],
  },
  {
    title: "News & fans",
    links: [
      { href: "/news", label: "Latest news" },
      { href: "/fan-zone", label: "Fan zone" },
      { href: "/polls", label: "Polls" },
      { href: "/predictions", label: "Predictions" },
      { href: "/guides", label: "Cricket guides" },
    ],
  },
  {
    title: "Platform",
    links: [
      { href: "/about", label: "About us" },
      { href: "/contact", label: "Contact" },
      { href: "/editorial-policy", label: "Editorial policy" },
      { href: "/corrections-policy", label: "Corrections policy" },
      { href: "/privacy-policy", label: "Privacy policy" },
      { href: "/terms", label: "Terms of use" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-12 border-t border-border bg-[#0b1f16] text-white/75">
      <div className="container-page grid gap-10 py-12 lg:grid-cols-[1.4fr_2.6fr]">
        <div>
          <BrandMark className="[&_span]:text-white" />
          <p className="mt-4 max-w-sm text-sm leading-6 text-white/60">
            Independent live scores, statistics and editorial coverage of the Nepal Premier League and Nepali cricket.
          </p>
          <p className="mt-3 max-w-sm text-xs leading-5 text-white/40">
            NPL Cricket Hub is not affiliated with, endorsed by or authorised by the Nepal Premier League, its franchises or
            the Cricket Association of Nepal. Team names are used for identification only.
          </p>
          <Link
            href="/news/rss.xml"
            className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-white/70 hover:text-white"
          >
            <Rss className="h-3.5 w-3.5" aria-hidden="true" />
            News RSS feed
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {columns.map((column) => (
            <div key={column.title}>
              <h2 className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/90">{column.title}</h2>
              <ul className="mt-3 space-y-2">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-[13px] text-white/60 hover:text-white">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-page flex flex-col gap-2 py-5 text-[11px] text-white/45 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} NPL Cricket Hub. All rights reserved.</p>
          <p>Match times shown in Nepal Standard Time (UTC+05:45). Data source is displayed on every match page.</p>
        </div>
      </div>
    </footer>
  );
}
