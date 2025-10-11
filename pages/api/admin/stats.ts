import type { NextApiRequest, NextApiResponse } from "next"
import { supabaseAdmin } from "../../../lib/supabase-client"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "Método no permitido" })

  try {
    const [{ count: totalUsers }, { count: totalSubjects }, { count: totalStudents }, { count: totalTeachers }] = await Promise.all([
      supabaseAdmin.from("users").select("id", { count: "estimated", head: true }),
      supabaseAdmin.from("subjects").select("id", { count: "estimated", head: true }),
      supabaseAdmin.from("users").select("id", { count: "estimated", head: true }).eq("role_id", 4),
      supabaseAdmin.from("users").select("id", { count: "estimated", head: true }).eq("role_id", 3),
    ])

    return res.status(200).json({
      totalUsers: totalUsers ?? 0,
      totalSubjects: totalSubjects ?? 0,
      totalStudents: totalStudents ?? 0,
      totalTeachers: totalTeachers ?? 0,
    })
  } catch (err) {
    console.error("stats error:", err)
    return res.status(500).json({ error: "Error interno" })
  }
}
