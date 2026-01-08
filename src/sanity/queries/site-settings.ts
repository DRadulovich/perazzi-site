import "server-only";

import { groq } from "next-sanity";

import { sanityFetch } from "../lib/live";
import type {
  SiteSettingsData,
  SiteNavCtas,
  SiteNavFlyouts,
  SiteStoreLink,
  SiteNavLink,
  SiteNavFlyoutExperienceSection,
  SiteNavFlyoutHeritageColumn,
  SiteNavFlyoutShotguns,
  SiteFooter,
  JournalUi,
  CtaDefaults,
} from "@/types/site-settings";

type SiteSettingsResponse = {
  brandLabel?: string | null;
  nav?: Array<{ label?: string | null; href?: string | null }> | null;
  navFlyouts?: {
    shotguns?: SiteNavFlyoutShotguns | null;
    experience?: {
      sections?: SiteNavFlyoutExperienceSection[] | null;
      footerCtaLabel?: string | null;
      footerCtaHref?: string | null;
    } | null;
    heritage?: {
      heading?: string | null;
      description?: string | null;
      ctaLabel?: string | null;
      ctaHref?: string | null;
      columns?: SiteNavFlyoutHeritageColumn[] | null;
    } | null;
  } | null;
  navCtas?: {
    buildPlanner?: { label?: string | null; href?: string | null } | null;
  } | null;
  storeLink?: { label?: string | null; href?: string | null } | null;
  footer?: {
    brandLabel?: string | null;
    description?: string | null;
    addressLine?: string | null;
    legalLinks?: Array<{ label?: string | null; href?: string | null }> | null;
    columns?: Array<{
      title?: string | null;
      links?: Array<{ label?: string | null; href?: string | null }> | null;
    }> | null;
  } | null;
  journalUi?: {
    heroLabel?: string | null;
    categoryLabel?: string | null;
    featuredLabel?: string | null;
    search?: {
      label?: string | null;
      placeholder?: string | null;
      buttonLabel?: string | null;
    } | null;
    newsletter?: {
      heading?: string | null;
      body?: string | null;
      inputLabel?: string | null;
      inputPlaceholder?: string | null;
      submitLabel?: string | null;
      successMessage?: string | null;
    } | null;
  } | null;
  ctaDefaults?: {
    heading?: string | null;
  } | null;
};

const siteSettingsQuery = groq`
  *[_type == "siteSettings"][0]{
    brandLabel,
    nav[]{
      label,
      href
    },
    navFlyouts{
      shotguns{
        heading,
        description,
        ctaLabel,
        ctaHref,
        cards[]{
          title,
          description,
          href
        }
      },
      experience{
        sections[]{
          label,
          links[]{
            label,
            href
          }
        },
        footerCtaLabel,
        footerCtaHref
      },
      heritage{
        heading,
        description,
        ctaLabel,
        ctaHref,
        columns[]{
          title,
          links[]{
            label,
            href
          }
        }
      }
    },
    navCtas{
      buildPlanner{
        label,
        href
      }
    },
    storeLink{
      label,
      href
    },
    footer{
      brandLabel,
      description,
      addressLine,
      legalLinks[]{
        label,
        href
      },
      columns[]{
        title,
        links[]{
          label,
          href
        }
      }
    },
    journalUi{
      heroLabel,
      categoryLabel,
      featuredLabel,
      search{
        label,
        placeholder,
        buttonLabel
      },
      newsletter{
        heading,
        body,
        inputLabel,
        inputPlaceholder,
        submitLabel,
        successMessage
      }
    },
    ctaDefaults{
      heading
    }
  }
`;

const hasValue = (value?: string | null): value is string => Boolean(value && value.trim().length > 0);

type RawNavLink = { label?: string | null; href?: string | null } | null;

const mapLinks = (links?: RawNavLink[] | null): SiteNavLink[] | undefined =>
  links
    ?.filter(
      (link): link is { label: string; href: string } =>
        hasValue(link?.label) && hasValue(link?.href),
    )
    .map((link) => ({
      label: link.label.trim(),
      href: link.href.trim(),
    }));

