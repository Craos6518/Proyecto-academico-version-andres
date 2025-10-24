"use client"

import { useEffect } from "react"
import { authService } from "@/lib/auth"

export default function AuthRehydrate() {
  useEffect(() => {
    // Rehydrate user by asking server. Server should read HttpOnly cookie.
    fetch("/api/auth/me", { method: "GET", credentials: "same-origin" })
      .then((r) => {
        if (!r.ok) return null
        return r.json()
      })
      .then((data) => {
        if (data && data.user) {
          // persist legacy client user shape for UI convenience
          authService.setCurrentUser(data.user)
        } else {
          authService.setCurrentUser(null)
        }
      })
      .catch(() => {
        authService.setCurrentUser(null)
      })
  }, [])

  return null
}
