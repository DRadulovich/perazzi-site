import { startupImages } from "@/lib/pwa-startup-images";

export default function Head() {
  return (
    <>
      <link rel="preconnect" href="https://cdn.sanity.io" crossOrigin="anonymous" />
      <link rel="preconnect" href="https://use.typekit.net" crossOrigin="anonymous" />
      <link rel="preconnect" href="https://p.typekit.net" crossOrigin="anonymous" />
      {startupImages.map((image) => (
        <link
          key={image.href}
          rel="apple-touch-startup-image"
          href={image.href}
          media={image.media}
        />
      ))}
    </>
  );
}
