import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "CROW MARKET · Crea, vende y escala productos digitales con IA",
    template: "%s · CROW MARKET",
  },
  description:
    "CROW MARKET es la plataforma premium donde creadores convierten ideas en productos digitales con IA y afiliados escalan sus ingresos con una red de 5 niveles.",
  keywords: [
    "marketplace digital",
    "creador de cursos",
    "IA para crear cursos",
    "afiliados",
    "USDT",
  ],
  openGraph: {
    title: "CROW MARKET",
    description:
      "La nueva generación de afiliados y creadores con IA. Crea, publica y vende infoproductos con comisiones de 5 niveles.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className="dark">
      <body className="min-h-screen bg-crow-black font-sans antialiased">
        <div className="pointer-events-none fixed inset-0 -z-10 opacity-[0.55] [background:radial-gradient(1200px_600px_at_50%_-200px,rgba(106,0,255,0.22),transparent_70%)]" />
        {children}
      </body>
    </html>
  );
}