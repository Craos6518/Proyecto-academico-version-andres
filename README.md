# Academic note system

🧮 Sistema de Gestión de Notas Académicas

Portal educativo para la gestión integral de notas.
Permite a docentes registrar calificaciones parciales y finales, a estudiantes consultar sus resultados y a directivos administrar usuarios, asignaturas y reportes.

---

🚀 Entorno y despliegue

Depuración y desarrollo asistido: v0.app

Alojamiento (producción): Vercel

> Los cambios realizados en el entorno de depuración (v0.app) se sincronizan automáticamente con este repositorio, y Vercel despliega siempre la versión más reciente.

🔗 Aplicación en producción:
https://proyecto-academico-version-andres-git-main-craos-projects.vercel.app
---

🧩 Tecnologías principales

Frontend: Next.js, React, TypeScript, Tailwind CSS

Backend: Supabase (PostgreSQL, autenticación y API REST)

Base de datos: PostgreSQL (Supabase compatible)

Autenticación: JWT (gestionada por Supabase)

---

📚 Contenido

1. Características
2. Arquitectura
3. Requisitos
4. Instalación & ejecución local
5. Base de datos: esquema
6. Variables de entorno
7. Pruebas
8. Despliegue
9. Contribuir
10. Licencia
11. Contacto

---

✏️ Características

- Administrador: gestión total del sistema, usuarios y configuración.
- Director: gestión académica, reportes y auditoría.
- Profesor: crear, editar y eliminar notas parciales y finales por asignación; gestión de asignaturas, inscripciones y calificaciones.
- Estudiante: consultar calificaciones y promedios por materia y asignación.

---

Control de acceso por roles (JWT o sesiones).

Validaciones y límites de rango de notas.

Cálculo automático de nota final por ponderación configurada.

Historial y auditoría de calificaciones.

---

🧱 Arquitectura actual

- Frontend: Next.js + React + TypeScript + Tailwind CSS
- Backend y base de datos: Supabase (PostgreSQL, autenticación, API REST y almacenamiento)
- Scripts SQL y migraciones: en carpeta /scripts para inicialización y seed

---

⚙️ Requisitos

Node.js >= 16
NPM o Yarn
PostgreSQL >= 12 (o Supabase)
(Opcional) Docker para ejecutar BD y servidor localmente

---

💻 Instalación & ejecución local

1. Clona el repositorio

```bash
git clone https://github.com/Craos6518/Proyecto-academico-version-andres.git
cd Proyecto-academico-version-andres
```

2. Configura Supabase (opcional para desarrollo local)

- Instala Supabase CLI: `npm install -g supabase`
- Inicia Supabase local: `supabase start`
- Aplica los scripts SQL desde `/scripts` si es necesario

3. Configura el frontend

```bash
cp .env.example .env
npm install
npm run dev
```

---

🗄️ Base de datos: esquema real (PostgreSQL/Supabase)

```sql
-- Roles
create table if not exists roles (
  id integer primary key,
  name text not null,
  description text
);

-- Users
create table if not exists users (
  id integer primary key,
  username text not null unique,
  email text,
  first_name text,
  last_name text,
  role_id integer references roles(id),
  role_name text,
  role text,
  is_active boolean default true,
  password text
);

-- Subjects
create table if not exists subjects (
  id integer primary key,
  name text not null,
  code text,
  description text,
  credits integer,
  teacher_id integer references users(id),
  teacher_name text
);

-- Enrollments
create table if not exists enrollments (
  id integer primary key,
  student_id integer references users(id),
  subject_id integer references subjects(id),
  enrollment_date timestamptz,
  status text
);

-- Assignments
create table if not exists assignments (
  id integer primary key,
  subject_id integer references subjects(id),
  name text,
  description text,
  assignment_type text,
  max_score numeric,
  weight integer,
  due_date date
);

-- Grades
create table if not exists grades (
  id integer primary key,
  student_id integer references users(id),
  assignment_id integer references assignments(id),
  subject_id integer references subjects(id),
  score numeric,
  graded_by integer references users(id),
  graded_at timestamptz,
  comments text
);
```

---

🔐 Variables de entorno

PGHOST=localhost
PGPORT=5432
PGDATABASE=notas_db
PGUSER=postgres
PGPASSWORD=postgres
JWT_SECRET=un_secret_fuerte_aqui
NODE_ENV=development
VITE_API_URL=http://localhost:4000/api

---

🧪 Pruebas

# backend
npm run test

---

☁️ Despliegue

Desarrollo / depuración: v0.app
Alojamiento (producción): Vercel

Asegúrate de configurar las variables de entorno en Vercel y de establecer correctamente la conexión con la base de datos remota.

---

🤝 Contribuir

1. Crea un issue describiendo la mejora o el bug.
2. Crea una rama: feature/<nombre> o fix/<nombre>.
3. Envía un Pull Request con una descripción clara y tus pruebas.

---

🧭 Roadmap

Importar listas de estudiantes desde CSV.
Auditoría de modificaciones de notas.
Notificaciones automáticas por correo.
Historial de notas por periodo académico.

---

📜 Licencia

Proyecto bajo licencia MIT — ver LICENSE.

---

👤 Contacto

Autor: Andrés Felipe Martínez Henao
Correo: f.martinez5@utp.edu.co
