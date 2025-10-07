"use client"

import { apiClient } from "./api-client"
import type { User } from "./mock-data"

const AUTH_STORAGE_KEY = "academic_auth_user"

export interface AuthUser extends User {
  token: string
}

export const authService = {
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

  logout: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(AUTH_STORAGE_KEY)
    }
  },

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
}
