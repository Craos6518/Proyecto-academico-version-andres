"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { apiClient } from "@/lib/api-client"
import type { Subject, Assignment } from "@/lib/mock-data"
import { BookOpen, User, Calculator, ChevronDown, ChevronUp, FileText, Calendar, Percent } from "lucide-react"

interface MySubjectsListProps {
  studentId: number
}

export function MySubjectsList({ studentId }: MySubjectsListProps) {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [subjectGrades, setSubjectGrades] = useState<Map<number, number | null>>(new Map())
  const [expandedSubject, setExpandedSubject] = useState<number | null>(null)
  const [subjectAssignments, setSubjectAssignments] = useState<Map<number, Assignment[]>>(new Map())

  useEffect(() => {
    const enrollments = apiClient.getEnrollmentsByStudent(studentId)
    const enrolledSubjects = enrollments
      .map((e) => apiClient.getSubjectById(e.subjectId))
      .filter((s): s is Subject => s !== undefined)

    setSubjects(enrolledSubjects)

    // Calculate final grades for each subject
    const gradesMap = new Map<number, number | null>()
    const assignmentsMap = new Map<number, Assignment[]>()

    enrolledSubjects.forEach((subject) => {
      const finalGrade = apiClient.calculateFinalGrade(studentId, subject.id)
      gradesMap.set(subject.id, finalGrade)

      // Get assignments for each subject
      const assignments = apiClient.getAssignmentsBySubject(subject.id)
      assignmentsMap.set(subject.id, assignments)
    })

    setSubjectGrades(gradesMap)
    setSubjectAssignments(assignmentsMap)
  }, [studentId])

  const toggleSubject = (subjectId: number) => {
    setExpandedSubject(expandedSubject === subjectId ? null : subjectId)
  }

  if (subjects.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No estás inscrito en ninguna materia</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {subjects.map((subject) => {
        const finalGrade = subjectGrades.get(subject.id)
        const progress = finalGrade !== null ? (finalGrade / 5.0) * 100 : 0
        const isExpanded = expandedSubject === subject.id
        const assignments = subjectAssignments.get(subject.id) || []

        return (
          <div key={subject.id} className="border rounded-lg overflow-hidden">
            <button
              onClick={() => toggleSubject(subject.id)}
              className="w-full p-4 hover:bg-accent/50 transition-colors text-left"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <BookOpen className="w-4 h-4 text-muted-foreground" />
                    <h3 className="font-semibold">{subject.name}</h3>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Badge variant="outline">{subject.code}</Badge>
                    <span>•</span>
                    <span>{subject.credits} créditos</span>
                  </div>
                </div>
                {finalGrade !== null && (
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
                      <Calculator className="w-3 h-3" />
                      <span>Promedio</span>
                    </div>
                    <div className={`text-2xl font-bold ${finalGrade >= 3.0 ? "text-green-600" : "text-red-600"}`}>
                      {finalGrade.toFixed(1)}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <User className="w-3 h-3 text-muted-foreground" />
                  <span className="text-muted-foreground">Profesor:</span>
                  <span>{subject.teacherName}</span>
                </div>

                {finalGrade !== null && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Progreso</span>
                      <span>{finalGrade >= 3.0 ? "Aprobado" : "Reprobado"}</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                )}
              </div>
            </button>

            {isExpanded && (
              <div className="border-t bg-muted/30 p-4 space-y-4">
                {/* Subject Description */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <h4 className="font-semibold text-sm">Descripción</h4>
                  </div>
                  <p className="text-sm text-muted-foreground pl-6">
                    {subject.description || "Sin descripción disponible"}
                  </p>
                </div>

                {/* Assignments/Evaluations */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <h4 className="font-semibold text-sm">Evaluaciones</h4>
                  </div>

                  {assignments.length > 0 ? (
                    <div className="space-y-2 pl-6">
                      {assignments.map((assignment) => {
                        const studentGrade = apiClient
                          .getGrades()
                          .find((g) => g.studentId === studentId && g.assignmentId === assignment.id)

                        return (
                          <div
                            key={assignment.id}
                            className="flex items-center justify-between p-3 bg-background rounded-lg border"
                          >
                            <div className="flex-1">
                              <div className="font-medium text-sm">{assignment.name}</div>
                              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                                <div className="flex items-center gap-1">
                                  <Percent className="w-3 h-3" />
                                  <span>Peso: {assignment.weight}%</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  <span>{new Date(assignment.dueDate).toLocaleDateString()}</span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              {studentGrade ? (
                                <div>
                                  <div className="text-xs text-muted-foreground mb-1">Calificación</div>
                                  <div
                                    className={`text-lg font-bold ${
                                      studentGrade.score >= 3.0 ? "text-green-600" : "text-red-600"
                                    }`}
                                  >
                                    {studentGrade.score.toFixed(1)}
                                  </div>
                                </div>
                              ) : (
                                <Badge variant="outline" className="text-xs">
                                  Sin calificar
                                </Badge>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground pl-6">No hay evaluaciones registradas</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
