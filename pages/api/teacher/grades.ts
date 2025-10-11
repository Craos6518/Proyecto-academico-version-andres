import type { NextApiRequest, NextApiResponse } from "next"
import { supabaseAdmin } from "../../../lib/supabase-client"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === "GET") {
      const { subjectId, studentId } = req.query
      let query = supabaseAdmin.from("grades").select("*")
      if (subjectId) query = query.eq("subject_id", Number(subjectId))
      if (studentId) query = query.eq("student_id", Number(studentId))
      const { data, error } = await query
      if (error) throw error
      return res.status(200).json(data)
    }

    if (req.method === "POST") {
      const payload = req.body
      const dbPayload = {
        student_id: payload.studentId,
        assignment_id: payload.assignmentId,
        subject_id: payload.subjectId,
        score: payload.score,
        comments: payload.comments,
        graded_by: payload.gradedBy,
        graded_at: payload.gradedAt,
      }
      const { data, error } = await supabaseAdmin.from("grades").insert(dbPayload).select().limit(1).single()
      if (error) throw error
      return res.status(201).json(data)
    }

    if (req.method === "PUT") {
      const { id, ...updates } = req.body
      if (!id) return res.status(400).json({ error: "Missing id" })
      const dbUpdates: any = {}
      if (updates.score !== undefined) dbUpdates.score = updates.score
      if (updates.comments !== undefined) dbUpdates.comments = updates.comments
      const { data, error } = await supabaseAdmin.from("grades").update(dbUpdates).eq("id", id).select().limit(1).single()
      if (error) throw error
      return res.status(200).json(data)
    }

    if (req.method === "DELETE") {
      const { id } = req.query
      if (!id) return res.status(400).json({ error: "Missing id" })
      const { error } = await supabaseAdmin.from("grades").delete().eq("id", Number(id))
      if (error) throw error
      return res.status(204).end()
    }

    return res.status(405).json({ error: "Method not allowed" })
  } catch (err: any) {
    console.error("teacher/grades error:", err)
    return res.status(500).json({ error: err.message || "Error interno" })
  }
}
