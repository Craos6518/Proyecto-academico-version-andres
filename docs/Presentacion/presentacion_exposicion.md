# Presentación profunda — Proyecto Académico

Documento de referencia para exposición técnica y ejecutiva.
Destinatarios: comité evaluador, equipo de desarrollo y docentes.
Formato: charla de equipo (3 presentadores) + máximo 10 diapositivas de apoyo.
Duración objetivo: 20–25 minutos (más 10 minutos de preguntas).

---

## Objetivos de la exposición

1. Explicar el problema y el alcance del proyecto.
2. Presentar la arquitectura técnica, decisiones y migraciones realizadas.
3. Resumir riesgos, mitigaciones y próximos pasos.
4. Mostrar evidencia (scripts, endpoints protegidos, UI/UX) y métricas de trabajo internas.

Público: mezcla técnica/técnico-administrativa — preparar lenguaje claro y ejemplos.

---

## Reparto y tiempos (3 expositores)

- Presentador A (Andrés) — Contexto y Estado del Proyecto (slides 1-3) — 6–8 min
- Presentador B (Dev Lead) — Arquitectura, Migraciones y Endpoints (slides 4-7) — 8–10 min
 - Presentador C (QA/UX) — UI/UX, pruebas y próximos pasos (slides 8-10) — 6–7 min

Tiempo por diapositiva: ~2 min en promedio; permitir transiciones y preguntas cortas.

---

## Contrato breve para la presentación (inputs/outputs/éxitos)

 - Inputs: código fuente (repositorio), scripts SQL, notas de migración, dashboards y reportes internos.
- Outputs: comprensión clara de la solución, decisiones justificadas y checklist de acciones siguientes.
- Criterios de éxito: audiencia entiende la arquitectura, se identifican riesgos y se aprueba plan de acción.

---

## Documento profundizado (resumen extendido)

1) Contexto del problema

- Necesidad: sistema para gestión de notas académicas con roles (admin, director, teacher, student).
- Requisitos principales: control de acceso por roles, persistencia en Postgres, generación de reportes y exportaciones.
- Decisión inicial: frontend Next.js + Supabase (Postgres) en backend para auth y datos.

2) Estado actual y cambios relevantes

- Migración a Supabase: creación de clientes anon y admin (service-role), scripts SQL para esquema y seed (`/scripts/03-04`), endpoints server-side para admin/teacher.
- Autenticación: transición desde token en body → cookie HttpOnly `academic_auth_token`. Cambios en `lib/auth.ts`, `pages/api/auth/login.ts`, y middleware para leer cookie si no hay header.
- DB: scripts para normalizar `id` a identity (`05-migrate-id-to-identity.sql`) y fallbacks temporales (`max(id)+1`) en endpoints hasta aplicar la migración.
- Normalización de datos: mapping snake_case ↔ camelCase en endpoints y UI.

3) Endpoints y seguridad

- Endpoints protegidos por rol: `/api/admin/*`, `/api/director/*`, `/api/teacher/*`, `/api/student/*`.
- Autenticación esperada en producción: cookie HttpOnly; en pruebas/dev se puede usar `Authorization: Bearer <token>`.
- Middleware: validación JWT, normalización de role y fallback para lectura de token desde `req.cookies`.

4) UI/UX y calidad

- Ajustes de responsive: fixes en `components/ui/*`, `dashboard-layout`, `sidebar` para evitar overflow y mejorar accesibilidad (<1024px tests).
- Verificación: `npx tsc --noEmit` y `npm run lint` pasaron en la sesión de redimensionado.
- Bugs detectados y resueltos: saludo faltante "Bienvenido, " causado por shape distinto de `user`; solución: resolver displayName con fallbacks.

5) Migraciones y scripts

- Scripts clave en `/scripts`: `03-supabase-schema.sql`, `04-supabase-seed.sql`, `05-migrate-id-to-identity.sql`.
- Recomendación: ejecutar `05-migrate-id-to-identity.sql` en staging con backup; luego remover fallbacks `max(id)+1`.

6) Métricas y evidencia

- Métricas y evidencia: revisar logs, resultados de tests y artefactos de CI disponibles en `/docs` y en el repositorio. Este documento no incluye métricas de WakaTime.

7) Riesgos y mitigaciones

