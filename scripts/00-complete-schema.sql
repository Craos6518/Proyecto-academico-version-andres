-- ============================================
-- SISTEMA ACADÉMICO - SCHEMA COMPLETO
-- Fecha: 03/10/2025
-- Base de datos: PostgreSQL
-- ============================================

-- Eliminar tablas existentes (solo para desarrollo)
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS grades CASCADE;
DROP TABLE IF EXISTS assignments CASCADE;
DROP TABLE IF EXISTS enrollments CASCADE;
DROP TABLE IF EXISTS subjects CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS roles CASCADE;

-- ============================================
-- TABLA: roles
-- Descripción: Roles del sistema (Administrador, Director, Profesor, Estudiante)
-- ============================================
CREATE TABLE roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE roles IS 'Roles del sistema académico';
COMMENT ON COLUMN roles.name IS 'Nombre único del rol';
COMMENT ON COLUMN roles.description IS 'Descripción de los permisos del rol';

-- ============================================
-- TABLA: users
-- Descripción: Usuarios del sistema (todos los roles)
-- ============================================
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE users IS 'Usuarios del sistema (administradores, directores, profesores, estudiantes)';
COMMENT ON COLUMN users.password IS 'Contraseña del usuario (en producción debe estar hasheada con bcrypt)';
COMMENT ON COLUMN users.role_id IS 'Referencia al rol del usuario';
COMMENT ON COLUMN users.is_active IS 'Indica si el usuario está activo en el sistema';

-- ============================================
-- TABLA: subjects
-- Descripción: Materias/Asignaturas del sistema
-- ============================================
CREATE TABLE subjects (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  credits INTEGER DEFAULT 3 CHECK (credits > 0),
  teacher_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE subjects IS 'Materias o asignaturas del sistema académico';
COMMENT ON COLUMN subjects.code IS 'Código único de la materia (ej: MAT301)';
COMMENT ON COLUMN subjects.credits IS 'Número de créditos de la materia';
COMMENT ON COLUMN subjects.teacher_id IS 'Profesor asignado a la materia';

-- ============================================
-- TABLA: enrollments
-- Descripción: Inscripciones de estudiantes a materias
-- ============================================
CREATE TABLE enrollments (
  id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  enrollment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'dropped', 'failed')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(student_id, subject_id)
);

COMMENT ON TABLE enrollments IS 'Inscripciones de estudiantes a materias';
COMMENT ON COLUMN enrollments.enrollment_date IS 'Fecha y hora de inscripción';
COMMENT ON COLUMN enrollments.status IS 'Estado de la inscripción: active, completed, dropped, failed';

