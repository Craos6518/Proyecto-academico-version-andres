"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { apiClient } from "@/lib/api-client"
import type { Subject, Assignment, User } from "@/lib/mock-data"
import { BookOpen, Users, Calendar, ClipboardList, Award } from "lucide-react"

interface MySubjectsProps {
  teacherId: number
}

export function MySubjects({ teacherId }: MySubjectsProps) {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [enrolledStudents, setEnrolledStudents] = useState<User[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])

  useEffect(() => {
    setSubjects(apiClient.getSubjectsByTeacher(teacherId))
  }, [teacherId])

  const handleViewDetails = (subject: Subject) => {
    setSelectedSubject(subject)

    // Get enrolled students
    const enrollments = apiClient.getEnrollmentsBySubject(subject.id)
    const students = enrollments
      .map((enrollment) => apiClient.getUserById(enrollment.studentId))
      .filter((student): student is User => student !== undefined)
    setEnrolledStudents(students)

    // Get assignments
    const subjectAssignments = apiClient.getAssignmentsBySubject(subject.id)
    setAssignments(subjectAssignments)

    setDialogOpen(true)
  }

  const getEnrolledStudentsCount = (subjectId: number) => {
    return apiClient.getEnrollmentsBySubject(subjectId).length
  }

  const getSubjectGradesCount = (subjectId: number) => {
    return apiClient.getGradesBySubject(subjectId).length
  }

  const formatAssignmentType = (type: string) => {
    const types: Record<string, string> = {
      parcial1: "Parcial 1",
      parcial2: "Parcial 2",
      final: "Final",
    }
    return types[type] || type
  }

  return (
    <>
      <div className="space-y-4">
        {subjects.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No tienes materias asignadas</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {subjects.map((subject) => (
              <Card key={subject.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{subject.name}</CardTitle>
                      <CardDescription className="mt-1">
                        <Badge variant="outline" className="mr-2">
                          {subject.code}
                        </Badge>
                        {subject.credits} créditos
                      </CardDescription>
                    </div>
                    <BookOpen className="w-5 h-5 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">{subject.description}</p>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <span>{getEnrolledStudentsCount(subject.id)} estudiantes</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span>{getSubjectGradesCount(subject.id)} calificaciones</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full bg-transparent"
                      onClick={() => handleViewDetails(subject)}
                    >
                      Ver Detalles
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">{selectedSubject?.name}</DialogTitle>
            <DialogDescription>
              <Badge variant="outline" className="mr-2">
                {selectedSubject?.code}
              </Badge>
              {selectedSubject?.credits} créditos
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Subject Information */}
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Descripción
              </h3>
              <p className="text-sm text-muted-foreground">{selectedSubject?.description}</p>
            </div>

            <Separator />

            {/* Enrolled Students */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Estudiantes Inscritos ({enrolledStudents.length})
              </h3>
              {enrolledStudents.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay estudiantes inscritos</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {enrolledStudents.map((student) => (
                    <div key={student.id} className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-xs font-medium">
                          {student.firstName[0]}
                          {student.lastName[0]}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {student.firstName} {student.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">{student.email}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            {/* Assignments/Evaluations */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <ClipboardList className="w-4 h-4" />
                Evaluaciones ({assignments.length})
              </h3>
              {assignments.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay evaluaciones creadas</p>
              ) : (
                <div className="space-y-2">
                  {assignments.map((assignment) => (
                    <div key={assignment.id} className="p-3 rounded-md border bg-card">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{assignment.name}</p>
                          <p className="text-xs text-muted-foreground mt-1">{assignment.description}</p>
                        </div>
                        <Badge variant="secondary" className="ml-2">
                          {formatAssignmentType(assignment.assignmentType)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Award className="w-3 h-3" />
                          <span>Peso: {assignment.weight}%</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <ClipboardList className="w-3 h-3" />
                          <span>Nota máxima: {assignment.maxScore}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>Fecha: {new Date(assignment.dueDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