- Riesgo: scripts de migración en DB pueden causar conflictos si no se aplican con backup — Mitigación: staging + backup + tests.
- Riesgo: exposición de token en cliente — Mitigación: cookie HttpOnly, eliminar token en body y refactor tests.
- Riesgo: tablas anchas en UI → overflow — Mitigación: paginación o reflow adaptativo.

8) Próximos pasos recomendados (priorizados)

- P1: Ejecutar migración `05-migrate-id-to-identity.sql` en staging y validar. (Ejecutado)
- P2: Eliminar `pages/api/auth/set-token` y pruebas que dependan de token en body. (Ejecutado)
- P3: Añadir tests automáticos (auth, student/secure-data, endpoints admin/teacher). (Ejecutado)
- P5: QA visual con datos reales (Supabase) para validar responsive y tablas. (Ejecutado)

---

## Guion detallado por presentador (script y señales)

### Presentador A — Contexto y estado (Slides 1–3)

Slide 1: Título y objetivo de la presentación — 30s
- Opening: saludo, presentación del equipo (nombres y roles).
- Objetivo: explicar qué cubriremos y qué esperamos del comité.

Slide 2: Problema y alcance — 90s
- Describir casos de uso: registro de notas, panel por rol, reportes.
- Datos esperados: volúmenes (estudiantes, materias) si aplica.

Slide 3: Estado global y timeline — 120s
- Estado actual del repositorio: migración a Supabase, endpoints implementados, scripts en `/scripts`.
- Mencionar hitos: migración auth, layouts responsive, verificación de build.

Transición: pasar a arquitectura técnica (Presentador B).

---

### Presentador B — Arquitectura y endpoints (Slides 4–7)

Slide 4: Arquitectura técnica — 90–120s
- Diagrama simple: Next.js frontend ↔ Supabase (Postgres + Auth) ↔ scripts SQL.
- Roles y flujo de autenticación (cookie HttpOnly como fuente de verdad).

Slide 5: Migraciones y DB — 90s
- Explicar `05-migrate-id-to-identity.sql` y razón del fallback temporario.
- Procedimiento seguro para aplicar migración (backup → staging → prod).

Slide 6: Endpoints protegidos y middleware — 90s
- Mostrar ejemplos: `/api/admin/users`, `/api/teacher/grades`, `/api/student/secure-data`.
- Explicar middleware: verificación JWT, lectura de cookie, rol canónico.

Slide 7: Seguridad y pruebas — 90s
- Enfoque para pruebas: Postman, fetch con `credentials: 'same-origin'`.
- Recomendación: añadir tests automáticos y e2e para flows de login y protected endpoints.

Transición: pasar a UI/UX y métricas (Presentador C).

---

### Presentador C — UI/UX, métricas y próximos pasos (Slides 8–10)

Slide 8: UI/UX y QA responsive — 90s
- Mostrar screenshots (antes/después) o enumerar fixes (sidebar, cards, inputs, charts).
- Checklist de QA visual y pasos para reproducir (responsive tool, resoluciones).

Slide 9: Evidencia y métricas internas — 60–90s
- Señalar artefactos de evidencia: logs, resultados de tests (unit/e2e), reportes de CI y PRs relacionados.
- Explicar dónde encontrar los reportes y cómo reproducir las métricas locales (scripts, logs y querys SQL).

Slide 10: Roadmap, riesgos y cierre — 90–120s
- Prioridades (P1–P5) y responsables.
- Llamado a la acción: aprobación para ejecutar migración staging y añadir tests.
- Q&A → abrir 10 minutos finales para preguntas.

---

## Diapositivas (contenido listo para copiar a PowerPoint / Google Slides)

A continuación cada diapositiva con título, bullets y notas de orador.

---

### Diapositiva 1 — Portada
- Título: "Proyecto Académico — Gestión de Notas"
- Subtítulo: Resumen técnico y plan de migración
- Equipo: Nombre A (Contexto), Nombre B (Arquitectura), Nombre C (QA/UX)

Notas: saludo y objetivo. 20–30s.

---

### Diapositiva 2 — Problema y alcance
- Necesidad: sistema fiable para gestión de calificaciones por rol.
- Usuarios: Admin, Director, Profesor, Estudiante.
- Funcionalidades clave: CRUD users/subjects, inscripciones, asignaciones, grades, reportes.

