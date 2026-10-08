# Enfoque: Temp Tactical Primero, SaaS Después

> Decisión estratégica de Gerson (oct 2026). Cambia el ORDEN de construcción,
> no la arquitectura. Este documento manda sobre el enfoque "SaaS desde el día
> cero" de los documentos anteriores.

## La decisión

Construir primero una herramienta que le sirva a **Temp Tactical** (la marca/
organización de Gerson). Si funciona y aporta valor real, **migrarla a un
producto SaaS** vendible a otras marcas en el futuro.

## Por qué es la decisión correcta

- Es el camino de dogfooding: validar con un usuario real (Temp Tactical)
  resolviendo un dolor real, antes de construir para clientes imaginarios.
- Va más rápido: no cargamos desde el inicio con facturación, planes, onboarding
  multi-organización ni landing de ventas.
- Baja el riesgo: si no le sirve ni a Temp Tactical, nos ahorramos meses de un
  SaaS que nadie quería. Patrón probado (Slack, Basecamp y muchos más nacieron
  como herramienta interna).

## La trampa a evitar (y cómo)

Si construimos "solo para Temp Tactical" con el nombre y las reglas hardcodeadas
por todos lados, migrar a SaaS después = reescritura dolorosa.

**Solución (ya está en marcha):** construir sobre la base multi-tenant ya
diseñada. Temp Tactical es simplemente *la primera organización* (`organizations`
fila #1). Se usa la app como si fuera solo para Temp Tactical, pero la estructura
por debajo ya soporta más organizaciones sin reescribir.

Analogía: una casa para Gerson, pero con los cimientos de un edificio. Hoy vive
él; el día que quiera rentar departamentos, construye pisos arriba sin tirar la
casa.

## Qué NO cambia (lo ya construido sigue sirviendo)

- Esqueleto Next.js + Supabase ✅
- Migración `0001_module0_core.sql` con tablas + RLS ✅ (Temp Tactical = primera
  fila en `organizations`)
- Clientes de Supabase (client/server) ✅

## Qué SÍ cambia (orden y prioridades)

- **Priorizar funciones que Temp Tactical necesita YA**, en lugar de funciones
  pensadas para vender a terceros.
- **Diferir a la fase de migración**: facturación (Stripe), planes de pago,
  onboarding de múltiples organizaciones, landing de ventas, white-label.
- El objetivo inmediato deja de ser "SaaS" y pasa a ser "la mejor herramienta
  interna para Temp Tactical", construida sobre cimientos que permiten vender
  después.

## Pendiente de confirmar con Gerson

- ¿Qué es lo PRIMERO que Temp Tactical necesita gestionar y le duele hoy?
  (gestión de equipo de esports / roster, contenido/clips, comunidad). Eso
  define cuál módulo construimos primero AHORA, con Temp Tactical como medida.
- Nota: en conversación Gerson mencionó que necesita "gestionar todo un equipo
  de esports". Candidato fuerte a primer módulo real: roster + base del Módulo 3,
  sobre el núcleo del Módulo 0. Confirmar.
