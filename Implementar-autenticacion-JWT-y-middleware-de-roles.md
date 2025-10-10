# Implementar autenticación JWT y middleware de roles

**Fecha de inicio:** 2025-10-10

**Descripción:**
Implementar autenticación basada en JWT para usuarios y un sistema de middleware que proteja rutas y gestione permisos según el rol. Esto permitirá asegurar el acceso y la gestión de permisos en toda la aplicación antes de integrar servicios externos como Supabase.

**Plan de acción:**

1. **Instalación de dependencias**
   - Instalar una librería para JWT: `npm install jsonwebtoken`

2. **Generación y validación de JWT**
   - Crear utilidades en `lib/auth.ts` para:
     - Generar tokens JWT al autenticar usuarios.
     - Validar y decodificar tokens JWT en cada request.

3. **Endpoint de autenticación**
   - Implementar un endpoint (por ejemplo, en `pages/api/auth/login.ts`) que:
     - Reciba credenciales.
     - Verifique usuario y contraseña.
     - Genere y retorne un JWT.

4. **Middleware de protección de rutas**
   - Crear un middleware (por ejemplo, en `lib/middleware/auth.ts`) que:
     - Intercepte requests protegidas.
     - Valide el JWT.
     - Permita o deniegue el acceso según el rol.

5. **Middleware de roles y permisos**
   - Extender el middleware para:
     - Leer el rol del usuario desde el JWT.
     - Permitir acceso solo a rutas autorizadas para ese rol.

6. **Integración en la app**
   - Aplicar el middleware en las rutas que requieran protección (por ejemplo, admin, director, teacher, student).

7. **Pruebas**
   - Verificar que:
     - Usuarios sin JWT no acceden a rutas protegidas.
     - Usuarios con JWT y rol adecuado acceden correctamente.
     - Usuarios con rol incorrecto reciben error de autorización.
