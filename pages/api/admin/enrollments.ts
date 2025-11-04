import type { NextApiRequest, NextApiResponse } from "next"
import { supabaseAdmin } from "../../../lib/supabase-client"
import { withAuth } from "../../../lib/middleware/auth"

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === "GET") {
      const { data, error } = await supabaseAdmin.from("enrollments").select("*")
      if (error) throw error
      const mapped = (data || []).map((row) => {
        const r = row as unknown as Record<string, unknown>
        return {
          id: r["id"] as number,
          studentId: (r["student_id"] ?? r["studentId"]) as number,
          subjectId: (r["subject_id"] ?? r["subjectId"]) as number,
          enrollmentDate: (r["enrollment_date"] ?? r["enrollmentDate"]) as string,
          status: (r["status"] ?? "") as string,
        }
      })
      return res.status(200).json(mapped)
    }

    if (req.method === "POST") {
      const payload = req.body as Record<string, unknown>
      const dbPayload = {
        ...(payload.id ? { id: payload.id } : {}),
        student_id: payload.studentId,
        subject_id: payload.subjectId,
        enrollment_date: payload.enrollmentDate,
        status: payload.status,
      }
      if (!dbPayload.id) {
        try {
          const { data: maxRow, error: maxErr } = await supabaseAdmin.from("enrollments").select("id").order("id", { ascending: false }).limit(1).maybeSingle()
            if (!maxErr && maxRow && (maxRow as unknown as Record<string, unknown>)["id"] !== undefined && (maxRow as unknown as Record<string, unknown>)["id"] !== null) {
              dbPayload.id = Number((maxRow as unknown as Record<string, unknown>)["id"]) + 1
          } else {
            dbPayload.id = 1
          }
        } catch {
          dbPayload.id = 1
        }
      }
      const { data, error } = await supabaseAdmin.from("enrollments").insert(dbPayload).select().limit(1).single()
      if (error) throw error
      const row = data as unknown as Record<string, unknown>
      const mapped = {
        id: row["id"] as number,
        studentId: (row["student_id"] ?? row["studentId"]) as number,
        subjectId: (row["subject_id"] ?? row["subjectId"]) as number,
        enrollmentDate: (row["enrollment_date"] ?? row["enrollmentDate"]) as string,
        status: (row["status"] ?? "") as string,
      }
      return res.status(201).json(mapped)
    }

    if (req.method === "PUT") {
  const { id, ...updates } = req.body as Record<string, unknown>
      if (!id) return res.status(400).json({ error: "Missing id" })
  const dbUpdates: Record<string, unknown> = {}
  const updatesRec = updates as Record<string, unknown>
  if (updatesRec["studentId"] !== undefined) dbUpdates.student_id = updatesRec["studentId"]
  if (updatesRec["subjectId"] !== undefined) dbUpdates.subject_id = updatesRec["subjectId"]
  if (updatesRec["enrollmentDate"] !== undefined) dbUpdates.enrollment_date = updatesRec["enrollmentDate"]
  if (updatesRec["status"] !== undefined) dbUpdates.status = updatesRec["status"]

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
  } catch (err: unknown) {
    console.error("admin/enrollments error:", err)
    const message = err instanceof Error ? err.message : String(err)
    return res.status(500).json({ error: message || "Error interno" })
  }
}

export default withAuth(handler, ["admin"])
