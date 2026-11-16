import type { Part } from "./types";

// ---------------------------------------------------------------------------
// Alkatrész-képek feloldása.
//
// Ha az adatbázisban van termékkép URL (parts.image_url), azt használjuk.
// Egyébként a kategória neve alapján választunk egy semleges, offline SVG
// illusztrációt (public/parts/*.svg) – így soha nem jelenik meg törött kép.
// ---------------------------------------------------------------------------

const CATEGORY_FALLBACK: Record<string, string> = {
  "Motor & motoralkatrészek": "/parts/engine-block.svg",
  Fékrendszer: "/parts/brake-disc.svg",
  "Futómű & kormányzás": "/parts/shock-absorber.svg",
  Szűrők: "/parts/cabin-filter.svg",
  "Gyújtás & elektronika": "/parts/alternator.svg",
  Világítás: "/parts/headlight.svg",
  Elektronika: "/parts/alternator.svg",
  "Hűtés & klíma": "/parts/radiator.svg",
  Kipufogórendszer: "/parts/exhaust-muffler.svg",
  "Váltó & kuplung": "/parts/clutch-kit.svg",
  Karosszéria: "/parts/bumper.svg",
  "Olajok & folyadékok": "/parts/engine-oil.svg",
  "Gumiabroncs & kerék": "/parts/tyre.svg",
};

// A sorrend számít: a konkrétabb kulcsszavak elöl vannak.
const KEYWORD_RULES: { keys: string[]; image: string }[] = [
  { keys: ["fékbetét", "brake pad"], image: "/parts/brake-pads.svg" },
  { keys: ["féktárcsa", "tárcsa", "brake disc", "brake disk"], image: "/parts/brake-disc.svg" },
  { keys: ["féknyereg", "nyereg", "caliper"], image: "/parts/brake-caliper.svg" },
  { keys: ["fékfolyadék", "dot 4", "dot4"], image: "/parts/brake-fluid.svg" },
  { keys: ["olajszűrő", "oil filter"], image: "/parts/oil-filter.svg" },
  { keys: ["levegőszűrő", "levegoszuro", "air filter"], image: "/parts/air-filter.svg" },
  { keys: ["utastér", "kabin", "pollen", "cabin filter"], image: "/parts/cabin-filter.svg" },
  { keys: ["hűtőszűrő", "akkumulátor hűtő"], image: "/parts/cabin-filter.svg" },
  { keys: ["vezérműszíj", "szíj szett", "timing belt"], image: "/parts/timing-belt-kit.svg" },
  { keys: ["kuplung", "clutch"], image: "/parts/clutch-kit.svg" },
  { keys: ["váltó", "sebességváltó", "gearbox", "transmission"], image: "/parts/gearbox.svg" },
  { keys: ["turbó", "turbolöltő", "turbo"], image: "/parts/turbo.svg" },
  { keys: ["generátor", "alternátor", "alternator"], image: "/parts/alternator.svg" },
  { keys: ["önindító", "indítómotor", "starter"], image: "/parts/starter.svg" },
  { keys: ["gyertya", "gyújtógyertya", "spark plug"], image: "/parts/spark-plugs.svg" },
  { keys: ["akkumulátor", "battery"], image: "/parts/battery.svg" },
  { keys: ["fényszóró", "headlight"], image: "/parts/headlight.svg" },
  { keys: ["hátsó lámpa", "hátsó lámpatest", "taillight", "tail light"], image: "/parts/taillight.svg" },
  { keys: ["lökhárító", "bumper"], image: "/parts/bumper.svg" },
  { keys: ["intercooler", "töltőlevegő"], image: "/parts/intercooler.svg" },
  { keys: ["klímahűtő", "kondenzátor", "kondenzator", "ac condenser"], image: "/parts/radiator.svg" },
  { keys: ["hűtőradiátor", "hűtő", "radiator"], image: "/parts/radiator.svg" },
  { keys: ["vízpumpa", "vizpumpa", "water pump"], image: "/parts/water-pump.svg" },
  { keys: ["lengéscsillapító", "lengéscsillapito", "shock absorber", "shock"], image: "/parts/shock-absorber.svg" },
  { keys: ["futómű", "futomu", "karosszéria elem", "karosszeria elem", "control arm", "lengőkar"], image: "/parts/control-arm.svg" },
  { keys: ["felni", "keréktárcsa", "keréktarcsa", "rim", "wheel"], image: "/parts/wheel-rim.svg" },
  { keys: ["kipufogó", "kipufogo", "muffler", "silencer"], image: "/parts/exhaust-muffler.svg" },
  { keys: ["katalizátor", "katalizator", "catalytic"], image: "/parts/catalytic-converter.svg" },
  { keys: ["részecskeszűrő", "dpf", "fap"], image: "/parts/dpf.svg" },
  { keys: ["olaj", "motorolaj", "5w-30", "5w30", "engine oil"], image: "/parts/engine-oil.svg" },
  { keys: ["klímagáz", "klimagaz", "hűtőközeg", "refrigerant", "r134a"], image: "/parts/ac-gas.svg" },
  { keys: ["gumiabroncs", "abroncs", "tyre", "tire"], image: "/parts/tyre.svg" },
  { keys: ["tükör", "tukor", "mirror"], image: "/parts/mirror.svg" },
  { keys: ["szervo", "kormányszervo", "kormany", "steering"], image: "/parts/power-steering-pump.svg" },
  { keys: ["motor", "engine", "hengerfej"], image: "/parts/engine-block.svg" },
];

/** Megadja az alkatrészhez tartozó termékkép útvonalát. */
export function partImage(part: Pick<Part, "name" | "category" | "image">): string {
  if (part.image && part.image.trim()) return part.image.trim();
  const name = part.name.toLowerCase();
  for (const rule of KEYWORD_RULES) {
    if (rule.keys.some((k) => name.includes(k))) return rule.image;
  }
  return CATEGORY_FALLBACK[part.category] ?? "/parts/part-generic.svg";
}
