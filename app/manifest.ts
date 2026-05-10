import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Tumbuh - Pendamping Digital ABK",
    short_name: "Tumbuh",
    description:
      "Platform pendamping orang tua untuk mencatat progres tumbuh kembang anak berkebutuhan khusus.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f5f8f6",
    theme_color: "#06443e",
    lang: "id",
    icons: [
      {
        src: "/images/dashboard.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/images/dashboard.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
