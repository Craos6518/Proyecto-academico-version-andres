"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { authService, normalizeRole } from "@/lib/auth"
import { GraduationCap, AlertCircle } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)
    // Local loading state will control the button and local UI

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 500))
    // Hacer la autenticación en el servidor para recibir logs y token
    let user = null
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })

      if (res.ok) {
        const body = await res.json()
        // Server sets HttpOnly cookie. Client must not persist token in localStorage.
        user = body.user
        try {
          // Persist a safe user shape (authService will strip any token if present)
          authService.setCurrentUser(body.user)
        } catch {
          // noop
        }
      } else {
        user = null
      }
    } catch (err) {
      console.error('fetch /api/auth/login error:', err)
      user = null
    }

      if (user) {
        // Redirect using normalized role
        const roleKey = normalizeRole(user.role ?? user.roleName)
        const routeByRole: Record<string, string> = {
          admin: "/admin",
          director: "/director",
          teacher: "/teacher",
          student: "/student",
        }
        const target = routeByRole[roleKey] ?? "/"
        // Navigate immediately; the global loader will stay visible up to 20s while preloads run
        router.push(target)
        return
      }

      setError("Usuario o contraseña incorrectos")
      setIsLoading(false)
    }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4">
      <div className="w-full max-w-md">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Sistema Académico</h1>
          <p className="text-gray-600">Gestión de Calificaciones</p>
        </div>

        {/* Login Card */}
        <Card className="shadow-xl border-0">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Iniciar Sesión</CardTitle>
            <CardDescription className="text-center">Ingresa tus credenciales para acceder al sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="username">Usuario</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Ingresa tu usuario"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  disabled={isLoading}
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Ingresa tu contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="h-11"
                />
              </div>

              <Button type="submit" className="w-full h-11 text-base" disabled={isLoading}>
                {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
              </Button>
            </form>

            {/* Demo Credentials */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
              <p className="text-sm font-semibold text-blue-900 mb-2">Credenciales de prueba:</p>
              <div className="text-xs text-blue-800 space-y-1">
                <p>
                  <strong>Admin:</strong> admin / demo123
                </p>
                <p>
                  <strong>Director:</strong> director / demo123
                </p>
                <p>
                  <strong>Profesor:</strong> profesor1 / demo123
                </p>
                <p>
                  <strong>Estudiante:</strong> estudiante1 / demo123
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 mt-6">
          © 2025 Sistema Académico. Todos los derechos reservados.
        </p>
      </div>
    </div>
  )
}
