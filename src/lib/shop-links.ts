import type { Part } from "./types";

// ---------------------------------------------------------------------------
// Vásárlási linkek.
//
// A linkeket az alkatrész cikkszáma (SKU) és OE száma alapján generáljuk, és
// MINDEN esetben egy webshop keresési találati oldalára mutatnak – soha nem
// konkrét termékre, árra vagy készletre.
// ---------------------------------------------------------------------------

export interface ShopLink {
  id: string;
  name: string;
  tagline: string;
  href: string;
  /** Márkanév-hex, a logó/ikon színezéséhez. */
  accent: string;
  /** Monogram a logó helyettesítéséhez. */
  monogram: string;
}

/** A legjobb elérhető keresőkifejezés: OE szám, majd gyártói cikkszám. */
export function partQuery(part: Pick<Part, "oeNumber" | "sku" | "name">): string {
  const oe = part.oeNumber?.trim();
  if (oe && oe !== "-") return oe;
  const sku = part.sku?.trim();
  if (sku) return sku;
  return part.name.trim();
}

/**
 * Keresési linkek generálása. Minden link az adott alkatrész (OE/cikkszám)
 * keresési találati oldalára mutat, nem konkrét termékajánlatra.
 */
export function buildShopLinks(part: Pick<Part, "oeNumber" | "sku" | "name">): ShopLink[] {
  const q = partQuery(part);
  const qe = encodeURIComponent(q);
  const qPlus = encodeURIComponent(q.replace(/\s+/g, " ").trim()).replace(/%20/g, "+");

  return [
    {
      id: "ebay",
      name: "eBay",
      tagline: "Nemzetközi piactér – használt és új alkatrészek",
      href: `https://www.ebay.com/sch/i.html?_nkw=${qPlus}`,
      accent: "#e53238",
      monogram: "e",
    },
    {
      id: "ovoko",
      name: "Ovoko",
      tagline: "Bontott és új alkatrészek Európából",
      href: `https://ovoko.hu/search?q=${qe}`,
      accent: "#00b0b9",
      monogram: "O",
    },
    {
      id: "allegro",
      name: "Allegro",
      tagline: "Közép-európai piactér – széles alkatrészválaszték",
      href: `https://allegro.pl/listing?string=${qPlus}`,
      accent: "#ff5a00",
      monogram: "A",
    },
    {
      id: "autodoc",
      name: "Autodoc",
      tagline: "Új utángyártott alkatrészek gyártó szerint",
      href: `https://www.autodoc.hu/search?keyword=${qe}`,
      accent: "#e2001a",
      monogram: "AD",
    },
    {
      id: "trodo",
      name: "Trodo",
      tagline: "Európai alkatrész webshop – OE szerinti keresés",
      href: `https://www.trodo.hu/search?q=${qe}`,
      accent: "#0a7d3f",
      monogram: "T",
    },
  ];
}

export const SHOP_LINK_NOTE =
  "A vásárlási linkek keresési linkek: az adott alkatrész cikkszámára keresnek rá az adott webshopban. " +
  "Nem valós termékajánlatok, és nem jelentenek készlet- vagy árgaranciát.";
