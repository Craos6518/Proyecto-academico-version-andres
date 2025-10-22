"use client"

import { useEffect } from "react"
import { authService } from "@/lib/auth"

export default function AuthRehydrate() {
  useEffect(() => {
    const token = authService.getAuthToken()
    if (!token) return

    // Llamar a /api/auth/me para rehidratar el usuario
    fetch(`/api/auth/me`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (!r.ok) throw new Error("not authorized")
        return r.json()
      })
      .then((user) => {
        // Guardar user y token
        authService.setCurrentUser({ ...user, token } as any)
        authService.setAuthToken(token)
      })
      .catch(() => {
        // token inválido o error -> limpiar
        authService.logoutClient()
      })
  }, [])

  return null
}
