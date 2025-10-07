# Scripts de Base de Datos - Sistema Académico

Este directorio contiene los scripts SQL necesarios para crear y configurar la base de datos del sistema académico.

## Fecha de Creación
03/10/2025

## Archivos Disponibles

### `00-complete-schema.sql` (RECOMENDADO)
**Script completo y actualizado** que incluye:
- Creación de todas las tablas con sus relaciones
- Índices optimizados para consultas
- Datos de demostración (usuarios, materias, inscripciones, calificaciones)
- Vistas útiles para reportes
- Funciones y triggers para auditoría
- Comentarios detallados en cada tabla y columna

**Uso:**
\`\`\`bash
psql -U postgres -d nombre_base_datos -f 00-complete-schema.sql
\`\`\`

### `01-create-tables.sql` (Legacy)
Script anterior para crear solo las tablas básicas sin datos.

### `02-seed-data.sql` (Legacy)
Script anterior para insertar datos de prueba.

## Estructura de la Base de Datos

### Tablas Principales

1. **roles** - Roles del sistema
   - Administrador
   - Director
   - Profesor
   - Estudiante

2. **users** - Usuarios del sistema
   - Información personal
   - Credenciales de acceso
   - Rol asignado

3. **subjects** - Materias/Asignaturas
   - Información de la materia
   - Profesor asignado
   - Créditos

4. **enrollments** - Inscripciones
   - Estudiante inscrito
   - Materia
   - Fecha de inscripción
   - Estado

5. **assignments** - Evaluaciones
   - Parciales, finales, tareas
   - Peso porcentual
   - Fecha de entrega

6. **grades** - Calificaciones
   - Calificación del estudiante (escala 0-5)
   - Evaluación calificada
   - Profesor que calificó
   - Comentarios

7. **audit_logs** - Auditoría
   - Registro de cambios importantes
   - Cambios de contraseña
   - Acciones de usuarios

## Relaciones

\`\`\`
roles (1) ──→ (N) users
users (1) ──→ (N) subjects (como profesor)
users (1) ──→ (N) enrollments (como estudiante)
subjects (1) ──→ (N) enrollments
subjects (1) ──→ (N) assignments
assignments (1) ──→ (N) grades
users (1) ──→ (N) grades (como estudiante)
users (1) ──→ (N) grades (como profesor que califica)
\`\`\`

## Datos de Demostración

### Usuarios (contraseña: demo123 para todos)

| Usuario | Email | Rol | Nombre |
|---------|-------|-----|--------|
| admin | admin@escuela.edu | Administrador | Carlos Administrador |
| director | director@escuela.edu | Director | María Directora |
| profesor1 | profesor1@escuela.edu | Profesor | Juan Pérez |
| profesor2 | profesor2@escuela.edu | Profesor | Ana García |
| estudiante1 | estudiante1@escuela.edu | Estudiante | Pedro López |
| estudiante2 | estudiante2@escuela.edu | Estudiante | Laura Martínez |
| estudiante3 | estudiante3@escuela.edu | Estudiante | Diego Rodríguez |

### Materias

- MAT301 - Matemáticas Avanzadas (4 créditos) - Prof. Juan Pérez
- FIS401 - Física Cuántica (4 créditos) - Prof. Juan Pérez
- INF201 - Programación Web (3 créditos) - Prof. Ana García
- INF301 - Base de Datos (3 créditos) - Prof. Ana García
- LIT101 - Literatura Española (3 créditos) - Prof. Juan Pérez

## Vistas Disponibles

### `student_averages`
Muestra el promedio de calificaciones por estudiante y materia.

\`\`\`sql
SELECT * FROM student_averages WHERE student_id = 5;
\`\`\`

### `pending_grades`
Muestra las calificaciones pendientes por profesor.

\`\`\`sql
SELECT * FROM pending_grades WHERE teacher_id = 3;
\`\`\`

## Funciones Disponibles

### `calculate_final_grade(student_id, subject_id)`
Calcula el promedio final ponderado de un estudiante en una materia.

\`\`\`sql
SELECT calculate_final_grade(5, 1);
\`\`\`

## Instalación

### Opción 1: PostgreSQL Local

1. Instalar PostgreSQL desde https://www.postgresql.org/download/
2. Crear una base de datos:
   \`\`\`bash
   createdb academic_system
   \`\`\`
3. Ejecutar el script:
   \`\`\`bash
   psql -U postgres -d academic_system -f 00-complete-schema.sql
   \`\`\`

### Opción 2: Supabase (Recomendado)

1. Crear cuenta en https://supabase.com
2. Crear un nuevo proyecto
3. Ir a SQL Editor
4. Copiar y pegar el contenido de `00-complete-schema.sql`
5. Ejecutar el script

### Opción 3: Neon, Railway, u otro servicio PostgreSQL

Similar a Supabase, usar el editor SQL del servicio para ejecutar el script.

## Configuración de Variables de Entorno

Después de crear la base de datos, configurar en `.env.local`:

\`\`\`env
# Para PostgreSQL local
POSTGRES_URL=postgresql://usuario:contraseña@localhost:5432/academic_system

# Para Supabase
SUPABASE_URL=tu_project_url
NEXT_PUBLIC_SUPABASE_URL=tu_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
POSTGRES_URL=tu_connection_string
\`\`\`

## Mantenimiento

### Backup de la base de datos
\`\`\`bash
pg_dump -U postgres academic_system > backup.sql
\`\`\`

### Restaurar backup
\`\`\`bash
psql -U postgres academic_system < backup.sql
\`\`\`

### Limpiar datos de prueba (mantener estructura)
\`\`\`sql
TRUNCATE TABLE audit_logs, grades, assignments, enrollments, subjects, users, roles RESTART IDENTITY CASCADE;
\`\`\`

## Notas Importantes

1. **Contraseñas**: En producción, las contraseñas deben estar hasheadas con bcrypt. El script actual usa contraseñas en texto plano solo para demostración.

2. **Escala de Calificaciones**: El sistema usa una escala de 0 a 5.0 (sistema colombiano).

3. **Auditoría**: Los cambios de contraseña se registran automáticamente en `audit_logs` mediante un trigger.

4. **Índices**: Se han creado índices en las columnas más consultadas para optimizar el rendimiento.

## Soporte

Para problemas o preguntas sobre la base de datos, revisar:
- Documentación de PostgreSQL: https://www.postgresql.org/docs/
- Documentación de Supabase: https://supabase.com/docs
