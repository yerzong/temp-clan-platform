# Temp Tactical — Los Cuatro Componentes a Gestionar

> Alcance real de lo que Temp Tactical necesita, confirmado por Gerson (oct 2026).
> Define qué construimos y en qué orden, con Temp Tactical como cliente cero.

## Los cuatro componentes

| # | Componente | Naturaleza | ¿Ya modelado? |
|---|-----------|-----------|---------------|
| 1 | **Staff** | Interno — operación de la organización | Sí (Módulo 0, rol `staff`) |
| 2 | **Equipo de esports** | Interno — roster competitivo propio | Sí (Módulo 0 rol `player` + Módulo 3) |
| 3 | **Creadores de contenido** | Interno — streamers/clippers | Sí (Módulo 0 rol `creator` + Módulo 1) |
| 4 | **Temp League** | EXTERNO — liga de Gears E-Day con equipos de terceros | NO — pieza nueva |

Los componentes 1–3 son **gestión interna**: gente con distintos roles dentro de
Temp Tactical. El núcleo multi-tenant (Módulo 0) ya los soporta.

El componente 4, **Temp League**, es de naturaleza distinta: Temp Tactical actúa
como **organizador/comisionado** de una liga donde compiten equipos que NO son
suyos.

## Temp League — análisis honesto

### Qué es
Una liga de **Gears E-Day** con **equipos externos**. Implica: inscripción de
equipos de terceros, jornadas, calendario de partidas, reporte de resultados,
tabla de posiciones/standings, posiblemente playoffs.

### El riesgo (hay que decirlo)
Este es el territorio de herramientas MADURAS y especializadas: **Toornament,
Start.gg, Battlefy** (ver 01-market-analysis.md). Construir un motor de
brackets/ligas desde cero para competir con ellos es mucho trabajo y es su
especialidad, no la nuestra.

### El ángulo que SÍ tenemos (nuestro plus)
La liga vive **dentro de la misma plataforma** donde Temp Tactical gestiona su
organización, con la **capa de Gears E-Day** (modos reales: Versus 4v4, Horde
Siege). Esa integración organización + liga + Gears es lo que las herramientas
genéricas no ofrecen.

### La decisión estratégica (pendiente de confirmar)
Dos caminos para Temp League:
- **A) Construir lo mínimo de liga** que Temp Tactical necesita (inscripción,
  calendario simple, standings), integrado con el resto. Más control, más
  trabajo, calidad inicial por debajo de los especialistas.
- **B) Integrar con una herramienta existente** (Start.gg / Toornament vía API)
  y quedarnos con la capa de organización + Gears encima. Más rápido, menos
  trabajo, dependemos de un tercero para el motor de brackets.

> Recomendación preliminar: NO construir un motor de liga completo desde cero al
> inicio. Evaluar camino B o un mínimo del A. Confirmar con Gerson al llegar a
> este módulo.

## Orden de construcción propuesto (Temp Tactical primero)

Sobre el núcleo ya construido (Módulo 0 + migración + Supabase):

1. **Núcleo de miembros** (ya en marcha): staff + jugadores + creadores con
   roles, dentro de la organización Temp Tactical. Cubre los componentes 1–3 en
   su forma base.
2. **Gestión de equipo de esports** (Módulo 3 base): roster, con el plus de
   sostenibilidad como diferenciador cuando toque.
3. **Contenido/creadores** (Módulo 1): fábrica de clips con la capa de Gears.
4. **Temp League** (módulo nuevo): al final del arco inicial, con la decisión
   construir-vs-integrar ya tomada. Es lo más grande y lo más riesgoso de
   construir desde cero.

> La liga se deja para después NO porque no importe, sino porque es la pieza más
> pesada y la que más conviene decidir con cuidado (construir vs integrar) para
> no reinventar Toornament.

## Pendiente de confirmar con Gerson

- De los componentes 1–3, ¿cuál le duele MÁS hoy y quiere ver primero
  funcionando? (define el primer módulo real después del núcleo).
- Para Temp League: ¿construir mínimo propio o integrar con Start.gg/Toornament?
  (no urge decidirlo hasta llegar al módulo, pero conviene irlo pensando).
