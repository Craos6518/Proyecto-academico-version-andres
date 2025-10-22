import type { NextApiRequest, NextApiResponse } from "next"
import { supabaseAdmin } from "../../../lib/supabase-client"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === "GET") {
      const { data, error } = await supabaseAdmin.from("subjects").select("*")
      if (error) throw error
      // fetch users to map teacher names when missing
      const { data: usersData } = await supabaseAdmin.from("users").select("id, first_name, last_name, firstName, lastName")
      const usersMap: Record<number, any> = {}
      ;(usersData || []).forEach((u: any) => (usersMap[u.id] = u))

      const mapped = (data || []).map((row: any) => {
        const teacherId = row.teacher_id ?? row.teacherId ?? null
        const teacherFromRow = row.teacher_name ?? row.teacherName
        const teacherUser = teacherId ? usersMap[teacherId] : null
        let teacherName = ""
        if (teacherFromRow) {
          teacherName = teacherFromRow
        } else if (teacherUser) {
          const first = (teacherUser.first_name ?? teacherUser.firstName) || ""
          const last = (teacherUser.last_name ?? teacherUser.lastName) || ""
          teacherName = `${first} ${last}`.trim()
        }
        return {
          id: row.id,
          name: row.name,
          code: row.code,
          description: row.description,
          credits: row.credits,
          teacherId,
          teacherName,
        }
      })
      return res.status(200).json(mapped)
    }

    if (req.method === "POST") {
      const payload = req.body
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
          if (!maxErr && maxRow && (maxRow as any).id !== undefined && (maxRow as any).id !== null) {
            dbPayload.id = Number((maxRow as any).id) + 1
          } else {
            dbPayload.id = 1
          }
        } catch (e) {
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
      const { id, ...updates } = req.body
      if (!id) return res.status(400).json({ error: "Missing id" })
      const dbUpdates: any = {}
      if (updates.name !== undefined) dbUpdates.name = updates.name
      if (updates.code !== undefined) dbUpdates.code = updates.code
      if (updates.description !== undefined) dbUpdates.description = updates.description
      if (updates.credits !== undefined) dbUpdates.credits = updates.credits
      if (updates.teacherId !== undefined) dbUpdates.teacher_id = updates.teacherId
      if (updates.teacherName !== undefined) dbUpdates.teacher_name = updates.teacherName

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
      const { error } = await supabaseAdmin.from("subjects").delete().eq("id", Number(id))
      if (error) throw error
      return res.status(204).end()
    }

    return res.status(405).json({ error: "Method not allowed" })
  } catch (err: any) {
    console.error("admin/subjects error:", err)
    return res.status(500).json({ error: err.message || "Error interno" })
  }
}
