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

const startupImages = [
  {
    href: "/pwa/splash/splash-1290x2796.png",
    media:
      "(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)",
  },
  {
    href: "/pwa/splash/splash-1284x2778.png",
    media:
      "(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)",
  },
  {
    href: "/pwa/splash/splash-1179x2556.png",
    media:
      "(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)",
  },
  {
    href: "/pwa/splash/splash-1170x2532.png",
    media:
      "(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)",
  },
  {
    href: "/pwa/splash/splash-1125x2436.png",
    media:
      "(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)",
  },
  {
    href: "/pwa/splash/splash-1080x2340.png",
    media:
      "(device-width: 360px) and (device-height: 780px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)",
  },
  {
    href: "/pwa/splash/splash-1242x2688.png",
    media:
      "(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)",
  },
  {
    href: "/pwa/splash/splash-828x1792.png",
    media:
      "(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)",
  },
  {
    href: "/pwa/splash/splash-1242x2208.png",
    media:
      "(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)",
  },
  {
    href: "/pwa/splash/splash-750x1334.png",
    media:
      "(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)",
  },
  {
    href: "/pwa/splash/splash-640x1136.png",
    media:
      "(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)",
  },
  {
    href: "/pwa/splash/splash-2048x2732.png",
    media:
      "(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)",
  },
  {
    href: "/pwa/splash/splash-1668x2388.png",
    media:
      "(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)",
  },
  {
    href: "/pwa/splash/splash-1640x2360.png",
    media:
      "(device-width: 820px) and (device-height: 1180px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)",
  },
  {
    href: "/pwa/splash/splash-1668x2224.png",
    media:
      "(device-width: 834px) and (device-height: 1112px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)",
  },
  {
    href: "/pwa/splash/splash-1620x2160.png",
    media:
      "(device-width: 810px) and (device-height: 1080px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)",
  },
  {
    href: "/pwa/splash/splash-1536x2048.png",
    media:
      "(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)",
  },
  {
    href: "/pwa/splash/splash-1488x2266.png",
    media:
      "(device-width: 744px) and (device-height: 1133px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)",
  },
];

export default function Head() {
  const heroUrl = hero.background.url;
  return (
    <>
      <link rel="preconnect" href="https://res.cloudinary.com" crossOrigin="" />
      <link rel="preload" as="image" href={heroUrl} fetchPriority="high" />
      {startupImages.map((image) => (
        <link
          key={image.href}
          rel="apple-touch-startup-image"
          href={image.href}
          media={image.media}
        />
      ))}

      {/* nosemgrep: trusted static inline script (static string) */}
      <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
    </>
  );
}
