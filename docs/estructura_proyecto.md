# Estructura del proyecto — Proyecto Académico

Este documento describe en detalle la estructura del repositorio, la organización de carpetas, las relaciones entre componentes, las funcionalidades principales y las limitaciones conocidas. Está pensado para un lector técnico que necesita comprender rápidamente la arquitectura y los puntos críticos para mantenimiento o despliegue.

## Resumen general

- Stack principal: Next.js (React) + TypeScript en el frontend, Supabase (Postgres + Auth) como backend/persistencia.
- Estilos: Tailwind CSS y utilidades (plugins y animaciones incluidas).
- Autenticación: JWT y migración a cookie HttpOnly (`academic_auth_token`) como fuente de verdad en producción.
- Scripts y migraciones: carpeta `/scripts` con SQL para esquema, seed y migraciones de ids.

---

## Árbol de carpetas (alto nivel)

Raíz (selección de elementos relevantes):

- `app/` — Entradas del frontend en la arquitectura de Next.js (layouts, páginas por rol y rutas principales).
- `components/` — Componentes React reutilizables y organizados por área (admin, director, student, teacher, ui).
- `docs/` — Documentación del proyecto, notas de migración, guías y presentaciones.
- `lib/` — Utilidades comunes, cliente supabase, manejo de JWT, helpers y constantes.
- `hooks/` — Hooks personalizados (por ejemplo `use-mobile.ts`, `use-toast.ts`).
- `pages/` — (Si existe) rutas API antiguas u otros endpoints (dependiendo de la configuración de Next.js en `app/`).
- `public/` — Activos públicos (imágenes, favicons, etc.).
- `scripts/` — Archivos SQL para crear esquema, seed y migraciones (`03-supabase-schema.sql`, `04-supabase-seed.sql`, `05-migrate-id-to-identity.sql`).
- `styles/` y `app/globals.css` — Configuración global de estilos y utilidades Tailwind.
- `pages/api/` y `app/*/page.tsx` — Endpoints server-side y páginas (según convención del proyecto).

---

## Descripción detallada por carpeta

### `app/`

- Contiene la entrada principal de la aplicación (Next.js App Router si está activado). Incluye:
  - `layout.tsx` y `globals.css` — layout global y estilos compartidos.
  - `page.tsx` y subcarpetas por rol (`admin/`, `director/`, `student/`, `teacher/`) que albergan las páginas de cada área.

- Relación con `components/`: las páginas importan componentes de `components/*` para construir la interfaz. `dashboard-layout.tsx` es un ejemplo de wrapper compartido para las vistas internas.

### `components/`

- Estructura interna: está organizada por dominios y una carpeta `ui/` con primitives y componentes base (botones, inputs, dialog, card, chart, etc.).

- Principales submódulos:
  - `components/admin/` — vistas y componentes específicos para administración (users, subjects, enrollments management).
  - `components/director/` — paneles y reportes para director (analytics, reports).
  - `components/student/` — vistas de estudiante (mis notas, materias inscritas).
  - `components/teacher/` — herramientas para docentes (gestión de evaluaciones, gestión de notas).
  - `components/ui/` — colecciones de componentes atómicos y compuestos (botones, formulario, calendar, chart, sidebar, etc.).

- Relación de dependencia:
  - `components/*` usan primitives en `components/ui/*`.
  - Páginas en `app/` orquestan componentes por rol (importan `components/dashboard-layout.tsx` y los paneles/containers específicos).

### `lib/`

- Contiene: `supabase-client.ts`, `supabase-api-client.ts`, `auth.ts`, `jwt-utils.ts`, `api-client.ts` y utilidades como `storage.ts`, `server-url.ts`.

- Función: centralizar el acceso a servicios externos (Supabase), encapsular lógica de autenticación/validación y ofrecer helpers para llamadas API server-side.

### `hooks/`

- Hooks reutilizables para UI y lógica (ej. detectar mobile, manejar toasts). Son consumidos por componentes y páginas.

### `scripts/`

- SQL para crear esquema y poblar datos de ejemplo (`03-supabase-schema.sql`, `04-supabase-seed.sql`), y migraciones más delicadas como `05-migrate-id-to-identity.sql`.

- Uso típico: ejecutar en staging con backup previo antes de aplicar a producción. La migración de `id` a identity requiere pasos coordinados porque cambia claves primarias y referencias.

### `docs/` y `README.md`

- Almacenan decisiones de diseño, notas de sesiones, migraciones y material de presentación (ej. `presentacion_exposicion.md`). Importante leer `MIGRATION_NOTES-*.md` antes de tocar migraciones.

---

## Relaciones entre componentes (flujo típico)

