# Endpoints protegidos por rol

## Descripción
Estos endpoints implementan protección por roles usando autenticación JWT y middleware. Todas las pruebas en Postman fueron exitosas.

## Endpoints

| Endpoint                                 | Método | Rol requerido | Descripción                       |
|-------------------------------------------|--------|---------------|-----------------------------------|
| `/api/admin/secure-data`                  | GET    | admin         | Acceso solo para administradores  |
| `/api/director/secure-data`               | GET    | director      | Acceso solo para directores       |
| `/api/teacher/secure-data`                | GET    | profesor      | Acceso solo para profesores       |
| `/api/student/secure-data`                | GET    | estudiante    | Acceso solo para estudiantes      |

## Autenticación
Todos requieren el header:
```
Authorization: Bearer <token JWT válido>
```

## Flujo de prueba en Postman

1. **Login:**
   - POST a `http://localhost:3000/api/auth/login` con body JSON:
     - `{ "username": "admin", "password": "demo123" }`
     - `{ "username": "director", "password": "demo123" }`
     - `{ "username": "profesor1", "password": "demo123" }`
     - `{ "username": "estudiante1", "password": "demo123" }`
   - Copia el campo `token` de la respuesta.

2. **Acceso protegido:**
   - GET a la URL correspondiente con el header `Authorization: Bearer <token>`:
     - Admin: `http://localhost:3000/api/admin/secure-data`
     - Director: `http://localhost:3000/api/director/secure-data`
     - Profesor: `http://localhost:3000/api/teacher/secure-data`
     - Estudiante: `http://localhost:3000/api/student/secure-data`
   - Si el rol es correcto, acceso permitido. Si no, error de permisos.

## Resultado
Todas las pruebas en Postman fueron exitosas: los endpoints permiten acceso solo al rol correspondiente y rechazan accesos no autorizados.
