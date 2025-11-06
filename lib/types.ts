// Shared domain types (extracted from previous mock-data)
export interface Role {
  id: number
  name: string
  description: string
}

export interface User {
  id: number
  username: string
  email: string
  firstName?: string
  lastName?: string
  roleId?: number
  roleName?: string
  role?: string
  isActive?: boolean
  // In production we expect password_hash (bcrypt). Cleartext password should not be used.
  password?: string
  password_hash?: string
  cedula?: string
}

export interface Subject {
  id: number
  name: string
  code: string
  description?: string
  credits?: number
  teacherId?: number
  teacherName?: string
}

export interface Assignment {
  id: number
  subjectId: number
  name: string
  description?: string
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
