import { LocaleProvider } from "@/components/providers/locale-provider";
import { defaultLocale, isLocale } from "@/lib/i18n/locales";

type LocaleLayoutProps = {
  children: React.ReactNode;
  params: {
    locale: string;
  };
};

export default function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;
  return <LocaleProvider locale={locale}>{children}</LocaleProvider>;
}

