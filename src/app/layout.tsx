import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Postei",
  description: "Posts de Instagram prontos, com a sua marca, todo dia.",
  // iPhone: ao adicionar à tela inicial, abre como app (sem a barra do navegador)
  appleWebApp: { capable: true, title: "Postei", statusBarStyle: "default" },
};

export const viewport = { themeColor: "#0E1330" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-neutral-50 text-neutral-900 font-sans">
        {children}
      </body>
    </html>
  );
}
