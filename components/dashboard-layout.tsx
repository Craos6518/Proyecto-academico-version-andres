"use client"

import type React from "react"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { authService, type AuthUser } from "@/lib/auth"
import { GraduationCap, LogOut, User, Key } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChangePasswordDialog } from "@/components/change-password-dialog"
import { useState } from "react"

interface DashboardLayoutProps {
  children: React.ReactNode
  user: AuthUser
  title: string
}

export function DashboardLayout({ children, user, title }: DashboardLayoutProps) {
  const router = useRouter()
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)

  // normalizar el nombre a mostrar una sola vez (accedemos de forma segura a propiedades dinámicas)
  const u = user as unknown as Record<string, unknown>
  const first = (u['firstName'] ?? u['first_name']) as string | undefined
  const last = (u['lastName'] ?? u['last_name']) as string | undefined
  const displayName = (first || last)
    ? `${first ?? ""} ${last ?? ""}`.trim()
    : ((u['displayName'] ?? u['username']) as string | undefined) ?? (u['email'] ? String(u['email']).split("@")[0] : "Usuario")

  const handleLogout = () => {
    authService.logout()
    router.push("/")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Title */}
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-blue-600 rounded-lg">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">{title}</h1>
                <p className="text-xs text-gray-500">{user.roleName}</p>
              </div>
            </div>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2">
                  <User className="w-4 h-4" />
                  <span className="hidden sm:inline">{displayName}</span>
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem disabled>
                  <User className="w-4 h-4 mr-2" />
                  {displayName}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setShowPasswordDialog(true)}>
                  <Key className="w-4 h-4 mr-2" />
                  Cambiar Contraseña
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                  <LogOut className="w-4 h-4 mr-2" />
                  Cerrar Sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</main>

      <ChangePasswordDialog userId={user.id} open={showPasswordDialog} onOpenChange={setShowPasswordDialog} />
    </div>
  )
}
