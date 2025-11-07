import { redirect } from "next/navigation"
// Forzar renderizado dinámico: esta página lee headers/cookies en el servidor.
export const dynamic = "force-dynamic"
import { headers, cookies } from "next/headers"
import { verifyJWT, normalizeRole } from "@/lib/auth"
import { DashboardLayout } from "@/components/dashboard-layout"
import type { User } from "@/lib/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import AcademicReports from "@/components/director/academic-reports"
import { PerformanceAnalytics } from "@/components/director/performance-analytics"
import { UsersManagement } from "@/components/admin/users-management"
import { Users, BookOpen, TrendingUp, Award, BarChart3 } from "lucide-react"

async function getTokenFromRequest() {
  const hdrs = headers()
  const auth = hdrs.get("authorization")
  if (auth && auth.toLowerCase().startsWith("bearer ")) return auth.slice(7).trim()

  const c = cookies()
  const tokenCookie = c.get("academic_auth_token") || c.get("auth_token")
  if (tokenCookie) return tokenCookie.value

  return null
}

export default async function DirectorDashboard() {
  try {
    // Server-side auth: verificar token y role
    const token = await getTokenFromRequest()
    if (!token) {
      console.warn("DirectorDashboard: token missing")
      return redirect("/")
    }

    // Añadir logging mínimo para depuración en producción (no imprimir token completo)
    try {
      console.log(`DirectorDashboard: token type=${typeof token} length=${String(token).length}`)
    } catch {
      // noop
    }

    const payload = verifyJWT(token)
    // Construir URL absoluta para llamadas server-side (centralizado en lib/server-url)
    if (!payload) {
        // Fallback: intentar recuperar usuario desde Supabase con token (supabase access token)
        try {
          // Fallback: utilizar el endpoint interno /api/auth/me para obtener info del token
          // Construir una URL absoluta en contexto server-side para evitar errores de URL relativa
          const hdrs2 = headers()
          const host2 = hdrs2.get("host") || "localhost:3000"
          let baseUrl = process.env.NEXT_PUBLIC_SITE_URL

          // ✅ Corrección automática del protocolo para evitar ERR_SSL_WRONG_VERSION_NUMBER
          if (!baseUrl || baseUrl.includes("https://localhost") || baseUrl.includes("https://127.0.0.1")) {
            baseUrl = `http://${host2}`
          } else if (!baseUrl.startsWith("http")) {
            baseUrl = `http://${host2}`
          }

          const meRes = await fetch(new URL("/api/auth/me", baseUrl).toString(), {
            headers: { Authorization: `Bearer ${token}` },
          })
          if (!meRes.ok) return redirect("/")
          const me = await meRes.json()
        const rawRole = me.roleName ?? me.role ?? ""
        const role = normalizeRole(rawRole)
        if (role !== "director") return redirect("/")

        const user: User = {
          id: Number(me.id),
          username: String(me.username ?? me.email ?? ""),
          email: String(me.email ?? ""),
          roleName: rawRole,
        }

        // Obtener estadísticas (server-side)
        // Obtener estadísticas (server-side). Proteger contra fallos de red en producción.
        let stats = { totalStudents: 0, totalTeachers: 0, totalSubjects: 0, averageGrade: 0, approvalRate: 0 }
        try {
          const statsRes = await fetch(new URL('/api/director/stats', baseUrl).toString(), { headers: { Authorization: `Bearer ${token}` } })
          if (statsRes.ok) stats = await statsRes.json()
        } catch (e) {
          // Si falla la petición, usar valores por defecto y seguir. No queremos lanzar aquí.
          console.error('DirectorDashboard stats fetch failed (fallback path):', e)
        }

        return (
          <DashboardLayout user={user} title="Panel del Director">
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">Resumen Institucional</h2>
                <p className="text-muted-foreground">Vista general del rendimiento académico y estadísticas</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Estudiantes</CardTitle>
                    <Users className="w-4 h-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalStudents}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Profesores</CardTitle>
                    <Users className="w-4 h-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalTeachers}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Materias</CardTitle>
                    <BookOpen className="w-4 h-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalSubjects}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Promedio General</CardTitle>
                    <TrendingUp className="w-4 h-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold ${stats.averageGrade >= 3.0 ? "text-green-600" : "text-red-600"}`}>
                      {stats.averageGrade > 0 ? stats.averageGrade : "-"}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Tasa de Aprobación</CardTitle>
                    <Award className="w-4 h-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold ${stats.approvalRate >= 70 ? "text-green-600" : "text-orange-600"}`}>
                      {stats.approvalRate > 0 ? `${stats.approvalRate}%` : "-"}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    <CardTitle>Reportes y Análisis</CardTitle>
                  </div>
                  <CardDescription>Consulta reportes académicos y análisis de rendimiento institucional</CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="reports" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="reports">Reportes Académicos</TabsTrigger>
                      <TabsTrigger value="analytics">Análisis de Rendimiento</TabsTrigger>
                      <TabsTrigger value="users">Gestión de Usuarios</TabsTrigger>
                    </TabsList>
                    <TabsContent value="reports" className="mt-6">
                      {/* AcademicReports es un Server Component*/}
                      <AcademicReports />
                    </TabsContent>
                    <TabsContent value="analytics" className="mt-6">
                      <PerformanceAnalytics />
                    </TabsContent>
                    <TabsContent value="users" className="mt-6">
                      <UsersManagement />
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          </DashboardLayout>
        )
      } catch (err) {
        console.error("supabase fallback auth error:", err)
        return redirect("/")
      }
    }

    // token decodificado con verifyJWT
    const rawRole = payload.role
    if (rawRole !== "director") return redirect("/")

    // obtener stats desde server-side API usando el mismo token
    let stats = { totalStudents: 0, totalTeachers: 0, totalSubjects: 0, averageGrade: 0, approvalRate: 0 }
    try {
      const hdrs3 = headers()
      const host3 = hdrs3.get('host') || 'localhost:3000'
      let baseUrl2 = process.env.NEXT_PUBLIC_SITE_URL

      // ✅ Misma corrección automática
      if (!baseUrl2 || baseUrl2.includes("https://localhost") || baseUrl2.includes("https://127.0.0.1")) {
        baseUrl2 = `http://${host3}`
      } else if (!baseUrl2.startsWith("http")) {
        baseUrl2 = `http://${host3}`
      }

      const statsRes = await fetch(new URL("/api/director/stats", baseUrl2).toString(), {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (statsRes.ok) stats = await statsRes.json()
    } catch (e) {
      console.error('DirectorDashboard stats fetch failed:', e)
      // mantener stats por defecto
    }

  const pl = payload as Record<string, unknown>
  const user: User = { id: Number(pl["id"] ?? 0), username: String(pl["username"] ?? pl["email"] ?? ""), email: String(pl["email"] ?? ""), roleName: String(pl["role"] ?? "") }

    return (
      <DashboardLayout user={user} title="Panel del Director">
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">Resumen Institucional</h2>
            <p className="text-muted-foreground">Vista general del rendimiento académico y estadísticas</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Estudiantes</CardTitle>
                <Users className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalStudents}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Profesores</CardTitle>
                <Users className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalTeachers}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Materias</CardTitle>
                <BookOpen className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalSubjects}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Promedio General</CardTitle>
                <TrendingUp className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${stats.averageGrade >= 3.0 ? "text-green-600" : "text-red-600"}`}>
                  {stats.averageGrade > 0 ? stats.averageGrade : "-"}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Tasa de Aprobación</CardTitle>
                <Award className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${stats.approvalRate >= 70 ? "text-green-600" : "text-orange-600"}`}>
                  {stats.approvalRate > 0 ? `${stats.approvalRate}%` : "-"}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                <CardTitle>Reportes y Análisis</CardTitle>
              </div>
              <CardDescription>Consulta reportes académicos y análisis de rendimiento institucional</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="reports" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="reports">Reportes Académicos</TabsTrigger>
                  <TabsTrigger value="analytics">Análisis de Rendimiento</TabsTrigger>
                  <TabsTrigger value="users">Gestión de Usuarios</TabsTrigger>
                </TabsList>
                <TabsContent value="reports" className="mt-6">
                  <AcademicReports />
                </TabsContent>
                <TabsContent value="analytics" className="mt-6">
                  <PerformanceAnalytics />
                </TabsContent>
                <TabsContent value="users" className="mt-6">
                  <UsersManagement />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    )
  } catch (err) {
    // NEXT_REDIRECT es un mecanismo interno de Next para hacer redirect desde Server Components.
    // No debemos tratarlo como un error inesperado ni capturarlo silenciosamente — debe propagarse
    // para que Next lo procese. Detectamos ese caso y lo relanzamos.
    const e = err as any
    const isNextRedirect = e && (e.message === "NEXT_REDIRECT" || (typeof e.digest === "string" && e.digest.includes("NEXT_REDIRECT")))
    if (isNextRedirect) throw err

    // Loguear stack trace para investigar la causa raíz sin mostrar la página de error al usuario
    console.error("DirectorDashboard unexpected error:", err)
    return redirect("/")
  }
}
