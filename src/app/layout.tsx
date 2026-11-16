import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/context/AppContext";
import { CatalogProvider } from "@/lib/catalog/CatalogProvider";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Toaster } from "@/components/Toaster";

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "AutoFit AI – Autóalkatrész kompatibilitás platform",
    template: "%s · AutoFit AI",
  },
  description:
    "Modern autóalkatrész-kompatibilitási platform. Ellenőrizd, hogy az alkatrész illik-e a járművedhez, keress a katalógusban és kezeld a garázsodat.",
  keywords: ["autóalkatrész", "kompatibilitás", "OE szám", "alkatrészkereső", "AutoFit AI"],
};

export const viewport: Viewport = {
  themeColor: "#07080a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="hu" className={inter.variable}>
      <body className="min-h-screen bg-ink-950 font-sans antialiased">
        <CatalogProvider>
          <AppProvider>
            <div className="relative flex min-h-screen flex-col">
              <div className="pointer-events-none fixed inset-0 -z-10 bg-radial-brand" aria-hidden />
              <div className="pointer-events-none fixed inset-0 -z-10 bg-grid bg-grid-fade opacity-[0.35]" aria-hidden />
              <Navbar />
              <main className="flex-1">{children}</main>
              <Footer />
            </div>
            <Toaster />
          </AppProvider>
        </CatalogProvider>
      </body>
    </html>
  );
}