Notas: explicar casos de uso y valor para la institución.

---

### Diapositiva 3 — Estado y logros
- Migración parcial a Supabase (clientes anon/admin).
- Endpoints server implementados: `/api/admin/*`, `/api/teacher/*`, `/api/student/secure-data`.
- Auth: cookie HttpOnly `academic_auth_token` (mejora seguridad).

Notas: mencionar pruebas y verificación de build/lint.

---

### Diapositiva 4 — Arquitectura
- Frontend: Next.js + TypeScript + Tailwind
- Backend/Bd: Supabase (Postgres + Auth)
- Scripts: `/scripts` para esquema y seed
- Diagrama simple (sugerir slide visual)

Notas: enfatizar separación responsabilidades y clientes supabase.

---

### Diapositiva 5 — Migraciones de BD
- Scripts: `03-supabase-schema.sql`, `04-supabase-seed.sql`, `05-migrate-id-to-identity.sql`.
- Riesgo: `id` sin autoincrement → fallbacks temporales (`max(id)+1`).
- Mitigación: ejecutar `05-migrate-id-to-identity.sql` en staging con backup.

Notas: explicar pasos de rollback y cómo validar.

---

### Diapositiva 6 — Endpoints seguros
- Ejemplos: `/api/admin/users`, `/api/teacher/grades`, `/api/student/secure-data`.
- Política: protección por rol (JWT cookie HttpOnly o Authorization bearer en dev).
- Pruebas: Postman flows y fetch con `credentials: 'same-origin'`.

Notas: mostrar ejemplo de respuesta JSON resumida (ver `ENDPOINTS-PROTEGIDOS-ROL.md`).

---

### Diapositiva 7 — Seguridad & pruebas automáticas
- Eliminar token en body del login en prod.
- Añadir tests e2e para login + cookies y protected endpoints.
- Integrar CI para build + lint + tests.

Notas: coste estimado y beneficios.

---

### Diapositiva 8 — UI/UX y resultados de redimensionado
- Fixes aplicados: sidebar colapsable, max-width en cards, inputs accesibles, charts responsivos.
- Steps para QA visual: devtools responsive, pruebas con datos reales.

Notas: mostrar comparativa y alertas pendientes.

---

### Diapositiva 9 — Evidencia y métricas internas
- Artefactos: logs, resultados de tests, reportes de CI y PRs adjuntos en el repositorio.
- Método para obtener cifras: consultas a la BD para métricas internas, resultados de CI y resúmenes de tests.
- Tabla ejemplo (placeholder si se necesita más detalle):
  - Total tareas/PRs en el sprint: —
  - Tests unitarios/pasados: —
  - Incidencias críticas resueltas: —

Notas: explicar dónde encontrar los artefactos y cómo interpretarlos.

---

### Diapositiva 10 — Roadmap y cierre
- Prioridades: ejecutar migración, añadir tests, limpiar auth dev flows, QA visual.
- Solicitud: aprobación para ejecutar P1 en staging y asignación de responsable.
- Abrir Q&A 10 min.

Notas: despedida y contacto.

---

## Material de apoyo y anexos

- Enlaces directos:
  - Repo: https://github.com/Craos6518/Proyecto-academico-version-andres
  - `README.md` y `/docs` para notas detalladas.

- Archivos importantes: `/scripts/03-05-...sql`, `pages/api/*`, `lib/*`.

---

## Checklist previa a la exposición (tareas prácticas)

- [x] Próximos pasos P1–P5: ejecutados y validados (migración, limpieza auth, tests, reportes internos, QA visual).
- [x] (N/A) Capturas de pantalla: no se tomaron capturas; la slide 8 describe los fixes sin imágenes.
- [ ] Preparar diagrama en herramienta visual para slide 4.
- [ ] Revisar entorno y pruebas con `npm run dev` y `supabase start` (si se usa local).

---

## Entrega

He creado este archivo `presentacion_exposicion.md` con todo el contenido necesario: documento profundizado, guion por presentador, 10 diapositivas de apoyo y checklist. Puedo exportarlo a PPTX (con títulos y bullets) o a Google Slides si lo necesitas: dime formato preferido.
