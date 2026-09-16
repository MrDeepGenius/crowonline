import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";

import { CrowLanding } from "@/components/landing/crow-landing";
import { CrowLandingClient } from "@/components/landing/crow-landing-client";

import "./crow-landing.css";

const displayFont = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const bodyFont = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "CROW — Creá. Publicá. Monetizá.",
  description:
    "CROW convierte una idea en un producto digital listo para vender, lo conecta con un marketplace global y te permite crecer con IA y afiliados.",
};

export default function LandingPage() {
  return (
    <div className={`${displayFont.variable} ${bodyFont.variable}`}>
      <CrowLanding />
      <CrowLandingClient />
    </div>
  );
}
