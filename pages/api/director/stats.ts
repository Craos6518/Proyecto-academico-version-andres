import type { NextApiRequest, NextApiResponse } from "next"
import { supabaseAdmin } from "../../../lib/supabase-client"
import { normalizeRole } from '../../../lib/auth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "Método no permitido" })

  try {
    const [usersRes, subjectsRes, gradesRes] = await Promise.all([
      supabaseAdmin.from("users").select("*") ,
      supabaseAdmin.from("subjects").select("*") ,
      supabaseAdmin.from("grades").select("*") ,
    ])

    const users = usersRes.data ?? []
    const subjects = subjectsRes.data ?? []
    const grades = gradesRes.data ?? []

  const students = (users as any[]).filter((u) => normalizeRole(u.roleName ?? u.role ?? u.role_name) === 'student')

    const averageGrade = grades.length > 0 ? Math.round((grades.reduce((sum: number, g: any) => sum + Number(g.score || 0), 0) / grades.length) * 10) / 10 : 0

    const approvedGrades = (grades as any[]).filter((g) => Number(g.score) >= 3.0).length
    const approvalRate = grades.length > 0 ? Math.round((approvedGrades / grades.length) * 1000) / 10 : 0

    return res.status(200).json({
  totalStudents: students.length,
  totalTeachers: (users as any[]).filter((u) => normalizeRole(u.roleName ?? u.role ?? u.role_name) === 'teacher').length,
      totalSubjects: (subjects as any[]).length,
      averageGrade,
      approvalRate,
    })
  } catch (err) {
    console.error("director stats error:", err)
    return res.status(500).json({ error: "Error interno" })
  }
}
