"use client"

import { authService } from "../auth"

// Cambia la propia contraseña llamando al endpoint seguro /api/auth/change-password
export async function changeOwnPassword(
  _userId: number,
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Call server endpoint that verifies current password and updates hash server-side
    const res = await fetch(`/api/auth/change-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    })

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      return { success: false, error: body.error || body.message || "Error al cambiar la contraseña" }
    }

    // Optionally update local cached user info (avoid storing passwords locally)
    try {
      const currentUser = authService.getCurrentUser()
      if (currentUser) {
        authService.updateCurrentUser({}) // noop by default; keep signature for compatibility
      }
    } catch {
      // noop
    }

    return { success: true }
  } catch (error) {
    console.error("[changeOwnPassword] error:", error)
    return { success: false, error: "Error al cambiar la contraseña" }
  }
}

// Admin/director flow for changing other users' passwords still uses admin API
export async function changeUserPassword(
  adminUserId: number,
  adminRole: string,
  targetUserId: number,
  newPassword: string,
) {
  try {
    // Only Admin and Director can change other users' passwords
    if (adminRole !== "Administrador" && adminRole !== "Director") {
      return { success: false, error: "No tienes permisos para realizar esta acción" }
    }

    try {
      const res = await fetch(`/api/admin/users`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: targetUserId, password: newPassword }),
      })
      if (!res.ok) return { success: false, error: "Error al actualizar la contraseña" }
      return { success: true }
    } catch (error) {
      console.error("Error updating user password via API:", error)
      return { success: false, error: "Error al cambiar la contraseña del usuario" }
    }
  } catch (error) {
    console.error("[v0] Error changing user password:", error)
    return { success: false, error: "Error al cambiar la contraseña del usuario" }
  }
}
