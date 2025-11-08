import type { NextIntlConfig } from 'next-intl';
import { DEFAULT_LOCALE, locales } from './src/i18n/locales';

const config: NextIntlConfig = {
  locales,
  defaultLocale: DEFAULT_LOCALE,
};

export default config;
