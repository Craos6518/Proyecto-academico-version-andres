-- Schema para Supabase/Postgres
-- Tablas: roles, users, subjects, enrollments, assignments, grades

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

-- Índices básicos
create index if not exists idx_users_role_id on users(role_id);
create index if not exists idx_subjects_teacher_id on subjects(teacher_id);
create index if not exists idx_enrollments_student_id on enrollments(student_id);
create index if not exists idx_enrollments_subject_id on enrollments(subject_id);
create index if not exists idx_assignments_subject_id on assignments(subject_id);
create index if not exists idx_grades_student_id on grades(student_id);
create index if not exists idx_grades_subject_id on grades(subject_id);
