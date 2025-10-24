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
    const subjectIds = (subjects || []).map((s: any) => s.id)

    // Obtener notas de esas materias
    const { data: gradesData, error: gradesError } = await supabaseAdmin.from("grades").select("id, student_id, subject_id, score, comments, graded_by, graded_at")
    if (gradesError) throw gradesError
    const grades = (gradesData || []).filter((g: any) => subjectIds.includes(g.subject_id))

    // Obtener estudiantes y materias para mostrar nombres
    const { data: usersData } = await supabaseAdmin.from("users").select("id, first_name, last_name")
    const usersMap: Record<number, any> = {}
    ;(usersData || []).forEach((u: any) => (usersMap[u.id] = u))
    const subjectsMap: Record<number, any> = {}
    ;(subjects || []).forEach((s: any) => (subjectsMap[s.id] = s))

    // Formatear grades para mostrar nombres
    const gradesFormatted = grades.map((g: any) => ({
      student: usersMap[g.student_id] ? `${usersMap[g.student_id].first_name} ${usersMap[g.student_id].last_name}` : g.student_id,
      subject: subjectsMap[g.subject_id] ? subjectsMap[g.subject_id].name : g.subject_id,
      grade: g.score,
      lastModified: g.graded_at,
      comments: g.comments,
    }))

    // Historial de cambios: buscar en tabla "grade_history" si existe
    let history: any[] = []
    try {
      const { data: historyData, error: historyError } = await supabaseAdmin.from("grade_history").select("student_id, action, old_grade, new_grade, date")
      if (!historyError && historyData) {
        history = historyData.map((h: any) => ({
          student: usersMap[h.student_id] ? `${usersMap[h.student_id].first_name} ${usersMap[h.student_id].last_name}` : h.student_id,
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
  } catch (err) {
    console.error("teacher secure-data error:", err)
    res.status(500).json({ error: "Error interno" })
  }
}, ["teacher"]);
