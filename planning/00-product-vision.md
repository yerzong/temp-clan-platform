# Visión de Producto — Gaming Org OS (nombre tentativo)

> Este es un producto SaaS B2B que se vende a marcas de gaming, clanes y
> organizaciones de esports/contenido. Temp Tactical es el cliente cero (el
> laboratorio de pruebas), no el dueño. Este documento es estrategia, no código.

## Pitch en una línea

**El sistema operativo para organizaciones de gaming modernas** — una plataforma
donde una marca gestiona a su staff, sus creadores de contenido y su equipo de
esports, todo junto.

## Enfoque actual y el PLUS (leer 06-the-plus-gears-first.md)

El diferenciador frente a toda herramienta existente: esta plataforma es
**consciente del juego (game-aware)**. Las herramientas genéricas (OpusClip,
Toornament, TeamSnap) no entienden el juego. Estrategia: un **núcleo genérico**
+ una **capa de juego enchufable**. La primera capa de juego es **Gears E-Day —
nuestro enfoque actual**. Ser la mejor plataforma para organizaciones de Gears
HOY es el plus; el diseño enchufable nos mantiene extensibles a otros juegos
después. Detalle completo en `06-the-plus-gears-first.md`.

## El problema (validado con investigación de mercado, oct 2026)

El mercado está dividido en dos mundos maduros pero separados, y nadie los une
bien para la organización de gaming moderna:

1. **Gestión de equipo / torneos** — Toornament, Battlefy, Challonge, Start.gg
   (brackets/torneos); TeamSnap, SportsEngine, Sportlyzer (rosters, pero
   orientados a deporte tradicional, no nativos de esports).
2. **Fábricas de clips con IA** — OpusClip, Ssemble, Vizard, QuickReel, 2Short.

Una marca de gaming moderna como Temp Tactical maneja TODO esto a la vez: staff,
creadores de contenido Y un roster competitivo, bajo una sola marca. Hoy lo
resuelven pegando 3–5 herramientas que no se hablan entre sí. Esa costura es la
oportunidad.

## La tesis (por qué esto es vendible)

NO somos "otra herramienta de clips" ni "otra app de brackets de torneos".
Competir de frente contra OpusClip en clips, o contra Toornament en brackets, es
una pelea perdida — son maduros y especializados.

Vendemos la **capa de organización que los unifica**: identidad, roles y flujos
de trabajo para toda la operación de una marca de gaming, con contenido y
competición como módulos que se montan sobre un solo grafo de miembros. El foso
competitivo es la integración, no una sola función.

## Panorama competitivo (resumen — detalle en 01-market-analysis.md)

| Categoría | Líderes | Su hueco (nuestro wedge) |
|-----------|---------|--------------------------|
| Clips con IA | OpusClip ($15–29/mes), Ssemble, Vizard | Cobran por creador/minuto; sin contexto de organización/roster; quejas de facturación |
| Torneos | Toornament, Battlefy, Start.gg | Solo brackets; sin lado de contenido/creadores |
| Gestión esports | ProStaff.gg, Team Manager App, Formation | Gestionan solo RENDIMIENTO; roster/horario/stats |
| Gestión deportiva tradicional | TeamSnap, Sportlyzer | No nativos de esports/contenido |
| **Org OS unificado + sostenibilidad** | **(hueco)** | **Nadie es dueño de toda la operación de una marca de gaming, y nadie gestiona la SOSTENIBILIDAD del jugador** |

## Los dos diferenciadores (lo que nadie tiene)

1. **Capa consciente del juego (game-aware)** (Gears E-Day primero) — ver
   `06-the-plus-gears-first.md`.
2. **Sostenibilidad del jugador** (burnout, bienestar, contratos justos) — el
   hueco respaldado por investigación que todo competidor ignora. Ver
   `07-module-3-esports.md`. Toda herramienta gestiona el RENDIMIENTO del
   jugador; ninguna gestiona si el jugador (y la organización) sobrevive.

## A quién le vendemos (ICP — perfil de cliente ideal)

- Organizaciones de esports / clanes con un roster Y creadores de contenido
  (como Temp Tactical).
- Colectivos de contenido / creator houses que empiezan a competir.
- Comunidades de gaming que monetizan contenido + arman un equipo.
- NO: streamers solitarios (OpusClip ya los sirve bien), NO clubes deportivos
  tradicionales.

## Monetización (cómo se vende)

- **Suscripción SaaS por organización**, por niveles según asientos (miembros
  gestionados) y uso (minutos de clips, módulos activos).
- Niveles sugeridos (para validar, no finales):
  - **Starter** — clan pequeño, núcleo + módulo de contenido ligero.
  - **Pro** — fábrica de contenido completa + comunidad + roster.
  - **Org/Enterprise** — white-label, múltiples equipos, soporte prioritario.
- Wedge de precio vs OpusClip: ellos cobran por creador y por minuto, lo que
  castiga a las organizaciones con muchos creadores. Un modelo por organización
  con uso justo es un diferenciador real — confirmado por las quejas de
  facturación de la competencia en la investigación.

## Principio de construcción

Construir y validar UN módulo a la vez, con Temp Tactical como la prueba en vivo. El
producto es un edificio levantado piso por piso. No construyas cinco módulos a la
vez. Una plataforma completa y bonita que nadie validó es la forma más común en
que estos proyectos mueren.

## Decisiones pendientes (necesitan confirmación de Gerson)

- [ ] **Nombre del producto** (tentativo "Gaming Org OS").
- [ ] **Método de autenticación**: login con Discord (recomendado, nativo de
      gaming) vs correo+contraseña. Para SaaS multi-tenant probablemente
      necesitemos AMBOS con el tiempo.
- [ ] **Plataforma de streaming principal** para el MVP del módulo de clips:
      Twitch / YouTube / ambos. Sigue siendo el bloqueador #1 del módulo de
      contenido.
- [ ] **¿Web primero confirmado?** (recomendado) Mobile después de validar.
- [ ] **Módulo wedge**: ¿lideramos con contenido (clips) o con gestión de
      organización/roster como primera función de pago? Ver 02-architecture +
      los documentos de módulos.

## Archivos en esta carpeta de planeación

- `00-product-vision.md` — este archivo (qué/por qué/para quién/cómo se vende)
- `01-market-analysis.md` — competidores, precios, huecos, nuestro posicionamiento
- `02-architecture.md` — arquitectura SaaS multi-tenant + opciones de stack por variante
- `03-module-0-core.md` — Módulo 0 a detalle (miembros multi-tenant, roles, auth)
- `04-module-1-content.md` — Módulo 1 a detalle (fábrica de clips como módulo vendible)
- `05-roadmap-and-gtm.md` — orden de construcción, milestones, go-to-market con Temp Tactical
- `06-the-plus-gears-first.md` — EL PLUS: capa de juego enchufable (Gears primero)
- `07-module-3-esports.md` — PLUS #2: gestión de esports + sostenibilidad del jugador
