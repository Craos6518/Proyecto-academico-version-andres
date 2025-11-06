// Import supabaseAdmin dynamically at runtime to avoid bundling server-only
// credentials into client-side bundles. Use getAdminClient() inside async
// methods which ensures the module is loaded only on the server.
async function getAdminClient() {
  if (typeof window !== "undefined") {
    // Prevent accidental use from client-side code
    throw new Error("supabaseAdmin is server-only and cannot be used in the browser")
  }
  const mod = await import("./supabase-client")
  return mod.supabaseAdmin
}
import type { User, Subject, Grade, Assignment, Enrollment } from "./types"

// Nota: estas funciones devuelven datos en la forma definida por mock-data.
// Requieren que en Supabase existan tablas: users, subjects, grades, assignments, enrollments

export class SupabaseApiClient {
  // Users
  async getUsers(): Promise<User[]> {
  const supabaseAdmin = await getAdminClient()
  const { data, error } = await supabaseAdmin.from("users").select("*")
    if (error) {
      console.error("getUsers error:", error)
      return []
    }
    // Map snake_case DB fields to camelCase User type
    return (data ?? []).map((row: unknown) => {
      const r = row as unknown as Record<string, unknown>
      return {
        id: r["id"] as number,
        username: (r["username"] ?? "") as string,
        email: (r["email"] ?? "") as string,
        firstName: (r["first_name"] ?? r["firstName"]) as string | undefined,
        lastName: (r["last_name"] ?? r["lastName"]) as string | undefined,
        roleId: (r["role_id"] ?? r["roleId"]) as number | undefined,
  roleName: (r["role_name"] ?? r["roleName"]) as string | undefined,
        isActive: (r["is_active"] ?? r["isActive"]) as boolean | undefined,
        password_hash: (r["password_hash"] ?? r["passwordHash"]) as string | undefined,
        cedula: (r["cedula"] ?? r["cedula_ci"] ?? r["cedula_norm"]) as string | undefined,
      }
    }) as User[]
  }

