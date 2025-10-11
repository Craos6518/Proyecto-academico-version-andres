import { supabase } from "./supabase-client"
import type {
  User,
  Subject,
  Grade,
  Assignment,
  Enrollment,
} from "./mock-data"

// Nota: estas funciones devuelven datos en la forma definida por mock-data.
// Requieren que en Supabase existan tablas: users, subjects, grades, assignments, enrollments

export class SupabaseApiClient {
  // Users
  async getUsers(): Promise<User[]> {
    const { data, error } = await supabase.from("users").select("*")
    if (error) {
      console.error("getUsers error:", error)
      return []
    }
    return (data ?? []) as User[]
  }

  async getUserById(id: number): Promise<User | undefined> {
    const { data, error } = await supabase.from("users").select("*").eq("id", id).limit(1).single()
    if (error) {
      return undefined
    }
    return data as User
  }

  async createUser(user: Omit<User, "id">): Promise<User | null> {
    const { data, error } = await supabase.from("users").insert(user).select().limit(1).single()
    if (error) {
      console.error("createUser error:", error)
      return null
    }
    return data as User
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | null> {
    const { data, error } = await supabase.from("users").update(updates).eq("id", id).select().limit(1).single()
    if (error) {
      console.error("updateUser error:", error)
      return null
    }
    return data as User
  }

  async deleteUser(id: number): Promise<boolean> {
    const { error } = await supabase.from("users").delete().eq("id", id)
    if (error) {
      console.error("deleteUser error:", error)
      return false
    }
    return true
  }

  // Subjects
  async getSubjects(): Promise<Subject[]> {
    const { data, error } = await supabase.from("subjects").select("*")
    if (error) {
      console.error("getSubjects error:", error)
      return []
    }
    return (data ?? []) as Subject[]
  }

  async getSubjectById(id: number): Promise<Subject | undefined> {
    const { data, error } = await supabase.from("subjects").select("*").eq("id", id).limit(1).single()
    if (error) return undefined
    return data as Subject
  }

  async getSubjectsByTeacher(teacherId: number): Promise<Subject[]> {
    const { data, error } = await supabase.from("subjects").select("*").eq("teacherId", teacherId)
    if (error) return []
    return (data ?? []) as Subject[]
  }

  async createSubject(subject: Omit<Subject, "id">): Promise<Subject | null> {
    const { data, error } = await supabase.from("subjects").insert(subject).select().limit(1).single()
    if (error) {
      console.error("createSubject error:", error)
      return null
    }
    return data as Subject
  }

  async updateSubject(id: number, updates: Partial<Subject>): Promise<Subject | null> {
    const { data, error } = await supabase.from("subjects").update(updates).eq("id", id).select().limit(1).single()
    if (error) return null
    return data as Subject
  }

  async deleteSubject(id: number): Promise<boolean> {
    const { error } = await supabase.from("subjects").delete().eq("id", id)
    if (error) {
      console.error("deleteSubject error:", error)
      return false
    }
    return true
  }

  // Enrollments
  async getEnrollments(): Promise<Enrollment[]> {
    const { data, error } = await supabase.from("enrollments").select("*")
    if (error) return []
    return (data ?? []) as Enrollment[]
  }

  async getEnrollmentsByStudent(studentId: number): Promise<Enrollment[]> {
    const { data, error } = await supabase.from("enrollments").select("*").eq("studentId", studentId)
    if (error) return []
    return (data ?? []) as Enrollment[]
  }

  async getEnrollmentsBySubject(subjectId: number): Promise<Enrollment[]> {
    const { data, error } = await supabase.from("enrollments").select("*").eq("subjectId", subjectId)
    if (error) return []
    return (data ?? []) as Enrollment[]
  }

  async createEnrollment(enrollment: Omit<Enrollment, "id">): Promise<Enrollment | null> {
    const { data, error } = await supabase.from("enrollments").insert(enrollment).select().limit(1).single()
    if (error) {
      console.error("createEnrollment error:", error)
      return null
    }
    return data as Enrollment
  }

  async updateEnrollment(id: number, updates: Partial<Enrollment>): Promise<Enrollment | null> {
    const { data, error } = await supabase.from("enrollments").update(updates).eq("id", id).select().limit(1).single()
    if (error) return null
    return data as Enrollment
  }

  async deleteEnrollment(id: number): Promise<boolean> {
    const { error } = await supabase.from("enrollments").delete().eq("id", id)
    if (error) return false
    return true
  }

  // Assignments
  async getAssignments(): Promise<Assignment[]> {
    const { data, error } = await supabase.from("assignments").select("*")
    if (error) return []
    return (data ?? []) as Assignment[]
  }

  async getAssignmentsBySubject(subjectId: number): Promise<Assignment[]> {
    const { data, error } = await supabase.from("assignments").select("*").eq("subjectId", subjectId)
    if (error) return []
    return (data ?? []) as Assignment[]
  }

  async createAssignment(assignment: Omit<Assignment, "id">): Promise<Assignment | null> {
    const { data, error } = await supabase.from("assignments").insert(assignment).select().limit(1).single()
    if (error) return null
    return data as Assignment
  }

  async updateAssignment(id: number, updates: Partial<Assignment>): Promise<Assignment | null> {
    const { data, error } = await supabase.from("assignments").update(updates).eq("id", id).select().limit(1).single()
    if (error) return null
    return data as Assignment
  }

  async deleteAssignment(id: number): Promise<boolean> {
    const { error } = await supabase.from("assignments").delete().eq("id", id)
    if (error) return false
    return true
  }

  // Grades
  async getGrades(): Promise<Grade[]> {
    const { data, error } = await supabase.from("grades").select("*")
    if (error) return []
    return (data ?? []) as Grade[]
  }

  async getGradesByStudent(studentId: number): Promise<Grade[]> {
    const { data, error } = await supabase.from("grades").select("*").eq("studentId", studentId)
    if (error) return []
    return (data ?? []) as Grade[]
  }

  async getGradesBySubject(subjectId: number): Promise<Grade[]> {
    const { data, error } = await supabase.from("grades").select("*").eq("subjectId", subjectId)
    if (error) return []
    return (data ?? []) as Grade[]
  }

  async getGradesByStudentAndSubject(studentId: number, subjectId: number): Promise<Grade[]> {
    const { data, error } = await supabase
      .from("grades")
      .select("*")
      .eq("studentId", studentId)
      .eq("subjectId", subjectId)

    if (error) return []
    return (data ?? []) as Grade[]
  }

  async createGrade(grade: Omit<Grade, "id">): Promise<Grade | null> {
    const payload = { ...grade, gradedAt: new Date().toISOString() }
    const { data, error } = await supabase.from("grades").insert(payload).select().limit(1).single()
    if (error) return null
    return data as Grade
  }

  async updateGrade(id: number, updates: Partial<Grade>): Promise<Grade | null> {
    const { data, error } = await supabase.from("grades").update(updates).eq("id", id).select().limit(1).single()
    if (error) return null
    return data as Grade
  }

  async deleteGrade(id: number): Promise<boolean> {
    const { error } = await supabase.from("grades").delete().eq("id", id)
    if (error) return false
    return true
  }

  // Calculate final grade (local calculation using fetched data)
  async calculateFinalGrade(studentId: number, subjectId: number): Promise<number | null> {
    const grades = await this.getGradesByStudentAndSubject(studentId, subjectId)
    const assignments = await this.getAssignmentsBySubject(subjectId)

    if (grades.length === 0) return null

    let totalWeightedScore = 0
    let totalWeight = 0

    for (const grade of grades) {
      const assignment = assignments.find((a) => a.id === grade.assignmentId)
      if (assignment) {
        totalWeightedScore += (grade.score * assignment.weight) / 100
        totalWeight += assignment.weight
      }
    }

    return totalWeight > 0 ? totalWeightedScore : null
  }
}

export const supabaseApiClient = new SupabaseApiClient()
