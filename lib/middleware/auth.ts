import type { NextApiRequest, NextApiResponse } from "next"
import { verifyJWT, normalizeRole } from "../../lib/auth"
import { supabaseAdmin } from "../supabase-client"

// Middleware para proteger rutas y verificar roles
export function withAuth(handler: Function, allowedRoles: string[] = []) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const authHeader = req.headers.authorization || req.headers.Authorization
    let token = typeof authHeader === "string" && authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : null

    // Si no viene Authorization header, intentar leer cookie HttpOnly `academic_auth_token`
    if (!token) {
      try {
        // Next.js API routes may expose parsed cookies in req.cookies
        const cookies = (req as any).cookies
        if (cookies && cookies.academic_auth_token) {
          token = cookies.academic_auth_token
        } else if (typeof req.headers.cookie === 'string') {
          // Fallback: parse cookie header manually
          const raw = req.headers.cookie || ''
          raw.split(';').forEach((c) => {
            const [k, ...v] = c.trim().split('=')
            if (k === 'academic_auth_token') token = decodeURIComponent(v.join('='))
          })
        }
      } catch (e) {
        // ignore cookie parsing errors
      }
    }

    if (!token) {
      return res.status(401).json({ error: "Token no proporcionado" })
    }

    // Intentamos verificar el JWT local (generado por generateJWT)
    const payload = verifyJWT(token)
    if (payload) {
      // normalizar roles permitidos para comparación
      const allowed = allowedRoles.map((r) => String(r).toLowerCase())
      const payloadRole = normalizeRole(payload.role)
      if (allowed.length > 0 && payloadRole && !allowed.includes(payloadRole)) {
        return res.status(403).json({ error: "No tienes permisos para acceder a esta ruta" })
      }
      ;(req as any).user = payload
      return handler(req, res)
    }

    // Fallback: si es un token de Supabase (access token), tratamos de obtener el usuario
    try {
      const { data: sbUser, error } = await supabaseAdmin.auth.getUser(token)
      if (error || !sbUser) {
        return res.status(401).json({ error: "Token inválido o expirado" })
      }

      // Obtenemos info adicional desde la tabla users
      const { data: dbUser } = await supabaseAdmin.from("users").select("*").eq("email", sbUser.user?.email).limit(1).maybeSingle()
      const rawRole = (dbUser as any)?.roleName ?? (dbUser as any)?.role ?? (dbUser as any)?.role_name ?? ""
      const role = normalizeRole(rawRole)

      const allowed = allowedRoles.map((r) => String(r).toLowerCase())
      if (allowed.length > 0 && role && !allowed.includes(role)) {
        return res.status(403).json({ error: "No tienes permisos para acceder a esta ruta" })
      }

      ;(req as any).user = { id: sbUser.user?.id, email: sbUser.user?.email, role, roleName: rawRole }
      return handler(req, res)
    } catch (err) {
      console.error("Auth middleware error:", err)
      return res.status(401).json({ error: "Token inválido o expirado" })
    }
  }
}
