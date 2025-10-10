import type { NextApiRequest, NextApiResponse } from "next"
import { verifyJWT } from "../../lib/auth"

// Middleware para proteger rutas y verificar roles
export function withAuth(handler: Function, allowedRoles: string[] = []) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const authHeader = req.headers.authorization || req.headers.Authorization
    const token = typeof authHeader === "string" && authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : null

    if (!token) {
      return res.status(401).json({ error: "Token no proporcionado" })
    }

    const payload = verifyJWT(token)
    if (!payload) {
      return res.status(401).json({ error: "Token inválido o expirado" })
    }

    // Verificación de roles si se especifican
    if (allowedRoles.length > 0 && !allowedRoles.includes(payload.role)) {
      return res.status(403).json({ error: "No tienes permisos para acceder a esta ruta" })
    }

    // Adjunta el usuario al request para uso posterior
    (req as any).user = payload
    return handler(req, res)
  }
}
