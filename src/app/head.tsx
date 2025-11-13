import { hero } from "@/content/home";

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
      <link rel="preload" as="image" href={heroUrl} fetchPriority="high" />
      <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
    </>
  );
}