const mapNavFlyouts = (
  navFlyouts?: SiteSettingsResponse["navFlyouts"] | null,
): SiteNavFlyouts | undefined => {
  if (!navFlyouts) return undefined;

  const experience = navFlyouts.experience
    ? {
        sections: navFlyouts.experience.sections ?? undefined,
        footerCtaLabel: navFlyouts.experience.footerCtaLabel ?? undefined,
        footerCtaHref: navFlyouts.experience.footerCtaHref ?? undefined,
      }
    : undefined;

  const heritage = navFlyouts.heritage
    ? {
        heading: navFlyouts.heritage.heading ?? undefined,
        description: navFlyouts.heritage.description ?? undefined,
        ctaLabel: navFlyouts.heritage.ctaLabel ?? undefined,
        ctaHref: navFlyouts.heritage.ctaHref ?? undefined,
        columns: navFlyouts.heritage.columns ?? undefined,
      }
    : undefined;

  return {
    shotguns: navFlyouts.shotguns ?? undefined,
    experience,
    heritage,
  };
};

const mapNavCtas = (navCtas?: SiteSettingsResponse["navCtas"] | null): SiteNavCtas | undefined => {
  const buildPlanner = navCtas?.buildPlanner;
  if (!buildPlanner?.label && !buildPlanner?.href) return undefined;
  return {
    buildPlanner: {
      label: buildPlanner.label ?? undefined,
      href: buildPlanner.href ?? undefined,
    },
  };
};

const mapStoreLink = (storeLink?: SiteSettingsResponse["storeLink"] | null): SiteStoreLink | undefined => {
  if (!storeLink?.label && !storeLink?.href) return undefined;
  return {
    label: storeLink.label ?? undefined,
    href: storeLink.href ?? undefined,
  };
};

const mapFooter = (footer?: SiteSettingsResponse["footer"] | null): SiteFooter | undefined => {
  if (!footer) return undefined;
  const columns = footer.columns
    ?.map((column) => ({
      title: column.title ?? undefined,
      links: mapLinks(column.links ?? undefined),
    }))
    .filter((column) => column.title || (column.links?.length ?? 0) > 0);

  return {
    brandLabel: footer.brandLabel ?? undefined,
    description: footer.description ?? undefined,
    addressLine: footer.addressLine ?? undefined,
    legalLinks: mapLinks(footer.legalLinks ?? undefined),
    columns,
  };
};

const mapJournalUi = (journalUi?: SiteSettingsResponse["journalUi"] | null): JournalUi | undefined => {
  if (!journalUi) return undefined;
  return {
    heroLabel: journalUi.heroLabel ?? undefined,
    categoryLabel: journalUi.categoryLabel ?? undefined,
    featuredLabel: journalUi.featuredLabel ?? undefined,
    search: journalUi.search
      ? {
          label: journalUi.search.label ?? undefined,
          placeholder: journalUi.search.placeholder ?? undefined,
          buttonLabel: journalUi.search.buttonLabel ?? undefined,
        }
      : undefined,
    newsletter: journalUi.newsletter
      ? {
          heading: journalUi.newsletter.heading ?? undefined,
          body: journalUi.newsletter.body ?? undefined,
          inputLabel: journalUi.newsletter.inputLabel ?? undefined,
          inputPlaceholder: journalUi.newsletter.inputPlaceholder ?? undefined,
          submitLabel: journalUi.newsletter.submitLabel ?? undefined,
          successMessage: journalUi.newsletter.successMessage ?? undefined,
        }
      : undefined,
  };
};

const mapCtaDefaults = (ctaDefaults?: SiteSettingsResponse["ctaDefaults"] | null): CtaDefaults | undefined =>
  ctaDefaults
    ? {
        heading: ctaDefaults.heading ?? undefined,
      }
    : undefined;

export async function getSiteSettings(): Promise<SiteSettingsData | null> {
  const result = await sanityFetch({
    query: siteSettingsQuery,
    stega: true,
  }).catch(() => ({ data: null }));
  const data = (result?.data as SiteSettingsResponse | null) ?? null;
  if (!data) return null;

  return {
    brandLabel: hasValue(data.brandLabel) ? data.brandLabel : undefined,
    nav: mapLinks(data.nav ?? undefined),
    navFlyouts: mapNavFlyouts(data.navFlyouts),
    navCtas: mapNavCtas(data.navCtas),
    storeLink: mapStoreLink(data.storeLink),
    footer: mapFooter(data.footer),
    journalUi: mapJournalUi(data.journalUi),
    ctaDefaults: mapCtaDefaults(data.ctaDefaults),
  };
}
