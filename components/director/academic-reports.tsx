"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { apiClient } from "@/lib/api-client"
import type { Subject, User } from "@/lib/mock-data"
import { BookOpen, TrendingUp, TrendingDown, Minus } from "lucide-react"

interface SubjectReport {
  subject: Subject
  enrolledStudents: number
  averageGrade: number
  approvalRate: number
  totalGrades: number
}

export function AcademicReports() {
  const [subjectReports, setSubjectReports] = useState<SubjectReport[]>([])
  const [studentReports, setStudentReports] = useState<
    Array<{ student: User; enrolledSubjects: number; averageGrade: number; approvalRate: number }>
  >([])

  useEffect(() => {
    // Generate subject reports
    const subjects = apiClient.getSubjects()
    const reports: SubjectReport[] = subjects.map((subject) => {
      const enrollments = apiClient.getEnrollmentsBySubject(subject.id)
      const grades = apiClient.getGradesBySubject(subject.id)

      const averageGrade = grades.length > 0 ? grades.reduce((sum, g) => sum + g.score, 0) / grades.length : 0

      const approvedGrades = grades.filter((g) => g.score >= 3.0).length
      const approvalRate = grades.length > 0 ? (approvedGrades / grades.length) * 100 : 0

      return {
        subject,
        enrolledStudents: enrollments.length,
        averageGrade: Math.round(averageGrade * 10) / 10,
        approvalRate: Math.round(approvalRate * 10) / 10,
        totalGrades: grades.length,
      }
    })

    setSubjectReports(reports)

    // Generate student reports
    const students = apiClient.getUsers().filter((u) => u.roleName === "Estudiante")
    const studentReportsData = students.map((student) => {
      const enrollments = apiClient.getEnrollmentsByStudent(student.id)
      const grades = apiClient.getGradesByStudent(student.id)

      const averageGrade = grades.length > 0 ? grades.reduce((sum, g) => sum + g.score, 0) / grades.length : 0

      const approvedGrades = grades.filter((g) => g.score >= 3.0).length
      const approvalRate = grades.length > 0 ? (approvedGrades / grades.length) * 100 : 0

      return {
        student,
        enrolledSubjects: enrollments.length,
        averageGrade: Math.round(averageGrade * 10) / 10,
        approvalRate: Math.round(approvalRate * 10) / 10,
      }
    })

    setStudentReports(studentReportsData)
  }, [])

  const getTrendIcon = (value: number) => {
    if (value >= 4.0) return <TrendingUp className="w-4 h-4 text-green-600" />
    if (value >= 3.0) return <Minus className="w-4 h-4 text-orange-600" />
    return <TrendingDown className="w-4 h-4 text-red-600" />
  }

  return (
    <div className="space-y-6">
      {/* Subjects Report */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Reporte por Materia
          </CardTitle>
          <CardDescription>Rendimiento académico por materia</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Materia</TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead>Estudiantes</TableHead>
                  <TableHead>Promedio</TableHead>
                  <TableHead>Aprobación</TableHead>
                  <TableHead>Tendencia</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subjectReports.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      No hay datos disponibles
                    </TableCell>
                  </TableRow>
                ) : (
                  subjectReports.map((report) => (
                    <TableRow key={report.subject.id}>
                      <TableCell className="font-medium">{report.subject.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{report.subject.code}</Badge>
                      </TableCell>
                      <TableCell>{report.enrolledStudents}</TableCell>
                      <TableCell>
                        <span
                          className={`font-semibold ${report.averageGrade >= 3.0 ? "text-green-600" : "text-red-600"}`}
                        >
                          {report.averageGrade > 0 ? report.averageGrade : "-"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span>{report.approvalRate > 0 ? `${report.approvalRate}%` : "-"}</span>
                          </div>
                          {report.approvalRate > 0 && <Progress value={report.approvalRate} className="h-2" />}
                        </div>
                      </TableCell>
                      <TableCell>{getTrendIcon(report.averageGrade)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Students Report */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Reporte por Estudiante
          </CardTitle>
          <CardDescription>Rendimiento individual de estudiantes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Estudiante</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Materias</TableHead>
                  <TableHead>Promedio</TableHead>
                  <TableHead>Aprobación</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {studentReports.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      No hay datos disponibles
                    </TableCell>
                  </TableRow>
                ) : (
                  studentReports.map((report) => (
                    <TableRow key={report.student.id}>
                      <TableCell className="font-medium">
                        {report.student.firstName} {report.student.lastName}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{report.student.email}</TableCell>
                      <TableCell>{report.enrolledSubjects}</TableCell>
                      <TableCell>
                        <span
                          className={`font-semibold ${report.averageGrade >= 3.0 ? "text-green-600" : "text-red-600"}`}
                        >
                          {report.averageGrade > 0 ? report.averageGrade : "-"}
                        </span>
                      </TableCell>
                      <TableCell>{report.approvalRate > 0 ? `${report.approvalRate}%` : "-"}</TableCell>
                      <TableCell>
                        {report.averageGrade >= 3.0 ? (
                          <Badge variant="default" className="bg-green-600">
                            Aprobado
                          </Badge>
                        ) : report.averageGrade > 0 ? (
                          <Badge variant="destructive">Reprobado</Badge>
                        ) : (
                          <Badge variant="outline">Sin datos</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
