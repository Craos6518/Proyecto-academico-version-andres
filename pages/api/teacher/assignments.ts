import type { NextApiRequest, NextApiResponse } from "next"
import { supabaseAdmin } from "../../../lib/supabase-client"
import { withAuth } from "../../../lib/middleware/auth"

function mapAssignment(row: Record<string, unknown>) {
  const id = Number(row["id"] ?? row["ID"] ?? 0)
  const subjectId = Number(row["subject_id"] ?? row["subjectId"] ?? 0)
  const name = String(row["name"] ?? "")
  const description = row["description"] ?? null
  const assignmentTypeRaw = row["assignment_type"] ?? row["assignmentType"] ?? null
  const assignmentType = assignmentTypeRaw != null ? String(assignmentTypeRaw) : null
  const maxScoreRaw = row["max_score"] ?? row["maxScore"] ?? null
  const maxScore = maxScoreRaw != null ? Number(maxScoreRaw) : null
  const weightRaw = row["weight"] ?? null
  const weight = weightRaw != null ? Number(weightRaw) : null
  const dueDate = row["due_date"] ?? row["dueDate"] ?? null
  const createdAt = row["created_at"] ?? row["createdAt"] ?? null
  const updatedAt = row["updated_at"] ?? row["updatedAt"] ?? null

  return {
    id,
    subjectId,
    name,
    description,
    assignmentType,
    maxScore,
    weight,
    dueDate,
    createdAt,
    updatedAt,
  }
}
export default withAuth(handler, ["teacher", "admin", "director"])

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === "GET") {
      const { subjectId } = req.query
      let query = supabaseAdmin.from("assignments").select("*")
      if (subjectId) query = query.eq("subject_id", Number(subjectId))
      const { data, error } = await query
      if (error) throw error
      return res.status(200).json((data || []).map(mapAssignment))
    }

    if (req.method === "POST") {
      const payload = req.body as Record<string, unknown>
      // Accept camelCase from client, convert to snake_case for DB
      const dbPayload = {
        ...(payload.id ? { id: payload.id } : {}),
        subject_id: payload.subjectId ?? payload.subject_id,
        name: payload.name ?? null,
        description: payload.description ?? null,
        assignment_type: payload.assignmentType ?? payload.assignment_type ?? null,
        max_score: payload.maxScore ?? payload.max_score ?? null,
        weight: payload.weight ?? null,
        due_date: payload.dueDate ?? payload.due_date ?? null,
      }
      if (!dbPayload.id) {
        try {
          const { data: maxRow, error: maxErr } = await supabaseAdmin.from("assignments").select("id").order("id", { ascending: false }).limit(1).maybeSingle()
          const maybeId = maxRow ? (maxRow as Record<string, unknown>)?.id : undefined
          if (!maxErr && maybeId !== undefined && maybeId !== null) {
            dbPayload.id = Number(maybeId) + 1
          } else {
            dbPayload.id = 1
          }
        } catch {
          dbPayload.id = 1
        }
      }
      const { data, error } = await supabaseAdmin.from("assignments").insert(dbPayload).select().limit(1).single()
      if (error) throw error
      return res.status(201).json(mapAssignment(data))
    }

    if (req.method === "PUT") {
      const { id, ...updates } = req.body as Record<string, unknown>
      if (!id) return res.status(400).json({ error: "Missing id" })
      const dbUpdates: Record<string, unknown> = {}
      if ((updates as Record<string, unknown>).subjectId !== undefined) dbUpdates.subject_id = (updates as Record<string, unknown>).subjectId
      if ((updates as Record<string, unknown>).name !== undefined) dbUpdates.name = (updates as Record<string, unknown>).name
      if ((updates as Record<string, unknown>).description !== undefined) dbUpdates.description = (updates as Record<string, unknown>).description
      if ((updates as Record<string, unknown>).assignmentType !== undefined) dbUpdates.assignment_type = (updates as Record<string, unknown>).assignmentType
      if ((updates as Record<string, unknown>).maxScore !== undefined) dbUpdates.max_score = (updates as Record<string, unknown>).maxScore
      if ((updates as Record<string, unknown>).weight !== undefined) dbUpdates.weight = (updates as Record<string, unknown>).weight
      if ((updates as Record<string, unknown>).dueDate !== undefined) dbUpdates.due_date = (updates as Record<string, unknown>).dueDate

      const { data, error } = await supabaseAdmin.from("assignments").update(dbUpdates).eq("id", id).select().limit(1).single()
      if (error) throw error
      return res.status(200).json(mapAssignment(data))
    }

    if (req.method === "DELETE") {
      const { id } = req.query
      if (!id) return res.status(400).json({ error: "Missing id" })
      const aid = Number(id)

      // Check if there are grades linked to this assignment
      const { data: linkedGrades, error: lgErr } = await supabaseAdmin.from("grades").select("id").eq("assignment_id", aid).limit(1)
      if (lgErr) throw lgErr
      if (linkedGrades && linkedGrades.length > 0) {
        return res.status(400).json({ error: "No se puede eliminar la evaluación porque tiene calificaciones registradas." })
      }

      // Authorization: si el caller es docente debe ser propietario de la materia
      const user = (req as unknown as { user?: unknown }).user as Record<string, unknown> | undefined
      if (user) {
        const roleRaw = user["role"] ?? user["roleName"] ?? user["role_name"]
        const role = String(roleRaw ?? "")
        // solo aplicar comprobación adicional para rol teacher
        if (role && role.toLowerCase().includes("teacher")) {
          // obtener subject_id de la asignación
          const { data: assignmentRow, error: aErr } = await supabaseAdmin.from("assignments").select("subject_id").eq("id", aid).limit(1).maybeSingle()
          if (aErr) throw aErr
          const subjectId = assignmentRow ? Number((assignmentRow as Record<string, unknown>)['subject_id'] ?? 0) : 0
          if (subjectId) {
            const { data: subjectRow, error: sErr } = await supabaseAdmin.from("subjects").select("teacher_id").eq("id", subjectId).limit(1).maybeSingle()
            if (sErr) throw sErr
            const teacherId = subjectRow ? Number((subjectRow as Record<string, unknown>)['teacher_id'] ?? 0) : 0
            const callerId = Number(user["id"] ?? user["userId"] ?? 0)
            if (teacherId && callerId && teacherId !== callerId) {
              return res.status(403).json({ error: "No tienes permiso para eliminar esta evaluación" })
            }
          }
        }
      }

      const { error } = await supabaseAdmin.from("assignments").delete().eq("id", aid)
      if (error) throw error
      return res.status(204).end()
    }

    return res.status(405).json({ error: "Method not allowed" })
  } catch (err: unknown) {
    console.error("teacher/assignments error:", err)
    const message = (typeof err === 'object' && err !== null && 'message' in err) ? String((err as { message?: unknown }).message) : String(err ?? 'Error interno')
    return res.status(500).json({ error: message })
  }
}
