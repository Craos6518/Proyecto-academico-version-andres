# Revisión de permisos — ROL: Director

Fecha: 2025-11-04
Autor: Revisión automatizada (pair-programming assistant)

## Resumen ejecutivo

Esta revisión analiza el estado actual de permisos y acciones asociadas al rol "Director" en el proyecto. Identifiqué endpoints, componentes y mecanismos de autorización (cliente y servidor), encontré riesgos críticos y propongo correcciones de mitigación inmediata y recomendaciones de endurecimiento.

Estado rápido:
- Build y lint pasan tras los cambios recientes.
- Riesgo crítico: múltiples endpoints administrativos y de datos están expuestos sin verificación server-side (p. ej. `pages/api/admin/users.ts`, `pages/api/director/stats.ts`).
- Acción prioritaria: proteger endpoints sensibles con middleware que verifique token y role; aplicar políticas por acción (crear/editar/eliminar).

---

## Alcance de la revisión
Incluye:
- Componentes de Director en UI: `app/director/page.tsx`, `components/director/*`.
- Endpoints API relevantes en `pages/api/director/*`, `pages/api/admin/*`, `pages/api/teacher/*` y `pages/api/auth/*`.
- Middleware de autorización: `lib/middleware/auth.ts`.
- Utilidades de auth: `lib/auth.ts`, `lib/jwt-utils.ts`.

No se analizaron cambios fuera del contexto (p. ej. infraestructura de red o reglas RLS en Supabase), pero se dan recomendaciones complementarias.

---

## Acciones expuestas desde la UI (qué puede hacer un Director desde la app)
- Acceder al dashboard del Director (reportes, analítica).
- Descargar o solicitar reportes (menciones a `/api/director/report.csv` y `/api/director/report.pdf`).
- Ver reportes por materia y por estudiante (server components que obtienen datos server-side).
- Acceder al componente de gestión de usuarios (`UsersManagement`) dentro del dashboard: listar, crear, editar, cambiar contraseña y eliminar usuarios. Nota: la restricción sobre no mostrar Admins en la lista para Director es solo UI.

---

## Endpoints identificados y su protección
A continuación se listan los endpoints clave y si usan `withAuth`:

- Protegidos con `withAuth` y roles esperados:
  - `pages/api/director/secure-data.ts` → withAuth(..., ["director"])  ✅
  - `pages/api/admin/secure-data.ts` → withAuth(...) ✅
  - `pages/api/teacher/secure-data.ts`, `pages/api/student/secure-data.ts` → withAuth ✅

- No protegidos (Riesgo):
  - `pages/api/director/stats.ts` → NO usa `withAuth` (devuelve estadísticas agregadas).  ❌
  - `pages/api/admin/users.ts` → NO usa `withAuth` (GET/POST/PUT/DELETE para usuarios, incluida `force` delete).  ❌
  - Otros endpoints `pages/api/admin/*` (subjects, roles, assignments, stats, enrollments) no usan `withAuth` salvo `secure-data.ts`.  ❌

- Utilidad de identidad:
  - `pages/api/auth/me.ts` → usa `verifyJWT` y devuelve role normalizado — sirve como fuente server-side para validar token y role.

- Middleware central:
  - `lib/middleware/auth.ts` → implementa `withAuth(handler, allowedRoles = [])`. Verifica JWT interno via `verifyJWT`. Si falla, intenta obtener usuario desde Supabase (`supabaseAdmin.auth.getUser(token)`), luego consulta tabla `users` para extraer `role`.
  - Mejora sugerida: normalizar `allowedRoles` usando `normalizeRole` (en vez de solo toLowerCase) y comparar con `normalizeRole(payload.role)`.

---

## Problemas y riesgos (priorizados)
1. Endpoints administrativos sin protección (Alta):
   - `pages/api/admin/users.ts` y otras APIs admin permiten operaciones CRUD sin autenticación. Riesgo: un actor no autenticado puede crear cuentas, asignar roles, eliminar datos. Especialmente peligroso el `force` delete que borra dependencias.

2. Endpoints de Director sin protección (Alta):
   - `pages/api/director/stats.ts` expone estadísticas sin verificar rol. Datos agregados pueden ser sensibles.

3. Lógica de seguridad en cliente (Medio):
   - `UsersManagement` filtra visualmente para esconder administradores a Directores, pero sin validación server-side esto es solo una barrera superficial.

4. Robustez del middleware (Medio):
   - `withAuth` normaliza allowedRoles con `.toLowerCase()`; es preferible usar `normalizeRole` para asegurar mapeos (p. ej. "Director", "Director ", "direcctor" se normalicen).

