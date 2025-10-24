import type { NextApiRequest, NextApiResponse } from "next"
import { supabaseAdmin } from "../../../lib/supabase-client"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" })

    const { studentId, subjectId } = req.query
    if (!studentId || !subjectId) return res.status(400).json({ error: "Missing studentId or subjectId" })

    const sId = Number(subjectId)
    const stId = Number(studentId)

    // Fetch assignments for the subject
    const { data: assignments, error: aErr } = await supabaseAdmin
      .from("assignments")
      .select("*")
      .eq("subject_id", sId)
    if (aErr) throw aErr

    // Fetch grades for the student in that subject
    const { data: grades, error: gErr } = await supabaseAdmin
      .from("grades")
      .select("*")
      .eq("student_id", stId)
      .eq("subject_id", sId)
    if (gErr) throw gErr

    // Map assignments by id
    const assignMap: Record<number, any> = {}
    ;(assignments || []).forEach((a: any) => (assignMap[a.id] = a))

    // Calculate weighted average
    let totalWeight = 0
    let weightedSum = 0

    ;(grades || []).forEach((grade: any) => {
      const a = assignMap[grade.assignment_id]
      if (!a) return
      const weight = a.weight || 0
      const maxScore = a.max_score ?? a.maxScore ?? 5
      const normalized = (grade.score / maxScore) * 5 // normalize to 0-5 scale
      weightedSum += normalized * (weight / 100)
      totalWeight += weight
    })

    if (totalWeight === 0) return res.status(200).json({ finalGrade: null })

    // final grade on 0-5 scale
    const final = weightedSum // since weights sum to 100

    return res.status(200).json({ finalGrade: final })
  } catch (err: any) {
    console.error("teacher/calculate-final-grade error:", err)
    return res.status(500).json({ error: err.message || "Error interno" })
  }
}
