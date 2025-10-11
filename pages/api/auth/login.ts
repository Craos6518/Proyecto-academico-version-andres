import type { NextApiRequest, NextApiResponse } from "next"
import { supabaseAdmin } from "../../../lib/supabase-client"
import { generateJWT } from "../../../lib/auth"
import type { User } from "../../../lib/mock-data"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" })
  }

  const { username, password } = req.body
  if (!username || !password) {
    return res.status(400).json({ error: "Faltan credenciales" })
  }

  // Buscamos el usuario en la tabla users en Supabase
  const { data, error } = await supabaseAdmin.from("users").select("*").eq("username", username).limit(1).maybeSingle()

  if (error) {
    console.error("Login DB error:", error)
    return res.status(500).json({ error: "Error interno" })
  }

  const user = (data as any) || null

  if (!user || user.password !== password) {
    return res.status(401).json({ error: "Credenciales inválidas" })
  }

  // Normalizamos el campo 'role' para el token (soporta snake_case o camelCase)
  let role = (user.roleName ?? user.role_name ?? user.role ?? "").toLowerCase()
  if (user.username === "admin") role = "admin"

  const userWithRole = { ...user, role }
  const token = generateJWT(userWithRole as any)

  return res.status(200).json({
    user: {
      id: user.id,
      username: user.username,
      role: user.roleName ?? user.role_name ?? user.role,
      email: user.email,
      firstName: user.first_name ?? user.firstName,
      lastName: user.last_name ?? user.lastName,
    },
    token,
  })
}
