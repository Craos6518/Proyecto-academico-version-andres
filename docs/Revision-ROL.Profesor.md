# Revisión de permisos — ROL: Profesor

Fecha: 2025-11-04
Autor: Revisión automatizada (pair-programming assistant)

## Resumen ejecutivo

Esta revisión examina el rol "Profesor" (Teacher): qué puede hacer desde la UI y qué endpoints y recursos backend utiliza. El objetivo es detectar exposiciones o permisos excesivos (lectura/escritura sobre calificaciones, evaluaciones y entregas) y proponer mitigaciones.

Estado rápido:
- Componentes relevantes: `components/teacher/*` (notablemente `grade-management.tsx`, `evaluations-management.tsx`, `my-subjects.tsx`).
- Endpoints relevantes: `pages/api/teacher/*` (calificaciones, evaluaciones, assignments). Deben estar protegidos con `withAuth` y validar que el caller sea profesor con permisos sobre la materia/curso.
- Recomendación principal: validar server-side que el profesor que solicita/modifica datos tenga asignación sobre la materia y permisos para la acción (p. ej. publicar nota, editar calificación, crear evaluación).

---

## Alcance
- Componentes UI: `components/teacher/*`, `app/teacher/page.tsx`.
- Endpoints API: `pages/api/teacher/*` (grades, evaluations, assignments, downloads).
- Middleware y utilidades: `lib/middleware/auth.ts`, `lib/auth.ts`, `lib/supabase-client.ts`.

---

## Qué puede hacer un Profesor (observado y esperado)
- Acceder a la lista de sus asignaturas y ver estudiantes inscritos.
- Crear y editar evaluaciones (exámenes, tareas) vinculadas a una asignatura.
- Registrar y editar calificaciones por estudiante en sus asignaturas.
- Publicar o marcar calificaciones como visibles para estudiantes.
- Descargar reportes de calificaciones y estadísticas por asignatura.

Acciones esperadas: lectura y escritura limitadas exclusivamente a las asignaturas en las que el profesor está asignado.

---

## Endpoints y protección (estado observado — acciones recomendadas)
- `pages/api/teacher/grades` — Debe exigir `withAuth(handler, ['teacher','admin'])` y comprobar que `caller` es profesor de la materia solicitada.
- `pages/api/teacher/evaluations` — Misma protección; validar autorización por recurso.
- `pages/api/teacher/assignments` — Si permite creación/edición de tareas, debe validar que el profesor pertenezca a la asignatura.

Sugerencia: no confiar en `role` genérico; además del rol `teacher`, verificar la relación `teacher -> subject` en la BD (por ejemplo: tabla `teacher_subjects` o campo `assigned_teacher_id` en `subjects`).

---

## Riesgos específicos para Profesor
1. Edición de calificaciones fuera de su asignatura (Alta):
   - Si un endpoint permite editar notas sin validar la relación profesor↔asignatura, un profesor podría modificar notas que no le corresponden.

2. Publicación de notas sin control (Medio-Alto):
   - Publicar notas debería ser una acción explícita y, preferiblemente, registrada en audit logs.

3. Acceso a datos de estudiantes no relacionados (Medio):
   - Endpoints que devuelven información sensible de estudiantes (emails, documentos) deben filtrar por materia/rol.

4. Bypass por token supabase o JWT mal validado (Medio):
   - `withAuth` debe comprobar token y, crucialmente, extraer `user.id` para comparar con relojes de la BD.

---

## Recomendaciones técnicas y parches mínimos
1) Proteger endpoints con `withAuth` y autorización por recurso:
   - Ejemplo: `withAuth(handler, ['teacher','admin'])` y dentro del handler:

```ts
const callerId = (req as any).user?.id
const subjectId = req.query.subjectId || req.body.subjectId
// verificar en BD que callerId está asignado a subjectId
if (!await isTeacherAssignedToSubject(callerId, subjectId)) return res.status(403)
```

2) Limitar permisos por acción:
   - Crear evaluación: solo profesor asignado o admin.
   - Editar calificación: solo profesor asignado y antes de la fecha límite (si aplica).
   - Publicar nota: acción explícita registrada en logs.

3) Añadir logging/auditoría en endpoints críticos:
   - Registrar `actorId`, `actorRole`, `subjectId`, `action`, `targetStudentId`, `timestamp`.

4) Validaciones de integridad:
   - Evitar que un profesor cambie su propio rol o eleve permisos desde endpoints teacher.
   - Validar payloads para evitar inyección/overposting (white-list fields para updates).

5) Tests mínimos:
   - Unit + integration: profesor asignado puede editar notas; profesor NO asignado recibe 403; no-auth recibe 401.

---

## Checklist de implementación sugerida (prioridad)
1. Revisar `pages/api/teacher/*` y envolver con `withAuth` (si falta).
2. Implementar validación `isTeacherAssignedToSubject(callerId, subjectId)` para endpoints que mutan datos.
3. Añadir logs de auditoría para operaciones de escritura (create/update/delete) en calificaciones y evaluaciones.
4. Añadir tests automáticos para los flujos principales.
5. Ejecutar `npm run lint` y `npm run build` tras cambios.

---

## Notas finales
- Aun cuando el rol `teacher` tiene menos privilegios globales que `admin`, la capacidad de modificar calificaciones y evaluaciones lo hace crítico desde la perspectiva de integridad de datos y confianza académica.
- Defensa en profundidad recomendada: validaciones server-side + RLS en la BD + auditoría de cambios.

Si quieres, puedo:
- Ejecutar una auditoría automática ahora (listar `pages/api/teacher/*` y detectar cuáles no usan `withAuth`) — responde `LISTAR_ENDPOINTS_TEACHER`.
- Aplicar parches mínimos para los endpoints que detectemos inseguros — responde `APLICAR_PATCHES_TEACHER`.

Fin del documento.
