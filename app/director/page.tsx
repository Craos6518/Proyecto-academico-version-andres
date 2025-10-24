import { redirect } from "next/navigation"
import { headers, cookies } from "next/headers"
import { verifyJWT, normalizeRole } from "@/lib/auth"
import { getServerBaseUrl } from "@/lib/server-url"
import { DashboardLayout } from "@/components/dashboard-layout"
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
  // Server-side auth: verificar token y role
  const token = await getTokenFromRequest()
  if (!token) return redirect("/")

  const payload = verifyJWT(token)
  if (!payload) {
    // Fallback: intentar recuperar usuario desde Supabase con token (supabase access token)
    try {
      // Fallback: utilizar el endpoint interno /api/auth/me para obtener info del token
      const meRes = await fetch(new URL("/api/auth/me", getServerBaseUrl(headers())).toString(), {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!meRes.ok) return redirect("/")
      const me = await meRes.json()
      const rawRole = me.roleName ?? me.role ?? ""
      const role = normalizeRole(rawRole)
      if (role !== "director") return redirect("/")

      const user = {
        id: me.id,
        email: me.email,
        roleName: rawRole,
      }

  // Obtener estadísticas (server-side)
  const statsRes = await fetch(new URL("/api/director/stats", getServerBaseUrl(headers())).toString(), { headers: { Authorization: `Bearer ${token}` } })
      const stats = statsRes.ok ? await statsRes.json() : { totalStudents: 0, totalTeachers: 0, totalSubjects: 0, averageGrade: 0, approvalRate: 0 }

      return (
        <DashboardLayout user={user as any} title="Panel del Director">
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
  const statsRes = await fetch(new URL("/api/director/stats", getServerBaseUrl(headers())).toString(), { headers: { Authorization: `Bearer ${token}` } })
  const stats = statsRes.ok ? await statsRes.json() : { totalStudents: 0, totalTeachers: 0, totalSubjects: 0, averageGrade: 0, approvalRate: 0 }

  const user = { id: payload.id, username: payload.username, roleName: payload.role }

  return (
    <DashboardLayout user={user as any} title="Panel del Director">
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
}
