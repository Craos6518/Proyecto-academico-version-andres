# Estado y Requerimientos del Sistema Académico

**Fecha:** 2025-10-10

## Proyecto: Sistema Académico para la Gestión de Calificaciones

### Requerimientos Funcionales Pendientes
- RF1: Autenticación de usuarios (JWT server-side, protección de rutas)
- RF2: Gestión de usuarios (CRUD real, persistencia en BD)
- RF3: Inscripciones y asignaciones (persistencia y validaciones server-side)
- RF4: Gestión de calificaciones (concurrencia y endpoints server-side)
- RF5: Paneles por rol (conexión con backend real para datos persistentes)
- RF7: Auditoría y logs (endpoints que persistan audit_logs desde la app)
- RF8: Roles y permisos (middleware server-side con JWT)
- RF9: Reportes y exportación (endpoints de exportación CSV/PDF)
- RF10: Seguridad y cambios de contraseña (registro en audit_logs)

### Requerimientos No Funcionales
- RNF1: Next.js frontend y Supabase backend (PostgreSQL)
- RNF2: Interfaz responsiva y accesible
- RNF3: Operaciones < 2 segundos bajo carga normal
- RNF4: Cifrado de datos y contraseñas con bcrypt
- RNF5: Control de versiones y CI/CD
- RNF6: Documentación API (Swagger/Postman)
- RNF7: Disponibilidad mínima 99%

### Vistas del Sistema por Rol
- **Login:** Pantalla inicial, validación de campos, manejo de errores, redirección por rol.
- **Dashboard Administrador:** Gestión de usuarios, roles, asignaturas y relaciones. Visualización de logs y estadísticas globales.
- **Dashboard Director:** Generación de reportes, revisión de notas consolidadas, supervisión docente, gráficos y descarga de reportes.
- **Dashboard Profesor:** Registro, edición y visualización de notas, cálculo de promedios, validaciones de rango, historial de modificaciones.
- **Dashboard Estudiante:** Consulta de asignaturas, calificaciones parciales y finales, promedios automáticos, mensajes del docente, exportación de boletín.

### Sugerencias de Nuevos Requerimientos (Ignorados por ahora)
- Recuperación de contraseña
- Mensajería interna
- Notificaciones

---

## Plan de acción para la próxima sesión
1. Integrar Supabase y migrar endpoints simulados a persistencia real (usuarios, asignaturas, notas, logs).
2. Implementar registro de acciones relevantes en la tabla `audit_logs` (accesos, edición de notas).
3. Crear endpoints para exportar reportes académicos en formato CSV y PDF.
4. Validar rangos de notas, roles y permisos en todos los endpoints.
5. Asegurar cifrado de datos sensibles y uso de bcrypt para contraseñas.
6. Añadir tests básicos y de integración para endpoints y lógica de negocio.
7. Ejecutar build/lint y corregir posibles warnings o errores.
8. Generar documentación de API (Swagger/Postman) y configurar CI/CD.

---

**Notas técnicas:**
- Scripts SQL incluyen triggers para auditoría; la tabla `audit_logs` está diseñada y documentada.
- Muchas correcciones de UI ya aplicadas para forwardRef; puede quedar trabajo manual en componentes que usen `asChild`/`Slot`.

**Hecho por:** cambios locales en el workspace
