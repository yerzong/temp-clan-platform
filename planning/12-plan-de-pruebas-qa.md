# Plan de Pruebas QA — Temp Platform (manual, de inicio a fin)

> Guía para probar la app TÚ MISMO, paso a paso. Marca cada caja. Si algo
> falla, anota qué pasó (pantalla + qué hiciste) para poder corregirlo.
>
> App local: http://localhost:3000  (el servidor debe estar corriendo)

## Antes de empezar
- [ ] El servidor dev está corriendo (`npm run dev` en la carpeta `app`).
- [ ] Tienes tu cuenta de Discord a la mano.
- [ ] Opcional: una segunda cuenta de Discord para probar invitaciones.

---

## 1. Autenticación (login / logout)
- [ ] Abro `http://localhost:3000` → veo la landing (hero + capacidades).
- [ ] Clic en "Sign in to deploy" → me lleva a `/login`.
- [ ] Clic en "Continue with Discord" → autorizo → regreso a `/dashboard`.
- [ ] Veo el dashboard con mi organización (Temp Tactical).
- [ ] Clic en "Sign out" → vuelvo al login.
- [ ] Intento abrir `/dashboard` sin sesión → me redirige a `/login`.
      (Prueba de seguridad: las rutas protegidas no se ven sin login.)

## 2. Overview (resumen)
- [ ] Entro a `/dashboard` → veo las tarjetas de resumen (Teams, In progress,
      Leagues, Need check-in) con números.
- [ ] Clic en cada tarjeta → me lleva al módulo correcto.
- [ ] Los contadores de arriba (Members / Players / Creators) tienen sentido.

## 3. Miembros (crear / editar / eliminar)
- [ ] Agrego un miembro (nombre, rol, marco player/creator) → aparece en el
      roster + toast "Member added".
- [ ] Edito ese miembro (lápiz) → cambio el nombre → guardo → se actualiza +
      toast "Member updated".
- [ ] Elimino ese miembro (bote → confirmar) → desaparece + toast "removed".
- [ ] En MI tarjeta (owner) NO aparece el botón de eliminar. (Protección.)

## 4. Esports (equipos + roster + bienestar)
- [ ] Creo un equipo (nombre + formato) → aparece + toast.
- [ ] Edito el equipo (lápiz) → cambio nombre/formato → guarda.
- [ ] Marco un miembro como "player" (en Overview) → aparece como opción.
- [ ] Asigno un jugador al equipo (Assign to roster) → aparece en el roster.
- [ ] Registro un check-in de bienestar de un jugador (ánimo/descanso/horas) →
      aparece su señal (Healthy / Watch / Check in).
- [ ] Elimino el equipo (X → confirmar) → desaparece.

## 5. Content (pipeline + Twitch)
- [ ] Abro "Add content" → agrego una pieza manual → aparece en "Ideas".
- [ ] Muevo la pieza por el pipeline (Start editing → Send to review → Publish).
- [ ] Edito una pieza (lápiz) → cambio título/plataforma → guarda.
- [ ] Abro "Import from Twitch" → escribo un canal real (ej. shroud) → Fetch →
      veo sus VODs → importo uno → aparece en el tablero.
- [ ] Abro "Find highlights" → escribo un canal → veo los clips top por vistas →
      importo uno.
- [ ] Elimino una pieza (bote → confirmar) → desaparece.

## 6. Temp League (liga con equipos externos)
- [ ] Creo una liga (nombre + formato) → aparece + puedo seleccionarla.
- [ ] Inscribo 2 equipos externos (nombre + contacto).
- [ ] Programo una partida entre los 2 equipos.
- [ ] Reporto el resultado (ej. 3-1) → se actualiza la tabla de posiciones.
- [ ] La tabla ordena por puntos (3 por victoria) correctamente.
- [ ] En la partida reportada: "Generate recap" → genera el texto → "Copy recap".
- [ ] Edito la liga (League settings → Edit) → renombro → guarda.
- [ ] Elimino la liga (League settings → Delete → confirmar).

## 7. Invitaciones
- [ ] Genero un invite con un rol → aparece el enlace + "Copy link".
- [ ] (Con otra cuenta de Discord) abro el enlace → inicio sesión → me uno a la
      organización con el rol asignado.
- [ ] Revoco una invitación pendiente (X) → cambia a "revoked".

## 8. Responsive (móvil)
- [ ] Encojo la ventana del navegador (o F12 → modo móvil).
- [ ] Aparece el botón de menú (hamburguesa) arriba.
- [ ] El menú se abre/cierra bien; navego entre secciones.
- [ ] El contenido no se desborda feo en pantalla angosta.

## 9. Estados (carga / error / 404)
- [ ] Al navegar entre secciones veo (brevemente) el esqueleto de carga.
- [ ] Abro una ruta que no existe (ej. `/dashboard/xyz`) → veo la página 404
      personalizada con botón "Back to dashboard".

---

## Qué cubrir (resumen de prioridades)
1. **Flujo crítico (haz esto primero):** login → crear org → agregar miembro →
   logout. Si esto falla, nada más importa.
2. **CRUD de cada módulo:** crear, editar, eliminar en los 5 módulos.
3. **Integraciones externas:** Twitch (VODs + highlights), invitaciones Discord.
4. **Seguridad:** rutas protegidas sin sesión, owner no eliminable.
5. **Experiencia:** responsive, toasts, estados de carga/error/404.

## Cómo reportar un fallo
Para cada cosa que falle, anota:
- **Dónde:** qué pantalla / qué módulo.
- **Qué hice:** los pasos exactos.
- **Qué esperaba** vs **qué pasó**.
- Captura de pantalla si puedes.
Con eso se corrige rápido.
