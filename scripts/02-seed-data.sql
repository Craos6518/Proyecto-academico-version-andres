-- Insert roles
INSERT INTO roles (name, description) VALUES
  ('Administrador', 'Acceso completo al sistema'),
  ('Director', 'Gestión académica y reportes'),
  ('Profesor', 'Gestión de calificaciones y materias'),
  ('Estudiante', 'Consulta de calificaciones y materias')
ON CONFLICT (name) DO NOTHING;

-- Insert demo users (password: demo123 for all)
-- Note: In production, passwords should be properly hashed with bcrypt
INSERT INTO users (username, email, password_hash, first_name, last_name, role_id) VALUES
  ('admin', 'admin@escuela.edu', '$2b$10$rKvVPZhJvZ5qX8qX8qX8qOqX8qX8qX8qX8qX8qX8qX8qX8qX8qX8q', 'Carlos', 'Administrador', 1),
  ('director', 'director@escuela.edu', '$2b$10$rKvVPZhJvZ5qX8qX8qX8qOqX8qX8qX8qX8qX8qX8qX8qX8qX8qX8q', 'María', 'Directora', 2),
  ('profesor1', 'profesor1@escuela.edu', '$2b$10$rKvVPZhJvZ5qX8qX8qX8qOqX8qX8qX8qX8qX8qX8qX8qX8qX8qX8q', 'Juan', 'Pérez', 3),
  ('profesor2', 'profesor2@escuela.edu', '$2b$10$rKvVPZhJvZ5qX8qX8qX8qOqX8qX8qX8qX8qX8qX8qX8qX8qX8qX8q', 'Ana', 'García', 3),
  ('estudiante1', 'estudiante1@escuela.edu', '$2b$10$rKvVPZhJvZ5qX8qX8qX8qOqX8qX8qX8qX8qX8qX8qX8qX8qX8qX8q', 'Pedro', 'López', 4),
  ('estudiante2', 'estudiante2@escuela.edu', '$2b$10$rKvVPZhJvZ5qX8qX8qX8qOqX8qX8qX8qX8qX8qX8qX8qX8qX8qX8q', 'Laura', 'Martínez', 4),
  ('estudiante3', 'estudiante3@escuela.edu', '$2b$10$rKvVPZhJvZ5qX8qX8qX8qOqX8qX8qX8qX8qX8qX8qX8qX8qX8qX8q', 'Diego', 'Rodríguez', 4)
ON CONFLICT (username) DO NOTHING;

-- Insert subjects
INSERT INTO subjects (name, code, description, credits, teacher_id) VALUES
  ('Matemáticas Avanzadas', 'MAT301', 'Cálculo diferencial e integral', 4, 3),
  ('Física Cuántica', 'FIS401', 'Introducción a la mecánica cuántica', 4, 3),
  ('Programación Web', 'INF201', 'Desarrollo de aplicaciones web modernas', 3, 4),
  ('Base de Datos', 'INF301', 'Diseño y gestión de bases de datos', 3, 4),
  ('Literatura Española', 'LIT101', 'Historia de la literatura española', 3, 3)
ON CONFLICT (code) DO NOTHING;

-- Insert enrollments
INSERT INTO enrollments (student_id, subject_id, status) VALUES
  (5, 1, 'active'), (5, 3, 'active'), (5, 4, 'active'),
  (6, 1, 'active'), (6, 2, 'active'), (6, 5, 'active'),
  (7, 3, 'active'), (7, 4, 'active'), (7, 5, 'active')
ON CONFLICT (student_id, subject_id) DO NOTHING;

-- Insert assignments
INSERT INTO assignments (subject_id, name, description, assignment_type, weight, due_date) VALUES
  (1, 'Parcial 1 - Derivadas', 'Examen de derivadas y límites', 'parcial1', 30.00, '2025-03-15'),
  (1, 'Parcial 2 - Integrales', 'Examen de integrales', 'parcial2', 30.00, '2025-05-15'),
  (1, 'Examen Final', 'Examen final de matemáticas', 'final', 40.00, '2025-07-15'),
  (3, 'Parcial 1 - HTML/CSS', 'Proyecto de maquetación web', 'parcial1', 30.00, '2025-03-20'),
  (3, 'Parcial 2 - JavaScript', 'Aplicación interactiva', 'parcial2', 30.00, '2025-05-20'),
  (3, 'Proyecto Final', 'Aplicación web completa', 'final', 40.00, '2025-07-20'),
  (4, 'Parcial 1 - SQL', 'Diseño de base de datos', 'parcial1', 30.00, '2025-03-18'),
  (4, 'Parcial 2 - Normalización', 'Normalización y optimización', 'parcial2', 30.00, '2025-05-18'),
  (4, 'Proyecto Final', 'Sistema de base de datos completo', 'final', 40.00, '2025-07-18');

-- Insert sample grades
INSERT INTO grades (student_id, assignment_id, subject_id, score, graded_by) VALUES
  (5, 1, 1, 85.00, 3), (5, 2, 1, 90.00, 3), (5, 3, 1, 88.00, 3),
  (5, 4, 3, 92.00, 4), (5, 5, 3, 87.00, 4),
  (6, 1, 1, 78.00, 3), (6, 2, 1, 82.00, 3),
  (7, 4, 3, 95.00, 4), (7, 5, 3, 93.00, 4), (7, 6, 3, 96.00, 4)
ON CONFLICT (student_id, assignment_id) DO NOTHING;
