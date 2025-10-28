import type { NextApiRequest, NextApiResponse } from "next"
import { withAuth } from "../../../lib/middleware/auth"
import { supabaseAdmin } from "../../../lib/supabase-client"

export default withAuth(async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    // Obtener el id del docente autenticado (puede venir en req.query o req.body)
    const teacherId = Number(req.query.teacherId || req.body?.teacherId)
    if (!teacherId) return res.status(400).json({ error: "Falta teacherId" })

    // Obtener materias del docente
    const { data: subjects, error: subjectsError } = await supabaseAdmin.from("subjects").select("id, name").eq("teacher_id", teacherId)
    if (subjectsError) throw subjectsError
  const subjectIds = (subjects || []).map((s: Record<string, unknown>) => Number(s.id ?? s.id ?? 0))

    // Obtener notas de esas materias
    const { data: gradesData, error: gradesError } = await supabaseAdmin.from("grades").select("id, student_id, subject_id, score, comments, graded_by, graded_at")
    if (gradesError) throw gradesError
  const grades = (gradesData || []).filter((g: Record<string, unknown>) => subjectIds.includes(Number(g.subject_id ?? g.subjectId ?? 0)))

    // Obtener estudiantes y materias para mostrar nombres
    const { data: usersData } = await supabaseAdmin.from("users").select("id, first_name, last_name")
    const usersMap: Record<number, Record<string, unknown>> = {}
    ;(usersData || []).forEach((u: Record<string, unknown>) => {
      const id = Number(u.id ?? 0)
      if (id) usersMap[id] = u
    })
    const subjectsMap: Record<number, Record<string, unknown>> = {}
    ;(subjects || []).forEach((s: Record<string, unknown>) => {
      const id = Number(s.id ?? 0)
      if (id) subjectsMap[id] = s
    })

    // Formatear grades para mostrar nombres
    const gradesFormatted = (grades || []).map((g: Record<string, unknown>) => {
      const studentId = Number(g.student_id ?? g.studentId ?? 0)
      const subjId = Number(g.subject_id ?? g.subjectId ?? 0)
      const user = usersMap[studentId]
      const subject = subjectsMap[subjId]
      return {
        student: user ? `${String(user.first_name ?? '')} ${String(user.last_name ?? '')}`.trim() : (g.student_id ?? g.studentId),
        subject: subject ? String(subject.name ?? '') : (g.subject_id ?? g.subjectId),
        grade: Number(g.score ?? g.grade ?? 0),
        lastModified: g.graded_at ?? g.gradedAt ?? null,
        comments: g.comments ?? null,
      }
    })

    // Historial de cambios: buscar en tabla "grade_history" si existe
    let history: Record<string, unknown>[] = []
    try {
      const { data: historyData, error: historyError } = await supabaseAdmin.from("grade_history").select("student_id, action, old_grade, new_grade, date")
      if (!historyError && Array.isArray(historyData)) {
        history = historyData.map((h: Record<string, unknown>) => ({
          student: usersMap[Number(h.student_id ?? 0)] ? `${String(usersMap[Number(h.student_id ?? 0)].first_name ?? '')} ${String(usersMap[Number(h.student_id ?? 0)].last_name ?? '')}`.trim() : (h.student_id ?? null),
          action: h.action,
          oldGrade: h.old_grade,
          newGrade: h.new_grade,
          date: h.date,
        }))
      }
    } catch {}

    const average = gradesFormatted.length > 0 ? Math.round((gradesFormatted.reduce((acc, g) => acc + Number(g.grade || 0), 0) / gradesFormatted.length) * 10) / 10 : 0

    res.status(200).json({
      message: 'Acceso concedido solo a docente',
      grades: gradesFormatted,
      history,
      average,
    })
  } catch (err: unknown) {
    console.error("teacher secure-data error:", err)
    const message = (typeof err === 'object' && err !== null && 'message' in err) ? String((err as { message?: unknown }).message) : String(err ?? 'Error interno')
    res.status(500).json({ error: message })
  }
}, ["teacher"]);
