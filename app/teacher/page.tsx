"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { authService } from "@/lib/auth"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MySubjects } from "@/components/teacher/my-subjects"
import { GradeManagement } from "@/components/teacher/grade-management"
import { EvaluationsManagement } from "@/components/teacher/evaluations-management"
import { BookOpen, Users, ClipboardList, TrendingUp } from "lucide-react"
import { apiClient } from "@/lib/api-client"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface PendingGradeItem {
  assignmentId: number
  assignmentName: string
  subjectName: string
  dueDate: string
  studentsWithoutGrade: number
}

export default function TeacherDashboard() {
  const router = useRouter()
  const [user, setUser] = useState(authService.getCurrentUser())
  const [stats, setStats] = useState({
    mySubjects: 0,
    totalStudents: 0,
    pendingGrades: 0,
    averageGrade: 0,
  })
  const [pendingGradesDetails, setPendingGradesDetails] = useState<PendingGradeItem[]>([])
  const [isPendingDialogOpen, setIsPendingDialogOpen] = useState(false)

  useEffect(() => {
    const currentUser = authService.getCurrentUser()
    if (!currentUser || currentUser.roleName !== "Profesor") {
      router.push("/")
      return
    }
    setUser(currentUser)

    // Calculate teacher stats
    const subjects = apiClient.getSubjectsByTeacher(currentUser.id)
    const enrollments = apiClient.getEnrollments()
    const grades = apiClient.getGrades()
    const assignments = apiClient.getAssignments()

    const mySubjectIds = subjects.map((s) => s.id)
    const studentsInMySubjects = enrollments.filter((e) => mySubjectIds.includes(e.subjectId))
    const gradesInMySubjects = grades.filter((g) => mySubjectIds.includes(g.subjectId))

    let averageGrade = 0
    if (gradesInMySubjects.length > 0) {
      const sum = gradesInMySubjects.reduce((acc, g) => acc + (g.score || 0), 0)
      averageGrade = sum / gradesInMySubjects.length
      averageGrade = Math.round(averageGrade * 10) / 10
    }

    const pendingItems: PendingGradeItem[] = []
    let totalPendingCount = 0

    for (const subject of subjects) {
      const subjectAssignments = assignments.filter((a) => a.subjectId === subject.id)
      const subjectEnrollments = enrollments.filter((e) => e.subjectId === subject.id)

      for (const assignment of subjectAssignments) {
        const assignmentGrades = grades.filter((g) => g.assignmentId === assignment.id)
        const studentsWithoutGrade = subjectEnrollments.length - assignmentGrades.length

        if (studentsWithoutGrade > 0) {
          pendingItems.push({
            assignmentId: assignment.id,
            assignmentName: assignment.name,
            subjectName: subject.name,
            dueDate: assignment.dueDate,
            studentsWithoutGrade,
          })
          totalPendingCount += studentsWithoutGrade
        }
      }
    }

    setPendingGradesDetails(pendingItems)

    setStats({
      mySubjects: subjects.length,
      totalStudents: new Set(studentsInMySubjects.map((s) => s.studentId)).size,
      pendingGrades: totalPendingCount,
      averageGrade: isNaN(averageGrade) ? 0 : averageGrade,
    })
  }, [router])

  if (!user) return null

  return (
    <DashboardLayout user={user} title="Panel del Profesor">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Mis Materias</CardTitle>
              <BookOpen className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.mySubjects}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Estudiantes</CardTitle>
              <Users className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalStudents}</div>
            </CardContent>
          </Card>

          <Dialog open={isPendingDialogOpen} onOpenChange={setIsPendingDialogOpen}>
            <DialogTrigger asChild>
              <Card className="cursor-pointer hover:bg-accent/50 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Calificaciones Pendientes</CardTitle>
                  <ClipboardList className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.pendingGrades}</div>
                  {stats.pendingGrades > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">Click para ver detalles</p>
                  )}
                </CardContent>
              </Card>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Calificaciones Pendientes</DialogTitle>
                <DialogDescription>
                  Evaluaciones que tienen estudiantes sin calificar ({stats.pendingGrades} total)
                </DialogDescription>
              </DialogHeader>
              <div className="mt-4">
                {pendingGradesDetails.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    ¡Excelente! No hay calificaciones pendientes
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Evaluación</TableHead>
                        <TableHead>Materia</TableHead>
                        <TableHead>Fecha de Entrega</TableHead>
                        <TableHead className="text-right">Estudiantes sin Calificar</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingGradesDetails.map((item) => (
                        <TableRow key={item.assignmentId}>
                          <TableCell className="font-medium">{item.assignmentName}</TableCell>
                          <TableCell>{item.subjectName}</TableCell>
                          <TableCell>{new Date(item.dueDate).toLocaleDateString("es-ES")}</TableCell>
                          <TableCell className="text-right">
                            <Badge variant="destructive">{item.studentsWithoutGrade}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </DialogContent>
          </Dialog>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Promedio General</CardTitle>
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.averageGrade || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Management Tabs */}
        <Card>
          <CardHeader>
            <CardTitle>Gestión Académica</CardTitle>
            <CardDescription>Administra tus materias y calificaciones de estudiantes</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="subjects" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="subjects">Mis Materias</TabsTrigger>
                <TabsTrigger value="evaluations">Evaluaciones</TabsTrigger>
                <TabsTrigger value="grades">Calificaciones</TabsTrigger>
              </TabsList>
              <TabsContent value="subjects" className="mt-6">
                <MySubjects teacherId={user.id} />
              </TabsContent>
              <TabsContent value="evaluations" className="mt-6">
                <EvaluationsManagement teacherId={user.id} />
              </TabsContent>
              <TabsContent value="grades" className="mt-6">
                <GradeManagement teacherId={user.id} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
