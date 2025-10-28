# Documentación del proyecto — Proyecto Académico

Este documento compila el estado del proyecto, resúmenes de sesiones, problemas detectados, soluciones aplicadas y cambios relevantes. Se generó a partir de los archivos en `/docs` y del `README.md` del repositorio.

## Resumen del proyecto

Nombre: Sistema de Gestión de Notas Académicas
Propósito: portal educativo para gestión de notas (administradores, directores, profesores y estudiantes).
Tecnologías: Next.js, React, TypeScript, Tailwind CSS. Backend: Supabase (Postgres), JWT para autenticación.
Deploy: Vercel (producción), desarrollo local con `npm run dev`.

## Índice

- Resumen general
- Situaciones encontradas y soluciones (por sesión / archivo)
- Cambios importantes y migraciones
- Endpoints protegidos por rol (resumen)
- UI / UX: redimensionado (resumen)
- Cómo ejecutar localmente
- WakaTime (control de tiempo del proyecto) — plantilla e instrucciones
- Enlaces a documentación fuente
- Próximos pasos y recomendaciones

---

## Resumen general (extraído de README)

El proyecto es una aplicación fullstack con frontend en Next.js y backend apoyado en Supabase (Postgres) para persistencia y auth. Soporta varios roles (admin, director, teacher, student) y contiene scripts SQL y utilidades para migraciones y seed en `/scripts`.

Requisitos principales: Node >= 16, PostgreSQL (o Supabase). Variables de entorno necesarias (PGHOST, PGUSER, etc. y claves de Supabase). Ver `README.md` para pasos de instalación y despliegue.

---

## Situaciones encontradas, soluciones y cambios (resúmenes por archivo / sesión)

### 1) `MIGRATION_NOTES-2025-10-23.md` — Migración: cookie HttpOnly y token

- Situación: Se eliminó la práctica insegura de devolver el JWT en el body del login y de persistirlo en localStorage.
- Solución aplicada: El login pasa a setear una cookie HttpOnly (`academic_auth_token`). El backend deja de devolver `token` en la respuesta JSON; `AuthUser.token` se vuelve opcional y se evita persistir token en localStorage.
- Cambios relevantes: endpoints y utilidades (`pages/api/auth/login.ts`, `lib/auth.ts`, `app/page.tsx`, `components/director/director-auth-fallback.tsx`) actualizados. `pages/api/auth/set-token.ts` marcado obsoleto (410 Gone).
- Acción pendiente: eliminar definitivamente `set-token` tras comprobar clientes y tests.

### 2) `commit-summary-supabase-migration-session.md`, `commit-summary-2025-10-21.md` — Migración a Supabase

- Situación: Migración de almacenamiento simulado a Supabase (clientes anon y admin/service-role). Se añadieron endpoints server-side (`/api/admin/*`, `/api/teacher/*`) y wrappers en `lib/supabase-api-client.ts`.
- Soluciones: Scripts SQL (`03-supabase-schema.sql`, `04-supabase-seed.sql`) y manejo dinámico del cliente admin para evitar exposición al bundle cliente.
- Cambios: creación/actualización de endpoints de admin/teacher, adaptación de componentes para usar fetch a los endpoints server.
- Recomendación: ejecutar `scripts/05-migrate-id-to-identity.sql` en staging tras backup para evitar los fallbacks `max(id)+1` que se usaron temporalmente.

### 3) `ENDPOINTS-PROTEGIDOS-ROL.md` — Endpoints y pruebas

- Situación: Necesidad de proteger endpoints por rol (admin, director, teacher, student).
- Solución y verificación: Se implementó middleware JWT y pruebas en Postman. Endpoints devuelven acceso sólo al rol correspondiente; las pruebas fueron exitosas.
- Nota técnica: todas las peticiones protegidas requieren `Authorization: Bearer <token>` o la cookie HttpOnly en los flujos actualizados.

### 4) `resumen-sesion-2025-10-22.md` y sesiones relacionadas (16/10/2025 y 22/10/2025)

- Problemas detectados:
  - Desajustes snake_case vs camelCase entre backend y frontend.
  - Peticiones cliente sin `credentials: 'same-origin'` o sin uso de cookie HttpOnly.
  - Vista "Mis Calificaciones" no mostraba datos completos (faltaban asignaciones o grades derivadas).
  - Saludo "Bienvenido, " sin nombre en algunas vistas por shape distinto del objeto `user`.
