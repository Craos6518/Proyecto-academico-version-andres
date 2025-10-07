"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { authService } from "@/lib/auth"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MyGrades } from "@/components/student/my-grades"
import { MySubjectsList } from "@/components/student/my-subjects-list"
import { BookOpen, TrendingUp, Award, AlertCircle } from "lucide-react"
import { apiClient } from "@/lib/api-client"

export default function StudentDashboard() {
  const router = useRouter()
  const [user, setUser] = useState(authService.getCurrentUser())
  const [stats, setStats] = useState({
    enrolledSubjects: 0,
    averageGrade: 0,
    highestGrade: 0,
    lowestGrade: 0,
  })

  useEffect(() => {
    const currentUser = authService.getCurrentUser()
    if (!currentUser || currentUser.roleName !== "Estudiante") {
      router.push("/")
      return
    }
    setUser(currentUser)

    // Calculate student stats
    const enrollments = apiClient.getEnrollmentsByStudent(currentUser.id)
    const grades = apiClient.getGradesByStudent(currentUser.id)

    if (grades.length > 0) {
      const scores = grades.map((g) => g.score)
      const average = scores.reduce((sum, score) => sum + score, 0) / scores.length
      const highest = Math.max(...scores)
      const lowest = Math.min(...scores)

      setStats({
        enrolledSubjects: enrollments.length,
        averageGrade: Math.round(average * 10) / 10,
        highestGrade: highest,
        lowestGrade: lowest,
      })
    } else {
      setStats({
        enrolledSubjects: enrollments.length,
        averageGrade: 0,
        highestGrade: 0,
        lowestGrade: 0,
      })
    }
  }, [router])

  if (!user) return null

  return (
    <DashboardLayout user={user} title="Panel del Estudiante">
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Bienvenido, {user.firstName} {user.lastName}
          </h2>
          <p className="text-gray-600">Aquí puedes consultar tus calificaciones y materias inscritas</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Materias Inscritas</CardTitle>
              <BookOpen className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.enrolledSubjects}</div>
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
              <CardTitle className="text-sm font-medium text-muted-foreground">Calificación Más Alta</CardTitle>
              <Award className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.highestGrade > 0 ? stats.highestGrade : "-"}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Calificación Más Baja</CardTitle>
              <AlertCircle className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {stats.lowestGrade > 0 ? stats.lowestGrade : "-"}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* My Subjects */}
        <Card>
          <CardHeader>
            <CardTitle>Mis Materias</CardTitle>
            <CardDescription>Materias en las que estás inscrito este semestre</CardDescription>
          </CardHeader>
          <CardContent>
            <MySubjectsList studentId={user.id} />
          </CardContent>
        </Card>

        {/* My Grades */}
        <Card>
          <CardHeader>
            <CardTitle>Mis Calificaciones</CardTitle>
            <CardDescription>Consulta tus calificaciones por materia y evaluación</CardDescription>
          </CardHeader>
          <CardContent>
            <MyGrades studentId={user.id} />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