  async getUserById(id: number): Promise<User | undefined> {
  const supabaseAdmin = await getAdminClient()
  const { data, error } = await supabaseAdmin.from("users").select("*").eq("id", id).limit(1).single()
    if (error) {
      return undefined
    }
    return data as User
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const supabaseAdmin = await getAdminClient()
    const { data, error } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("username", username)
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error("getUserByUsername error:", error)
      return undefined
    }
    return data as User | undefined
  }

  async createUser(user: Omit<User, "id">): Promise<User | null> {
  const supabaseAdmin = await getAdminClient()
  // Ensure required DB columns exist: cedula and role
  const safeUser = { ...user } as Record<string, unknown>
  if (!safeUser.cedula || String(safeUser.cedula).trim() === "") {
    safeUser.cedula = `legacy-${Date.now()}-${Math.floor(Math.random() * 1000)}`
  }
  // Do not populate a removed/free-text `role` column. Ensure we set role_name or role_id
  // when available so DB remains consistent with roles table.
  if (!safeUser.role_name && safeUser.roleName) safeUser.role_name = safeUser.roleName
  if (!safeUser.role_id && (user as any).roleId) safeUser.role_id = (user as any).roleId

  const { data, error } = await supabaseAdmin.from("users").insert(safeUser).select().limit(1).single()
    if (error) {
      console.error("createUser error:", error)
      return null
    }
    return data as User
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | null> {
  const supabaseAdmin = await getAdminClient()
  const { data, error } = await supabaseAdmin.from("users").update(updates).eq("id", id).select().limit(1).single()
    if (error) {
      console.error("updateUser error:", error)
      return null
    }
    return data as User
  }

  async deleteUser(id: number): Promise<boolean> {
  const supabaseAdmin = await getAdminClient()
  const { error } = await supabaseAdmin.from("users").delete().eq("id", id)
    if (error) {
      console.error("deleteUser error:", error)
      return false
    }
    return true
  }

  // Subjects
  async getSubjects(): Promise<Subject[]> {
  const supabaseAdmin = await getAdminClient()
  const { data, error } = await supabaseAdmin.from("subjects").select("*")
    if (error) {
      console.error("getSubjects error:", error)
      return []
    }
    return (data ?? []) as Subject[]
  }

  async getSubjectById(id: number): Promise<Subject | undefined> {
  const supabaseAdmin = await getAdminClient()
  const { data, error } = await supabaseAdmin.from("subjects").select("*").eq("id", id).limit(1).single()
    if (error) return undefined
    return data as Subject
  }

  async getSubjectsByTeacher(teacherId: number): Promise<Subject[]> {
  const supabaseAdmin = await getAdminClient()
  const { data, error } = await supabaseAdmin.from("subjects").select("*").eq("teacherId", teacherId)
    if (error) return []
    return (data ?? []) as Subject[]
  }

  async createSubject(subject: Omit<Subject, "id">): Promise<Subject | null> {
  const supabaseAdmin = await getAdminClient()
  const { data, error } = await supabaseAdmin.from("subjects").insert(subject).select().limit(1).single()
    if (error) {
      console.error("createSubject error:", error)
      return null
    }
    return data as Subject
  }

  async updateSubject(id: number, updates: Partial<Subject>): Promise<Subject | null> {
  const supabaseAdmin = await getAdminClient()
  const { data, error } = await supabaseAdmin.from("subjects").update(updates).eq("id", id).select().limit(1).single()
    if (error) return null
    return data as Subject
  }

  async deleteSubject(id: number): Promise<boolean> {
  const supabaseAdmin = await getAdminClient()
  const { error } = await supabaseAdmin.from("subjects").delete().eq("id", id)
    if (error) {
      console.error("deleteSubject error:", error)
      return false
    }
    return true
  }

  // Enrollments
  async getEnrollments(): Promise<Enrollment[]> {
  const supabaseAdmin = await getAdminClient()
  const { data, error } = await supabaseAdmin.from("enrollments").select("*")
    if (error) return []
    return (data ?? []).map((row: unknown) => {
      const r = row as unknown as Record<string, unknown>
      return {
        id: r["id"] as number,
        studentId: (r["student_id"] ?? r["studentId"]) as number,
        subjectId: (r["subject_id"] ?? r["subjectId"]) as number,
        enrollmentDate: (r["enrollment_date"] ?? r["enrollmentDate"]) as string,
        status: (r["status"] ?? "") as string,
      }
    }) as Enrollment[]
  }

  async getEnrollmentsByStudent(studentId: number): Promise<Enrollment[]> {
  const supabaseAdmin = await getAdminClient()
  // Query using snake_case column name
  const { data, error } = await supabaseAdmin.from("enrollments").select("*").eq("student_id", studentId)
    if (error) return []
    return (data ?? []).map((row: unknown) => {
      const r = row as unknown as Record<string, unknown>
      return {
        id: r["id"] as number,
        studentId: (r["student_id"] ?? r["studentId"]) as number,
        subjectId: (r["subject_id"] ?? r["subjectId"]) as number,
        enrollmentDate: (r["enrollment_date"] ?? r["enrollmentDate"]) as string,
        status: (r["status"] ?? "") as string,
      }
    }) as Enrollment[]
  }

  async getEnrollmentsBySubject(subjectId: number): Promise<Enrollment[]> {
  const supabaseAdmin = await getAdminClient()
  const { data, error } = await supabaseAdmin.from("enrollments").select("*").eq("subject_id", subjectId)
    if (error) return []
    return (data ?? []).map((row: unknown) => {
      const r = row as unknown as Record<string, unknown>
      return {
        id: r["id"] as number,
        studentId: (r["student_id"] ?? r["studentId"]) as number,
        subjectId: (r["subject_id"] ?? r["subjectId"]) as number,
        enrollmentDate: (r["enrollment_date"] ?? r["enrollmentDate"]) as string,
        status: (r["status"] ?? "") as string,
      }
    }) as Enrollment[]
  }

  async createEnrollment(enrollment: Omit<Enrollment, "id">): Promise<Enrollment | null> {
  const supabaseAdmin = await getAdminClient()
  const { data, error } = await supabaseAdmin.from("enrollments").insert(enrollment).select().limit(1).single()
    if (error) {
      console.error("createEnrollment error:", error)
      return null
    }
    return data as Enrollment
  }

  async updateEnrollment(id: number, updates: Partial<Enrollment>): Promise<Enrollment | null> {
  const supabaseAdmin = await getAdminClient()
  const { data, error } = await supabaseAdmin.from("enrollments").update(updates).eq("id", id).select().limit(1).single()
    if (error) return null
    return data as Enrollment
  }

  async deleteEnrollment(id: number): Promise<boolean> {
  const supabaseAdmin = await getAdminClient()
  const { error } = await supabaseAdmin.from("enrollments").delete().eq("id", id)
    if (error) return false
    return true
  }

  // Assignments
  async getAssignments(): Promise<Assignment[]> {
  const supabaseAdmin = await getAdminClient()
  const { data, error } = await supabaseAdmin.from("assignments").select("*")
    if (error) return []
    return (data ?? []) as Assignment[]
  }

  async getAssignmentsBySubject(subjectId: number): Promise<Assignment[]> {
  const supabaseAdmin = await getAdminClient()
  const { data, error } = await supabaseAdmin.from("assignments").select("*").eq("subjectId", subjectId)
    if (error) return []
    return (data ?? []) as Assignment[]
  }

  async createAssignment(assignment: Omit<Assignment, "id">): Promise<Assignment | null> {
  const supabaseAdmin = await getAdminClient()
  const { data, error } = await supabaseAdmin.from("assignments").insert(assignment).select().limit(1).single()
    if (error) return null
    return data as Assignment
  }

  async updateAssignment(id: number, updates: Partial<Assignment>): Promise<Assignment | null> {
  const supabaseAdmin = await getAdminClient()
  const { data, error } = await supabaseAdmin.from("assignments").update(updates).eq("id", id).select().limit(1).single()
    if (error) return null
    return data as Assignment
  }

  async deleteAssignment(id: number): Promise<boolean> {
  const supabaseAdmin = await getAdminClient()
  const { error } = await supabaseAdmin.from("assignments").delete().eq("id", id)
    if (error) return false
    return true
  }

  // Grades
  async getGrades(): Promise<Grade[]> {
  const supabaseAdmin = await getAdminClient()
  const { data, error } = await supabaseAdmin.from("grades").select("*")
    if (error) return []
    return (data ?? []).map((row: unknown) => {
      const r = row as unknown as Record<string, unknown>
      const scoreVal = r["score"]
      return {
        id: r["id"] as number,
        studentId: (r["student_id"] ?? r["studentId"]) as number,
        assignmentId: (r["assignment_id"] ?? r["assignmentId"]) as number,
        subjectId: (r["subject_id"] ?? r["subjectId"]) as number,
        score: typeof scoreVal === 'string' ? parseFloat(scoreVal as string) : (scoreVal as number),
        gradedBy: (r["graded_by"] ?? r["gradedBy"]) as number,
        gradedAt: (r["graded_at"] ?? r["gradedAt"]) as string,
        comments: (r["comments"] ?? null) as string | null,
      }
    }) as Grade[]
  }

  async getGradesByStudent(studentId: number): Promise<Grade[]> {
  const supabaseAdmin = await getAdminClient()
  const { data, error } = await supabaseAdmin.from("grades").select("*").eq("student_id", studentId)
    if (error) return []
    return (data ?? []).map((row: unknown) => {
      const r = row as unknown as Record<string, unknown>
      const scoreVal = r["score"]
      return {
        id: r["id"] as number,
        studentId: (r["student_id"] ?? r["studentId"]) as number,
        assignmentId: (r["assignment_id"] ?? r["assignmentId"]) as number,
        subjectId: (r["subject_id"] ?? r["subjectId"]) as number,
        score: typeof scoreVal === 'string' ? parseFloat(scoreVal as string) : (scoreVal as number),
        gradedBy: (r["graded_by"] ?? r["gradedBy"]) as number,
        gradedAt: (r["graded_at"] ?? r["gradedAt"]) as string,
        comments: (r["comments"] ?? null) as string | null,
      }
    }) as Grade[]
  }

  async getGradesBySubject(subjectId: number): Promise<Grade[]> {
  const supabaseAdmin = await getAdminClient()
  const { data, error } = await supabaseAdmin.from("grades").select("*").eq("subject_id", subjectId)
    if (error) return []
    return (data ?? []).map((row: unknown) => {
      const r = row as unknown as Record<string, unknown>
      const scoreVal = r["score"]
      return {
        id: r["id"] as number,
        studentId: (r["student_id"] ?? r["studentId"]) as number,
        assignmentId: (r["assignment_id"] ?? r["assignmentId"]) as number,
        subjectId: (r["subject_id"] ?? r["subjectId"]) as number,
        score: typeof scoreVal === 'string' ? parseFloat(scoreVal as string) : (scoreVal as number),
        gradedBy: (r["graded_by"] ?? r["gradedBy"]) as number,
        gradedAt: (r["graded_at"] ?? r["gradedAt"]) as string,
        comments: (r["comments"] ?? null) as string | null,
      }
    }) as Grade[]
  }

  async getGradesByStudentAndSubject(studentId: number, subjectId: number): Promise<Grade[]> {
    const supabaseAdmin = await getAdminClient()
    const { data, error } = await supabaseAdmin
      .from("grades")
      .select("*")
      .eq("student_id", studentId)
      .eq("subject_id", subjectId)

    if (error) return []
    return (data ?? []).map((row: unknown) => {
      const r = row as unknown as Record<string, unknown>
      const scoreVal = r["score"]
      return {
        id: r["id"] as number,
        studentId: (r["student_id"] ?? r["studentId"]) as number,
        assignmentId: (r["assignment_id"] ?? r["assignmentId"]) as number,
        subjectId: (r["subject_id"] ?? r["subjectId"]) as number,
        score: typeof scoreVal === 'string' ? parseFloat(scoreVal as string) : (scoreVal as number),
        gradedBy: (r["graded_by"] ?? r["gradedBy"]) as number,
        gradedAt: (r["graded_at"] ?? r["gradedAt"]) as string,
        comments: (r["comments"] ?? null) as string | null,
      }
    }) as Grade[]
  }

  async createGrade(grade: Omit<Grade, "id">): Promise<Grade | null> {
    const payload = { ...grade, gradedAt: new Date().toISOString() }
  const supabaseAdmin = await getAdminClient()
  const { data, error } = await supabaseAdmin.from("grades").insert(payload).select().limit(1).single()
    if (error) return null
    return data as Grade
  }

  async updateGrade(id: number, updates: Partial<Grade>): Promise<Grade | null> {
  const supabaseAdmin = await getAdminClient()
  const { data, error } = await supabaseAdmin.from("grades").update(updates).eq("id", id).select().limit(1).single()
    if (error) return null
    return data as Grade
  }

  async deleteGrade(id: number): Promise<boolean> {
  const supabaseAdmin = await getAdminClient()
  const { error } = await supabaseAdmin.from("grades").delete().eq("id", id)
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
      // assignments may have id as number or string, ensure comparable
      const gradeAssignmentId = typeof grade.assignmentId === 'string' ? Number(grade.assignmentId) : grade.assignmentId
      const assignment = assignments.find((a) => (typeof a.id === 'string' ? Number(a.id) : a.id) === gradeAssignmentId)
      if (assignment) {
        totalWeightedScore += (grade.score * assignment.weight) / 100
        totalWeight += assignment.weight
      }
    }

    return totalWeight > 0 ? totalWeightedScore : null
  }
}

export const supabaseApiClient = new SupabaseApiClient()
