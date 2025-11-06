# Revisión de permisos — ROL: Administrador

Fecha: 2025-11-04
Autor: Revisión automatizada (pair-programming assistant)

## Resumen ejecutivo

Esta auditoría evalúa los permisos, acciones y riesgos asociados al rol "Administrador" en el proyecto. Identifiqué endpoints y componentes que permiten operaciones administrativas, evalué su protección actual y propongo correcciones urgentes y recomendaciones de endurecimiento.

Estado rápido:
- El cliente ahora persiste un `role` canonical (normalizado) en `localStorage` tras una modificación reciente en `lib/auth.ts`.
- Riesgo crítico: varios endpoints bajo `pages/api/admin/*` no están protegidos con `withAuth` y exponen operaciones CRUD y borrados forzados.
- Acción prioritaria: aplicar `withAuth` y validaciones por acción para garantizar que solo usuarios con rol `admin` puedan realizar operaciones sensibles (crear/editar roles admin, force delete, asignación de roles).

---

## Alcance
- Componentes UI relacionados: `components/admin/*`, `components/admin/users-management.tsx`.
- Endpoints API: `pages/api/admin/*` y endpoints transversales que permiten gestión de usuarios, materias, inscripciones, asignaciones, backups/migrations.
- Middleware y utilidades: `lib/middleware/auth.ts`, `lib/auth.ts`, `lib/jwt-utils.ts`, `lib/supabase-client.ts`.

No se realizó here una revisión exhaustiva de la BD (RLS) ni del entorno de producción; ver recomendaciones.

---

## Qué puede hacer un Administrador (observado en el código)
- CRUD completo sobre usuarios (crear, editar, asignar roles, eliminar, fuerza de borrado).
- Gestionar materias, asignaturas, inscripciones y asignaciones (endpoints admin para subjects/enrollments/assignments).
- Acceder a datos y reportes administrativos.
- Ejecutar operaciones que en el código pueden realizar borrados en cascada o borrados forzados de dependencias (scripts/acciones administrativas).
- Potencial acceso a operaciones de migración o seed (scripts en `scripts/`), que podrían ser ejecutadas por personal con acceso a la base de datos.

---

## Estado actual de protección (resumen)
- `pages/api/admin/users.ts`: NO protegido; permite GET/POST/PUT/DELETE, incluyendo `force` delete — riesgo ALTO.  ❌
- `pages/api/admin/*` (subjects, enrollments, roles, etc.): varias rutas no usan `withAuth` — riesgo ALTO/medio dependiendo de la operación. ❌
- `components/admin/users-management.tsx`: UI permite a un usuario con rol Director ver y operar usuarios; la lógica UI oculta Admins en la vista pero no garantiza seguridad server-side.
- `lib/middleware/auth.ts`: existe y se usa en algunas rutas, pero no en todas. Requiere mejora: normalizar `allowedRoles` con `normalizeRole` y propagar `req.user` de forma consistente.

---

## Riesgos y ejemplos concretos
1. Creación y asignación de roles admin sin verificación server-side (Muy alto):
   - Si `admin/users.ts` permite crear usuarios con `roleName: 'Administrador'` sin comprobar que el requester es admin, un actor autenticado con otro rol (o sin autenticación si la ruta está abierta) puede auto-escalarse.

2. Borrado forzado (`force=true`) que elimina dependencias (Muy alto):
   - El endpoint realiza borrados de filas relacionadas; si se permite sin restricción, un atacante puede provocar pérdida masiva de datos.

3. Uso de `supabaseAdmin` en endpoints no protegidos (Alto):
   - El servicio server-side con role `service_role` tiene poderes elevados; si código que usa `supabaseAdmin` está accesible desde rutas públicas, hay riesgo de explotación.

4. Confianza en validación cliente (Medio):
   - `UsersManagement` y otros componentes confían en la UI para filtrar/ocultar acciones; el servidor debe ser la fuente de verdad.

---

## Recomendaciones inmediatas (parches de alta prioridad)

1) Protección de rutas admin críticas (hacer ahora):
   - Envolver `pages/api/admin/users.ts` y otras rutas modificadoras con `withAuth(handler, ['admin'])`.
   - Implementar validaciones por acción dentro del handler:
     - POST/PUT: si payload intenta asignar `role`/`roleName` igual a `Administrador` o `admin`, rechazar con 403 si `callerRole !== 'admin'`.
     - DELETE: permitir `force` solo si `callerRole === 'admin'`. Si el target es `admin`, solo `admin` puede borrarlo.

2) Normalizar `withAuth` y comparaciones de roles:
   - En `lib/middleware/auth.ts`, mapear `allowedRoles` con `normalizeRole` y comparar con `normalizeRole(payload.role)` para evitar bypasses por formato/case.

3) Minimizar uso de `supabaseAdmin` en handlers públicos:
   - Asegurarse que cualquier handler que use `supabaseAdmin` esté protegido y que los checks de autorización ocurran antes de cualquier operación con ese cliente.

4) Revisar y proteger todas las rutas `pages/api/admin/*` (audit completo):
   - Automatizar búsqueda de rutas sin `withAuth` y priorizar según sensibilidad (users, roles, deletions, migrations).

5) Políticas internas en `admin/users.ts` (ejemplos):

Pseudocódigo para POST:

```ts
const callerRole = normalizeRole((req as any).user?.role ?? (req as any).user?.roleName)
if (normalizeRole(payload.roleName) === 'admin' && callerRole !== 'admin') {
  return res.status(403).json({ error: 'No autorizado para crear administradores' })
}
```

Pseudocódigo para DELETE:

```ts
if (req.query.force) {
  if (callerRole !== 'admin') return res.status(403)
}
const target = await db.getUserById(id)
if (normalizeRole(target.roleName) === 'admin' && callerRole !== 'admin') return res.status(403)
```

---

## Controles adicionales y endurecimiento (mediano plazo)
- Añadir pruebas unitarias e integración para `withAuth` y `admin/users.ts`.
- Documentar una matriz de permisos: por cada endpoint, listar qué roles pueden CALL/POST/PUT/DELETE.
- Considerar añadir RLS (Row-Level Security) y políticas en la base de datos para limitar operaciones de in-band.
- Revisar logs y alertas para operaciones sensibles (borrados masivos, cambios de rol).

---

## Cambios recomendados a corto plazo (lista accionable)
1. Envolver rutas: `admin/users.ts`, `admin/subjects.ts`, `admin/enrollments.ts`, `admin/roles.ts` con `withAuth`.
2. Añadir validaciones por acción dentro de `admin/users.ts` (crear admin, eliminar admin, force delete).
3. Ejecutar `npm run lint` y `npm run build` tras cambios. Si pasan, desplegar a staging y ejecutar pruebas.
4. Crear tests automatizados (unit + integration).

---

## Notas sobre auditoría previa (Director)
- Se aplicó una mejora a `lib/auth.ts` para persistir el campo `role` canonical en localStorage y `authService.hasRole` ahora usa `normalizeRole`.
- Esa mejora reduce discrepancias cliente/servidor, pero la seguridad real depende de aplicar validaciones server-side en endpoints críticos.

---

## Próximo paso propuesto
Puedo aplicar los parches urgentes ahora (proteger `pages/api/admin/users.ts` y añadir validaciones mínimas) y ejecutar `lint` y `build`. Indica "APLICAR_PATCH_ADMIN" para que lo haga en este turno.

Si prefieres, primero hago un listado automático de todos los `pages/api/admin/*` que no usan `withAuth` y te lo presento para priorizar.

---

Fin del documento.
