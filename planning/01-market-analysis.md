# Análisis de Mercado — Competidores, Precios, Huecos

> Basado en investigación web realizada en oct 2026. Los precios cambian seguido
> — reconfirmar antes de cualquier decisión de precio. Fuentes citadas en línea.

## Por qué importa esto

Antes de construir, hay que saber contra quién compites. La investigación arrojó
una conclusión clara: **no competir de frente en ninguna categoría existente.
Ganar en la costura entre ellas.**

## Categoría 1 — Fábricas de clips con IA (saturada, madura)

| Herramienta | Precio (2026) | Modelo | Notas |
|-------------|---------------|--------|-------|
| OpusClip | $15 Starter / $29 Pro / Custom Business | ~1 crédito = 1 min de video fuente | Líder del mercado, buena detección de highlights, scheduler de 9 redes. Trustpilot ~4.0/5, ~22% de 1 estrella — quejas por disparo del costo por minuto, fallos de procesamiento, cancelación difícil |
| Ssemble | ~$15/mes (o ~$6 anual) | 1 crédito = hasta 20 min | Más barato por minuto; enfocado en talking-head; sin prueba gratis; tope 1080p |
| Vizard, QuickReel, 2Short | ~$1.33–5.88 / hr de video fuente | varía | 2Short el más barato por hora; QuickReel agrupa el flujo más amplio |

**Conclusión:** clipear por sí solo es un commodity ya resuelto y competido en
precio. NO le vamos a ganar a OpusClip clipeando. USAMOS el clipeo como un módulo
dentro del contexto de organización, y lo cobramos por organización (no por
creador-minuto) para esquivar su mayor queja.

