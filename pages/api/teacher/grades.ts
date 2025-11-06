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
      // Normalize rows to a typed-friendly shape
      const rows = (data || []) as Array<Record<string, unknown>>
      const mapped = rows.map((r) => ({
        id: Number(r["id"] ?? 0),
        studentId: Number(r["student_id"] ?? r["studentId"] ?? 0),
        assignmentId: Number(r["assignment_id"] ?? r["assignmentId"] ?? 0),
        subjectId: Number(r["subject_id"] ?? r["subjectId"] ?? 0),
        score: Number(r["score"] ?? 0),
        gradedBy: Number(r["graded_by"] ?? r["gradedBy"] ?? 0),
        gradedAt: r["graded_at"] ?? r["gradedAt"] ?? null,
        comments: r["comments"] ?? r["comment"] ?? null,
      }))
      return res.status(200).json(mapped)
    }

    if (req.method === "POST") {
      const payload = req.body as Record<string, unknown>
      // Build payload without forcing id – let the DB assign primary key to avoid race conditions
      const dbPayload = {
        student_id: payload.studentId ?? payload.student_id,
        assignment_id: payload.assignmentId ?? payload.assignment_id,
        subject_id: payload.subjectId ?? payload.subject_id,
        score: payload.score ?? payload.score,
        comments: payload.comments ?? payload.comment ?? null,
        graded_by: payload.gradedBy ?? payload.graded_by ?? null,
        graded_at: payload.gradedAt ?? payload.graded_at ?? null,
      }

      let { data, error } = await supabaseAdmin.from("grades").insert(dbPayload).select().limit(1).single()
      // handle possible sequence mismatch where nextval returns an id that already exists
      if (error && (error as any).code === "23505") {
        console.error("teacher/grades insert conflict, attempting one retry to repair sequence", error)
        try {
          const { data: maxRow, error: maxErr } = await supabaseAdmin
            .from("grades")
            .select("id")
            .order("id", { ascending: false })
            .limit(1)
            .maybeSingle()
          const maybeId = maxRow ? (maxRow as Record<string, unknown>)?.id : undefined
          const nextId = maybeId !== undefined && maybeId !== null ? Number(maybeId) + 1 : 1
          // try inserting with explicit id = nextId
          const { data: data2, error: error2 } = await supabaseAdmin
            .from("grades")
            .insert({ ...dbPayload, id: nextId })
            .select()
            .limit(1)
            .single()
          if (error2) throw error2
          data = data2
          error = null
        } catch (err2) {
          // if retry fails, propagate original or retry error
          console.error("teacher/grades retry insert failed", err2)
          throw err2
        }
      }
      if (error) throw error
      const row = data as Record<string, unknown>
      return res.status(201).json({
        id: Number(row["id"] ?? 0),
        studentId: Number(row["student_id"] ?? row["studentId"] ?? 0),
        assignmentId: Number(row["assignment_id"] ?? row["assignmentId"] ?? 0),
        subjectId: Number(row["subject_id"] ?? row["subjectId"] ?? 0),
        score: Number(row["score"] ?? 0),
        gradedBy: Number(row["graded_by"] ?? row["gradedBy"] ?? 0),
        gradedAt: row["graded_at"] ?? row["gradedAt"] ?? null,
        comments: row["comments"] ?? row["comment"] ?? null,
      })
    }

    if (req.method === "PUT") {
      const { id, ...updates } = req.body as Record<string, unknown>
      if (!id) return res.status(400).json({ error: "Missing id" })
      const dbUpdates: Record<string, unknown> = {}
      if ((updates as Record<string, unknown>).score !== undefined) dbUpdates.score = (updates as Record<string, unknown>).score
      if ((updates as Record<string, unknown>).comments !== undefined) dbUpdates.comments = (updates as Record<string, unknown>).comments
      const { data, error } = await supabaseAdmin.from("grades").update(dbUpdates).eq("id", id).select().limit(1).single()
      if (error) throw error
      const row = data as Record<string, unknown>
      return res.status(200).json({
        id: Number(row["id"] ?? 0),
        studentId: Number(row["student_id"] ?? row["studentId"] ?? 0),
        assignmentId: Number(row["assignment_id"] ?? row["assignmentId"] ?? 0),
        subjectId: Number(row["subject_id"] ?? row["subjectId"] ?? 0),
        score: Number(row["score"] ?? 0),
        gradedBy: Number(row["graded_by"] ?? row["gradedBy"] ?? 0),
        gradedAt: row["graded_at"] ?? row["gradedAt"] ?? null,
        comments: row["comments"] ?? row["comment"] ?? null,
      })
    }

    if (req.method === "DELETE") {
      const { id } = req.query
      if (!id) return res.status(400).json({ error: "Missing id" })
      const { error } = await supabaseAdmin.from("grades").delete().eq("id", Number(id))
      if (error) throw error
      return res.status(204).end()
    }

    return res.status(405).json({ error: "Method not allowed" })
  } catch (err: unknown) {
    console.error("teacher/grades error:", err)
    const message = (typeof err === 'object' && err !== null && 'message' in err) ? String((err as { message?: unknown }).message) : String(err ?? 'Error interno')
    return res.status(500).json({ error: message })
  }
}
