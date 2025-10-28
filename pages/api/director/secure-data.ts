import type { NextApiRequest, NextApiResponse } from "next"
import { withAuth } from "../../../lib/middleware/auth"
import { supabaseAdmin } from "../../../lib/supabase-client"

export default withAuth(async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    // Obtener materias, usuarios y notas
    const [subjectsRes, usersRes, gradesRes] = await Promise.all([
      supabaseAdmin.from("subjects").select("id, name, code, description, credits, teacher_id"),
      supabaseAdmin.from("users").select("id, username, first_name, last_name, role_id, role_name"),
      supabaseAdmin.from("grades").select("id, student_id, subject_id, score, period"),
    ])
    const subjects = (subjectsRes.data ?? []) as Record<string, unknown>[]
    const users = (usersRes.data ?? []) as Record<string, unknown>[]
    const grades = (gradesRes.data ?? []) as Record<string, unknown>[]

    // Reportes académicos por materia y periodo
    const academicReports: Array<Record<string, unknown>> = []
    const subjectsById: Record<number, Record<string, unknown>> = {}
    subjects.forEach((s) => { const id = Number(s.id ?? 0); if (id) subjectsById[id] = s })
    const periods = Array.from(new Set(grades.map((g) => g.period)))
    for (const period of periods) {
      for (const subject of subjects) {
        const subId = Number(subject.id ?? 0)
        const gradesForSubjectPeriod = grades.filter((g) => Number(g.subject_id ?? g.subjectId ?? 0) === subId && (g.period ?? null) === period)
        if (gradesForSubjectPeriod.length === 0) continue
        const average = Math.round((gradesForSubjectPeriod.reduce((sum: number, g) => sum + Number(g.score ?? 0), 0) / gradesForSubjectPeriod.length) * 10) / 10
        academicReports.push({
          course: subject.code ?? "",
          subject: subject.name ?? null,
          period,
          average,
          students: gradesForSubjectPeriod.length,
        })
      }
    }

    // Desempeño docente por materia
    const teacherPerformance: Array<Record<string, unknown>> = []
    for (const subject of subjects) {
      const teacher = users.find((u) => Number(u.id ?? 0) === Number(subject.teacher_id ?? subject.teacherId ?? 0))
      const gradesForSubject = grades.filter((g) => Number(g.subject_id ?? g.subjectId ?? 0) === Number(subject.id ?? 0))
      if (gradesForSubject.length === 0 || !teacher) continue
      const average = Math.round((gradesForSubject.reduce((sum: number, g) => sum + Number(g.score ?? 0), 0) / gradesForSubject.length) * 10) / 10
      teacherPerformance.push({
        teacher: `${String(teacher.first_name ?? '')} ${String(teacher.last_name ?? '')}`.trim(),
        subject: subject.name ?? null,
        average,
      })
    }

    res.status(200).json({
      message: 'Acceso concedido solo a director',
      academicReports,
      teacherPerformance,
      downloadLinks: {
        csv: '/api/director/report.csv',
        pdf: '/api/director/report.pdf',
      },
    })
  } catch (err: unknown) {
    console.error("director secure-data error:", err)
    const message = (typeof err === 'object' && err !== null && 'message' in err) ? String((err as { message?: unknown }).message) : String(err ?? 'Error interno')
    res.status(500).json({ error: message })
  }
}, ["director"]);
