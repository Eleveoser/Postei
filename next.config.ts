import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Desligado: o app é quase todo dinâmico (sessão de usuário, dados do
  // Supabase por cliente) — Cache Components exigiria marcar cada rota
  // manualmente sem trazer ganho real nesta fase.
  cacheComponents: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
