"use client"

import { apiClient } from "./api-client"
import type { User } from "./mock-data"
import jwt from "jsonwebtoken"
import { supabaseApiClient } from "./supabase-api-client"

const AUTH_STORAGE_KEY = "academic_auth_user"

// Clave secreta para firmar los JWT (en producción usar variable de entorno)
const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey"

// Tiempo de expiración del token
const JWT_EXPIRES_IN = "2h"

export interface AuthUser extends User {
  token: string
}

// Genera un JWT para el usuario
export function generateJWT(user: User) {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  )
}

// Valida y decodifica un JWT
export function verifyJWT(token: string): null | { id: string; username: string; role: string } {
  try {
    return jwt.verify(token, JWT_SECRET) as { id: string; username: string; role: string }
  } catch (err) {
    return null
  }
}

export const authService = {
  // Legacy sync login (kept for compatibility with parts of the app that still use it)
  login: (username: string, password: string): AuthUser | null => {
    const users = apiClient.getUsers()
    const user = users.find((u) => u.username === username)

    if (user && user.password === password) {
      const authUser: AuthUser = {
        ...user,
        token: `mock_token_${user.id}_${Date.now()}`,
      }

      // Store in localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authUser))
      }

      return authUser
    }

    return null
  },

  // Logout local
  logout: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(AUTH_STORAGE_KEY)
    }
  },

  // Legacy sync getter
  getCurrentUser: (): AuthUser | null => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY)
      if (stored) {
        try {
          return JSON.parse(stored)
        } catch {
          return null
        }
      }
    }
    return null
  },

  isAuthenticated: (): boolean => {
    return authService.getCurrentUser() !== null
  },

  hasRole: (roleName: string): boolean => {
    const user = authService.getCurrentUser()
    return user?.roleName === roleName
  },

  updateCurrentUser: (updates: Partial<User>): void => {
    const currentUser = authService.getCurrentUser()
    if (currentUser && typeof window !== "undefined") {
      const updatedUser = { ...currentUser, ...updates }
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updatedUser))
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
      if (typeof idOrEmail === "number") {
        return await supabaseApiClient.getUserById(idOrEmail as number)
      }
      // por email
      const users = await supabaseApiClient.getUsers()
      return users.find((u) => u.email === idOrEmail) ?? null
    } catch (err) {
      console.error("getCurrentUserAsync error:", err)
      return null
    }
  },
}

// Nueva función async para login usando Supabase como fuente de usuarios.
// No reemplaza automáticamente el `authService.login` para evitar romper consumidores.
export async function loginWithSupabase(username: string, password: string) {
  const users = await supabaseApiClient.getUsers()
  const user = users.find((u) => u.username === username)

  if (user && user.password === password) {
    const authUser = {
      ...user,
      token: `supabase_token_${user.id}_${Date.now()}`,
    }

    if (typeof window !== "undefined") {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authUser))
    }

    return authUser
  }

  return null
}
