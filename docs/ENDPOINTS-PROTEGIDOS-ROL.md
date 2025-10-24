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

## Ejemplos de petición y respuesta

### Admin
**Petición:**
```http
GET /api/admin/secure-data
Authorization: Bearer <token>
```
**Respuesta:**
```json
{
  "message": "Acceso concedido solo a administrador",
  "users": [ { "id": 1, "name": "Juan Pérez", "role": "admin" }, ... ],
  "subjects": [ { "id": 1, "name": "Matemáticas" }, ... ],
  "logs": [ { "id": 1, "action": "login", "user": "Juan Pérez", "date": "2025-10-10" }, ... ],
  "stats": { "totalUsers": 3, "totalSubjects": 2, "totalLogs": 2 }
}
```

### Director
**Petición:**
```http
GET /api/director/secure-data
Authorization: Bearer <token>
```
**Respuesta:**
```json
{
  "message": "Acceso concedido solo a director",
  "academicReports": [ { "course": "10A", "subject": "Matemáticas", "period": "2025-2", "average": 4.2, "students": 30 }, ... ],
  "teacherPerformance": [ { "teacher": "Ana Gómez", "subject": "Matemáticas", "average": 4.5 }, ... ],
  "downloadLinks": { "csv": "/api/director/report.csv", "pdf": "/api/director/report.pdf" }
}
```

### Profesor
**Petición:**
```http
GET /api/teacher/secure-data
Authorization: Bearer <token>
```
**Respuesta:**
```json
{
  "message": "Acceso concedido solo a docente",
  "grades": [ { "student": "Luis Torres", "subject": "Matemáticas", "grade": 4.8, "lastModified": "2025-10-09" }, ... ],
  "history": [ { "student": "Luis Torres", "action": "edit", "oldGrade": 4.5, "newGrade": 4.8, "date": "2025-10-09" } ],
  "average": 4.35
}
```

### Estudiante
**Petición:**
```http
GET /api/student/secure-data
Authorization: Bearer <token>
```
**Respuesta:**
```json
{
  "message": "Acceso concedido solo a estudiante",
  "subjects": [ { "name": "Matemáticas", "grade": 4.8 }, { "name": "Lengua", "grade": 3.9 } ],
  "average": 4.35,
  "messages": [ { "from": "Ana Gómez", "subject": "Matemáticas", "message": "Buen trabajo en el último examen." } ],
  "exportLinks": { "csv": "/api/student/grades.csv", "pdf": "/api/student/grades.pdf" }
}
```