-- ============================================
-- TABLA: assignments
-- Descripción: Evaluaciones/Tareas de las materias
-- ============================================
CREATE TABLE assignments (
  id SERIAL PRIMARY KEY,
  subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  assignment_type VARCHAR(50) NOT NULL CHECK (assignment_type IN ('parcial1', 'parcial2', 'final', 'tarea', 'proyecto')),
  max_score DECIMAL(3,1) DEFAULT 5.0 CHECK (max_score > 0),
  weight DECIMAL(5,2) NOT NULL CHECK (weight >= 0 AND weight <= 100),
  due_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE assignments IS 'Evaluaciones, tareas y proyectos de las materias';
COMMENT ON COLUMN assignments.assignment_type IS 'Tipo de evaluación: parcial1, parcial2, final, tarea, proyecto';
COMMENT ON COLUMN assignments.max_score IS 'Calificación máxima (escala 0-5)';
COMMENT ON COLUMN assignments.weight IS 'Peso porcentual de la evaluación (0-100)';
COMMENT ON COLUMN assignments.due_date IS 'Fecha de entrega';

-- ============================================
-- TABLA: grades
-- Descripción: Calificaciones de estudiantes
-- ============================================
CREATE TABLE grades (
  id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assignment_id INTEGER NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  score DECIMAL(3,1) NOT NULL CHECK (score >= 0 AND score <= 5.0),
  graded_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  graded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  comments TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(student_id, assignment_id)
);

COMMENT ON TABLE grades IS 'Calificaciones de estudiantes en evaluaciones';
COMMENT ON COLUMN grades.score IS 'Calificación obtenida (escala 0-5)';
COMMENT ON COLUMN grades.graded_by IS 'Profesor que calificó';
COMMENT ON COLUMN grades.graded_at IS 'Fecha y hora de calificación';
COMMENT ON COLUMN grades.comments IS 'Comentarios del profesor sobre la calificación';

-- ============================================
-- TABLA: audit_logs
-- Descripción: Registro de auditoría del sistema
-- ============================================
CREATE TABLE audit_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  table_name VARCHAR(100),
  record_id INTEGER,
  old_values JSONB,
  new_values JSONB,
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE audit_logs IS 'Registro de auditoría de acciones importantes del sistema';
COMMENT ON COLUMN audit_logs.action IS 'Acción realizada (ej: password_change, user_created)';
COMMENT ON COLUMN audit_logs.old_values IS 'Valores anteriores en formato JSON';
COMMENT ON COLUMN audit_logs.new_values IS 'Valores nuevos en formato JSON';

-- ============================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- ============================================

-- Índices para users
CREATE INDEX idx_users_role ON users(role_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_active ON users(is_active);

-- Índices para subjects
CREATE INDEX idx_subjects_teacher ON subjects(teacher_id);
CREATE INDEX idx_subjects_code ON subjects(code);

-- Índices para enrollments
CREATE INDEX idx_enrollments_student ON enrollments(student_id);
CREATE INDEX idx_enrollments_subject ON enrollments(subject_id);
CREATE INDEX idx_enrollments_status ON enrollments(status);
CREATE INDEX idx_enrollments_date ON enrollments(enrollment_date);

-- Índices para assignments
CREATE INDEX idx_assignments_subject ON assignments(subject_id);
CREATE INDEX idx_assignments_type ON assignments(assignment_type);
CREATE INDEX idx_assignments_due_date ON assignments(due_date);

-- Índices para grades
CREATE INDEX idx_grades_student ON grades(student_id);
CREATE INDEX idx_grades_assignment ON grades(assignment_id);
CREATE INDEX idx_grades_subject ON grades(subject_id);
CREATE INDEX idx_grades_graded_by ON grades(graded_by);

-- Índices para audit_logs
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_table ON audit_logs(table_name);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);

-- ============================================
-- DATOS INICIALES
-- ============================================

-- Insertar roles
INSERT INTO roles (id, name, description) VALUES
  (1, 'Administrador', 'Acceso completo al sistema. Puede gestionar usuarios, materias, inscripciones y todas las funcionalidades.'),
  (2, 'Director', 'Gestión académica y reportes. Puede ver y gestionar usuarios (excepto administradores), materias e inscripciones.'),
  (3, 'Profesor', 'Gestión de calificaciones y materias. Puede calificar estudiantes en sus materias asignadas.'),
  (4, 'Estudiante', 'Consulta de calificaciones y materias. Puede ver sus materias inscritas y calificaciones.');

-- Resetear secuencia de roles
SELECT setval('roles_id_seq', 4, true);

-- Insertar usuarios de demostración (contraseña: demo123 para todos)
INSERT INTO users (id, username, email, password, first_name, last_name, role_id, is_active) VALUES
  (1, 'admin', 'admin@escuela.edu', 'demo123', 'Carlos', 'Administrador', 1, true),
  (2, 'director', 'director@escuela.edu', 'demo123', 'María', 'Directora', 2, true),
  (3, 'profesor1', 'profesor1@escuela.edu', 'demo123', 'Juan', 'Pérez', 3, true),
  (4, 'profesor2', 'profesor2@escuela.edu', 'demo123', 'Ana', 'García', 3, true),
  (5, 'estudiante1', 'estudiante1@escuela.edu', 'demo123', 'Pedro', 'López', 4, true),
  (6, 'estudiante2', 'estudiante2@escuela.edu', 'demo123', 'Laura', 'Martínez', 4, true),
  (7, 'estudiante3', 'estudiante3@escuela.edu', 'demo123', 'Diego', 'Rodríguez', 4, true);

-- Resetear secuencia de usuarios
SELECT setval('users_id_seq', 7, true);

-- Insertar materias
INSERT INTO subjects (id, name, code, description, credits, teacher_id) VALUES
  (1, 'Matemáticas Avanzadas', 'MAT301', 'Cálculo diferencial e integral. Estudio de límites, derivadas, integrales y aplicaciones.', 4, 3),
  (2, 'Física Cuántica', 'FIS401', 'Introducción a la mecánica cuántica. Principios fundamentales y aplicaciones.', 4, 3),
  (3, 'Programación Web', 'INF201', 'Desarrollo de aplicaciones web modernas con HTML, CSS, JavaScript y frameworks actuales.', 3, 4),
  (4, 'Base de Datos', 'INF301', 'Diseño y gestión de bases de datos relacionales. SQL, normalización y optimización.', 3, 4),
  (5, 'Literatura Española', 'LIT101', 'Historia de la literatura española desde la Edad Media hasta la actualidad.', 3, 3);

-- Resetear secuencia de materias
SELECT setval('subjects_id_seq', 5, true);

-- Insertar inscripciones
INSERT INTO enrollments (id, student_id, subject_id, enrollment_date, status) VALUES
  (1, 5, 1, '2025-01-15 08:00:00', 'active'),
  (2, 5, 3, '2025-01-15 08:30:00', 'active'),
  (3, 5, 4, '2025-01-15 09:00:00', 'active'),
  (4, 6, 1, '2025-01-16 08:00:00', 'active'),
  (5, 6, 2, '2025-01-16 08:30:00', 'active'),
  (6, 6, 5, '2025-01-16 09:00:00', 'active'),
  (7, 7, 3, '2025-01-17 08:00:00', 'active'),
  (8, 7, 4, '2025-01-17 08:30:00', 'active'),
  (9, 7, 5, '2025-01-17 09:00:00', 'active');

-- Resetear secuencia de inscripciones
SELECT setval('enrollments_id_seq', 9, true);

-- Insertar evaluaciones
INSERT INTO assignments (id, subject_id, name, description, assignment_type, max_score, weight, due_date) VALUES
  -- Matemáticas Avanzadas
  (1, 1, 'Parcial 1 - Derivadas', 'Examen de derivadas y límites', 'parcial1', 5.0, 30.00, '2025-03-15'),
  (2, 1, 'Parcial 2 - Integrales', 'Examen de integrales', 'parcial2', 5.0, 30.00, '2025-05-15'),
  (3, 1, 'Examen Final', 'Examen final de matemáticas', 'final', 5.0, 40.00, '2025-07-15'),
  -- Programación Web
  (4, 3, 'Parcial 1 - HTML/CSS', 'Proyecto de maquetación web', 'parcial1', 5.0, 30.00, '2025-03-20'),
  (5, 3, 'Parcial 2 - JavaScript', 'Aplicación interactiva', 'parcial2', 5.0, 30.00, '2025-05-20'),
  (6, 3, 'Proyecto Final', 'Aplicación web completa', 'final', 5.0, 40.00, '2025-07-20'),
  -- Base de Datos
  (7, 4, 'Parcial 1 - SQL', 'Diseño de base de datos', 'parcial1', 5.0, 30.00, '2025-03-18'),
  (8, 4, 'Parcial 2 - Normalización', 'Normalización y optimización', 'parcial2', 5.0, 30.00, '2025-05-18'),
  (9, 4, 'Proyecto Final', 'Sistema de base de datos completo', 'final', 5.0, 40.00, '2025-07-18');

-- Resetear secuencia de evaluaciones
SELECT setval('assignments_id_seq', 9, true);

-- Insertar calificaciones de ejemplo
INSERT INTO grades (id, student_id, assignment_id, subject_id, score, graded_by, graded_at, comments) VALUES
  -- Pedro López (estudiante1) - Matemáticas
  (1, 5, 1, 1, 4.2, 3, '2025-03-16 10:00:00', 'Buen dominio de derivadas'),
  (2, 5, 2, 1, 4.5, 3, '2025-05-16 10:00:00', 'Excelente trabajo con integrales'),
  (3, 5, 3, 1, 4.4, 3, '2025-07-16 10:00:00', 'Muy buen desempeño general'),
  -- Pedro López - Programación Web
  (4, 5, 4, 3, 4.6, 4, '2025-03-21 10:00:00', 'Excelente maquetación'),
  (5, 5, 5, 3, 4.3, 4, '2025-05-21 10:00:00', 'Buen manejo de JavaScript'),
  -- Laura Martínez (estudiante2) - Matemáticas
  (6, 6, 1, 1, 3.9, 3, '2025-03-16 11:00:00', 'Necesita reforzar algunos conceptos'),
  (7, 6, 2, 1, 4.1, 3, '2025-05-16 11:00:00', 'Mejora notable'),
  -- Diego Rodríguez (estudiante3) - Programación Web
  (8, 7, 4, 3, 4.7, 4, '2025-03-21 11:00:00', 'Trabajo excepcional'),
  (9, 7, 5, 3, 4.6, 4, '2025-05-21 11:00:00', 'Muy buen código'),
  (10, 7, 6, 3, 4.8, 4, '2025-07-21 11:00:00', 'Proyecto sobresaliente');

-- Resetear secuencia de calificaciones
SELECT setval('grades_id_seq', 10, true);

-- ============================================
-- VISTAS ÚTILES
-- ============================================

-- Vista: Promedio de calificaciones por estudiante
CREATE OR REPLACE VIEW student_averages AS
SELECT 
  u.id as student_id,
  u.first_name || ' ' || u.last_name as student_name,
  s.id as subject_id,
  s.name as subject_name,
  ROUND(AVG(g.score), 2) as average_score,
  COUNT(g.id) as total_grades
FROM users u
JOIN grades g ON u.id = g.student_id
JOIN subjects s ON g.subject_id = s.id
WHERE u.role_id = 4
GROUP BY u.id, u.first_name, u.last_name, s.id, s.name;

-- Vista: Calificaciones pendientes por profesor
CREATE OR REPLACE VIEW pending_grades AS
SELECT 
  s.id as subject_id,
  s.name as subject_name,
  s.teacher_id,
  u.first_name || ' ' || u.last_name as teacher_name,
  a.id as assignment_id,
  a.name as assignment_name,
  COUNT(e.student_id) as total_students,
  COUNT(g.id) as graded_students,
  COUNT(e.student_id) - COUNT(g.id) as pending_students
FROM subjects s
JOIN users u ON s.teacher_id = u.id
JOIN assignments a ON s.id = a.subject_id
JOIN enrollments e ON s.id = e.subject_id
LEFT JOIN grades g ON a.id = g.assignment_id AND e.student_id = g.student_id
WHERE e.status = 'active'
GROUP BY s.id, s.name, s.teacher_id, u.first_name, u.last_name, a.id, a.name
HAVING COUNT(e.student_id) - COUNT(g.id) > 0;

-- ============================================
-- FUNCIONES ÚTILES
-- ============================================

-- Función: Calcular promedio final de un estudiante en una materia
CREATE OR REPLACE FUNCTION calculate_final_grade(
  p_student_id INTEGER,
  p_subject_id INTEGER
) RETURNS DECIMAL(3,1) AS $$
DECLARE
  final_grade DECIMAL(5,2);
BEGIN
  SELECT SUM(g.score * (a.weight / 100.0))
  INTO final_grade
  FROM grades g
  JOIN assignments a ON g.assignment_id = a.id
  WHERE g.student_id = p_student_id 
    AND g.subject_id = p_subject_id;
  
  RETURN ROUND(final_grade, 1);
END;
$$ LANGUAGE plpgsql;

-- Función: Registrar cambio de contraseña en audit_logs
CREATE OR REPLACE FUNCTION log_password_change() RETURNS TRIGGER AS $$
BEGIN
  IF OLD.password IS DISTINCT FROM NEW.password THEN
    INSERT INTO audit_logs (user_id, action, table_name, record_id, old_values, new_values)
    VALUES (
      NEW.id,
      'password_change',
      'users',
      NEW.id,
      jsonb_build_object('password', OLD.password),
      jsonb_build_object('password', NEW.password)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Auditar cambios de contraseña
CREATE TRIGGER trigger_password_change
AFTER UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION log_password_change();

-- ============================================
-- PERMISOS (Opcional - ajustar según necesidad)
-- ============================================

-- Crear rol de solo lectura para reportes
-- CREATE ROLE academic_readonly;
-- GRANT SELECT ON ALL TABLES IN SCHEMA public TO academic_readonly;

-- ============================================
-- VERIFICACIÓN DEL SCHEMA
-- ============================================

-- Verificar que todas las tablas se crearon correctamente
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Verificar índices creados
SELECT 
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- ============================================
-- FIN DEL SCHEMA
-- ============================================
