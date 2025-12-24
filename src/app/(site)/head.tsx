import { startupImages } from "@/lib/pwa-startup-images";

export default function Head() {
  return (
    <>
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
