import { AppLink } from "@/components/ui/app-link";

import type { Locale } from "@/lib/i18n/locales";
import { withLocale } from "@/lib/i18n/paths";
import { featureTiles, type FeatureTile } from "@/lib/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type FeatureGridProps = {
  title?: string;
  subtitle?: string;
  items?: FeatureTile[];
  modulesLabel?: string;
  locale?: Locale;
  className?: string;
};

export function FeatureGrid({
  title = "",
  subtitle = "",
  items = featureTiles,
  modulesLabel = "",
  locale,
  className
}: FeatureGridProps) {
  const countLabel = modulesLabel ? `${items.length} ${modulesLabel}` : String(items.length);

  return (
    <section className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        {(title || subtitle) ? (
          <div>
            {title ? <h2 className="text-lg font-semibold">{title}</h2> : null}
            {subtitle ? <p className="text-sm text-muted-foreground">{subtitle}</p> : null}
          </div>
        ) : <div />}
        <Badge variant="outline">{countLabel}</Badge>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <AppLink key={item.href} href={locale ? withLocale(locale, item.href) : item.href}>
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
          </AppLink>
        ))}
      </div>
    </section>
  );
}
