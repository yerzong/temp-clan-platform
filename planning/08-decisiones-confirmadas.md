# Decisiones Confirmadas — Punto de Partida

> Decisiones cerradas por Gerson para arrancar la construcción. Este documento es
> la fuente de verdad del stack y las decisiones iniciales. Fecha: oct 2026.

## Nombres (producto vs organización — no mezclar)

- **Temp Platform** = el PRODUCTO (el software). Confirmado por Gerson.
- **Temp Tactical** = la ORGANIZACIÓN de Gerson. Es el primer usuario/cliente
  dentro de Temp Platform (fila #1 en la tabla `organizations`).
- **Temp League** = la liga de Gears con equipos externos, vive dentro de la
  plataforma.
- Dominio (.com/.gg) y marca: NO se verifican por ahora, no se necesitan todavía.

## Stack confirmado

| Capa | Elección | Notas |
|------|----------|-------|
| Frontend | Next.js + TypeScript + Tailwind | Lo recomendado; Gerson sin preferencia distinta |
| Backend/DB | Supabase | Gerson ya tiene suscripción |
| Multi-tenancy | Variante A — DB compartida con RLS (`org_id` por fila) | La recomendada para empezar |
| Auth | **Supabase Auth** con proveedor **Discord** primero; correo/contraseña después | Motor de auth incluido en Supabase; Discord es nativo de gaming |
| Plataforma | Web primero; mobile después de validar | |

## Contenido (Módulo 1 — para después)

- Plataformas objetivo: **Twitch + YouTube + TikTok**.
- Recomendado arrancar por **Twitch** (su API es la más amigable para detectar
  momentos/clips automáticamente — clave para el plus de Gears). YouTube segundo;
  TikTok más como destino de publicación que como origen.
- Se confirma al llegar al Módulo 1. No bloquea el Módulo 0.
- Enfoque: integrar/componentes abiertos antes que construir desde cero.

## Política de credenciales y seguridad (IMPORTANTE)

- NO se usa acceso total ni credenciales de administrador compartidas con el
  asistente. Riesgo irreversible para un SaaS con datos de múltiples
  organizaciones.
- Flujo seguro: el asistente escribe código, migraciones de DB y políticas de
  RLS como ARCHIVOS en el proyecto. Gerson los revisa y los aplica.
- Las keys de Supabase viven en un `.env` local que NUNCA se sube al repo.
- MCP de Supabase: solo si una tarea concreta lo justifica, con permisos
  acotados — nunca "acceso total por si acaso".

## Pendientes de confirmar (no bloquean el Módulo 0)

- [ ] Módulo wedge / primer módulo de pago (contenido vs roster).
- [ ] Plataforma de streaming principal exacta de Temp Tactical para el MVP del
      Módulo 1.
- [ ] Nombre final + dominio verificado.

## Lo que se necesita de Gerson para construir el Módulo 0

1. **Proyecto Supabase**: crear uno nuevo (o confirmar cuál usar). Se necesitará
   URL + keys, que van en variables de entorno, NUNCA en el código.
2. **Aplicación de Discord** en el portal de desarrolladores (para OAuth): da
   Client ID + Secret. Guía paso a paso cuando lleguemos.
3. **Entorno local**: confirmar Node.js + Git instalados. Si no, instalarlos
   primero.
4. **Ubicación del proyecto**: recomendado `temp-clan-platform/app/` (al lado de
   `planning/`).

## Objetivo del primer entregable (M0.1 — la prueba más pequeña)

Iniciar sesión con Discord → crear la organización Temp Tactical → ver un dashboard
vacío con el nombre del usuario. Nada más. Esto prueba que auth + multi-tenancy
funcionan de punta a punta antes de construir el CRUD de miembros.

## Principios para ir a paso seguro

- Un módulo a la vez; dentro del módulo, un milestone a la vez.
- Validar auth + tenancy antes de cualquier función.
- Secretos siempre en variables de entorno.
- Testear el aislamiento de tenants, no asumirlo.
- Temp Tactical como cliente cero: todo se valida en vivo con la operación real.
