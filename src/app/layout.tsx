import type { Metadata, Viewport } from "next";
import { Barlow_Condensed, Inter } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/context/AppContext";
import { CatalogProvider } from "@/lib/catalog/CatalogProvider";
import { MotorsportProvider } from "@/lib/motorsport/MotorsportProvider";
import { ProgressionProvider } from "@/lib/progression/ProgressionProvider";
import { Navbar } from "@/components/Navbar";
import { FooterGate } from "@/components/FooterGate";
import { Toaster } from "@/components/Toaster";

const inter = Inter({
  subsets: ["latin","latin-ext"],
  variable: "--font-sans",
  display: "swap",
});

// Sportos, kondenzált display-betű a címekhez: motorsport-plakát hangulat,
// de visszafogott – csak a nagy címek és a jelvényfeliratok használják.
const barlow = Barlow_Condensed({
  subsets: ["latin","latin-ext"],
  weight: ["500","600","700","800"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "GRIDLINE – Find your line. Set your time.",
    template: "%s · GRIDLINE",
  },
  description: "Magyar versenypályák, hitelesített köridő-ranglisták, GPS-alapú köridőmérés és versenyzői profilok egy helyen. A GRIDLINE a magyar motorsport közösség platformja. Find your line. Set your time.",
  applicationName: "GRIDLINE",
  keywords: ["versenypálya","köridő","ranglista","Hungaroring","Pannónia-Ring","Balaton Park Circuit","motorsport","GRIDLINE",
  ],
  openGraph: {
    title: "GRIDLINE – Find your line. Set your time.",
    description: "Magyar versenypályák, hitelesített köridők és versenyzői profilok. Mérd az idődet, és hasonlítsd össze a közösséggel.",
    siteName: "GRIDLINE",
    type: "website",
    locale: "hu_HU",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0b",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="hu" className={`${inter.variable} ${barlow.variable}`}>
      <body className="min-h-screen bg-ink-950 font-sans antialiased">
        <CatalogProvider>
          <MotorsportProvider>
            <AppProvider>
              <ProgressionProvider>
                <div className="relative flex min-h-screen flex-col">
                  <Navbar />
                  <main className="flex-1">{children}</main>
                  <FooterGate />
                </div>
                <Toaster />
              </ProgressionProvider>
            </AppProvider>
          </MotorsportProvider>
        </CatalogProvider>
      </body>
    </html>
  );
}
