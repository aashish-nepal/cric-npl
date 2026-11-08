import type { Metadata } from "next";
import Link from "next/link";
import { NepaliPage, NepaliEnglishLink } from "@/components/layout/nepali-page";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "फ्यान जोन — नेपाल प्रिमियर लिग",
  description: "नेपाल प्रिमियर लिगका पोल, भविष्यवाणी, टिप्पणी र फ्यान गतिविधि।",
  alternates: { canonical: "/ne/fan-zone", languages: { en: "/fan-zone", ne: "/ne/fan-zone" } },
};

const LINKS = [
  { href: "/polls", title: "पोलहरू", description: "तपाईंको मत दिनुहोस् र अरूको मत हेर्नुहोस्।" },
  { href: "/predictions", title: "भविष्यवाणी", description: "आगामी खेलको नतिजा अनुमान गर्नुहोस्।" },
  { href: "/fan-zone", title: "फ्यान जोन", description: "टिप्पणी, बुकमार्क र फ्यान गतिविधि।" },
  { href: "/news", title: "समाचार", description: "लिगका ताजा समाचार र विश्लेषण।" },
];

export default function NepaliFanZonePage() {
  return (
    <NepaliPage
      title="फ्यान जोन"
      description="लिगसँग जोडिनुहोस्: मत दिनुहोस्, भविष्यवाणी गर्नुहोस् र बहस गर्नुहोस्।"
      actions={<NepaliEnglishLink href="/fan-zone" />}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        {LINKS.map((link) => (
          <Link key={link.href} href={link.href}>
            <Card className="h-full transition-colors hover:border-primary/40">
              <CardHeader>
                <CardTitle>{link.title}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 text-xs text-muted-foreground">{link.description}</CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </NepaliPage>
  );
}
