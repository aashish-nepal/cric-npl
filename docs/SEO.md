# SEO strategy

## On-page metadata

Every public page exports typed `metadata` (Next App Router):

- unique `<title>` + `description` per route, generated from live data
  (teams, players, matches, articles) — never duplicated between pages;
- canonical URLs built from `NEXT_PUBLIC_SITE_URL`;
- Open Graph + Twitter cards with `og:type`, `og:image` patterns (article image fallback);
- `robots` directives: admin pages and search/filters are `noindex, follow`; everything
  else indexable.

## Structured data (JSON-LD)

Rendered server-side, validated against schema.org types:

- `SportsEvent` on match pages (with team, venue, date, status)
- `SportsTeam` on team pages, `Person` (athlete) on player pages
- `Article` + `BreadcrumbList` on news article pages, `BreadcrumbList` sitewide
- `WebSite` + `SearchAction` on the homepage

## Sitemap & robots

- `src/app/sitemap.ts` — dynamic sitemap including static routes and every
  published article, match, team, player, season, venue and guide. Demo backend
  drives it locally; the Supabase adapter drives it in production.
- Editorial and corrections policy pages are public, canonical and included in the
  sitemap.
- `src/app/robots.ts` — allows all crawlers, blocks `/admin`, `/api`, `/auth`,
  and links the sitemap.

## Multilingual (`/ne`)

- `/ne` ships a fully-translated Nepali landing page with `lang="ne"` metadata.
- Localized section routes are live: `/ne/live`, `/ne/fixtures`, `/ne/results`,
  `/ne/points-table`, `/ne/teams`, `/ne/players`, `/ne/statistics`, `/ne/news`,
  `/ne/seasons`, `/ne/venues` and `/ne/fan-zone`.
- Each localized route emits `alternates.languages` (`en` ↔ `ne`) and the English
  counterparts emit the matching pair, so crawlers receive reciprocal hreflang hints.
- Proper nouns (team, player and venue names) are intentionally not machine-translated;
  editorial articles remain in their authored language and the Nepali index labels this
  explicitly.

## Performance budget

- Mobile-first CSS via Tailwind, no client JS on static content pages except islands
  (search dialog, mobile nav, scoring console — all admin or opt-in).
- Streaming/staged loading: above-the-fold scorecards render first; below-fold lists
  are data-driven and cache-friendly.
- Fonts are self-hosted (`next/font`), images are SVG/initials only.
- Vitals targets: LCP < 2.5s on 4G mobile demo data, CLS ~ 0 (layout reserved), all
  interactive elements ≥ 44px touch targets.

## Monitoring checklist (post-deploy)

1. Search Console: submit sitemap, verify structured data for one page per type.
2. Lighthouse mobile run ≥ 90 on home / live / scorecard.
3. Verify `robots.txt` disallows `/admin` and the sitemap URL returns 200.
4. Check `view-source:` JSON-LD blocks with Google Rich Results test.
