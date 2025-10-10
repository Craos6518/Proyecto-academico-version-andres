import type { NextApiRequest, NextApiResponse } from "next"
import { apiClient } from "../../../lib/api-client"
import { generateJWT } from "../../../lib/auth"
import type { User } from "../../../lib/mock-data"

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" })
  }

  const { username, password } = req.body
  if (!username || !password) {
    return res.status(400).json({ error: "Faltan credenciales" })
  }

  const users: User[] = apiClient.getUsers()
  const user = users.find(
    (u) => u.username === username && u.password === password
  )

  if (!user) {
    return res.status(401).json({ error: "Credenciales inválidas" })
  }

  // Normalizamos el campo 'role' para el token
  let role = user.roleName.toLowerCase()
  if (user.username === "admin") role = "admin"
  const userWithRole = { ...user, role }
  const token = generateJWT(userWithRole)

  return res.status(200).json({
    user: {
      id: user.id,
      username: user.username,
      role: user.roleName,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    },
    token,
  })
}
