import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Perazzi USA",
    short_name: "Perazzi USA",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    theme_color: "#DB1022",
    background_color: "#FFFFFF",
    icons: [
      {
        src: "/pwa/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any maskable",
      },
      {
        src: "/pwa/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any maskable",
      },
      {
        src: "/pwa/icon-1024.png",
        sizes: "1024x1024",
        type: "image/png",
        purpose: "any maskable",
      },
    ],
  };
}
