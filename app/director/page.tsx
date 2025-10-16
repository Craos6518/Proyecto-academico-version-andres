"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { authService } from "@/lib/auth"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AcademicReports } from "@/components/director/academic-reports"
import { PerformanceAnalytics } from "@/components/director/performance-analytics"
import { UsersManagement } from "@/components/admin/users-management"
import { Users, BookOpen, TrendingUp, Award, BarChart3 } from "lucide-react"
// importación eliminada: apiClient

export default function DirectorDashboard() {
  const router = useRouter()
  const [user, setUser] = useState(authService.getCurrentUser())
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    totalSubjects: 0,
    averageGrade: 0,
    approvalRate: 0,
  })

  useEffect(() => {
    const currentUser = authService.getCurrentUser()
    if (!currentUser || currentUser.roleName !== "Director") {
      router.push("/")
      return
    }
    setUser(currentUser)

    // Fetch director stats from server (Supabase)
    fetch("/api/director/stats")
      .then((r) => r.json())
      .then((data) => {
        setStats({
          totalStudents: data.totalStudents,
          totalTeachers: data.totalTeachers,
          totalSubjects: data.totalSubjects,
          averageGrade: data.averageGrade,
          approvalRate: data.approvalRate,
        })
      })
      .catch((err) => console.error("Failed to load director stats", err))
  }, [router])

  if (!user) return null

  return (
    <DashboardLayout user={user} title="Panel del Director">
      <div className="space-y-6">
        {/* Overview Section */}
        <div>
          <h2 className="text-2xl font-bold mb-2">Resumen Institucional</h2>
          <p className="text-muted-foreground">Vista general del rendimiento académico y estadísticas</p>
        </div>

        {/* Stats Cards */}
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

        {/* Reports and Analytics */}
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
