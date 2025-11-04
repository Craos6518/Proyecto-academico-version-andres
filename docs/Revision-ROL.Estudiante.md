# Revisión de permisos — ROL: Estudiante

Fecha: 2025-11-04
Autor: Revisión automatizada (pair-programming assistant)

## Resumen ejecutivo

Esta revisión evalúa el rol "Estudiante" en la aplicación: qué puede hacer desde la UI, qué endpoints backend consume y los riesgos asociados a la exposición de datos personales y académicos (calificaciones, entregas, documentos). Se proponen mitigaciones y parches mínimos para asegurar confidencialidad e integridad.

Estado rápido:
- El rol Estudiante debe tener permisos de lectura sobre sus propios datos académicos y permisos limitados para actualizar su perfil.
- Riesgos críticos observados: endpoints que devuelven calificaciones, listas de estudiantes o archivos sin comprobar que el caller sea el propietario o un rol autorizado (admin/teacher).
- Acción prioritaria: asegurar que todos los endpoints bajo `pages/api/student/*` verifiquen `withAuth` y la propiedad del recurso (owner check) antes de devolver información.

---

## Alcance de la revisión
- Componentes UI: `components/student/*` (ej. `my-grades.tsx`, `my-subjects-list.tsx`).
- Endpoints API: `pages/api/student/*` (calificaciones, inscripciones, descargas, perfil).
- Middleware y utilidades: `lib/middleware/auth.ts`, `lib/auth.ts`, `lib/supabase-client.ts`.

---

## Qué puede (y debería) hacer un Estudiante
- Visualizar sus propias calificaciones, materias y entregas.
- Descargar sus reportes y documentos (certificados, comprobantes) que le pertenezcan.
- Actualizar su perfil no sensible (nombre, teléfono) y solicitar recuperación de contraseña mediante flujo controlado.
- No debería poder ver calificaciones o datos personales de otros estudiantes ni manipular recursos de cursos.

---

## Endpoints críticos y controles recomendados
- `pages/api/student/my-grades` (o `pages/api/student/grades`) — Debe requerir `withAuth` y verificar `req.user.id === studentId` o que `caller` sea `admin/teacher` con permiso.
- `pages/api/student/downloads` — Verificar propietario del archivo; validar token temporal o autorización antes de servir archivos.
- `pages/api/student/profile` — Permitir GET/PUT para el propio usuario; PUT debe validar campos permitidos (whitelist) y no permitir cambios de rol ni campos sensibles.
- `pages/api/student/enrollments` — Solo devolver las inscripciones del propio estudiante o, si se solicita listados, exigir rol `admin/teacher`.

Recomendación técnica: además de `withAuth`, implementar una función auxiliar `ensureOwnerOrRole(req, resourceOwnerId, allowedRoles = [])` para centralizar la validación.

---

## Riesgos específicos para Estudiante
1. Exposición de calificaciones de terceros (Alta):
   - Endpoints que reciben `studentId` sin verificar propiedad pueden filtrar por cualquier id y devolver calificaciones.

2. Descarga no autorizada de documentos (Alta):
   - URLs directas a archivos en storage sin verificación permiten acceso si conocen la ruta. Usar tokens temporales (signed URLs) y verificar propietario.

3. Overposting en actualización de perfil (Medio):
   - Si el handler acepta todo el body para update, un actor puede intentar cambiar `role` o `isAdmin`. Usar whitelist de campos.

4. Rate limiting y scraping (Medio):
   - Endpoints que devuelven listas o reportes podrían ser objeto de scraping masivo; considerar rate-limits o protecciones adicionales.

---

## Recomendaciones y parches mínimos (prioridad)
1) Proteger rutas con `withAuth` y checks de propiedad:
   - Ejemplo en handler:

```ts
import { withAuth } from '../../../lib/middleware/auth'
export default withAuth(async (req, res) => {
  const callerId = (req as any).user?.id
  const studentId = req.query.studentId ?? callerId
  if (studentId !== callerId && !['admin','teacher'].includes(normalizeRole((req as any).user?.role))) {
    return res.status(403).json({ error: 'No autorizado' })
  }
  // continuar
})
```

2) Descargas seguras:
   - Generar signed URLs con expiración desde server tras verificar propiedad.
   - No servir archivos estáticos directamente sin validación.

3) White-list fields en actualizaciones de perfil:
   - Solo permitir actualizar: `displayName`, `phone`, `avatar_url`, `address`.
   - Rechazar cambios en `role`, `isAdmin`, `created_at`, `id`.

4) Logging y auditoría mínima:
   - Registrar accesos a endpoints críticos (download, getGrades) con `actorId`, `resourceId`, `timestamp`.

5) Rate limiting y protecciones anti-scraping (opcional/mediano plazo):
   - Aplicar limitadores por IP o por userId en endpoints que generan reportes o listados.

---

## Tests y validación
- Tests sugeridos:
  - Student A puede ver solo sus calificaciones (200).
  - Student A no puede ver calificaciones de Student B (403).
  - No-auth request recibe 401.
  - Download de archivo requiere signed URL y propietario verificado.
- Ejecutar `npm run lint` y `npm run build` tras aplicar cambios.

---

## Checklist de implementación (acciónable)
1. Auditar `pages/api/student/*` y envolver con `withAuth` donde falte.
2. Implementar `ensureOwnerOrRole` helper y usarlo en handlers críticos.
3. Cambiar endpoints de descarga para usar signed URLs y validar propietario.
4. Añadir whitelist de campos en `profile` updates.
5. Añadir tests unitarios e integración y ejecutar `lint` y `build`.

---

## Próximo paso propuesto
Puedo:
- Listar automáticamente las rutas `pages/api/student/*` que no usan `withAuth` (responde `LISTAR_ENDPOINTS_STUDENT`).
- Aplicar parches mínimos (envolver rutas y añadir validaciones básicas) y ejecutar `lint` y `build` (responde `APLICAR_PATCHES_STUDENT`).

Fin del documento.
