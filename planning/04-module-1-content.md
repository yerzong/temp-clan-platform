# Módulo 1 — Contenido (Fábrica de Clips como Módulo Vendible)

> Construido sobre el grafo de miembros del Módulo 0. Este es el motor de ARPU.
> Nota estratégica: NO intentamos superar a OpusClip clipeando. Vendemos el
> CONTEXTO DE ORGANIZACIÓN alrededor del clipeo. Ver 01-market-analysis.md.

## Objetivo

Dejar que los creadores de una organización conviertan VODs/streams largos en
clips verticales listos para publicar, rastreados por creador, dentro de la
organización — para que una marca vea quién produjo qué y toda la operación de
contenido viva en un solo lugar.

## Por qué vende (y por qué NO como producto suelto)

- Clipear por sí solo es un commodity: OpusClip/Ssemble/Vizard ya ganan en
  calidad y precio por minuto.
- Nuestro valor: clips atados a la ORGANIZACIÓN y a una identidad de MIEMBRO, con
  precio por organización en vez de por creador-minuto (el punto de dolor de la
  competencia). Una organización con muchos creadores es justo a quien la
  competencia sobre-cobra.
- Por eso el Módulo 1 se vende como "tu operación de contenido, unificada" — no
  como "un clipeador".

## Construir vs Integrar (decidir antes de codear — ver 02-architecture)

- **Integrar / componentes abiertos primero** (recomendado): ffmpeg + Whisper
  para subtítulos, más heurísticas o un motor envuelto. Entregar rápido,
  competir en integración (el foso), no en calidad de clips.
- **Construir in-house después**: solo si el volumen de clips hace que el costo
  de proveedor duela.

## El pipeline (concepto)

```
VOD / stream del creador (Twitch o YouTube — PENDIENTE cuál)
   → detectar highlights (picos de audio, rachas de kills, picos de chat)
   → cortar clips verticales
   → subtítulos automáticos (Whisper) + plantilla de marca de la organización
   → cola de revisión (staff/admin aprueba)
   → publicar en TikTok / Shorts / Reels (o exportar archivo listo)
```

### Dónde trabaja la IA
- **Subtítulos**: transcripción con Whisper → subtítulos incrustados.
- **Detección de highlights**: picos de actividad de audio/chat como señal del
  clip.
- **Metadata**: título + descripción + hashtags automáticos por clip.

## EL bloqueador pendiente

**¿Qué plataforma usan los creadores de la organización — Twitch, YouTube, o
ambos?**
- Twitch → Twitch API + clips + EventSub (lo más automatizable).
- YouTube → YouTube Data API + procesamiento de VOD (más trabajo, viable).
- Ambos → empezar con la de mayor audiencia, agregar la otra después.

El Módulo 0 puede avanzar sin esta respuesta. El Módulo 1 no puede arrancar sin
ella.

## Alcance (v1 — pequeño, para validar con Temp Tactical)

**Dentro del alcance:**
- Conectar el canal de UN creador a su perfil de miembro.
- Jalar un VOD / stream reciente.
- Detectar highlights, cortar 2–3 clips verticales.
- Subtítulos + plantilla de marca de la organización.
- Cola de revisión para aprobar.

**Fuera del alcance (v1):**
- Auto-publicación multi-plataforma (exportación manual primero).
- Muchos creadores a la vez.
- Editor avanzado / B-roll / efectos.

## Regla de validación

Construir el cortador de clips más pequeño para UNA plataforma, UN creador, en
este ciclo. Si le ahorra tiempo real a alguien del staff de Temp Tactical, el módulo
tiene valor. Si no, aprendiste barato. Luego escalar a más creadores y
auto-publicación.

## Detalle de monetización

- El Módulo 1 es la razón principal para subir de Starter a Pro.
- Precio por organización con un pool de minutos de clip compartido entre los
  creadores de la organización.
- Precio de excedente por minutos, pero más suave que el cálculo por creador de
  la competencia.
- El nivel Pro agrega: múltiples plantillas de marca, más canales conectados,
  scheduler.

## Milestones

1. **M1.1** — Conectar un canal (a un miembro) + jalar un VOD.
2. **M1.2** — Detección de highlights → clips crudos.
3. **M1.3** — Subtítulos + plantilla de marca + cola de revisión.
4. **M1.4** — Auto-publicación + múltiples creadores + scheduler.

Arranca solo después de que el Módulo 0 M0.1 esté hecho Y la pregunta de la
plataforma esté respondida.
