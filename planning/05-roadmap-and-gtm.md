# Roadmap y Go-To-Market

> Orden de construcción, milestones, y cómo Temp Tactical se convierte en clientes
> externos que pagan.

## Regla guía

Un módulo a la vez, validado con Temp Tactical (cliente cero) antes de venderle a
nadie más. Entregar la prueba más pequeña, aprender, y luego expandir. Una
plataforma completa sin construir no vale nada; una pequeña validada es un
negocio.

## Roadmap por fases

### Fase 1 — Cimiento (Módulo 0)
- Núcleo multi-tenant: organizaciones, auth, miembros, roles, perfiles, tests de
  aislamiento.
- Resultado: Temp Tactical corre su staff/creadores/jugadores reales en la app.
- Este es el producto cabeza de playa.

### Fase 2 — Contenido (Módulo 1)
- Fábrica de clips como motor de ARPU, integrada (no construida desde cero)
  primero.
- Resultado: los creadores de Temp Tactical producen clips a través de la plataforma.
- Requiere: la pregunta de la plataforma de streaming respondida.

### Fase 3 — Comunidad (Módulo 2)
- Bot de Discord: LFG, notificaciones de eventos, sincronización de miembros con
  el grafo de la organización.
- Resultado: retención + la identidad de Discord se ata a las memberships.

### Fase 4 — Esports (Módulo 3)
- Roster, calendario de scrims, seguimiento de partidas. Integrar (no
  reconstruir) brackets vía APIs de Start.gg / Toornament en lugar de competir
  con ellos.
- MÁS el PLUS de sostenibilidad del jugador (ver 07-module-3-esports.md).
- Resultado: el lado competitivo vive sobre el mismo grafo de miembros que el
  contenido.

### Fase 5 — Métricas / Admin (Módulo 4)
- Dashboards de rendimiento (contenido + competición sobre una sola identidad),
  finanzas.
- Resultado: la promesa de "org OS" se realiza por completo; el upsell y la
  retención más fuertes.

### Transversal (cuando haya tenants reales que paguen)
- Facturación con Stripe, aplicación de planes, endurecimiento del log de
  auditoría, backups.

## Go-to-market (cómo Temp Tactical se vuelve ventas)

1. **Dogfooding**: correr Temp Tactical completo en la plataforma. Arreglar lo que
   duela.
2. **Prueba pública**: mostrar la operación de Temp Tactical como el caso de estudio
   — "así es como una organización de gaming moderna corre en una sola
   plataforma".
3. **Design partners**: reclutar 2–3 organizaciones/clanes amigables con
   descuento para validar los supuestos multi-tenant y juntar testimonios.
4. **Posicionamiento**: liderar con "org OS", no con "herramienta de clips" ni
   "herramienta de brackets", para evitar la comparación de frente contra el
   commodity (ver 01-market-analysis.md).
5. **Piloto de precio**: gratis para Temp Tactical + design partners; introducir
   niveles una vez que el valor del Módulo 1 esté probado.

## Niveles de precio sugeridos (BORRADOR — validar, no cerrar)

| Nivel | Para quién | Incluye | Idea aproximada |
|-------|-----------|---------|-----------------|
| Starter | clan pequeño | Núcleo + contenido ligero | entrada baja |
| Pro | organización activa | Fábrica de contenido completa + comunidad + roster | nivel principal |
| Org / Enterprise | grande / white-label | multi-equipo, white-label, soporte | a medida |

Wedge: precio por ORGANIZACIÓN con pools de uso compartidos, para que las
organizaciones con muchos creadores ahorren vs el modelo por creador/por minuto
de OpusClip.

## Siguientes pasos inmediatos (lo que desbloquea construir)

1. Confirmar **método de auth** (Discord primero recomendado).
2. Confirmar **plataforma de streaming** para el MVP del Módulo 1 (Twitch /
   YouTube / ambos).
3. Confirmar **web primero** y **stack** (Next.js + Supabase recomendado).
4. Confirmar el **wedge/primer módulo de pago** (¿liderar con contenido, o vender
   el directorio/roster del Módulo 0 como cabeza de playa?).

Una vez respondidas estas cuatro, el Módulo 0 M0.1 puede arrancar como el primer
objetivo de construcción.

## Riesgos honestos (mantenerlos visibles)

- Calidad de clips < OpusClip al lanzar → posicionar los clips como parte del
  valor de organización; integrar un motor en vez de reconstruir.
- La superficie de dos lados (contenido + competición) es grande → un módulo a la
  vez.
- "Org OS" es una categoría nueva para el comprador → Temp Tactical como prueba
  viva es el antídoto.
- Los bugs de aislamiento multi-tenant son catastróficos para un SaaS → testear
  la tenancy, no asumirla.