1. Usuario accede a una ruta en `app/` o `pages/`.
2. La página importa `dashboard-layout` o componente de layout, que a su vez inyecta la `Sidebar` y el espacio del contenido.
3. El contenido importa componentes del dominio (por ejemplo, `components/teacher/grade-management.tsx`) que consumen hooks y utilidades de `lib/` y `hooks/`.
4. Los componentes llaman a `lib/api-client.ts` o `lib/supabase-api-client.ts` para leer/escribir datos en Supabase.
5. Middleware server-side o API routes (en `pages/api/*` o en el App Router) validan la cookie `academic_auth_token` y resuelven permisos por rol antes de ejecutar la lógica.

Este patrón separa responsabilidades: vistas (app/pages) → UI (components) → lógica/servicios (lib) → persistencia (Supabase).

---

## Funcionalidades principales

- Gestión de usuarios y roles: CRUD de usuarios, asignación de roles (admin, director, teacher, student).
- Gestión académica: subjects (materias), enrollments (inscripciones), assignments (asignaciones) y grades (notas).
- Autenticación: login/logout, renovación de sesión via cookie HttpOnly, verificación de JWT en middleware.
- Reportes/analytics: vistas para director (performance, reportes académicos), paneles con charts (usando `recharts`).
- UI/UX: layout de dashboard, componentes accesibles y responsive, manejo de errores y alertas (sonner / alert-dialogs).

---

## Puntos de integración y dependencias externas

- Supabase: base de datos (Postgres) y Auth. Se usa tanto cliente anon (frontend) como service-role (server) para operaciones privilegiadas.
- Vercel: ajustes para despliegue (presente en `@vercel/analytics` y configuración `next.config.mjs`).
- Paquetes UI: Radix UI primitives, Lucide icons, Tailwind CSS, y utilidades como `cmdk`, `embla-carousel-react`, `recharts`.

---

## Limitaciones y riesgos conocidos

1. Reproducibilidad de dependencias
   - Algunas dependencias están fijadas a `latest` en `package.json`. Esto dificulta la reproducibilidad exacta de instalaciones sin `package-lock.json` o `pnpm-lock.yaml` y puede introducir rupturas en CI.

2. Migraciones complejas
   - La migración `05-migrate-id-to-identity.sql` cambia la columna `id` a `identity` (autoincrement). Si la base de datos tiene claves foráneas o referencias externas, la operación requiere backup, pruebas en staging y verificación por scripts.

3. Autenticación y compatibilidad
   - El proyecto migró a cookie HttpOnly para seguridad; sin embargo, existen endpoints y entornos de prueba que podrían todavía esperar tokens en el body. Es importante limpiar código y pruebas antiguas.

4. Ausencia de Next en `package.json`
   - No aparece la dependencia explícita `next` en `package.json`. Si bien los scripts usan `next`, eso puede indicar que el entorno la provee o que falta registrarla; aconsejable añadir la versión concreta para claridad.

5. Datos grandes y rendimiento
   - Algunas vistas (tablas con muchas filas) pueden sufrir en rendimiento si no hay paginación o consultas optimizadas en el servidor. Añadir paginación server-side y consultar índices en Postgres es recomendable.

6. Falta de capturas / evidencia visual
   - En la presentación se decidió no incluir capturas; para QA y revisión visual sería ideal añadir imágenes antes de la entrega final.

7. Testing y CI
   - Aunque hay mención de tests automáticos exitosos, conviene tener una carpeta de tests (unit / e2e) junto con una configuración de CI que valide build + lint + tests en cada PR.

---

## Buenas prácticas y recomendaciones

- Bloquear versiones de dependencias en `package.json` o usar lockfile (`package-lock.json`, `pnpm-lock.yaml`) para reproducibilidad.
- Mantener la lógica de migraciones en scripts versionados y desplegar en staging con backup y pruebas automáticas.
- Añadir documentación técnica en `docs/` con pasos exactos para rollback y validación post-migración.
- Centralizar las variables de entorno en `.env.example` documentado en `README.md` (por ejemplo: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `JWT_SECRET`).
- Implementar paginación y optimizaciones SQL donde existan tablas potencialmente grandes (enrollements, grades).

---

## Referencias internas

- Revisa: `README.md`, `docs/MIGRATION_NOTES-2025-10-23.md`, `/scripts/05-migrate-id-to-identity.sql`, y `components/dashboard-layout.tsx` para ejemplos de wiring entre layout y vistas.

---

Si quieres, puedo:

- Generar un diagrama visual (mermaid) que muestre las relaciones entre `app/`, `components/` y `lib/`.
- Añadir ejemplos de consultas SQL recomendadas para paginación e índices.
- Crear `docs/libraries.md` con enlaces y descripciones de las dependencias listadas en `package.json`.

Archivo creado: `docs/estructura_proyecto.md` — listo para revisión.
