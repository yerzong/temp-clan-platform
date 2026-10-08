# Módulo 0 — Núcleo (Miembros Multi-Tenant, Roles, Auth)

> El cimiento del SaaS. Construir PRIMERO. Multi-tenant desde el día uno.
> Todos los demás módulos cuelgan del grafo de miembros definido aquí.

## Objetivo

Dar a CUALQUIER organización de gaming (Temp Tactical primero) un sistema de registro
de su gente: dar de alta una organización, invitar staff/creadores/jugadores,
asignar roles, gestionar perfiles — todo aislado por tenant para que las
organizaciones nunca vean los datos de las otras.

## El wedge vive aquí

El diferenciador frente a todo competidor es la **identidad dual/triple**: un
mismo miembro puede ser staff Y creador Y jugador. Modelarlo desde el inicio.
Esto es lo que las herramientas de torneos y de clips fundamentalmente no hacen.

## Roles (por organización)

| Rol | Puede hacer |
|-----|-------------|
| **Owner (dueño)** | Facturación, borrar la organización, todo lo de abajo |
| **Admin** | Gestionar miembros, roles, todos los módulos |
| **Staff** | Gestionar contenido/miembros, sin ajustes de organización/facturación |
| **Creator (creador)** | Su propio perfil, vincular canales, ver su propio contenido/stats |
| **Player (jugador)** | Su propio perfil, vista de roster/equipo |

Una membership tiene UN rol, pero un perfil puede marcar `is_creator` /
`is_player` de forma independiente, para que un miembro de staff que también
compite sea representable.

## Alcance (v1)

**Dentro del alcance:**
- Alta de organización (crear organización, quien la crea queda como Owner).
- Auth: Discord OAuth + correo/contraseña (multi-tenant, ver 02-architecture).
- Flujo de invitación: invitar por correo/Discord, asignar rol.
- Directorio de miembros (por organización): listar, buscar, filtrar por rol.
- Crear / editar / desactivar miembro.
- Perfil de miembro: nombre, avatar, is_creator/is_player, handles de cuentas
  vinculadas.
- Ajustes de la organización: nombre, slug, logo, plan (el plan puede ir
  hardcodeado durante el piloto).
- Aislamiento de tenants forzado + testeado.

**Fuera del alcance (v1) — resistir la tentación:**
- Procesamiento de clips (Módulo 1).
- Automatización del bot de Discord (Módulo 2).
- Lógica de torneos/roster (Módulo 3).
- Analíticas (Módulo 4).
- UI de facturación (modelar el campo `plan`, pero Stripe puede esperar hasta
  después del piloto).
- Mobile.

## Decisión de auth (PENDIENTE de confirmación)

Para un SaaS multi-tenant lo más probable es que necesites AMBOS:
- **Discord OAuth** — principal, nativo de gaming, sin fricción para el ICP.
- **Correo/contraseña** — para compradores/admins que no viven en Discord.

> Recomendación: entregar Discord primero (cubre el piloto con Temp Tactical),
> agregar correo/contraseña antes de vender a organizaciones externas. Confirmar
> con Gerson.

## Modelo de datos (ver 02-architecture para la versión canónica)

Tablas clave del Módulo 0: `User`, `Organization`, `Membership`,
`MemberProfile`, `LinkedAccount`. Todas las tablas acotadas por tenant llevan
`org_id` y están protegidas por RLS.

## Milestones

1. **M0.1** — Esqueleto + auth: crear una organización, iniciar sesión, aterrizar
   en un dashboard vacío. *La prueba más pequeña. Confirmar que la creación de
   tenant + login funciona de punta a punta.*
2. **M0.2** — Directorio de miembros: invitar/agregar miembros, asignar roles,
   listar/buscar.
3. **M0.3** — Perfiles (is_creator/is_player + handles vinculados) + ajustes de
   la organización.
4. **M0.4** — Tests de aislamiento de tenants (probar que la organización A no
   puede leer la B).

Entregar M0.1 antes que nada. Validar login + tenancy antes de construir el CRUD.

## Definición de "hecho" (Módulo 0)

- Una organización nueva puede darse de alta sola; quien la crea queda como Owner.
- Owner/Admin pueden invitar miembros y asignar roles.
- Los miembros tienen perfiles que marcan identidad de creador/jugador + handles
  de plataformas.
- Los datos están demostrablemente aislados por tenant (los tests pasan).

Este es un cimiento completo y vendible. Todo lo demás es un módulo encima.

## Cómo el Módulo 0 por sí solo ya podría venderse

Incluso antes de los clips, un "directorio de roster + staff + creadores con
roles" multi-tenant y limpio para organizaciones de esports es un producto
delgado pero real — sobre todo si se combina con el login de Discord que el ICP
ya usa. Es la cabeza de playa. Los Módulos 1+ aumentan el ARPU.
