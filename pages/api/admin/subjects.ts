import type { NextApiRequest, NextApiResponse } from "next"
import { supabaseAdmin } from "../../../lib/supabase-client"
import type { User } from "../../../lib/types"
import { withAuth } from "../../../lib/middleware/auth"
import { normalizeRole } from "../../../lib/auth"

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === "GET") {
      // Allow role-aware access: admins/directors can list all subjects.
      // Teachers may request only their own subjects (either by omitting teacherId
      // or by passing ?teacherId=<theirId>). We enforce that a teacher cannot
      // request other teachers' subjects.
      const teacherIdParam = req.query.teacherId
      const reqUser = (req as unknown as { user?: Record<string, unknown> }).user
      const payloadRoleRaw = reqUser ? (reqUser["role"] ?? reqUser["roleName"] ?? reqUser["role_name"]) as string | undefined : undefined
      const payloadRole = normalizeRole(payloadRoleRaw)

      // Build base query
      let query = supabaseAdmin.from("subjects").select("*")

      if (teacherIdParam !== undefined) {
        const sid = Number(teacherIdParam)
        if (!Number.isNaN(sid)) {
          // If requester is a teacher, ensure they only request their own subjects
          if (payloadRole === "teacher") {
            const requesterId = reqUser && (reqUser["id"] ?? reqUser["sub"] ?? reqUser["userId"]) as number | string | undefined
            if (Number(requesterId) !== sid) {
              return res.status(403).json({ error: "No tienes permisos para acceder a materias de otro docente" })
            }
          }
          query = query.eq("teacher_id", sid)
        }
      } else if (payloadRole === "teacher") {
        // If no teacherId provided and requester is teacher, return only their subjects
        const requesterId = reqUser && (reqUser["id"] ?? reqUser["sub"] ?? reqUser["userId"]) as number | string | undefined
        if (requesterId) {
          query = query.eq("teacher_id", Number(requesterId))
        }
      }

      const { data, error } = await query
      if (error) throw error
      // fetch users to map teacher names when missing
  const { data: usersData } = await supabaseAdmin.from("users").select("id, first_name, last_name, firstName, lastName")
  const usersMap: Record<number, User | undefined> = {}
  ;(usersData || []).forEach((u: Record<string, unknown>) => (usersMap[(u as unknown as User).id] = u as unknown as User))

      const mapped = (data || []).map((row: Record<string, unknown>) => {
        const r = row as Record<string, unknown>
        const teacherId = (r["teacher_id"] ?? r["teacherId"]) as number | null | undefined
        const teacherFromRow = (r["teacher_name"] ?? r["teacherName"]) as string | undefined
        const teacherUser = teacherId ? usersMap[teacherId] : null
        let teacherName = ""
        if (teacherFromRow) {
          teacherName = teacherFromRow
        } else if (teacherUser) {
          const tu = teacherUser as unknown as Record<string, unknown>
          const first = (tu["first_name"] ?? (teacherUser as User).firstName ?? "") as string
          const last = (tu["last_name"] ?? (teacherUser as User).lastName ?? "") as string
          teacherName = `${first} ${last}`.trim()
        }
        return {
          id: r["id"] as number,
          name: (r["name"] ?? "") as string,
          code: (r["code"] ?? "") as string,
          description: (r["description"] ?? "") as string,
          credits: (r["credits"] ?? null) as number | null,
          teacherId: (teacherId ?? null) as number | null,
          teacherName,
        }
      })
      return res.status(200).json(mapped)
  }

    if (req.method === "POST") {
  const payload = req.body as Record<string, unknown>
      const dbPayload = {
        // For schemas that don't have auto-increment on id, avoid null id by generating one
        // (best-effort: compute max(id)+1). This keeps compatibility with the simple SQL seeds
        // that define `id integer primary key` without default.
        // If you have a service_role key and Postgres sequences, consider altering the table
        // to use SERIAL/IDENTITY instead.
        ...(payload.id ? { id: payload.id } : {}),
        name: payload.name,
        code: payload.code,
        description: payload.description,
        credits: payload.credits,
        teacher_id: payload.teacherId,
        teacher_name: payload.teacherName,
      }
      // If no id provided, try to allocate one using max(id)+1 to avoid null constraint
      if (!dbPayload.id) {
        try {
          const { data: maxRow, error: maxErr } = await supabaseAdmin.from("subjects").select("id").order("id", { ascending: false }).limit(1).maybeSingle()
          if (!maxErr && maxRow && (maxRow as unknown as Record<string, unknown>)["id"] !== undefined && (maxRow as unknown as Record<string, unknown>)["id"] !== null) {
            dbPayload.id = Number((maxRow as unknown as Record<string, unknown>)["id"]) + 1
          } else {
            dbPayload.id = 1
          }
        } catch {
          // fallback
          dbPayload.id = 1
        }
      }
      const { data, error } = await supabaseAdmin.from("subjects").insert(dbPayload).select().limit(1).single()
      if (error) throw error
      const row = data
      const mapped = {
        id: row.id,
        name: row.name,
        code: row.code,
        description: row.description,
        credits: row.credits,
        teacherId: row.teacher_id ?? row.teacherId ?? null,
        teacherName: row.teacher_name ?? row.teacherName ?? "",
      }
      return res.status(201).json(mapped)
    }

    if (req.method === "PUT") {
  const { id, ...updates } = req.body as Record<string, unknown>
      if (!id) return res.status(400).json({ error: "Missing id" })
  const dbUpdates: Record<string, unknown> = {}
  const updatesRec = updates as Record<string, unknown>
  if (updatesRec["name"] !== undefined) dbUpdates.name = updatesRec["name"]
  if (updatesRec["code"] !== undefined) dbUpdates.code = updatesRec["code"]
  if (updatesRec["description"] !== undefined) dbUpdates.description = updatesRec["description"]
  if (updatesRec["credits"] !== undefined) dbUpdates.credits = updatesRec["credits"]
  if (updatesRec["teacherId"] !== undefined) dbUpdates.teacher_id = updatesRec["teacherId"]
  if (updatesRec["teacherName"] !== undefined) dbUpdates.teacher_name = updatesRec["teacherName"]

      const { data, error } = await supabaseAdmin.from("subjects").update(dbUpdates).eq("id", id).select().limit(1).single()
      if (error) throw error
      const row = data
      const mapped = {
        id: row.id,
        name: row.name,
        code: row.code,
        description: row.description,
        credits: row.credits,
        teacherId: row.teacher_id ?? row.teacherId ?? null,
        teacherName: row.teacher_name ?? row.teacherName ?? "",
      }
      return res.status(200).json(mapped)
    }

    if (req.method === "DELETE") {
      const { id } = req.query
      if (!id) return res.status(400).json({ error: "Missing id" })
      const subjectId = Number(id)
      // Defensive: ensure id is a number
      if (Number.isNaN(subjectId)) return res.status(400).json({ error: "Invalid id" })

      // First, do not allow deleting a subject that has enrolled students
      try {
        const { data: enrollsData, count: enrollCount, error: enrollCountErr } = await supabaseAdmin
          .from("enrollments")
          .select("id", { count: "exact" })
          .eq("subject_id", subjectId)

        if (enrollCountErr) throw enrollCountErr
        if (enrollCount && enrollCount > 0) {
          return res.status(409).json({ error: "No se puede eliminar la materia: existen estudiantes matriculados" })
        }

        // No enrollments -> safe to remove assignments and grades related to this subject, then delete subject
        const { error: gradesErr } = await supabaseAdmin.from("grades").delete().eq("subject_id", subjectId)
        if (gradesErr) throw gradesErr

        const { error: assignmentsErr } = await supabaseAdmin.from("assignments").delete().eq("subject_id", subjectId)
        if (assignmentsErr) throw assignmentsErr

        const { error: subjErr } = await supabaseAdmin.from("subjects").delete().eq("id", subjectId)
        if (subjErr) throw subjErr

        return res.status(204).end()
      } catch (innerErr: unknown) {
        const msg = innerErr instanceof Error ? innerErr.message : String(innerErr)
        console.error("admin/subjects delete check error:", innerErr)
        return res.status(500).json({ error: msg || "Error al intentar eliminar la materia" })
      }
    }

      return res.status(405).json({ error: "Method not allowed" })
  } catch (err: unknown) {
    console.error("admin/subjects error:", err)
    const message = err instanceof Error ? err.message : String(err)
    return res.status(500).json({ error: message || "Error interno" })
  }
}

// Use withAuth with no static role whitelist so the handler can perform
// role-aware checks depending on request parameters (see GET logic above).
export default withAuth(handler, [])
