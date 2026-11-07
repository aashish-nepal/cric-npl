export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

export function absoluteUrl(path: string): string {
  return `${siteUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "SportsOrganization",
    name: "NPL Cricket Hub",
    url: siteUrl(),
    description:
      "Independent Nepal Premier League coverage: live scores, statistics, fixtures, results and editorial.",
    sport: "Cricket",
    areaServed: { "@type": "Country", name: "Nepal" },
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "NPL Cricket Hub",
    url: siteUrl(),
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteUrl()}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function breadcrumbJsonLd(items: Array<{ name: string; path: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function sportsEventJsonLd(input: {
  name: string;
  startDate: string;
  url: string;
  venueName: string;
  city: string;
  homeName: string;
  awayName: string;
  status: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    name: input.name,
    startDate: input.startDate,
    eventStatus:
      input.status === "completed"
        ? "https://schema.org/EventScheduled"
        : "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: {
      "@type": "Place",
      name: input.venueName,
      address: { "@type": "PostalAddress", addressLocality: input.city, addressCountry: "NP" },
    },
    competitor: [
      { "@type": "SportsTeam", name: input.homeName },
      { "@type": "SportsTeam", name: input.awayName },
    ],
    url: input.url,
  };
}