5. Endpoints usados por componentes cliente (Medio):
   - `PerformanceAnalytics` hace fetch a `/api/teacher/grades` y `/api/teacher/assignments` desde cliente. Asegurar que esos endpoints sólo retornen datos permitidos y estén protegidos.

---

## Recomendaciones y parches propuestos (con prioridad)

Prioridad inmediata (Mitigación rápida — aplicar ahora):

1) Proteger endpoints clave con `withAuth`:
   - `pages/api/director/stats.ts` → envolver con `withAuth(handler, ["director","admin"])`.
   - `pages/api/admin/users.ts` → envolver con `withAuth(handler, ["admin","director"])` o (más seguro) `['admin']` y luego diseñar excepciones para Director (ver 2).

Ejemplo mínimo:

```ts
import { withAuth } from "../../../lib/middleware/auth"

export default withAuth(async (req, res) => {
  // lógica actual
}, ["director", "admin"] )
```

2) Endurecer `pages/api/admin/users.ts` (controles por acción):
   - Obtener rol del llamante `const caller = (req as any).user; const callerRole = normalizeRole(caller?.role ?? caller?.roleName)` (puesto por `withAuth`).
   - Regla para POST/PUT: si requester no es `admin` y payload intenta asignar `roleName` = `Administrador`, negar con 403.
   - Regla para DELETE: sólo `admin` puede eliminar administradores o usar `force`.
   - Para `director`: permitir GET y PUT limitados (no cambiar roles a admin, no force-delete).

Pseudocódigo:

```ts
if (req.method === 'POST') {
  if (normalizeRole(payload.roleName) === 'admin' && callerRole !== 'admin') {
    return res.status(403).json({ error: 'No puedes crear administradores' })
  }
}

if (req.method === 'DELETE') {
  if (callerRole !== 'admin') {
    // carga target user y verifica
    if (normalizeRole(target.roleName) === 'admin') return res.status(403)
    if (req.query.force) return res.status(403)
  }
}
```

3) Normalizar `withAuth`:
   - Cambiar `allowedRoles.map(r => r.toLowerCase())` por `allowedRoles.map(r => normalizeRole(String(r)))` y comparar contra `normalizeRole(payload.role)`.

4) Auditoría completa (siguiente paso):
   - Buscar todos los `pages/api/*` que no envuelven con `withAuth` y priorizarlos por sensibilidad (users, grades, assignments, enrollments, subjects, roles, stats).

Medio plazo (endurecimiento y pruebas):
- Añadir tests unitarios para `normalizeRole` y para `withAuth` (mock tokens, supabase fallback).
- Añadir pruebas de integración mínimas que simulen llamadas a `admin/users` por un `director` vs `admin` y verifiquen respuestas 200/403 según caso.
- Documentar políticas de autorización (matriz de rol→acción) en `docs/ENDPOINTS-PROTEGIDOS-ROL.md` o el README técnico.
- Considerar aplicar Row-Level Security (RLS) y políticas en la BD (supabase) como defensa en profundidad.

---

## Cambios realizados durante la revisión
- Se actualizó `lib/auth.ts` para almacenar una clave canonical `role` (normalizada) al persistir el usuario en `localStorage` y `authService.hasRole` ahora compara con `normalizeRole` para evitar discrepancias entre cliente y servidor.
- Ejecuté `npm run lint` y `npm run build`. Ambos pasaron correctamente tras los cambios.

---

## Plan de parche inmediato (si se autoriza)
1. Aplicar parches mínimos: proteger `pages/api/director/stats.ts` y `pages/api/admin/users.ts` con `withAuth`.
2. Añadir validaciones internas en `admin/users.ts` para acciones sensibles (crear admin, force delete).
3. Ejecutar build/lint y pruebas rápidas.

Puedo aplicar estos cambios ahora mismo y crear un pequeño PR en la rama actual si lo autorizas.

---

## Próximos pasos recomendados (ordenados)
1. Mitigación inmediata: envolver endpoints listados y aplicar validaciones (esto reduce el riesgo en minutos).
2. Auditoría completa automática de `pages/api/*` para detectar rutas sin `withAuth` (priorizar endpoints que modifican datos o devuelven info sensible).
3. Implementar política de roles por acción en `admin/users.ts` y endpoints admin críticos.
4. Añadir tests unitarios e integración para middleware y reglas de autorización.
5. Revisar políticas de RLS/DB y credenciales de `supabaseAdmin` usadas en server-side.

---

Si deseas, aplico los parches mínimos ahora (propuesta: parchear `pages/api/director/stats.ts` y `pages/api/admin/users.ts` y ejecutar build/lint). Indica "APLICAR_PATCH_MINIMO" y lo hago en este turno.

Fin del documento.
