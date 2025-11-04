import type { NextApiRequest, NextApiResponse } from "next"
import { supabaseAdmin } from "../../../lib/supabase-client"
import type { User } from "../../../lib/types"
import { withAuth } from "../../../lib/middleware/auth"

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === "GET") {
      const { data, error } = await supabaseAdmin.from("subjects").select("*")
      if (error) throw error
      // fetch users to map teacher names when missing
  const { data: usersData } = await supabaseAdmin.from("users").select("id, first_name, last_name, firstName, lastName")
  const usersMap: Record<number, User | undefined> = {}
  ;(usersData || []).forEach((u) => (usersMap[(u as unknown as User).id] = u as unknown as User))

      const mapped = (data || []).map((row) => {
        const r = row as unknown as Record<string, unknown>
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
      const { error } = await supabaseAdmin.from("subjects").delete().eq("id", Number(id))
      if (error) throw error
      return res.status(204).end()
    }

      return res.status(405).json({ error: "Method not allowed" })
  } catch (err: unknown) {
    console.error("admin/subjects error:", err)
    const message = err instanceof Error ? err.message : String(err)
    return res.status(500).json({ error: message || "Error interno" })
  }
}

export default withAuth(handler, ["admin", "director"])
