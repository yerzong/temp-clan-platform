# Arquitectura — SaaS Multi-Tenant

> Este es un producto que se vende a MUCHAS organizaciones. Ese solo hecho lo
> cambia todo frente a una herramienta interna: debe ser multi-tenant desde el
> día uno. Este documento ataca cada variante arquitectónica con sus tradeoffs.

## La decisión que define todo lo demás: multi-tenancy

Una herramienta interna tiene UNA organización. Un SaaS tiene MUCHAS, y jamás
pueden ver los datos de las otras. Cada tabla, cada consulta, cada archivo está
acotado a un tenant (una organización). Equivocarse aquí después = una migración
dolorosa y riesgosa.

### Variante A — DB compartida, tenancy a nivel de fila (RECOMENDADA para empezar)
Cada fila lleva `org_id`; el aislamiento se fuerza con Row-Level Security (RLS).

- ✅ Lo más barato, simple y rápido de entregar. Una sola DB que operar.
- ✅ Supabase/Postgres RLS da aislamiento fuerte por tenant si se hace bien.
- ⚠️ Un bug en una política puede filtrar datos entre tenants — el RLS hay que
  testearlo en serio.
- Mejor para: etapa temprana, de decenas a miles de organizaciones.

### Variante B — Schema por tenant
Cada organización tiene su propio schema de Postgres.

- ✅ Aislamiento más fuerte, exportación por tenant más fácil.
- ⚠️ Las migraciones a través de cientos de schemas se vuelven dolorosas.
- Mejor para: etapa media con demandas de aislamiento empresarial.

### Variante C — DB por tenant
Cada organización tiene su propia base de datos.

- ✅ Aislamiento máximo (el sueño enterprise/white-label).
- ⚠️ Mucha carga de operación; exagerado al inicio.
- Mejor para: solo contratos enterprise grandes.

> **Recomendación: empezar con la Variante A (RLS)**, diseñando el modelo de
> datos para que un movimiento a B/C sea posible si un cliente white-label
> grande lo exige. NO sobre-ingenierizar el aislamiento antes de tener tenants
> que paguen.

## Opciones de stack (atacando cada variante)

### Frontend (web primero)
- **Recomendado: Next.js + TypeScript + Tailwind.** Rápido, ecosistema enorme,
  server components para rendimiento, camino claro a un design system compartido.
- Alt: Remix (gran carga de datos) o SvelteKit (más ligero) — solo si tienes
  preferencia. No hay razón fuerte para desviarse de Next.js aquí.

### Backend / Datos
- **Recomendado: Supabase** (Postgres + Auth + Storage + RLS + Realtime).
  - Por qué: RLS multi-tenant, proveedores OAuth (Discord, Google/YouTube),
    almacenamiento de archivos para clips, y realtime para dashboards — todo en
    uno, barato para arrancar.
- Alt: Node/NestJS a medida + Postgres + Auth0/Clerk. Más control, más trabajo.
  Elegir solo si te quedas corto con el modelo opinado de Supabase.

### Auth (realidad multi-tenant)
- Los usuarios pertenecen a una o más organizaciones con un rol por organización.
- **Proveedores recomendados**: Discord OAuth (nativo de gaming) +
  correo/contraseña (necesario para compradores que no están en Discord).
  Supabase/Clerk soportan ambos.
- Modelo: `User` (identidad global) ↔ `Membership` (usuario + organización + rol).

### Mobile (después)
- Cuando esté validado, **Expo / React Native** reutiliza el skill de React +
  mucha lógica.
- NO construir mobile en paralelo con la v1 de web.

### Procesamiento de clips (el motor del módulo 1) — construir vs integrar
Esta es una bifurcación estratégica real, decidir antes del Módulo 1:
- **Construir**: ffmpeg + Whisper (transcripción) + heurísticas de highlights
  (picos de audio/chat). Control total, sin costo de proveedor por clip, más
  tiempo de desarrollo, peor calidad que OpusClip al inicio.
- **Integrar**: envolver una API/motor de clips existente y agregar la capa de
  organización encima. Más rápido al mercado, costo de proveedor + dependencia,
  pero compites en integración (tu verdadero foso) en vez de en calidad de clips
  (que no es tu foso).
- **Recomendación: integrar o usar componentes existentes primero; no hundir
  meses en superar a OpusClip clipeando.** Revisar construir in-house solo si el
  volumen lo justifica.

## Modelo de datos del núcleo (multi-tenant, primer borrador)

```
User                      # identidad de login global
  id, email, auth_provider, created_at

Organization (tenant)
  id, name, slug, logo_url, plan (starter|pro|org), created_at

Membership                # el corazón: usuario ↔ organización ↔ rol
  id, user_id (FK), org_id (FK),
  role (owner|admin|staff|creator|player),
  status (active|invited|inactive), created_at

MemberProfile             # el wedge de la "identidad dual"
  membership_id (FK), display_name, avatar_url,
  is_creator (bool), is_player (bool), bio

LinkedAccount
  id, membership_id (FK), platform (discord|twitch|youtube), handle, url

# El Módulo 1 agrega: Channel, Vod, Clip, PublishTarget ...
# El Módulo 3 agrega: Team, RosterSlot, Match ...
```

Regla general de RLS: toda tabla acotada por tenant filtra por `org_id` y un
usuario solo puede tocar filas de organizaciones donde tiene una membership
activa.

## Innegociables para un SaaS (no saltárselos)

- **Aislamiento de tenants testeado**, no asumido (escribe tests que prueben que
  la organización A no puede leer la B).
- **Log de auditoría** de quién hizo qué (los compradores de software de
  organización lo esperan).
- **Hook de facturación** listo (Stripe) aunque sea gratis durante el piloto con
  Temp Tactical.
- **Secretos nunca en el código**; variables de entorno + almacenamiento de
  secretos del proveedor.
- **Backups** desde el día uno una vez que existan tenants reales.
