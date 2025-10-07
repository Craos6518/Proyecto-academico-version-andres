"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { apiClient } from "@/lib/api-client"
import type { Grade, Subject, Assignment } from "@/lib/mock-data"
import { Calculator, Calendar } from "lucide-react"

interface MyGradesProps {
  studentId: number
}

export function MyGrades({ studentId }: MyGradesProps) {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [selectedSubjectId, setSelectedSubjectId] = useState<number>(0)
  const [grades, setGrades] = useState<Grade[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])

  useEffect(() => {
    const enrollments = apiClient.getEnrollmentsByStudent(studentId)
    const enrolledSubjects = enrollments
      .map((e) => apiClient.getSubjectById(e.subjectId))
      .filter((s): s is Subject => s !== undefined)

    setSubjects(enrolledSubjects)
    if (enrolledSubjects.length > 0) {
      setSelectedSubjectId(enrolledSubjects[0].id)
    }
  }, [studentId])

  useEffect(() => {
    if (selectedSubjectId > 0) {
      const studentGrades = apiClient.getGradesByStudentAndSubject(studentId, selectedSubjectId)
      setGrades(studentGrades)
      setAssignments(apiClient.getAssignmentsBySubject(selectedSubjectId))
    }
  }, [studentId, selectedSubjectId])

  const getAssignmentDetails = (assignmentId: number) => {
    return assignments.find((a) => a.id === assignmentId)
  }

  const getAssignmentTypeBadge = (type: string) => {
    switch (type) {
      case "parcial1":
        return <Badge variant="default">Parcial 1</Badge>
      case "parcial2":
        return <Badge variant="secondary">Parcial 2</Badge>
      case "final":
        return <Badge variant="destructive">Final</Badge>
      default:
        return <Badge variant="outline">Otro</Badge>
    }
  }

  const finalGrade = selectedSubjectId > 0 ? apiClient.calculateFinalGrade(studentId, selectedSubjectId) : null

  if (subjects.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No tienes calificaciones registradas</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Subject Selection */}
      <div className="flex items-center justify-between">
        <div className="flex-1 max-w-sm">
          <Label htmlFor="subject">Selecciona una materia</Label>
          <Select
            value={selectedSubjectId.toString()}
            onValueChange={(value) => setSelectedSubjectId(Number.parseInt(value))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona una materia" />
            </SelectTrigger>
            <SelectContent>
              {subjects.map((subject) => (
                <SelectItem key={subject.id} value={subject.id.toString()}>
                  {subject.name} ({subject.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {finalGrade !== null && (
          <div className="text-right">
            <div className="flex items-center justify-end gap-1 text-sm text-muted-foreground mb-1">
              <Calculator className="w-4 h-4" />
              <span>Promedio Final</span>
            </div>
            <div className={`text-3xl font-bold ${finalGrade >= 3.0 ? "text-green-600" : "text-red-600"}`}>
              {finalGrade.toFixed(1)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">{finalGrade >= 3.0 ? "Aprobado" : "Reprobado"}</div>
          </div>
        )}
      </div>

      {/* Grades Table */}
      {selectedSubjectId > 0 && (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Evaluación</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Peso</TableHead>
                <TableHead>Calificación</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Comentarios</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {grades.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No hay calificaciones registradas para esta materia
                  </TableCell>
                </TableRow>
              ) : (
                grades.map((grade) => {
                  const assignment = getAssignmentDetails(grade.assignmentId)
                  return (
                    <TableRow key={grade.id}>
                      <TableCell className="font-medium">{assignment?.name || "Desconocido"}</TableCell>
                      <TableCell>{assignment && getAssignmentTypeBadge(assignment.assignmentType)}</TableCell>
                      <TableCell>{assignment?.weight}%</TableCell>
                      <TableCell>
                        <span
                          className={`text-lg font-semibold ${grade.score >= 3.0 ? "text-green-600" : "text-red-600"}`}
                        >
                          {grade.score}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          {new Date(grade.gradedAt).toLocaleDateString("es-ES")}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{grade.comments || "-"}</TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>

          {/* Grade Calculation Info */}
          {grades.length > 0 && (
            <div className="p-4 bg-muted/50 border-t">
              <p className="text-sm text-muted-foreground">
                <strong>Cálculo del promedio:</strong> Parcial 1 (30%) + Parcial 2 (30%) + Final (40%)
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