- Soluciones aplicadas:
  - Normalización de respuestas de endpoints (`subjects[]`, `grades[]`) y adaptaciones de componentes (`components/student/my-subjects-list.tsx`, `my-grades.tsx`).
  - Middleware ajustado para leer token desde cookie HttpOnly si no hay header `Authorization`.
  - Refactors y defensivas para `displayName`/`firstName+lastName` en saludo.

### 5) `redimensionar-ui-ux.md` — UI / UX responsiva (sesión 28-10-2025)

- Situación: problemas de overflow y reflow en breakpoints < 1024px.
- Soluciones y cambios:
  - Ajustes en `globals.css`, `dashboard-layout.tsx`, `sidebar.tsx`, `card.tsx`, `input.tsx`, `button.tsx`, `chart.tsx` para control de `max-width` y colapso automático de la sidebar.
  - Verificaciones: `npx tsc --noEmit` y `npm run lint` pasaron sin errores.
- Recomendación: pruebas visuales con datos reales y, en caso de tablas muy anchas, paginación o reflow adaptativo.

### 6) `MIGRATION_NOTES-2025-10-23.md` y follow-ups — notas operativas

- Se registraron pasos de verificación y comandos útiles (build, pruebas con curl, uso de Supabase CLI) y se dejó pendiente añadir tests automáticos para endpoints auth y session flows.

---

## Cambios técnicos importantes (resumen)

- Autenticación: migración hacia cookie HttpOnly `academic_auth_token`. Reducida exposición del token en el cliente.
- Supabase: adición de clientes (anon y service-role), wrappers en `lib/`, y endpoints server para admin/teacher.
- DB: scripts SQL para crear esquema y seeds en `/scripts`; script `05-migrate-id-to-identity.sql` propuesto para normalizar ids.
- UI: refactors para responsive, correcciones de mapeo snake_case → camelCase, mejoras en `dashboard-layout` y primitives UI.
- Seguridad: eliminación gradual de prácticas de token en body; recomendación final: depender sólo de cookie HttpOnly.

---

## Endpoints protegidos (resumen)

- Rutas protegidas por rol: `/api/admin/*`, `/api/director/*`, `/api/teacher/*`, `/api/student/*`.
- Autenticación esperada: cookie HttpOnly (entorno seguro) o header `Authorization: Bearer <token>` (uso en pruebas/dev).
- Recomendación de pruebas: usar Postman o fetch con `credentials: 'same-origin'` para comprobar sesión basada en cookie.

---

## Cómo ejecutar localmente (extracto práctico)

1. Clonar repo y entrar en carpeta

```bash
git clone https://github.com/Craos6518/Proyecto-academico-version-andres.git
cd Proyecto-academico-version-andres
```

2. Instalar dependencias y ejecutar dev

```bash
npm install
npm run dev
```

3. Configurar Supabase (opcional para datos persistentes)

- Instalar Supabase CLI y ejecutar `supabase start`.
- Ejecutar scripts SQL en `/scripts` para crear esquema y poblar datos.

4. Variables de entorno: copiar `.env.example` a `.env` y completar con credenciales de DB y Supabase.

---

## Enlaces a la documentación fuente

- `README.md` — resumen del proyecto, instalación y ejecución.
- `docs/MIGRATION_NOTES-2025-10-23.md` — notas de migración sobre cookies HttpOnly.
- `docs/commit-summary-supabase-migration-session.md`, `docs/commit-summary-2025-10-21.md` — migración a Supabase y cambios relacionados.
- `docs/ENDPOINTS-PROTEGIDOS-ROL.md` — pruebas y ejemplos de endpoints protegidos.
- `docs/redimensionar-ui-ux.md` — resumen de los cambios en UI/UX y pruebas.
- `docs/resumen-sesion-2025-10-22.md`, `docs/sesion-2025-10-16.md` — sesiones con diagnósticos y acciones.
- `scripts/` — scripts SQL para esquema y migraciones.

(Ver carpeta `docs/` para archivos completos y notas de sesión.)

---

## Verificación realizada

- He leído y resumido los archivos listados en `/docs` y el `README.md` para elaborar este documento.
- Búsqueda de `wakatime` en el repo: sin resultados. Por eso la sección WakaTime está en plantilla y requiere que pegues/adjuntes tu export.

---

## Contacto

Autor del repositorio: Andrés Felipe Martínez Henao — f.martinez5@utp.edu.co

---