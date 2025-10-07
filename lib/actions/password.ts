"use client"

import { apiClient } from "@/lib/api-client"
import { authService } from "@/lib/auth"

export async function changeOwnPassword(userId: number, currentPassword: string, newPassword: string) {
  try {
    // Get user from localStorage
    const user = apiClient.getUserById(userId)

    if (!user) {
      return { success: false, error: "Usuario no encontrado" }
    }

    // Verify current password
    if (user.password !== currentPassword) {
      return { success: false, error: "Contraseña actual incorrecta" }
    }

    // Update password in localStorage
    const updated = apiClient.updateUserPassword(userId, newPassword)

    if (!updated) {
      return { success: false, error: "Error al actualizar la contraseña" }
    }

    // Update current user session if changing own password
    const currentUser = authService.getCurrentUser()
    if (currentUser && currentUser.id === userId) {
      authService.updateCurrentUser({ password: newPassword })
    }

    return { success: true }
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

    // Update password in localStorage
    const updated = apiClient.updateUserPassword(targetUserId, newPassword)

    if (!updated) {
      return { success: false, error: "Error al actualizar la contraseña" }
    }

    return { success: true }
  } catch (error) {
    console.error("[v0] Error changing user password:", error)
    return { success: false, error: "Error al cambiar la contraseña del usuario" }
  }
}
