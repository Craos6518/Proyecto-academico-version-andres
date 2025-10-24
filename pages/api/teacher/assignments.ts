import type { NextApiRequest, NextApiResponse } from "next"
import { supabaseAdmin } from "../../../lib/supabase-client"

function mapAssignment(row: any) {
  return {
    id: row.id,
    subjectId: row.subject_id ?? row.subjectId,
    name: row.name,
    description: row.description,
    assignmentType: row.assignment_type ?? row.assignmentType,
    maxScore: row.max_score ?? row.maxScore,
    weight: row.weight,
    dueDate: row.due_date ?? row.dueDate,
    createdAt: row.created_at ?? row.createdAt,
    updatedAt: row.updated_at ?? row.updatedAt,
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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
      const payload = req.body
      // Accept camelCase from client, convert to snake_case for DB
      const dbPayload = {
        ...(payload.id ? { id: payload.id } : {}),
        subject_id: payload.subjectId,
        name: payload.name,
        description: payload.description,
        assignment_type: payload.assignmentType,
        max_score: payload.maxScore,
        weight: payload.weight,
        due_date: payload.dueDate,
      }
      if (!dbPayload.id) {
        try {
          const { data: maxRow, error: maxErr } = await supabaseAdmin.from("assignments").select("id").order("id", { ascending: false }).limit(1).maybeSingle()
          if (!maxErr && maxRow && (maxRow as any).id !== undefined && (maxRow as any).id !== null) {
            dbPayload.id = Number((maxRow as any).id) + 1
          } else {
            dbPayload.id = 1
          }
        } catch (e) {
          dbPayload.id = 1
        }
      }
      const { data, error } = await supabaseAdmin.from("assignments").insert(dbPayload).select().limit(1).single()
      if (error) throw error
      return res.status(201).json(mapAssignment(data))
    }

    if (req.method === "PUT") {
      const { id, ...updates } = req.body
      if (!id) return res.status(400).json({ error: "Missing id" })
      const dbUpdates: any = {}
      if (updates.subjectId !== undefined) dbUpdates.subject_id = updates.subjectId
      if (updates.name !== undefined) dbUpdates.name = updates.name
      if (updates.description !== undefined) dbUpdates.description = updates.description
      if (updates.assignmentType !== undefined) dbUpdates.assignment_type = updates.assignmentType
      if (updates.maxScore !== undefined) dbUpdates.max_score = updates.maxScore
      if (updates.weight !== undefined) dbUpdates.weight = updates.weight
      if (updates.dueDate !== undefined) dbUpdates.due_date = updates.dueDate

      const { data, error } = await supabaseAdmin.from("assignments").update(dbUpdates).eq("id", id).select().limit(1).single()
      if (error) throw error
      return res.status(200).json(mapAssignment(data))
    }

    if (req.method === "DELETE") {
      const { id } = req.query
      if (!id) return res.status(400).json({ error: "Missing id" })
      const { error } = await supabaseAdmin.from("assignments").delete().eq("id", Number(id))
      if (error) throw error
      return res.status(204).end()
    }

    return res.status(405).json({ error: "Method not allowed" })
  } catch (err: any) {
    console.error("teacher/assignments error:", err)
    return res.status(500).json({ error: err.message || "Error interno" })
  }
}
