import type { NextApiRequest, NextApiResponse } from "next"
import { supabaseAdmin } from "../../../lib/supabase-client"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === "GET") {
      const { subjectId } = req.query
      let query = supabaseAdmin.from("assignments").select("*")
      if (subjectId) {
        query = query.eq("subject_id", subjectId)
      }
      const { data, error } = await query
      if (error) throw error
      const mapped = (data || []).map((row) => {
        const r = row as unknown as Record<string, unknown>
        return {
          id: r["id"] as number,
          subjectId: (r["subject_id"] ?? r["subjectId"]) as number,
          name: (r["name"] ?? "") as string,
          description: (r["description"] ?? "") as string,
          assignmentType: (r["assignment_type"] ?? r["assignmentType"]) as string,
          maxScore: (r["max_score"] ?? r["maxScore"]) as number,
          weight: (r["weight"] ?? null) as number | null,
          dueDate: (r["due_date"] ?? r["dueDate"]) as string,
        }
      })
      return res.status(200).json(mapped)
    }

    if (req.method === "POST") {
  const payload = req.body as Record<string, unknown>
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
          if (!maxErr && maxRow && (maxRow as unknown as Record<string, unknown>)["id"] !== undefined && (maxRow as unknown as Record<string, unknown>)["id"] !== null) {
            dbPayload.id = Number((maxRow as unknown as Record<string, unknown>)["id"]) + 1
          } else {
            dbPayload.id = 1
          }
        } catch {
          dbPayload.id = 1
        }
      }
      const { data, error } = await supabaseAdmin.from("assignments").insert(dbPayload).select().limit(1).single()
      if (error) throw error
      const row = data
      const mapped = {
        id: row.id,
        subjectId: row.subject_id ?? row.subjectId,
        name: row.name,
        description: row.description,
        assignmentType: row.assignment_type ?? row.assignmentType,
        maxScore: row.max_score ?? row.maxScore,
        weight: row.weight,
        dueDate: row.due_date ?? row.dueDate,
      }
      return res.status(201).json(mapped)
    }

    if (req.method === "PUT") {
  const { id, ...updates } = req.body as Record<string, unknown>
      if (!id) return res.status(400).json({ error: "Missing id" })
  const dbUpdates: Record<string, unknown> = {}
  const updatesRec = updates as Record<string, unknown>
  if (updatesRec["subjectId"] !== undefined) dbUpdates.subject_id = updatesRec["subjectId"]
  if (updatesRec["name"] !== undefined) dbUpdates.name = updatesRec["name"]
  if (updatesRec["description"] !== undefined) dbUpdates.description = updatesRec["description"]
  if (updatesRec["assignmentType"] !== undefined) dbUpdates.assignment_type = updatesRec["assignmentType"]
  if (updatesRec["maxScore"] !== undefined) dbUpdates.max_score = updatesRec["maxScore"]
  if (updatesRec["weight"] !== undefined) dbUpdates.weight = updatesRec["weight"]
  if (updatesRec["dueDate"] !== undefined) dbUpdates.due_date = updatesRec["dueDate"]

      const { data, error } = await supabaseAdmin.from("assignments").update(dbUpdates).eq("id", id).select().limit(1).single()
      if (error) throw error
      const row = data as unknown as Record<string, unknown>
      const mapped = {
        id: row["id"] as number,
        subjectId: (row["subject_id"] ?? row["subjectId"]) as number,
        name: (row["name"] ?? "") as string,
        description: (row["description"] ?? "") as string,
        assignmentType: (row["assignment_type"] ?? row["assignmentType"]) as string,
        maxScore: (row["max_score"] ?? row["maxScore"]) as number,
        weight: (row["weight"] ?? null) as number | null,
        dueDate: (row["due_date"] ?? row["dueDate"]) as string,
      }
      return res.status(200).json(mapped)
    }

    if (req.method === "DELETE") {
      const { id } = req.query
      if (!id) return res.status(400).json({ error: "Missing id" })
      const { error } = await supabaseAdmin.from("assignments").delete().eq("id", Number(id))
      if (error) throw error
      return res.status(204).end()
    }

    return res.status(405).json({ error: "Method not allowed" })
  } catch (err: unknown) {
    console.error("admin/assignments error:", err)
    const message = err instanceof Error ? err.message : String(err)
    return res.status(500).json({ error: message || "Error interno" })
  }
}
