import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "سَنَد — صندوق تكافل العائلة",
    short_name: "سَنَد",
    description: "صندوق التعاضد والتكاتف العائلي — شفافية كاملة لكل الأعضاء",
    start_url: "/",
    display: "standalone",
    background_color: "#0F172A",
    theme_color: "#0F172A",
    icons: [
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
