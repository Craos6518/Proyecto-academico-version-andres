
import type { NextApiRequest, NextApiResponse } from "next"
import { withAuth } from "../../../lib/middleware/auth"
import { supabaseAdmin } from "../../../lib/supabase-client"

export default withAuth(async (req: NextApiRequest, res: NextApiResponse) => {
  // Solo método GET
  if (req.method !== "GET") return res.status(405).json({ error: "Método no permitido" })

  // Obtener el id del usuario autenticado
  const user = (req as unknown as { user?: Record<string, unknown> }).user
  const studentId = (user?.id ?? user?.user_id ?? user?.userId) as number | string | undefined
  if (!studentId) return res.status(400).json({ error: "No se pudo identificar al estudiante" })

  try {
    // Obtener materias inscritas y calificaciones
    const [enrollRes, gradesRes] = await Promise.all([
      // include subject description and teacher_id via related select
      supabaseAdmin.from("enrollments").select("subject_id, subjects(id, name, description, teacher_id)").eq("student_id", studentId),
  // grades query (usar '*' para evitar fallas por columnas faltantes)
  supabaseAdmin.from("grades").select("*").eq("student_id", studentId),
    ])

    // Intentar obtener mensajes, pero manejar si la tabla no existe
    let messages: Record<string, unknown>[] = []
    try {
      const messagesRes = await supabaseAdmin.from("messages").select("from, subject, message").eq("student_id", studentId)
      if (!messagesRes.error && Array.isArray(messagesRes.data)) messages = messagesRes.data as Record<string, unknown>[]
    } catch (e) {
      // tabla messages posiblemente no exista; continuar sin bloquear
      console.warn("messages table missing or query failed, continuing without messages", e)
      messages = []
    }

  const subjectsRaw = (enrollRes.data ?? []) as Record<string, unknown>[]
  const gradesRaw = (gradesRes.data ?? []) as Record<string, unknown>[]

    // Mapear calificaciones por subject_id para acceso rápido
    const gradesMap: Record<number, number[]> = {}
    const assignmentGradeMap: Record<number, number> = {}
    ;(gradesRaw || []).forEach((g: Record<string, unknown>) => {
      const sid = Number(g.subject_id ?? g.subjectId ?? 0)
      if (!gradesMap[sid]) gradesMap[sid] = []
      gradesMap[sid].push(Number(g.score ?? g.grade ?? 0))
      const aid = g.assignment_id ?? g.assignmentId
      if (aid !== undefined && aid !== null) assignmentGradeMap[Number(aid as unknown as number)] = Number(g.score ?? g.grade ?? 0)
    })

    // Para cada materia inscrita, incluir la nota si existe (promedio si hay múltiples)
    // collect subjectIds and teacherIds to fetch assignments and teachers
  const subjectIds: number[] = (subjectsRaw || []).map((e: Record<string, unknown>) => Number(e.subject_id ?? e.subjectId ?? 0))
  const teacherIds = Array.from(new Set((subjectsRaw || []).map((e: Record<string, unknown>) => Number(((e.subjects as Record<string, unknown> | undefined)?.teacher_id ?? (e.subjects as Record<string, unknown> | undefined)?.teacherId) ?? 0)).filter(Boolean)))

    // fetch teacher data
    const teachersMap: Record<number, Record<string, unknown>> = {}
    if (teacherIds.length > 0) {
      const { data: teachersData } = await supabaseAdmin.from("users").select("id, first_name, last_name").in("id", teacherIds)
      ;(teachersData || []).forEach((t: Record<string, unknown>) => {
        const id = Number(t.id ?? 0)
        if (id) teachersMap[id] = t
      })
    }

    // fetch assignments for these subjects — usar select('*') para evitar errores por columnas faltantes
    let assignmentsData: Record<string, unknown>[] = []
    if (subjectIds.length > 0) {
      const { data: aData } = await supabaseAdmin.from("assignments").select("*").in("subject_id", subjectIds)
      assignmentsData = (aData || []) as Record<string, unknown>[]
    }

  const subjects = (subjectsRaw || []).map((e: Record<string, unknown>) => {
      const sid = Number(e.subject_id ?? e.subjectId ?? 0)
      const subj = (e.subjects as Record<string, unknown> | undefined) ?? {}
      const scores = gradesMap[sid] || []
      const grade = scores.length > 0 ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) / 100 : null
      const teacher = subj.teacher_id ? teachersMap[Number(subj.teacher_id)] : (subj.teacherId ? teachersMap[Number(subj.teacherId)] : null)
      const subjectAssignments = (assignmentsData || []).filter((a: Record<string, unknown>) => Number(a.subject_id ?? a.subjectId ?? 0) === sid).map((a: Record<string, unknown>) => ({
        id: a.id,
        title: (a.title ?? a.name) ?? null,
        description: a.description ?? null,
        due_date: a.due_date ?? a.dueDate ?? null,
        type: a.assignment_type ?? a.assignmentType ?? null,
        max_score: a.max_score ?? a.maxScore ?? null,
        weight: a.weight ?? null,
        studentGrade: assignmentGradeMap[Number(a.id ?? 0)] ?? null,
      }))
      return {
        id: subj.id ?? sid,
        name: subj.name ?? "",
        subject_id: sid,
        description: subj.description ?? "",
        teacherName: teacher ? `${teacher.first_name ?? ''} ${teacher.last_name ?? ''}`.trim() : null,
        grade,
        assignments: subjectAssignments,
      }
    })

    // Calcular promedio global considerando solo materias con nota
  const scored = subjects.filter((s: Record<string, unknown>) => (s.grade ?? null) !== null).map((s: Record<string, unknown>) => (s.grade ?? 0) as number)
    const average = scored.length > 0 ? Math.round((scored.reduce((a: number, b: number) => a + b, 0) / scored.length) * 100) / 100 : 0

    // Enlaces de exportación (pueden ser rutas reales si existen)
    const exportLinks = {
      csv: `/api/student/grades.csv?studentId=${studentId}`,
      pdf: `/api/student/grades.pdf?studentId=${studentId}`,
    }

  // Normalizar gradesRaw para exponer un array top-level que los componentes cliente esperan
    // build an assignment lookup to attach names/descriptions to grades
    const assignmentById: Record<string, Record<string, unknown>> = {}
    ;(assignmentsData || []).forEach((a: Record<string, unknown>) => {
      const key = String(a.id ?? '')
      assignmentById[key] = a
    })

  const grades = (gradesRaw || []).map((g: Record<string, unknown>) => {
      const aid = g.assignment_id ?? g.assignmentId ?? null
      const assignmentRel = (g.assignments as Record<string, unknown> | undefined) ?? (aid ? assignmentById[aid as unknown as string | number] : null)
      const assignment = assignmentRel || (aid ? assignmentById[aid as unknown as string | number] : null)
      return {
        id: g.id,
        assignment_id: aid,
        subject_id: Number(g.subject_id ?? g.subjectId ?? 0),
        score: Number(g.score ?? g.grade ?? 0),
        graded_at: g.graded_at ?? g.gradedAt ?? null,
        graded_by: g.graded_by ?? g.gradedBy ?? null,
        comment: g.comment ?? g.notes ?? g.note ?? null,
        name: assignment ? (assignment.title ?? assignment.name ?? `Evaluación ${aid}`) : (g.name ?? null),
        assignment_description: assignment ? (assignment.description ?? null) : null,
      }
    })

    // NOTE: debug-only responses removed in cleanup

    // Respuesta normal para el cliente
    return res.status(200).json({
      message: 'Acceso concedido solo a estudiante',
      subjects,
      average,
      grades,
      messages,
      exportLinks,
    })
  } catch (err) {
    console.error("student secure-data error:", err)
    res.status(500).json({ error: "Error interno" })
  }
}, ["student"]);
