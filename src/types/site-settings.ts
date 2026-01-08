export type SiteNavLink = {
  label?: string;
  href?: string;
};

export type SiteNavFlyoutCard = {
  title?: string;
  description?: string;
  href?: string;
};

export type SiteNavFlyoutShotguns = {
  heading?: string;
  description?: string;
  ctaLabel?: string;
  ctaHref?: string;
  cards?: SiteNavFlyoutCard[];
};

export type SiteNavFlyoutExperienceLink = {
  label?: string;
  href?: string;
};

export type SiteNavFlyoutExperienceSection = {
  label?: string;
  links?: SiteNavFlyoutExperienceLink[];
};

export type SiteNavFlyoutExperience = {
  sections?: SiteNavFlyoutExperienceSection[];
  footerCtaLabel?: string;
  footerCtaHref?: string;
};

export type SiteNavFlyoutHeritageColumn = {
  title?: string;
  links?: SiteNavLink[];
};

export type SiteNavFlyoutHeritage = {
  heading?: string;
  description?: string;
  ctaLabel?: string;
  ctaHref?: string;
  columns?: SiteNavFlyoutHeritageColumn[];
};

export type SiteNavFlyouts = {
  shotguns?: SiteNavFlyoutShotguns;
  experience?: SiteNavFlyoutExperience;
  heritage?: SiteNavFlyoutHeritage;
};

export type SiteNavCtas = {
  buildPlanner?: {
    label?: string;
    href?: string;
  };
};

export type SiteStoreLink = {
  label?: string;
  href?: string;
};

export type SiteFooterColumn = {
  title?: string;
  links?: SiteNavLink[];
};

export type SiteFooter = {
  brandLabel?: string;
  description?: string;
  addressLine?: string;
  legalLinks?: SiteNavLink[];
  columns?: SiteFooterColumn[];
};

export type JournalUi = {
  heroLabel?: string;
  categoryLabel?: string;
  featuredLabel?: string;
  search?: {
    label?: string;
    placeholder?: string;
    buttonLabel?: string;
  };
  newsletter?: {
    heading?: string;
    body?: string;
    inputLabel?: string;
    inputPlaceholder?: string;
    submitLabel?: string;
    successMessage?: string;
  };
};

export type CtaDefaults = {
  heading?: string;
};

export type SiteSettingsData = {
  brandLabel?: string;
  nav?: SiteNavLink[];
  navFlyouts?: SiteNavFlyouts;
  navCtas?: SiteNavCtas;
  storeLink?: SiteStoreLink;
  footer?: SiteFooter;
  journalUi?: JournalUi;
  ctaDefaults?: CtaDefaults;
};
