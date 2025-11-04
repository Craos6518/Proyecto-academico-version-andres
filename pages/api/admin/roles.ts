import type { NextApiRequest, NextApiResponse } from "next"
import { supabaseAdmin } from "../../../lib/supabase-client"
import { withAuth } from "../../../lib/middleware/auth"

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" })

    const { data, error } = await supabaseAdmin.from("roles").select("*")
    if (error) throw error

    return res.status(200).json(data ?? [])
  } catch (err: unknown) {
    console.error("admin/roles error:", err)
    const message = err instanceof Error ? err.message : String(err)
    return res.status(500).json({ error: message || "Error interno" })
  }
}

export default withAuth(handler, ["admin"])
