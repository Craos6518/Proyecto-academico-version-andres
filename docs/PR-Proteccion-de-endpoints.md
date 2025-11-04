# PR: Proteccion-de-endpoints

Resumen breve
- Hardening de endpoints admin y RBAC.
- Implementación de safeguard para evitar eliminación/despromoción del último Administrador.
- Normalización de roles y mejoras en middleware y UI.
- Stub de Supabase para entorno de test (in-memory) para permitir tests herméticos.

Archivos principales modificados
- lib/supabase-client.ts — stub en memoria para tests, detección IS_TEST, wiring de supabaseAdmin
- lib/middleware/auth.ts — normalización de roles y verificación más robusta
- lib/auth.ts — normalización y persistencia de rol canonical
- pages/api/admin/users.ts — last-admin safeguard, restricciones para asignar/eliminar Admin
- pages/api/admin/assignments.ts — owner checks y withAuth
- pages/api/admin/subjects.ts — withAuth
- pages/api/admin/enrollments.ts — withAuth
- pages/api/admin/roles.ts — withAuth
- pages/api/admin/stats.ts — withAuth
- components/admin/users-management.tsx — UI: ocultar rol Admin a no-admins y manejar 403/409
- tests/users.rbac.test.ts & tests/utils/mockReqRes.ts — tests RBAC y utilidades

Verificación realizada
- ESLint: pasado (sin advertencias críticas para los cambios aplicados)
- Tests (Vitest): todos los tests añadidos/presentes pasan (2 tests en `tests/users.rbac.test.ts`)
- Next.js build: compilación previa exitosa durante validación de cambios

Instrucciones para probar localmente
1. Instalar dependencias: `npm install`
2. Ejecutar los tests: `npm run test`
3. Ejecutar linter: `npm run lint`
4. Para ejecutar la app localmente: `npm run dev` (asegúrate de configurar las variables SUPABASE_* en entornos no-test)

Notas y recomendaciones
- Recomendado: añadir tabla `admin_audit_logs` y registrar eventos sensibles (creación/eliminación/despromoción de Admin).
- Recomendado: revisar RLS en Supabase y rotación de claves service_role.
- Recomendado: añadir más tests de integración (ownership, teacher assignment ownership, etc.).

Contacto
Si quieres que continúe con (A) migración y audit logs, (B) más tests, o (D) preparar PR con cambios mínimos, responde aquí y procedo.
