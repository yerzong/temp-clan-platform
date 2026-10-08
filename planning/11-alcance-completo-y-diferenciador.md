# Alcance Completo y Diferenciador — El Software que Nadie Tiene

> La visión de alcance total para Temp Tactical + Temp League: gestión +
> automatización + IA + diseño, en una sola plataforma, con la capa de Gears
> E-Day. Basado en investigación de mercado (oct 2026) para asegurar que el
> diferenciador es REAL y no algo que ya existe.

## Qué YA existe (NO reinventar — llegaríamos tarde)

La investigación lo deja claro:

- **Clips/highlights con IA**: maduro. WSC Sports (650 ligas/broadcasters),
  Magnifi, Pixellot; editores de gaming con visión por computadora que detectan
  multi-kills/clutches; Sony patentó un sistema para esto. Detectar momentos de
  gaming con IA ya no es novedad.
- **Ligas por Discord**: muy servido. Arbiter (multi-tenant: paneles de partida,
  logs de árbitro, vault de evidencia, map veto), LeagueBot (equipos, stats,
  tablas), Team Up (matchmaking, Elo, lobbies, torneos). Bots potentes y
  gratuitos.
- **Arbitraje con IA**: EMERGENTE. CallsWrapped (escucha voz de Discord y
  transcribe), LexSportiva (árbitro IA que cita reglamentos), papers de arbitraje
  multi-agente. Nuevo, aún NO integrado en plataformas de organización.

> Contenido reformulado de las fuentes para cumplir restricciones de licencia.
> Fuentes:
> [frostytools highlights](https://frostytools.com/blog/best-stream-highlight-tools-for-content-creators/),
> [WSC alternativas](https://www.vidio.ai/blog/article/best-alternatives-to-wsc-sports-for-sports-highlights),
> [digen gaming AI](https://resource.digen.ai/best-ai-video-editor-gaming-highlights-2026/),
> [Arbiter](https://github.com/devabdullahs/Arbiter),
> [Team Up](https://top.gg/bot/661408036220436511),
> [CallsWrapped](https://lablab.ai/ai-hackathons/assemblyai-voice-agent-hackathon/aang-and-bumi/callswrapped-ai-voice-referee-and-discord-recap),
> [LexSportiva](https://github.com/Hazem-Emam-404/LexSportiva-AI).

## El diferenciador REAL (lo que nadie tiene)

Cada pieza existe POR SEPARADO. **Nadie las une en un solo flujo automatizado,
sobre una sola identidad, con la capa de un juego específico (Gears E-Day).**

```
     IA de highlights        Bots de liga        Arbitraje IA
       (separado)             (separado)          (emergente)
            \                     |                   /
             \                    |                  /
              →  UNA PLATAFORMA, UN FLUJO, UN JUEGO  ←
     organización + liga + contenido + arbitraje, automatizado,
                   todo sobre Gears E-Day
```

El plus no es ninguna función suelta: es la **integración + automatización de
punta a punta** que convierte eventos de la liga en contenido, decisiones y datos
sin trabajo manual.

## Alcance completo por eje

### Eje 1 — Gestión (la base, Temp Tactical interno)
- Staff, equipo de esports, creadores: miembros con roles (Módulo 0 ✅).
- Roster + sostenibilidad del jugador (burnout/bienestar) — diferenciador del
  Módulo 3.
- Perfiles con identidad múltiple (staff/creador/jugador a la vez).

### Eje 2 — Temp League (liga de Gears con equipos externos)
- Inscripción de equipos de terceros, jornadas, calendario, standings.
- Decisión construir-vs-integrar (ver 10-temp-tactical-componentes.md): no
  reinventar Toornament/Arbiter; integrar o mínimo propio.
- El plus: la liga vive junto a la organización y el contenido, con modos reales
  de Gears (Versus 4v4, Horde Siege).

### Eje 3 — Automatización (el pegamento, el verdadero valor)
- **De evento de liga → contenido**: cuando termina una partida de Temp League,
  el sistema dispara el pipeline de clips de esos VODs automáticamente.
- **De calendario → comunicación**: recordatorios automáticos a equipos/jugadores
  (Discord) de sus partidas, sin que alguien los mande a mano.
- **De resultado → standings → anuncio**: reportado un resultado, se actualiza la
  tabla y se publica el recap automáticamente.
- **Multiplicador de contenido**: una partida → clip + recap + post social +
  miniatura, generados en pipeline.

### Eje 4 — IA (donde aporta de verdad, no por moda)
- **Highlights conscientes de Gears**: detectar ejecuciones, clutches, wipes de
  Horde Siege (capa de Gears, ver 06). Realista empezando por señales de
  audio/chat; mejorar con el tiempo.
- **Arbitraje asistido por IA (I+D, el más novedoso)**: asistente que ayuda al
  árbitro humano — resume evidencia de una disputa, cita la regla aplicable del
  reglamento de Temp League (RAG sobre tus reglas), transcribe lo relevante.
  NUNCA reemplaza al árbitro humano al inicio; lo asiste.
- **Agente de dudas de la liga/comunidad**: responde reglas, calendario, formato
  (RAG sobre tus documentos).
- **Metadata automática**: títulos, descripciones, hashtags de clips.

### Eje 5 — Diseño (identidad y experiencia)
- Design system propio de Temp Tactical / Temp League (marca consistente).
- Plantillas de marca aplicadas automáticamente a clips, cartas de jugador,
  gráficos de standings, recaps — generados por el sistema con la identidad
  visual de la marca.
- Experiencia que una organización "siente" como suya, no como herramienta
  genérica.

## Honestidad — qué es realista hoy vs I+D

- **Realista ya**: gestión (Módulo 0), roster, pipeline de clips con señales
  simples, automatización de recordatorios/standings/anuncios, RAG para dudas,
  plantillas de marca.
- **I+D / iterativo**: detección de eventos de Gears frame-perfect, arbitraje
  asistido por IA (empieza como asistente, no como juez), visión por computadora
  avanzada. Empezar simple, mejorar; no prometer magia el día uno.
- **No construir desde cero**: motor de brackets (integrar), clipeo commodity
  (integrar/componentes abiertos). Construir lo que UNE, no lo que ya es
  commodity.

## Restricciones que se mantienen

- Sin API/SDK oficial de Gears → nos apoyamos en APIs abiertas (Twitch/YouTube/
  TikTok/Discord), datos públicos y heurísticas. NUNCA cheats/trainers.
- Datos sensibles (bienestar, menores en contratos/liga) → consentimiento,
  privacidad, revisión legal antes de lanzar.
- Multi-tenant desde el día uno → Temp Tactical es la primera organización;
  migrable a SaaS sin reescribir.
- Automatización e IA con humano al mando → la IA asiste y ejecuta; las
  decisiones (sobre todo arbitraje) las aprueba una persona.

## Cómo esto se vuelve "el software que nadie tiene"

Posicionamiento: **la primera plataforma donde una organización de gaming corre
su equipo, su contenido y su liga en un solo flujo automatizado, con IA que
entiende el juego.** No es "otro clipper", "otro bot de liga" ni "otro gestor de
roster" — es el sistema que los une y los automatiza, con la marca propia encima.

## Pendiente de confirmar con Gerson

- Prioridad del primer módulo real tras el núcleo (staff / esports / creadores).
- Temp League: construir mínimo vs integrar (Arbiter/Toornament/Start.gg).
- Hasta dónde llevar el arbitraje con IA (asistente de árbitro es el inicio sano).