Fuentes: [Opus pricing](https://www.opus.pro/pricing),
[comparación techpilot](https://techpilot.ai/opus-clip-vs-ssemble/),
[comparación de precios quickreel](https://quickreel.io/blog/ai-clip-tool-pricing-compared),
[reseña ssemble](https://www.ssemble.com/blog/opus-clip-review-2026).

## Categoría 2 — Operación de torneos / esports (madura, especializada)

| Herramienta | Enfoque |
|-------------|---------|
| Toornament | Gestión profunda de torneos + ligas, herramientas de comunidad, publicación white-label |
| Battlefy | Operaciones de torneos repetibles, flujo de partidas para participantes |
| Challonge | Armado rápido de brackets, reporte de partidas (organizadores pequeños) |
| Start.gg | Operaciones de brackets vía automatización por API, fuerte para comunidades |
| LeagueLobster | Promociones controladas, validaciones automatizadas, flujos de operador |

**Conclusión:** brackets/torneos son una especialidad resuelta. Si necesitamos
torneos, considerar INTEGRAR (vía API) con Start.gg/Toornament en lugar de
reconstruir. Nuestro valor es la organización alrededor de la competición, no el
motor de brackets.

Fuentes: [gitnux esports](https://gitnux.org/best/esports-management-software/),
[guideflow torneos](https://www.guideflow.com/blog/esports-tournament-software),
[gitnux gestión gaming](https://gitnux.org/best/gaming-management-software/).

## Categoría 3 — Gestión de equipo / roster

### 3a. Herramientas de deporte tradicional (no nativas de esports)
| Herramienta | Enfoque | Hueco para nosotros |
|-------------|---------|---------------------|
| TeamSnap | Roster, horario, comunicación | Hecho para deporte juvenil/clubes |
| SportsEngine | Registro, agendado | Deporte tradicional |
| Sportlyzer | Roster + control de squad en día de partido | Deporte tradicional |
| LeagueApps | Alta de jugadores + comunicación | Clubes juveniles |

### 3b. Herramientas de equipo nativas de esports (competidores directos)
| Herramienta | Enfoque |
|-------------|---------|
| ProStaff.gg | Analíticas, scouting, planeación estratégica |
| Team Manager App | Roster, horario, reclutamiento, stats de FACEIT, updates a Discord |
| Formation | Rosters, agendado, disponibilidad, analíticas, recordatorios de Discord |

**Conclusión:** la gestión de equipo de esports YA está servida. Todas giran en
torno al mismo núcleo: roster + horario + disponibilidad + stats de partidas +
recordatorios de Discord. Reconstruir solo eso = llegar tarde y sin
diferenciación. El wedge NO es el roster.

Fuentes: [ProStaff.gg](https://prostaff.gg/),
[Team Manager App](https://teammanger.app/),
[Formation](https://formation.esports-tools.com/),
[zipdo gestión de jugadores](https://zipdo.co/best/player-management-software/),
[guideflow plataformas esports](https://www.guideflow.com/blog/esports-platform).

## Categoría 4 — El hueco NO SERVIDO: sostenibilidad del jugador (nuestro PLUS más fuerte)

La investigación muestra lo que toda herramienta ignora y lo que de verdad mata
las carreras/organizaciones:
- La duración media de carrera para jugadores nacidos después de 1998 ronda los
  **2 años**.
- Causas: burnout, contratos explotadores, entrenamiento intenso, gobernanza
  fragmentada.
- El apoyo organizacional al bienestar es **limitado**; los jugadores demandan
  apoyo de salud mental/física que las organizaciones no dan.
- Los contratos de 2026 apenas ahora agregan bienestar + protecciones a menores.

**Ningún competidor gestiona la SOSTENIBILIDAD del jugador (burnout, bienestar,
contratos justos).** Todos gestionan el RENDIMIENTO. Este es el diferenciador
defendible y con demanda demostrada. Detalle completo en `07-module-3-esports.md`.

> Contenido reformulado de las fuentes para cumplir restricciones de licencia.

Fuentes:
[Frontiers duración de carrera](https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2025.1585599/full),
[PMC/NIH burnout](https://pmc.ncbi.nlm.nih.gov/articles/PMC12104221/),
[Stirling Duty of Care](https://www.storre.stir.ac.uk/bitstream/1893/35822/1/HICSS%20Manuscript_Final_Clean_Non-Anonymised_HJH%20.pdf),
[Esports Tower contratos 2026](https://esportstower.com/news/guide-to-negotiating-esports-athlete-contracts-in-2026/).

## El hueco que ocupamos

```
        CONTENIDO (OpusClip y cía.)      COMPETICIÓN (Toornament y cía.)
                 \                              /
                  \                            /
                   \        EL HUECO          /
                    \   (nadie lo ocupa)     /
                     \                      /
             UNA MARCA DE GAMING, UN SOLO GRAFO DE MIEMBROS
          staff + creadores + jugadores, roles, flujos de trabajo
```

Un miembro en nuestro sistema puede ser staff, creador y jugador a la vez. La
producción de contenido y el rendimiento competitivo cuelgan de la misma
identidad. Ningún competidor modela la organización de gaming moderna así. Esa es
la posición defendible.

## Enunciado de posicionamiento (borrador)

> Para marcas de gaming y organizaciones de esports que hacen malabares con
> staff, creadores y un roster competitivo, [Producto] es la única plataforma
> que gestiona toda su operación — a diferencia de OpusClip (solo clips) o
> Toornament (solo torneos), que resuelven una rebanada y no se hablan entre sí.

## Wedge de precio (borrador, validar)

- Los competidores castigan la escala: asientos por creador (OpusClip Pro = 2
  asientos) y créditos por minuto. Una organización con 8 creadores paga una
  fortuna.
- **Nuestro wedge:** precio por ORGANIZACIÓN con pools de uso compartidos entre
  los creadores de la organización. Mientras más creadores tenga una marca, más
  doloroso es el cálculo del competidor, más fuerte es nuestro valor.

## Riesgos que hay que decir con honestidad

- **Calidad de clips**: la nuestra será peor que OpusClip al inicio. Mitigar
  (a) posicionando los clips como parte del valor de organización, no como el
  héroe, y/o (b) integrando un motor de clips existente en lugar de construir
  desde cero.
- **Costo de construir dos lados**: unir contenido + competición es más
  superficie que una herramienta de un solo propósito. La regla de un módulo a
  la vez es innegociable.
- **Educación del mercado**: "org OS" es una categoría nueva para los
  compradores. Temp Tactical como caso de prueba público es el antídoto.
