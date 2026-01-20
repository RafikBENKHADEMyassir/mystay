import Link from "next/link";

import type { Locale } from "@/lib/i18n/locales";
import { withLocale } from "@/lib/i18n/paths";
import { featureTiles, type FeatureTile } from "@/lib/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type FeatureGridProps = {
  title?: string;
  items?: FeatureTile[];
  locale?: Locale;
  className?: string;
};

export function FeatureGrid({ title = "Experience modules", items = featureTiles, locale, className }: FeatureGridProps) {
  return (
    <section className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="text-sm text-muted-foreground">Scaffolded routes mapped to the MyStay brief.</p>
        </div>
        <Badge variant="outline">{items.length} modules</Badge>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <Link key={item.href} href={locale ? withLocale(locale, item.href) : item.href}>
            <Card className="h-full transition hover:-translate-y-0.5 hover:shadow-md">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{item.title}</CardTitle>
                    <CardDescription>{item.description}</CardDescription>
                  </div>
                  {item.tag ? <Badge variant="secondary">{item.tag}</Badge> : null}
                </div>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
