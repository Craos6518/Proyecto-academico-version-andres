-- Seed data basado en lib/mock-data.ts

-- Roles
insert into roles (id, name, description) values
(1, 'Administrador', 'Acceso completo al sistema'),
(2, 'Director', 'Gestión académica y reportes'),
(3, 'Profesor', 'Gestión de calificaciones y materias'),
(4, 'Estudiante', 'Consulta de calificaciones y materias')
on conflict (id) do nothing;

insert into users (id, username, email, first_name, last_name, role_id, role_name, is_active, password, cedula) values
(1, 'admin', 'admin@escuela.edu', 'Carlos', 'Administrador', 1, 'Administrador', true, 'demo123', '000000001'),
(2, 'director', 'director@escuela.edu', 'María', 'Directora', 2, 'Director', true, 'demo123', '000000002'),
(3, 'profesor1', 'profesor1@escuela.edu', 'Juan', 'Pérez', 3, 'Profesor', true, 'demo123', '000000101'),
(4, 'profesor2', 'profesor2@escuela.edu', 'Ana', 'García', 3, 'Profesor', true, 'demo123', '000000102'),
(5, 'estudiante1', 'estudiante1@escuela.edu', 'Pedro', 'López', 4, 'Estudiante', true, 'demo123', '100000001'),
(6, 'estudiante2', 'estudiante2@escuela.edu', 'Laura', 'Martínez', 4, 'Estudiante', true, 'demo123', '100000002'),
(7, 'estudiante3', 'estudiante3@escuela.edu', 'Diego', 'Rodríguez', 4, 'Estudiante', true, 'demo123', '100000003')
on conflict (id) do nothing;

-- Subjects
insert into subjects (id, name, code, description, credits, teacher_id, teacher_name) values
(1, 'Matemáticas Avanzadas', 'MAT301', 'Cálculo diferencial e integral', 4, 3, 'Juan Pérez'),
(2, 'Física Cuántica', 'FIS401', 'Introducción a la mecánica cuántica', 4, 3, 'Juan Pérez'),
(3, 'Programación Web', 'INF201', 'Desarrollo de aplicaciones web modernas', 3, 4, 'Ana García'),
(4, 'Base de Datos', 'INF301', 'Diseño y gestión de bases de datos', 3, 4, 'Ana García'),
(5, 'Literatura Española', 'LIT101', 'Historia de la literatura española', 3, 3, 'Juan Pérez')
on conflict (id) do nothing;

-- Enrollments
insert into enrollments (id, student_id, subject_id, enrollment_date, status) values
(1, 5, 1, '2025-01-15T08:00:00Z', 'active'),
(2, 5, 3, '2025-01-15T08:30:00Z', 'active'),
(3, 5, 4, '2025-01-15T09:00:00Z', 'active'),
(4, 6, 1, '2025-01-16T08:00:00Z', 'active'),
(5, 6, 2, '2025-01-16T08:30:00Z', 'active'),
(6, 6, 5, '2025-01-16T09:00:00Z', 'active'),
(7, 7, 3, '2025-01-17T08:00:00Z', 'active'),
(8, 7, 4, '2025-01-17T08:30:00Z', 'active'),
(9, 7, 5, '2025-01-17T09:00:00Z', 'active')
on conflict (id) do nothing;

-- Assignments
insert into assignments (id, subject_id, name, description, assignment_type, max_score, weight, due_date) values
(1, 1, 'Parcial 1 - Derivadas', 'Examen de derivadas y límites', 'parcial1', 5.0, 30, '2025-03-15'),
(2, 1, 'Parcial 2 - Integrales', 'Examen de integrales', 'parcial2', 5.0, 30, '2025-05-15'),
(3, 1, 'Examen Final', 'Examen final de matemáticas', 'final', 5.0, 40, '2025-07-15'),
(4, 3, 'Parcial 1 - HTML/CSS', 'Proyecto de maquetación web', 'parcial1', 5.0, 30, '2025-03-20'),
(5, 3, 'Parcial 2 - JavaScript', 'Aplicación interactiva', 'parcial2', 5.0, 30, '2025-05-20'),
(6, 3, 'Proyecto Final', 'Aplicación web completa', 'final', 5.0, 40, '2025-07-20'),
(7, 4, 'Parcial 1 - SQL', 'Diseño de base de datos', 'parcial1', 5.0, 30, '2025-03-18'),
(8, 4, 'Parcial 2 - Normalización', 'Normalización y optimización', 'parcial2', 5.0, 30, '2025-05-18'),
(9, 4, 'Proyecto Final', 'Sistema de base de datos completo', 'final', 5.0, 40, '2025-07-18')
on conflict (id) do nothing;

-- Grades
insert into grades (id, student_id, assignment_id, subject_id, score, graded_by, graded_at) values
(1, 5, 1, 1, 4.2, 3, '2025-03-16T10:00:00Z'),
(2, 5, 2, 1, 4.5, 3, '2025-05-16T10:00:00Z'),
(3, 5, 3, 1, 4.4, 3, '2025-07-16T10:00:00Z'),
(4, 5, 4, 3, 4.6, 4, '2025-03-21T10:00:00Z'),
(5, 5, 5, 3, 4.3, 4, '2025-05-21T10:00:00Z'),
(6, 6, 1, 1, 3.9, 3, '2025-03-16T10:00:00Z'),
(7, 6, 2, 1, 4.1, 3, '2025-05-16T10:00:00Z'),
(8, 7, 4, 3, 4.7, 4, '2025-03-21T10:00:00Z'),
(9, 7, 5, 3, 4.6, 4, '2025-05-21T10:00:00Z'),
(10, 7, 6, 3, 4.8, 4, '2025-07-21T10:00:00Z')
on conflict (id) do nothing;
