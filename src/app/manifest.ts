import type { MetadataRoute } from "next";

// Deixa o app instalável pela tela inicial do celular (sem loja de aplicativos).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Postei",
    short_name: "Postei",
    description: "Posts de Instagram prontos, com a sua marca.",
    start_url: "/app",
    display: "standalone",
    background_color: "#F6F3EA",
    theme_color: "#0E1330",
    lang: "pt-BR",
    icons: [
      { src: "/icone-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icone-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icone-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
