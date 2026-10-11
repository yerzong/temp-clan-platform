/** Compact country catalog for nationality + phone dial-code selectors. */

export interface Country {
  code: string; // ISO 3166-1 alpha-2
  name: string; // Spanish name
  dial: string; // phone dial code
}

export const COUNTRIES: Country[] = [
  { code: "MX", name: "México", dial: "+52" },
  { code: "US", name: "Estados Unidos", dial: "+1" },
  { code: "AR", name: "Argentina", dial: "+54" },
  { code: "CO", name: "Colombia", dial: "+57" },
  { code: "CL", name: "Chile", dial: "+56" },
  { code: "PE", name: "Perú", dial: "+51" },
  { code: "ES", name: "España", dial: "+34" },
  { code: "BR", name: "Brasil", dial: "+55" },
  { code: "EC", name: "Ecuador", dial: "+593" },
  { code: "VE", name: "Venezuela", dial: "+58" },
  { code: "GT", name: "Guatemala", dial: "+502" },
  { code: "CR", name: "Costa Rica", dial: "+506" },
  { code: "PA", name: "Panamá", dial: "+507" },
  { code: "DO", name: "Rep. Dominicana", dial: "+1" },
  { code: "UY", name: "Uruguay", dial: "+598" },
  { code: "PY", name: "Paraguay", dial: "+595" },
  { code: "BO", name: "Bolivia", dial: "+591" },
  { code: "HN", name: "Honduras", dial: "+504" },
  { code: "SV", name: "El Salvador", dial: "+503" },
  { code: "NI", name: "Nicaragua", dial: "+505" },
  { code: "PR", name: "Puerto Rico", dial: "+1" },
  { code: "CA", name: "Canadá", dial: "+1" },
  { code: "GB", name: "Reino Unido", dial: "+44" },
  { code: "FR", name: "Francia", dial: "+33" },
  { code: "DE", name: "Alemania", dial: "+49" },
  { code: "IT", name: "Italia", dial: "+39" },
  { code: "PT", name: "Portugal", dial: "+351" },
];

/** Unique dial codes (for the phone lada selector), sorted by country name. */
export const DIAL_CODES = Array.from(
  new Map(COUNTRIES.map((c) => [`${c.code}`, c])).values()
);

/** Emoji flag from an ISO 3166-1 alpha-2 code (regional indicator symbols). */
export function flagEmoji(code: string): string {
  if (!/^[A-Za-z]{2}$/.test(code)) return "🏳️";
  const base = 0x1f1e6;
  return String.fromCodePoint(
    ...code
      .toUpperCase()
      .split("")
      .map((c) => base + (c.charCodeAt(0) - 65))
  );
}
