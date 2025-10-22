import type { NextApiRequest, NextApiResponse } from "next"
import { supabaseAdmin } from "../../../lib/supabase-client"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "Método no permitido" })

  const studentId = Number(req.query.studentId)
  if (!studentId) return res.status(400).json({ error: "Falta studentId" })

  try {
    const [enrollRes, gradesRes] = await Promise.all([
      supabaseAdmin.from("enrollments").select("*").eq("student_id", studentId),
      supabaseAdmin.from("grades").select("*").eq("student_id", studentId),
    ])

    const enrollments = enrollRes.data ?? []
    const grades = gradesRes.data ?? []

    let average = 0
    let highest = 0
    let lowest = 0

    if ((grades as any[]).length > 0) {
      const scores = (grades as any[]).map((g) => Number(g.score))
      average = Math.round((scores.reduce((s, v) => s + v, 0) / scores.length) * 10) / 10
      highest = Math.max(...scores)
      lowest = Math.min(...scores)
    }

    return res.status(200).json({
      enrolledSubjects: (enrollments as any[]).length,
      averageGrade: average,
      highestGrade: highest,
      lowestGrade: lowest,
    })
  } catch (err) {
    console.error("student stats error:", err)
    return res.status(500).json({ error: "Error interno" })
  }
}
