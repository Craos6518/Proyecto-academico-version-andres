import type { NextApiRequest, NextApiResponse } from "next"
import { supabaseAdmin } from "../../../lib/supabase-client"
import { withAuth } from "../../../lib/middleware/auth"
import { normalizeRole } from "../../../lib/auth"

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === "GET") {
      // Support optional filtering by subjectId query param
      const subjectIdParam = req.query.subjectId

      // Allow role-aware access: admin/director may list all enrollments.
      // Teachers can request enrollments for a specific subject only if they
      // are the teacher of that subject.
      const reqUser = (req as unknown as { user?: Record<string, unknown> }).user
      const payloadRoleRaw = reqUser ? (reqUser["role"] ?? reqUser["roleName"] ?? reqUser["role_name"]) as string | undefined : undefined
      const payloadRole = normalizeRole(payloadRoleRaw)

      let query = supabaseAdmin.from("enrollments").select("*")

      if (subjectIdParam !== undefined) {
        const sid = Number(subjectIdParam)
        if (!Number.isNaN(sid)) {
          // If requester is a teacher, verify they are the owner of the subject
          if (payloadRole === "teacher") {
            const { data: subjectRow, error: subjErr } = await supabaseAdmin.from("subjects").select("teacher_id").eq("id", sid).maybeSingle()
            if (subjErr) throw subjErr
            const teacherIdOfSubject = subjectRow ? (subjectRow["teacher_id"] ?? subjectRow["teacherId"]) as number | undefined : undefined
            const requesterId = reqUser && (reqUser["id"] ?? reqUser["sub"] ?? reqUser["userId"]) as number | string | undefined
            if (!teacherIdOfSubject || Number(requesterId) !== Number(teacherIdOfSubject)) {
              return res.status(403).json({ error: "No tienes permisos para ver inscripciones de esta materia" })
            }
          }
          query = query.eq("subject_id", sid)
        }
      } else if (payloadRole === "teacher") {
        // If a teacher requests enrollments but didn't pass a subjectId, disallow listing all enrollments
        return res.status(400).json({ error: "Se requiere subjectId para que un docente consulte inscripciones" })
      }

      const { data, error } = await query
      if (error) throw error
      const mapped = (data || []).map((row: Record<string, unknown>) => {
        const r = row as Record<string, unknown>
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

// Use withAuth with no static whitelist and perform role-aware checks inside
export default withAuth(handler, [])
