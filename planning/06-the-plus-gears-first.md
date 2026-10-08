# El PLUS — Capa Consciente del Juego (Gears E-Day Primero)

> El diferenciador que ninguna herramienta tiene hoy. La estrategia: construir un
> núcleo genérico de organización, y luego enchufar una CAPA DE JUEGO. Gears
> E-Day es la primera capa de juego, y el enfoque actual. Juegos nuevos se
> enchufan después sin reescribir el núcleo.

## Por qué se requiere un plus

Todo en el mercado es GENÉRICO:
- OpusClip clipea cualquier video pero no sabe qué es una ejecución con motosierra.
- Toornament corre cualquier bracket pero no sabe que Horde Siege son 3 escuadras
  de 4.
- Las herramientas de equipo gestionan cualquier roster pero no saben que Versus
  es 4v4.

Una plataforma que ENTIENDE el juego le gana a las genéricas para las
organizaciones que viven en ese juego. Enfocarse en Gears E-Day ahora nos hace
los mejores para organizaciones de Gears hoy — ese enfoque ES el plus, no una
limitación.

## Arquitectura del plus: Capa de Juego enchufable

```
NÚCLEO GENÉRICO (reutilizable para cualquier juego)
  miembros, roles, organizaciones, pipeline de clips, roster, métricas
        │
        ▼
CAPA DE JUEGO  ← enchufable por juego
  Capa de Gears E-Day  (PRIMERA, enfoque actual)
  [futuro] otra capa de juego se enchufa aquí
```

Construir el núcleo genérico. Poner todo el conocimiento específico de Gears en
una capa de Gears. Enfocarse en Gears ahora; mantenerse extensible para después.
NO hardcodear Gears dentro del núcleo.

## Las funciones concretas del PLUS (capa de Gears E-Day)

### 1. Detección de highlights consciente de Gears (plus de la fábrica de clips)
Los clipeadores genéricos usan picos de audio. La capa de Gears detecta momentos
que IMPORTAN en Gears, elevando la calidad del clip específicamente para
contenido de Gears:
- Ejecuciones con motosierra, active reloads perfectos, clutches 1vX en Versus,
  team wipes / extracciones en Horde Siege.
- Fuentes de señal a combinar: picos de audio + picos de chat + (donde haya)
  pistas en pantalla/eventos. Empezar con heurísticas; refinar con el tiempo.
- Este es un plus que OpusClip estructuralmente no ofrece: no tiene concepto de
  Gears.

> Honestidad: detectar eventos específicos del juego de forma confiable es
> investigación y desarrollo. Empezar con las señales más baratas (audio + chat)
> enmarcadas como "momentos de Gears", mejorar iterativamente. No prometer
> detección de eventos perfecta al pixel desde el día uno.

### 2. Calendario de temporada de Gears, integrado y accionable
- Los eventos de la Season 1 son ventanas programadas de 2 semanas (Halloween,
  20 Years of Gears, Thanksgibbing). La plataforma convierte el calendario en
  acción: "el evento X empieza en 3 días — prepara contenido, estas son las
  recompensas".
- Une contenido + comunidad + timing. Ninguna herramienta genérica conoce el
  calendario de Gears.
- Fuente de datos: anuncios oficiales de Gears/Xbox, mantenidos en la capa de
  Gears.

### 3. LFG y roster con la forma de Gears
- El LFG arma grupos con la forma REAL de Gears: Horde Siege = 12 jugadores
  (3 escuadras de 4); Versus = 4v4.
- El módulo de roster/esports entiende los roles de Versus 4v4, no "equipo
  genérico".

### 4. Métricas unificadas de Gears
- Rendimiento de contenido (qué clips de Gears funcionaron) + rendimiento
  competitivo (resultados en Versus) sobre la MISMA identidad de miembro, con
  contexto del juego.
- Nadie une contenido + competición en una sola identidad, mucho menos por juego.

## Restricción a respetar (de la investigación previa)

The Coalition NO tiene API/SDK pública para E-Day (confirmado oct 2026). Así que
la capa de Gears se alimenta de:
- APIs abiertas de plataformas (Twitch/YouTube/Discord) para contenido +
  comunidad.
- Datos públicos (calendario, modos, recompensas) mantenidos en la capa.
- Nuestras propias heurísticas para "momentos de Gears" — NO conectándose al
  juego, y NUNCA con cheats/trainers (ese camino = baneos, DMCA, marca muerta).

## Cómo se vende el plus

- Las organizaciones de Gears obtienen una herramienta que habla Gears, vs
  herramientas genéricas que no.
- Posicionamiento: "la plataforma hecha para organizaciones de Gears" hoy;
  "agrega tu juego" mañana.
- Temp Tactical prueba la capa de Gears en vivo.

## Implicaciones de construcción

- El Módulo 0 (núcleo) se mantiene genérico — sin hardcodear Gears.
- El Módulo 1 (contenido) recibe un plug de detección de highlights de Gears.
- Los módulos posteriores consumen el calendario de Gears + las definiciones de
  modos desde la capa.
- Mantener una costura limpia para que una segunda capa de juego se enchufe sin
  reescritura.
