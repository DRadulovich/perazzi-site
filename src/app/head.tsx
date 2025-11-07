import { hero } from "@/content/home";

export default function Head() {
  const heroUrl = hero.background.url;
  return (
    <>
      <link rel="preconnect" href="https://res.cloudinary.com" crossOrigin="" />
      <link rel="preload" as="image" href={heroUrl} fetchpriority="high" />
    </>
  );
}
