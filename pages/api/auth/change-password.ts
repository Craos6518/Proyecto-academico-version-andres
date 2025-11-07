import type { NextApiRequest, NextApiResponse } from "next"
import { withAuth } from "../../../lib/middleware/auth"
import { supabaseAdmin } from "../../../lib/supabase-client"
import bcrypt from "bcryptjs"

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" })

  const caller = (req as unknown as { user?: Record<string, unknown> }).user
  const callerRec = caller as Record<string, unknown> | undefined
  const callerId = callerRec && (callerRec["id"] ?? callerRec["user_id"] ?? callerRec["sub"] ?? callerRec["uid"])
  const id = callerId ? Number(callerId) : undefined

  if (!id) return res.status(401).json({ error: "Usuario no autenticado" })

  const { currentPassword, newPassword } = req.body || {}
  if (!currentPassword || !newPassword) return res.status(400).json({ error: "currentPassword y newPassword son requeridos" })

  try {
    // Use select('*') to avoid failing when `password_hash` column is not present in older schemas
    const { data: userRec, error: userErr } = await supabaseAdmin.from("users").select("*").eq("id", id).limit(1).maybeSingle()
    if (userErr) {
      console.error("change-password: db fetch error", userErr)
      return res.status(500).json({ error: "Error interno" })
    }
    if (!userRec) return res.status(404).json({ error: "Usuario no encontrado" })

    const storedHash = (userRec as Record<string, unknown>)["password_hash"] ?? (userRec as Record<string, unknown>)["password"]

    // Verify current password: support bcrypt hashes or legacy plaintext (migration)
    let match = false
    try {
      if (typeof storedHash === "string" && storedHash.startsWith("$2")) {
        match = bcrypt.compareSync(String(currentPassword), String(storedHash))
      } else {
        // legacy plaintext comparison (development/seed only)
        match = String(currentPassword) === String(storedHash)
      }
    } catch (e) {
      console.error("change-password: bcrypt compare error", e)
      match = false
    }

    if (!match) return res.status(401).json({ error: "Contraseña actual incorrecta" })

    // Hash new password and update DB (store in password_hash; optionally keep legacy password column for migration)
    const SALT_ROUNDS = 10
    const newHash = bcrypt.hashSync(String(newPassword), SALT_ROUNDS)

    try {
      const rec = userRec as Record<string, unknown>
      const updates: Record<string, unknown> = {}

      // Only update password_hash if the column exists in the fetched record (avoid PostgREST schema cache errors)
      if (Object.prototype.hasOwnProperty.call(rec, "password_hash")) {
        updates["password_hash"] = newHash
      }

      // Update legacy `password` column only if present in the record
      if (Object.prototype.hasOwnProperty.call(rec, "password")) {
        updates["password"] = String(newPassword)
      }

      // If no known password column is present, attempt to update `password` as a last resort
      if (Object.keys(updates).length === 0) {
        console.warn("change-password: no password column detected in users row; attempting to update `password` column as fallback")
        updates["password"] = String(newPassword)
      }

      const { error: updateErr } = await supabaseAdmin.from("users").update(updates).eq("id", id)
      if (updateErr) {
        console.error("change-password: update error", updateErr)
        return res.status(500).json({ error: "Error al actualizar la contraseña" })
      }

      return res.status(200).json({ success: true })
    } catch (e) {
      console.error("change-password: unexpected error", e)
      return res.status(500).json({ error: "Error interno" })
    }
  } catch (err) {
    console.error("change-password error:", err)
    return res.status(500).json({ error: "Error interno" })
  }
}

export default withAuth(handler)
