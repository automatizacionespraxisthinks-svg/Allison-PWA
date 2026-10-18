/**
 * Qué estampilla lleva cada paso de la ruta. Va aparte de la estampilla
 * dibujada (un componente del navegador) para poder usarse también en el
 * servidor.
 */

const CIUDADES: Record<string, string> = {
  Miami: "miami",
  Orlando: "orlando",
  "Nueva York": "nueva-york",
  Washington: "washington",
  Chicago: "chicago",
  "Los Ángeles": "los-angeles",
  "Nueva Orleans": "nueva-orleans",
  Boston: "boston",
  Seattle: "seattle",
  "San Francisco": "san-francisco",
  Londres: "londres",
  Manchester: "manchester",
  Liverpool: "liverpool",
  Edimburgo: "edimburgo",
  Oxford: "oxford",
  York: "york",
  Cambridge: "cambridge",
  Brighton: "brighton",
  Bath: "bath",
  Cardiff: "cardiff",
  Toronto: "toronto",
  Montreal: "montreal",
  Ottawa: "ottawa",
  Vancouver: "vancouver",
  Calgary: "calgary",
  Victoria: "victoria",
  Quebec: "quebec",
  Banff: "banff",
  Halifax: "halifax",
  Niagara: "niagara",
};

/**
 * La estampilla de un paso: la de su ciudad, o la del repaso. El Repaso
 * final da la del nivel completo ("a1-completo", "a2-completo", "b1-completo"): el nivel
 * sale de la clave del paso ("a2-rf").
 */
export function selloDe(p: { tipo: "parada" | "repaso"; nombre: string; ciudad: string; clave?: string }): string | null {
  if (p.tipo === "repaso") {
    if (p.nombre !== "Repaso final") return "repaso-1";
    const nivel = /^(a\d|b\d|c\d)-/i.exec(p.clave ?? "")?.[1]?.toLowerCase() ?? "a1";
    return nivel === "b1" ? "b1-completo" : nivel === "a2" ? "a2-completo" : "a1-completo";
  }
  return CIUDADES[p.ciudad] ?? null;
}
