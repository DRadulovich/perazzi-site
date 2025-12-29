"use client";

import { useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { locales } from "@/i18n/locales";

export function LocaleSwitcher() {
  const t = useTranslations("LocaleSwitcher");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const handleChange = (nextLocale: string) => {
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    if (nextLocale) {
      params.set("locale", nextLocale);
    } else {
      params.delete("locale");
    }
    const query = params.toString();
    startTransition(() => {
      router.replace(query ? `${pathname}?${query}` : pathname);
    });
  };

  return (
    <label className="flex items-center gap-2 type-body-sm text-ink">
      <span>{t("label")}</span>
      <select
        className="min-h-10 rounded-xl border border-border bg-transparent px-3 py-2 type-body-sm focus-ring"
        value={locale}
        onChange={(event) => { handleChange(event.target.value); }}
        disabled={isPending}
      >
        {locales.map((value) => (
          <option key={value} value={value}>
            {t(`options.${value}`)}
          </option>
        ))}
      </select>
    </label>
  );
}
