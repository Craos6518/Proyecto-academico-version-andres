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
    const subjects = subjectsRes.data ?? []
    const users = usersRes.data ?? []
    const grades = gradesRes.data ?? []

    // Reportes académicos por materia y periodo
    const academicReports: any[] = []
    const subjectsById = Object.fromEntries(subjects.map((s: any) => [s.id, s]))
    const periods = Array.from(new Set(grades.map((g: any) => g.period)))
    for (const period of periods) {
      for (const subject of subjects) {
        const gradesForSubjectPeriod = grades.filter((g: any) => g.subject_id === subject.id && g.period === period)
        if (gradesForSubjectPeriod.length === 0) continue
        const average = Math.round((gradesForSubjectPeriod.reduce((sum: number, g: any) => sum + Number(g.score || 0), 0) / gradesForSubjectPeriod.length) * 10) / 10
        academicReports.push({
          course: subject.code ?? "",
          subject: subject.name,
          period,
          average,
          students: gradesForSubjectPeriod.length,
        })
      }
    }

    // Desempeño docente por materia
    const teacherPerformance: any[] = []
    for (const subject of subjects) {
      const teacher = users.find((u: any) => u.id === subject.teacher_id)
      const gradesForSubject = grades.filter((g: any) => g.subject_id === subject.id)
      if (gradesForSubject.length === 0 || !teacher) continue
      const average = Math.round((gradesForSubject.reduce((sum: number, g: any) => sum + Number(g.score || 0), 0) / gradesForSubject.length) * 10) / 10
      teacherPerformance.push({
        teacher: teacher.first_name + " " + teacher.last_name,
        subject: subject.name,
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
  } catch (err) {
    console.error("director secure-data error:", err)
    res.status(500).json({ error: "Error interno" })
  }
}, ["director"]);
