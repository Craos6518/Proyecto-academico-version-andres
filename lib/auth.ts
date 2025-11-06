import type { User } from "./types"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
// Import dinámico de `supabase-api-client` cuando sea necesario en runtime (server-only)

const AUTH_STORAGE_KEY = "academic_auth_user"
const AUTH_TOKEN_KEY = "academic_auth_token"

// Clave secreta para firmar los JWT (en producción usar variable de entorno)
const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey"

// Tiempo de expiración del token
const JWT_EXPIRES_IN = "2h"

export interface AuthUser extends User {
  // token is optional on the client side. Server will set HttpOnly cookie.
  token?: string
}

// Genera un JWT para el usuario
export function generateJWT(user: User) {
  // Normalizar rol antes de firmar
  const urec = user as unknown as Record<string, unknown>
  const rawRole = (urec["role"] ?? urec["roleName"] ?? urec["role_name"]) as string | undefined
  const roleKey = normalizeRole(rawRole)
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      role: roleKey,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  )
}

// Valida y decodifica un JWT
export function verifyJWT(token: string): null | { id: string; username: string; role: string } {
  try {
    return jwt.verify(token, JWT_SECRET) as { id: string; username: string; role: string }
  } catch {
    return null
  }
}

// Normaliza distintos nombres de rol (español/ingles/underscore) a claves canónicas
export function normalizeRole(value: string | undefined | null): string {
  if (!value) return ""
  const v = String(value).trim().toLowerCase()
  // mapeos comunes
  if (["admin", "administrador", "administrador(a)", "administradorx"].includes(v)) return "admin"
  if (["director", "direcctor", "head", "headmaster"].includes(v)) return "director"
  if (["teacher", "profesor", "profesora", "docente", "profesor(a)"].includes(v)) return "teacher"
  if (["student", "estudiante", "alumno", "alumna"].includes(v)) return "student"
  // role_name snake_case or other forms
  if (v === "role_admin" || v === "role_admin") return "admin"
  // fallback: devuelve la cadena limpia (sin espacios)
  return v
}

export const authService = {
  // Legacy sync login (kept for compatibility with parts of the app that still use it)
  login: (username: string, password: string): AuthUser | null => {
    // Legacy sync login removed: after migration use `loginAsync` / Supabase Auth.
    void username
    void password
    return null
  },

  // Logout local (noop). Use Supabase Auth for real session management.
  logout: () => {
    return
  },

  // Legacy sync getter (deprecated)
  // (Legacy getter removed) use the persisted `getCurrentUser` implemented below which reads localStorage

  isAuthenticated: (): boolean => {
    return authService.getCurrentUser() !== null
  },

  hasRole: (roleName: string): boolean => {
    const user = authService.getCurrentUser()
    if (!user) return false
    try {
      const userRole = normalizeRole((user as unknown as Record<string, unknown>)["role"] as string | undefined ?? ((user as unknown as Record<string, unknown>)["roleName"] as string | undefined))
      return userRole === normalizeRole(roleName)
    } catch {
      return false
    }
  },

  updateCurrentUser: (updates: Partial<User>): void => {
    // noop: updates should be performed via supabaseApiClient.updateUser
    void updates
    return
  },

  // Persistencia en cliente (localStorage)
  setCurrentUser: (user: AuthUser | null) => {
    if (typeof window === "undefined") return
    try {
      if (!user) {
        localStorage.removeItem(AUTH_STORAGE_KEY)
      } else {
        // Store only non-sensitive user fields. Token should not be stored in localStorage.
        const safeUser = { ...user }
        const su = safeUser as Record<string, unknown>
        if ("token" in su) delete su["token"]

        // Normalizar rol y añadir campo canonical `role` para comparaciones robustas
        try {
          const rawRole = (su["role"] ?? su["roleName"] ?? su["role_name"]) as string | undefined
          const canonical = normalizeRole(rawRole)
          su["role"] = canonical
          if (!su["roleName"]) su["roleName"] = rawRole ?? ""
        } catch {
          // noop
        }

        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(safeUser))
      }
    } catch {
      // noop
    }
  },

  getCurrentUser: (): AuthUser | null => {
    if (typeof window === "undefined") return null
    try {
  const raw = localStorage.getItem(AUTH_STORAGE_KEY)
      if (!raw) return null
      return JSON.parse(raw) as AuthUser
    } catch {
      return null
    }
  },

  // Token management is intentionally removed from client-side storage.
  // The server should use the HttpOnly cookie `academic_auth_token` as the source of truth.
  setAuthToken: (_token: string | null) => {
    // noop in client: cookie HttpOnly is set by server on login
    void _token
    return
  },

  getAuthToken: (): string | null => {
    // Do not expose HttpOnly cookie to JS. Return null to encourage server-side auth via cookie.
    return null
  },

  logoutClient: () => {
    if (typeof window === "undefined") return
    try {
      localStorage.removeItem(AUTH_TOKEN_KEY)
      localStorage.removeItem(AUTH_STORAGE_KEY)
    } catch {
      // noop
    }
  },

  // New async methods that use Supabase (server/async flows)
  loginAsync: async (username: string, password: string) => {
    return await loginWithSupabase(username, password)
  },

  getCurrentUserAsync: async (idOrEmail: number | string) => {
    // Busca por id o por email según tipo
    if (!idOrEmail) return null
    try {
      // Import dinámico para evitar bundling en cliente
      const { supabaseApiClient } = await import("./supabase-api-client")
      if (typeof idOrEmail === "number") {
        return await supabaseApiClient.getUserById(idOrEmail as number)
      }
      // por email
      const users = await supabaseApiClient.getUsers()
      return users.find((u) => u.email === idOrEmail) ?? null
    } catch (err: unknown) {
      console.error("getCurrentUserAsync error:", err)
      return null
    }
  },
}

// Nueva función async para login usando Supabase como fuente de usuarios.
// No reemplaza automáticamente el `authService.login` para evitar romper consumidores.
export async function loginWithSupabase(username: string, password: string) {
  const { supabaseApiClient } = await import("./supabase-api-client")
  const user = await supabaseApiClient.getUserByUsername(username)
  if (!user) return null
  const ru = user as unknown as Record<string, unknown>
  const hash = (ru["password_hash"] ?? ru["passwordHash"] ?? ru["password"]) as string | undefined
  if (!hash) return null

  try {
    const match = bcrypt.compareSync(password, String(hash))
    if (!match) return null
  } catch (err: unknown) {
    console.error("bcrypt compare error:", err)
    return null
  }

  const authUser: AuthUser = {
    ...user,
    token: `supabase_token_${user.id}_${Date.now()}`,
  }

  return authUser
}
