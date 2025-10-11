import type { NextApiRequest, NextApiResponse } from "next"
import { supabaseAdmin } from "../../../lib/supabase-client"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === "GET") {
      const { data, error } = await supabaseAdmin.from("enrollments").select("*")
      if (error) throw error
      const mapped = (data || []).map((row: any) => ({
        id: row.id,
        studentId: row.student_id ?? row.studentId,
        subjectId: row.subject_id ?? row.subjectId,
        enrollmentDate: row.enrollment_date ?? row.enrollmentDate,
        status: row.status,
      }))
      return res.status(200).json(mapped)
    }

    if (req.method === "POST") {
      const payload = req.body
      const dbPayload = {
        student_id: payload.studentId,
        subject_id: payload.subjectId,
        enrollment_date: payload.enrollmentDate,
        status: payload.status,
      }
      const { data, error } = await supabaseAdmin.from("enrollments").insert(dbPayload).select().limit(1).single()
      if (error) throw error
      const row = data
      const mapped = {
        id: row.id,
        studentId: row.student_id ?? row.studentId,
        subjectId: row.subject_id ?? row.subjectId,
        enrollmentDate: row.enrollment_date ?? row.enrollmentDate,
        status: row.status,
      }
      return res.status(201).json(mapped)
    }

    if (req.method === "PUT") {
      const { id, ...updates } = req.body
      if (!id) return res.status(400).json({ error: "Missing id" })
      const dbUpdates: any = {}
      if (updates.studentId !== undefined) dbUpdates.student_id = updates.studentId
      if (updates.subjectId !== undefined) dbUpdates.subject_id = updates.subjectId
      if (updates.enrollmentDate !== undefined) dbUpdates.enrollment_date = updates.enrollmentDate
      if (updates.status !== undefined) dbUpdates.status = updates.status

      const { data, error } = await supabaseAdmin.from("enrollments").update(dbUpdates).eq("id", id).select().limit(1).single()
      if (error) throw error
      const row = data
      const mapped = {
        id: row.id,
        studentId: row.student_id ?? row.studentId,
        subjectId: row.subject_id ?? row.subjectId,
        enrollmentDate: row.enrollment_date ?? row.enrollmentDate,
        status: row.status,
      }
      return res.status(200).json(mapped)
    }

    if (req.method === "DELETE") {
      const { id } = req.query
      if (!id) return res.status(400).json({ error: "Missing id" })
      const { error } = await supabaseAdmin.from("enrollments").delete().eq("id", Number(id))
      if (error) throw error
      return res.status(204).end()
    }

    return res.status(405).json({ error: "Method not allowed" })
  } catch (err: any) {
    console.error("admin/enrollments error:", err)
    return res.status(500).json({ error: err.message || "Error interno" })
  }
}
