// Mock data for the academic system (simulates database)

export interface Role {
  id: number
  name: string
  description: string
}

export interface User {
  id: number
  username: string
  email: string
  firstName: string
  lastName: string
  roleId: number
  roleName: string
  role?: string // Nuevo: para compatibilidad JWT
  isActive: boolean
  password: string
}

export interface Subject {
  id: number
  name: string
  code: string
  description: string
  credits: number
  teacherId: number
  teacherName: string
}

export interface Assignment {
  id: number
  subjectId: number
  name: string
  description: string
  assignmentType: "parcial1" | "parcial2" | "final"
  maxScore: number
  weight: number
  dueDate: string
}

export interface Grade {
  id: number
  studentId: number
  assignmentId: number
  subjectId: number
  score: number
  gradedBy: number
  gradedAt: string
  comments?: string
}

export interface Enrollment {
  id: number
  studentId: number
  subjectId: number
  enrollmentDate: string
  status: string
}

// Mock roles
export const mockRoles: Role[] = [
  { id: 1, name: "Administrador", description: "Acceso completo al sistema" },
  { id: 2, name: "Director", description: "Gestión académica y reportes" },
  { id: 3, name: "Profesor", description: "Gestión de calificaciones y materias" },
  { id: 4, name: "Estudiante", description: "Consulta de calificaciones y materias" },
]

// Mock users (password: demo123 for all)
export const mockUsers: User[] = [
  {
    id: 1,
    username: "admin",
    email: "admin@escuela.edu",
    firstName: "Carlos",
    lastName: "Administrador",
    roleId: 1,
    roleName: "Administrador",
    isActive: true,
    password: "demo123",
  },
  {
    id: 2,
    username: "director",
    email: "director@escuela.edu",
    firstName: "María",
    lastName: "Directora",
    roleId: 2,
    roleName: "Director",
    isActive: true,
    password: "demo123",
  },
  {
    id: 3,
    username: "profesor1",
    email: "profesor1@escuela.edu",
    firstName: "Juan",
    lastName: "Pérez",
    roleId: 3,
    roleName: "Profesor",
    isActive: true,
    password: "demo123",
  },
  {
    id: 4,
    username: "profesor2",
    email: "profesor2@escuela.edu",
    firstName: "Ana",
    lastName: "García",
    roleId: 3,
    roleName: "Profesor",
    isActive: true,
    password: "demo123",
  },
  {
    id: 5,
    username: "estudiante1",
    email: "estudiante1@escuela.edu",
    firstName: "Pedro",
    lastName: "López",
    roleId: 4,
    roleName: "Estudiante",
    isActive: true,
    password: "demo123",
  },
  {
    id: 6,
    username: "estudiante2",
    email: "estudiante2@escuela.edu",
    firstName: "Laura",
    lastName: "Martínez",
    roleId: 4,
    roleName: "Estudiante",
    isActive: true,
    password: "demo123",
  },
  {
    id: 7,
    username: "estudiante3",
    email: "estudiante3@escuela.edu",
    firstName: "Diego",
    lastName: "Rodríguez",
    roleId: 4,
    roleName: "Estudiante",
    isActive: true,
    password: "demo123",
  },
]

// Mock subjects
export const mockSubjects: Subject[] = [
  {
    id: 1,
    name: "Matemáticas Avanzadas",
    code: "MAT301",
    description: "Cálculo diferencial e integral",
    credits: 4,
    teacherId: 3,
    teacherName: "Juan Pérez",
  },
  {
    id: 2,
    name: "Física Cuántica",
    code: "FIS401",
    description: "Introducción a la mecánica cuántica",
    credits: 4,
    teacherId: 3,
    teacherName: "Juan Pérez",
  },
  {
    id: 3,
    name: "Programación Web",
    code: "INF201",
    description: "Desarrollo de aplicaciones web modernas",
    credits: 3,
    teacherId: 4,
    teacherName: "Ana García",
  },
  {
    id: 4,
    name: "Base de Datos",
    code: "INF301",
    description: "Diseño y gestión de bases de datos",
    credits: 3,
    teacherId: 4,
    teacherName: "Ana García",
  },
  {
    id: 5,
    name: "Literatura Española",
    code: "LIT101",
    description: "Historia de la literatura española",
    credits: 3,
    teacherId: 3,
    teacherName: "Juan Pérez",
  },
]

