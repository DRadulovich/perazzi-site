// nosemgrep: disable false positive for template literals in static string below
import { hero } from "@/content/home";

// nosemgrep: inline JS self-executing theme setter is static and vetted
const themeInitScript = `
(function() {
  try {
    var stored = localStorage.getItem('theme');
    var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    var theme = stored === 'dark' || stored === 'light' ? stored : (prefersDark ? 'dark' : 'light');
    document.documentElement.dataset.theme = theme;
    document.cookie = 'theme=' + theme + '; path=/; max-age=31536000';
  } catch (e) {}
})();
`;

export default function Head() {
  const heroUrl = hero.background.url;
  return (
    <>
      <link rel="preconnect" href="https://res.cloudinary.com" crossOrigin="" />
      <link rel="stylesheet" href="https://use.typekit.net/sgz5dmx.css" />
      <link rel="preload" as="image" href={heroUrl} fetchPriority="high" />

      {/* nosemgrep: trusted static inline script (static string) */}
      <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
    </>
  );
}
