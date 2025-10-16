"use client"

import { authService } from "../auth"

export async function changeOwnPassword(
  userId: number,
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Call server to update password
    try {
      // Verify current password by fetching user (server should validate in real impl)
      const resVerify = await fetch(`/api/admin/users?id=${userId}`)
      if (!resVerify.ok) return { success: false, error: "Usuario no encontrado" }

      // For now, server doesn't verify current password; front-end enforces by fetching current user from local session
      const currentUser = authService.getCurrentUser()
      if (currentUser && currentUser.password !== currentPassword) {
        return { success: false, error: "Contraseña actual incorrecta" }
      }

      const res = await fetch(`/api/admin/users`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: userId, password: newPassword }),
      })

      if (!res.ok) return { success: false, error: "Error al actualizar la contraseña" }

      // Update current user session if changing own password
      if (currentUser && currentUser.id === userId) {
        authService.updateCurrentUser({ password: newPassword })
      }

      return { success: true }
    } catch (error) {
      console.error("Error updating password via API:", error)
      return { success: false, error: "Error al cambiar la contraseña" }
    }
  } catch (error) {
    console.error("[v0] Error changing password:", error)
    return { success: false, error: "Error al cambiar la contraseña" }
  }
}

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
