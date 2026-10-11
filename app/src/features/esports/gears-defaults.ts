/**
 * Suggested defaults for Gears-style match params.
 *
 * NOTE: Gears of War: E-Day hasn't released and has no public multiplayer maps
 * or modes yet, so these are the classic Gears of War set as a sensible,
 * editable starting point. The scheduler always allows adding custom values.
 */
export const GEARS_DEFAULT_MODES: string[] = [
  "Ejecución",
  "Warzone",
  "Rey de la colina",
  "Dominación",
  "Guardián",
  "Captura del líder",
  "Horda",
  "Escalada",
  "Duelo por equipos",
];

export const GEARS_DEFAULT_MAPS: string[] = [
  "Gridlock",
  "War Machine",
  "Canals",
  "Fuel Depot",
  "Mansion",
  "Mausoleum",
  "Tyro Station",
  "Clocktower",
  "Rooftops",
];

/** Case-insensitive dedupe preserving first-seen order. */
export function dedupe(values: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const v of values) {
    const key = v.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(v.trim());
  }
  return out;
}
