
import type { NextApiRequest, NextApiResponse } from "next"
import { withAuth } from "../../../lib/middleware/auth"
import { supabaseAdmin } from "../../../lib/supabase-client"

export default withAuth(async (req: NextApiRequest, res: NextApiResponse) => {
  // Solo método GET
  if (req.method !== "GET") return res.status(405).json({ error: "Método no permitido" })

  // Obtener el id del usuario autenticado
  const user = (req as any).user
  const studentId = user?.id || user?.user_id || user?.userId
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
    let messages: any[] = []
    try {
      const messagesRes = await supabaseAdmin.from("messages").select("from, subject, message").eq("student_id", studentId)
      if (!messagesRes.error && messagesRes.data) messages = messagesRes.data
    } catch (e) {
      // tabla messages posiblemente no exista; continuar sin bloquear
      console.warn("messages table missing or query failed, continuing without messages", e)
      messages = []
    }

  const subjectsRaw = (enrollRes.data ?? [])
  const gradesRaw = (gradesRes.data ?? [])
    // DEBUG: log info útil para depuración
    console.debug('[secure-data] studentId=', studentId, 'enrollCount=', (subjectsRaw || []).length, 'gradesResError=', gradesRes.error, 'gradesCount=', (gradesRaw || []).length)
    try {
      console.debug('[secure-data] enrollRes.data sample=', JSON.stringify((enrollRes.data || []).slice(0,3)))
      console.debug('[secure-data] gradesRes.data sample=', JSON.stringify((gradesRes.data || []).slice(0,10)))
    } catch (e) {
      console.debug('[secure-data] debug stringify error', e)
    }

    // Mapear calificaciones por subject_id para acceso rápido
    const gradesMap: Record<number, number[]> = {}
    const assignmentGradeMap: Record<number, number> = {}
    ;(gradesRaw || []).forEach((g: any) => {
      const sid = Number(g.subject_id)
      if (!gradesMap[sid]) gradesMap[sid] = []
      gradesMap[sid].push(Number(g.score))
      if (g.assignment_id) assignmentGradeMap[g.assignment_id] = Number(g.score)
    })

    // Para cada materia inscrita, incluir la nota si existe (promedio si hay múltiples)
    // collect subjectIds and teacherIds to fetch assignments and teachers
    const subjectIds: number[] = (subjectsRaw || []).map((e: any) => Number(e.subject_id))
    const teacherIds = Array.from(new Set((subjectsRaw || []).map((e: any) => Number(e.subjects?.teacher_id)).filter(Boolean)))

    // fetch teacher data
    const teachersMap: Record<number, any> = {}
    if (teacherIds.length > 0) {
      const { data: teachersData } = await supabaseAdmin.from("users").select("id, first_name, last_name").in("id", teacherIds)
      ;(teachersData || []).forEach((t: any) => (teachersMap[t.id] = t))
    }

    // fetch assignments for these subjects — usar select('*') para evitar errores por columnas faltantes
    let assignmentsData: any[] = []
    if (subjectIds.length > 0) {
      const { data: aData } = await supabaseAdmin.from("assignments").select("*").in("subject_id", subjectIds)
      assignmentsData = aData || []
    }

  const subjects = (subjectsRaw || []).map((e: any) => {
      const sid = Number(e.subject_id)
      const subj = e.subjects || {}
      const scores = gradesMap[sid] || []
      const grade = scores.length > 0 ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) / 100 : null
      const teacher = subj.teacher_id ? teachersMap[subj.teacher_id] : null
      const subjectAssignments = (assignmentsData || []).filter((a: any) => Number(a.subject_id) === sid).map((a: any) => ({
        id: a.id,
        title: a.title ?? a.name ?? null,
        description: a.description ?? null,
        due_date: a.due_date ?? null,
        type: a.assignment_type ?? null,
        max_score: a.max_score ?? null,
        weight: a.weight ?? null,
        studentGrade: assignmentGradeMap[a.id] ?? null,
      }))
      return {
        id: subj.id || sid,
        name: subj.name || "",
        subject_id: sid,
        description: subj.description || "",
        teacherName: teacher ? `${teacher.first_name || ''} ${teacher.last_name || ''}`.trim() : null,
        grade,
        assignments: subjectAssignments,
      }
    })

    // Calcular promedio global considerando solo materias con nota
    const scored = subjects.filter((s: any) => s.grade !== null).map((s: any) => s.grade as number)
    const average = scored.length > 0 ? Math.round((scored.reduce((a: number, b: number) => a + b, 0) / scored.length) * 100) / 100 : 0

    // Enlaces de exportación (pueden ser rutas reales si existen)
    const exportLinks = {
      csv: `/api/student/grades.csv?studentId=${studentId}`,
      pdf: `/api/student/grades.pdf?studentId=${studentId}`,
    }

  // Normalizar gradesRaw para exponer un array top-level que los componentes cliente esperan
    // build an assignment lookup to attach names/descriptions to grades
    const assignmentById: Record<string|number, any> = {}
    ;(assignmentsData || []).forEach((a: any) => { assignmentById[a.id] = a })

  const grades = (gradesRaw || []).map((g: any) => {
      const aid = g.assignment_id ?? g.assignmentId ?? null
      const assignmentRel = g.assignments ?? (aid ? assignmentById[aid] : null)
      const assignment = assignmentRel || (aid ? assignmentById[aid] : null)
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

    // Si se pide debug, devolver los datos crudos para inspección
    if (String(req.query.debug) === '1' || String(req.query.debug) === 'true') {
      return res.status(200).json({
        message: 'DEBUG - raw data',
        enrollRaw: enrollRes.data ?? null,
        gradesRaw: gradesRes.data ?? null,
        assignmentsData: assignmentsData ?? null,
      })
    }

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
