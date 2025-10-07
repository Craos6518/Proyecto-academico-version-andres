"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { apiClient } from "@/lib/api-client"
import type { Grade, Subject, User, Assignment } from "@/lib/mock-data"
import { Plus, Pencil, Calculator, Trash2, AlertCircle } from "lucide-react"

interface GradeManagementProps {
  teacherId: number
}

export function GradeManagement({ teacherId }: GradeManagementProps) {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [selectedSubjectId, setSelectedSubjectId] = useState<number>(0)
  const [students, setStudents] = useState<User[]>([])
  const [grades, setGrades] = useState<Grade[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingGrade, setEditingGrade] = useState<Grade | null>(null)
  const [deleteGradeId, setDeleteGradeId] = useState<number | null>(null)
  const [duplicateError, setDuplicateError] = useState<string>("")
  const [formData, setFormData] = useState({
    studentId: 0,
    assignmentId: 0,
    score: 0,
    comments: "",
  })

  useEffect(() => {
    const teacherSubjects = apiClient.getSubjectsByTeacher(teacherId)
    setSubjects(teacherSubjects)
    if (teacherSubjects.length > 0) {
      setSelectedSubjectId(teacherSubjects[0].id)
    }
  }, [teacherId])

  useEffect(() => {
    if (selectedSubjectId > 0) {
      const enrollments = apiClient.getEnrollmentsBySubject(selectedSubjectId)
      const enrolledStudents = enrollments
        .map((e) => apiClient.getUserById(e.studentId))
        .filter((u): u is User => u !== undefined)

      setStudents(enrolledStudents)
      setGrades(apiClient.getGradesBySubject(selectedSubjectId))
      setAssignments(apiClient.getAssignmentsBySubject(selectedSubjectId))
    }
  }, [selectedSubjectId])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (editingGrade) {
      apiClient.updateGrade(editingGrade.id, {
        score: formData.score,
        comments: formData.comments,
      })
    } else {
      const existingGrade = grades.find(
        (g) => g.studentId === formData.studentId && g.assignmentId === formData.assignmentId,
      )

      if (existingGrade) {
        const studentName = getStudentName(formData.studentId)
        const assignmentName = getAssignmentName(formData.assignmentId)
        setDuplicateError(
          `Ya existe una calificación para ${studentName} en ${assignmentName}. Por favor, edita la calificación existente.`,
        )
        return
      }

      apiClient.createGrade({
        studentId: formData.studentId,
        assignmentId: formData.assignmentId,
        subjectId: selectedSubjectId,
        score: formData.score,
        comments: formData.comments,
        gradedBy: teacherId,
        gradedAt: new Date().toISOString(),
      })
    }

    setGrades(apiClient.getGradesBySubject(selectedSubjectId))
    setIsDialogOpen(false)
    resetForm()
  }

  const handleEdit = (grade: Grade) => {
    setEditingGrade(grade)
    setFormData({
      studentId: grade.studentId,
      assignmentId: grade.assignmentId,
      score: grade.score,
      comments: grade.comments || "",
    })
    setIsDialogOpen(true)
  }

  const handleDelete = (gradeId: number) => {
    apiClient.deleteGrade(gradeId)
    setGrades(apiClient.getGradesBySubject(selectedSubjectId))
    setDeleteGradeId(null)
  }

  const resetForm = () => {
    setEditingGrade(null)
    setDuplicateError("")
    setFormData({
      studentId: students[0]?.id || 0,
      assignmentId: assignments[0]?.id || 0,
      score: 0,
      comments: "",
    })
  }

  const getStudentName = (studentId: number) => {
    const student = students.find((s) => s.id === studentId)
    return student ? `${student.firstName} ${student.lastName}` : "Desconocido"
  }

  const getAssignmentName = (assignmentId: number) => {
    const assignment = assignments.find((a) => a.id === assignmentId)
    return assignment ? assignment.name : "Desconocido"
  }

  const getAssignmentType = (assignmentId: number) => {
    const assignment = assignments.find((a) => a.id === assignmentId)
    return assignment ? assignment.assignmentType : "unknown"
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

  const calculateFinalGrade = (studentId: number) => {
    return apiClient.calculateFinalGrade(studentId, selectedSubjectId)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="flex-1 max-w-sm">
          <Label htmlFor="subject">Materia</Label>
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

        <Dialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            setIsDialogOpen(open)
            if (!open) resetForm()
          }}
        >
          <DialogTrigger asChild>
            <Button disabled={selectedSubjectId === 0}>
              <Plus className="w-4 h-4 mr-2" />
              Nueva Calificación
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingGrade ? "Editar Calificación" : "Nueva Calificación"}</DialogTitle>
              <DialogDescription>
                {editingGrade ? "Modifica la calificación del estudiante" : "Registra una nueva calificación"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4">
                {duplicateError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{duplicateError}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="student">Estudiante</Label>
                  <Select
                    value={formData.studentId.toString()}
                    onValueChange={(value) => {
                      setFormData({ ...formData, studentId: Number.parseInt(value) })
                      setDuplicateError("")
                    }}
                    disabled={!!editingGrade}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un estudiante" />
                    </SelectTrigger>
                    <SelectContent>
                      {students.map((student) => (
                        <SelectItem key={student.id} value={student.id.toString()}>
                          {student.firstName} {student.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="assignment">Evaluación</Label>
                  <Select
                    value={formData.assignmentId.toString()}
                    onValueChange={(value) => {
                      setFormData({ ...formData, assignmentId: Number.parseInt(value) })
                      setDuplicateError("")
                    }}
                    disabled={!!editingGrade}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una evaluación" />
                    </SelectTrigger>
                    <SelectContent>
                      {assignments.map((assignment) => (
                        <SelectItem key={assignment.id} value={assignment.id.toString()}>
                          {assignment.name} ({assignment.weight}%)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="score">Calificación (0.0-5.0)</Label>
                  <Input
                    id="score"
                    type="number"
                    min="0"
                    max="5"
                    step="0.1"
                    value={Number.isNaN(formData.score) ? '' : String(formData.score)}
                    onChange={(e) => {
                      const raw = e.target.value
                      const parsed = raw === '' ? NaN : Number.parseFloat(raw)
                      setFormData({ ...formData, score: Number.isNaN(parsed) ? 0 : parsed })
                    }}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="comments">Comentarios (opcional)</Label>
                  <Textarea
                    id="comments"
                    value={formData.comments}
                    onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                    rows={3}
                    placeholder="Comentarios sobre la calificación..."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">{editingGrade ? "Guardar Cambios" : "Registrar Calificación"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {selectedSubjectId > 0 && (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Estudiante</TableHead>
                <TableHead>Evaluación</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Calificación</TableHead>
                <TableHead>Promedio Final</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {grades.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No hay calificaciones registradas
                  </TableCell>
                </TableRow>
              ) : (
                grades.map((grade) => {
                  const finalGrade = calculateFinalGrade(grade.studentId)
                  return (
                    <TableRow key={grade.id}>
                      <TableCell className="font-medium">{getStudentName(grade.studentId)}</TableCell>
                      <TableCell>{getAssignmentName(grade.assignmentId)}</TableCell>
                      <TableCell>{getAssignmentTypeBadge(getAssignmentType(grade.assignmentId))}</TableCell>
                      <TableCell>
                        <span className={grade.score >= 3.0 ? "text-green-600" : "text-red-600"}>{grade.score}</span>
                      </TableCell>
                      <TableCell>
                        {finalGrade !== null ? (
                          <div className="flex items-center gap-2">
                            <Calculator className="w-4 h-4 text-muted-foreground" />
                            <span
                              className={finalGrade >= 3.0 ? "text-green-600 font-medium" : "text-red-600 font-medium"}
                            >
                              {finalGrade.toFixed(1)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(grade)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteGradeId(grade.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <AlertDialog open={deleteGradeId !== null} onOpenChange={() => setDeleteGradeId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar calificación?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La calificación será eliminada permanentemente del sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteGradeId && handleDelete(deleteGradeId)}
              className="bg-red-600 hover:bg-red-700"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
