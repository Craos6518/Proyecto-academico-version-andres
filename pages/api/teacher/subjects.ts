import type { NextApiRequest, NextApiResponse } from "next"
import { withAuth } from "../../../lib/middleware/auth"
import { supabaseAdmin } from "../../../lib/supabase-client"

export default withAuth(async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    if (req.method !== "GET") return res.status(405).json({ error: "Método no permitido" })

    const caller = (req as unknown as { user?: Record<string, unknown> }).user as Record<string, unknown> | undefined
    const callerRole = caller ? String(caller["role"] ?? caller["roleName"] ?? "") : ""

    // If caller is teacher, use their id as source of truth
    let teacherId: number | undefined = undefined
    if (callerRole === "teacher") {
      teacherId = Number(caller?.["id"] ?? caller?.["userId"] ?? 0)
      if (!teacherId) return res.status(401).json({ error: "Usuario no autenticado" })
    } else {
      // Allow admin/director to pass ?teacherId= to fetch for a specific teacher
      const qtid = req.query.teacherId
      if (qtid) teacherId = Number(qtid)
    }

    if (!teacherId) return res.status(400).json({ error: "Falta teacherId" })

    const { data, error } = await supabaseAdmin.from("subjects").select("id, name, code, description, credits, teacher_id").eq("teacher_id", teacherId)
    if (error) throw error

    const mapped = (data || []).map((r: unknown) => {
      const row = r as Record<string, unknown>
      return {
        id: Number(row["id"] ?? 0),
        name: String(row["name"] ?? ""),
        code: String(row["code"] ?? ""),
        description: String(row["description"] ?? ""),
        credits: row["credits"] === null || row["credits"] === undefined ? null : Number(row["credits"]),
        teacherId: row["teacher_id"] ?? row["teacherId"] ?? null,
      }
    })

    return res.status(200).json(mapped)
  } catch (err: unknown) {
    console.error("teacher/subjects error:", err)
    const message = err instanceof Error ? err.message : String(err)
    return res.status(500).json({ error: message || "Error interno" })
  }
}, ["teacher", "admin", "director"])