// Mock enrollments
export const mockEnrollments: Enrollment[] = [
  { id: 1, studentId: 5, subjectId: 1, enrollmentDate: "2025-01-15T08:00:00Z", status: "active" },
  { id: 2, studentId: 5, subjectId: 3, enrollmentDate: "2025-01-15T08:30:00Z", status: "active" },
  { id: 3, studentId: 5, subjectId: 4, enrollmentDate: "2025-01-15T09:00:00Z", status: "active" },
  { id: 4, studentId: 6, subjectId: 1, enrollmentDate: "2025-01-16T08:00:00Z", status: "active" },
  { id: 5, studentId: 6, subjectId: 2, enrollmentDate: "2025-01-16T08:30:00Z", status: "active" },
  { id: 6, studentId: 6, subjectId: 5, enrollmentDate: "2025-01-16T09:00:00Z", status: "active" },
  { id: 7, studentId: 7, subjectId: 3, enrollmentDate: "2025-01-17T08:00:00Z", status: "active" },
  { id: 8, studentId: 7, subjectId: 4, enrollmentDate: "2025-01-17T08:30:00Z", status: "active" },
  { id: 9, studentId: 7, subjectId: 5, enrollmentDate: "2025-01-17T09:00:00Z", status: "active" },
]

// Mock assignments
export const mockAssignments: Assignment[] = [
  {
    id: 1,
    subjectId: 1,
    name: "Parcial 1 - Derivadas",
    description: "Examen de derivadas y límites",
    assignmentType: "parcial1",
    maxScore: 5.0,
    weight: 30,
    dueDate: "2025-03-15",
  },
  {
    id: 2,
    subjectId: 1,
    name: "Parcial 2 - Integrales",
    description: "Examen de integrales",
    assignmentType: "parcial2",
    maxScore: 5.0,
    weight: 30,
    dueDate: "2025-05-15",
  },
  {
    id: 3,
    subjectId: 1,
    name: "Examen Final",
    description: "Examen final de matemáticas",
    assignmentType: "final",
    maxScore: 5.0,
    weight: 40,
    dueDate: "2025-07-15",
  },
  {
    id: 4,
    subjectId: 3,
    name: "Parcial 1 - HTML/CSS",
    description: "Proyecto de maquetación web",
    assignmentType: "parcial1",
    maxScore: 5.0,
    weight: 30,
    dueDate: "2025-03-20",
  },
  {
    id: 5,
    subjectId: 3,
    name: "Parcial 2 - JavaScript",
    description: "Aplicación interactiva",
    assignmentType: "parcial2",
    maxScore: 5.0,
    weight: 30,
    dueDate: "2025-05-20",
  },
  {
    id: 6,
    subjectId: 3,
    name: "Proyecto Final",
    description: "Aplicación web completa",
    assignmentType: "final",
    maxScore: 5.0,
    weight: 40,
    dueDate: "2025-07-20",
  },
  {
    id: 7,
    subjectId: 4,
    name: "Parcial 1 - SQL",
    description: "Diseño de base de datos",
    assignmentType: "parcial1",
    maxScore: 5.0,
    weight: 30,
    dueDate: "2025-03-18",
  },
  {
    id: 8,
    subjectId: 4,
    name: "Parcial 2 - Normalización",
    description: "Normalización y optimización",
    assignmentType: "parcial2",
    maxScore: 5.0,
    weight: 30,
    dueDate: "2025-05-18",
  },
  {
    id: 9,
    subjectId: 4,
    name: "Proyecto Final",
    description: "Sistema de base de datos completo",
    assignmentType: "final",
    maxScore: 5.0,
    weight: 40,
    dueDate: "2025-07-18",
  },
]

// Mock grades
export const mockGrades: Grade[] = [
  { id: 1, studentId: 5, assignmentId: 1, subjectId: 1, score: 4.2, gradedBy: 3, gradedAt: "2025-03-16T10:00:00Z" },
  { id: 2, studentId: 5, assignmentId: 2, subjectId: 1, score: 4.5, gradedBy: 3, gradedAt: "2025-05-16T10:00:00Z" },
  { id: 3, studentId: 5, assignmentId: 3, subjectId: 1, score: 4.4, gradedBy: 3, gradedAt: "2025-07-16T10:00:00Z" },
  { id: 4, studentId: 5, assignmentId: 4, subjectId: 3, score: 4.6, gradedBy: 4, gradedAt: "2025-03-21T10:00:00Z" },
  { id: 5, studentId: 5, assignmentId: 5, subjectId: 3, score: 4.3, gradedBy: 4, gradedAt: "2025-05-21T10:00:00Z" },
  { id: 6, studentId: 6, assignmentId: 1, subjectId: 1, score: 3.9, gradedBy: 3, gradedAt: "2025-03-16T10:00:00Z" },
  { id: 7, studentId: 6, assignmentId: 2, subjectId: 1, score: 4.1, gradedBy: 3, gradedAt: "2025-05-16T10:00:00Z" },
  { id: 8, studentId: 7, assignmentId: 4, subjectId: 3, score: 4.7, gradedBy: 4, gradedAt: "2025-03-21T10:00:00Z" },
  { id: 9, studentId: 7, assignmentId: 5, subjectId: 3, score: 4.6, gradedBy: 4, gradedAt: "2025-05-21T10:00:00Z" },
  { id: 10, studentId: 7, assignmentId: 6, subjectId: 3, score: 4.8, gradedBy: 4, gradedAt: "2025-07-21T10:00:00Z" },
]
