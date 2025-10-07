Estado del proyecto y plan de acción
Fecha: 2025-10-07

Resumen del estado de los Requerimientos Funcionales (RF)

RF1 - Autenticación de usuarios: Parcial
- Implementación actual: mock auth en `lib/auth.ts` (cliente local + localStorage).
- Pendiente: Issuing y validación de JWTs server-side, protección de rutas.

RF2 - Gestión de usuarios (CRUD): Parcial
- Implementación actual: CRUD simulado en `lib/api-client.ts` usando localStorage.
- Pendiente: Migración a endpoints reales y persistencia en BD.

RF3 - Inscripciones y asignaciones: Parcial
- Implementación actual: funcionalidades UI y lógica en `lib/api-client.ts` con datos mock.
- Pendiente: Persistencia en BD y validaciones server-side.

RF4 - Gestión de calificaciones: Parcial
- Implementación actual: componentes `components/teacher/grade-management.tsx` y cálculos en `lib/api-client.ts`.
- Correcciones recientes: evita `value={NaN}` en inputs numéricos.
- Pendiente: Concurrencia y endpoints server-side.

RF5 - Paneles por rol (Admin/Director/Teacher/Student): Hecho (UI)
- Implementación actual: páginas y componentes por rol en `app/*` y `components/*`.
- Pendiente: conexión con backend real para datos persistentes.

RF6 - UI/UX y biblioteca de componentes: Hecho
- Implementación actual: componentes UI (Radix/Tailwind), conversión parcial a `forwardRef` para compatibilidad con `asChild`/`Slot`.
- Pendiente: completar conversión en todo el repositorio para eliminar warnings de refs.

RF7 - Auditoría y logs: Parcial
- Implementación actual: scripts SQL (`scripts/*.sql`) definen tabla `audit_logs` y triggers.
- Pendiente: endpoints server-side que persistan `audit_logs` desde la app.

RF8 - Roles y permisos: Parcial
- Implementación actual: roles modelados en `lib/mock-data.ts` y comprobaciones en UI.
- Pendiente: middleware server-side para verificar permisos con JWT.

RF9 - Reportes y exportación (CSV/PDF): No implementado
- Pendiente: endpoints de exportación y botones UI para descarga.

RF10 - Seguridad y cambios de contraseña: Parcial
- Implementación actual: `lib/actions/password.ts` maneja cambios de contraseña en localStorage.
- Pendiente: registrar cambios en `audit_logs` (persistencia) y flujo de recuperación de contraseña.

Plan de acción (próxima sesión)
1) Ejecutar `npm install` y arrancar `npm run dev` para validar que no quedan warnings en consola (refs / NaN). (Prioridad alta)
2) Completar conversiones `asChild`/`Slot` -> `forwardRef` en componentes UI restantes. (Prioridad alta)
3) Verificar e integrar `@supabase/supabase-js` y probar `utils/supabase/server.ts` helper con operaciones básicas (inserción en `audit_logs`). (Prioridad media)
4) Implementar endpoint autenticación JWT + middleware de roles. (Prioridad alta)
5) Adaptar `lib/actions/password.ts` para escribir en `audit_logs` vía endpoint o Supabase. (Prioridad media)
6) Implementar export CSV/PDF para reportes de director. (Prioridad baja)
7) Añadir tests básicos (smoke) y ejecutar build/lint. (Prioridad media)

Notas técnicas
- Muchas correcciones de UI ya aplicadas para forwardRef; puede quedar trabajo manual en componentes que usen `asChild`/`Slot`.
- Los scripts SQL incluyen triggers para auditoría; la tabla `audit_logs` está diseñada y documentada.

Hecho por: cambios locales en el workspace
