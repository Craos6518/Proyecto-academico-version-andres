import type { NextApiRequest, NextApiResponse } from "next"
import { supabaseAdmin } from "../../../lib/supabase-client"

type Assignment = {
  id?: number
  weight?: number
  max_score?: number
  maxScore?: number
}

type Grade = {
  assignment_id?: number
  score?: number
}

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

    // Map assignments by id (typed)
    const assignMap: Record<number, Assignment> = {}
    ;(assignments || []).forEach((aRaw: unknown) => {
      const a = aRaw as Assignment
      if (a?.id !== undefined) assignMap[Number(a.id)] = a
    })

    // Calculate weighted average
    let totalWeight = 0
    let weightedSum = 0

    ;(grades || []).forEach((gradeRaw: unknown) => {
      const grade = gradeRaw as Grade
      const a = grade.assignment_id !== undefined ? assignMap[Number(grade.assignment_id)] : undefined
      if (!a) return
      const weight = Number(a.weight ?? 0)
      const maxScore = Number(a.max_score ?? a.maxScore ?? 5)
      const sc = Number(grade.score ?? 0)
      const normalized = maxScore > 0 ? (sc / maxScore) * 5 : 0 // normalize to 0-5 scale
      weightedSum += normalized * (weight / 100)
      totalWeight += weight
    })

    if (totalWeight === 0) return res.status(200).json({ finalGrade: null })

    // final grade on 0-5 scale (weights are percent)
    const final = weightedSum

    return res.status(200).json({ finalGrade: final })
  } catch (err: unknown) {
    console.error("teacher/calculate-final-grade error:", err)
    const message = err instanceof Error ? err.message : String(err)
    return res.status(500).json({ error: message || "Error interno" })
  }
}
