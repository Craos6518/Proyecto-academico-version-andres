"use client"

import type React from "react"

import { useState, useEffect, useMemo } from "react"
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
import { normalizeRole } from "@/lib/auth"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { Grade, Subject, User, Assignment } from "@/lib/types"
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
  const [finalGradesMap, setFinalGradesMap] = useState<Record<number, number | null>>({})
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingGrade, setEditingGrade] = useState<Grade | null>(null)
  const [deleteGradeId, setDeleteGradeId] = useState<number | null>(null)
  const [currentStudentIndex, setCurrentStudentIndex] = useState<number>(0)
  const [duplicateError, setDuplicateError] = useState<string>("")
  const [skippedStudentIds, setSkippedStudentIds] = useState<number[]>([])
  const [formData, setFormData] = useState({
    studentId: 0,
    assignmentId: 0,
    score: 0,
    comments: "",
  })

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch(`/api/teacher/subjects?teacherId=${teacherId}`)
        if (!res.ok) throw new Error("Error fetching subjects")
        const data: Subject[] = await res.json()
        setSubjects(data)
        if (data.length > 0) setSelectedSubjectId(data[0].id)
      } catch (err) {
        console.error(err)
      }
    })()
  }, [teacherId])

  useEffect(() => {
    if (selectedSubjectId > 0) {
      ;(async () => {
        try {
          const [enrRes, gradesRes, assignsRes, usersRes] = await Promise.all([
            fetch(`/api/teacher/enrollments?subjectId=${selectedSubjectId}`),
            fetch(`/api/teacher/grades?subjectId=${selectedSubjectId}`),
            fetch(`/api/teacher/assignments?subjectId=${selectedSubjectId}`),
            fetch(`/api/teacher/students?subjectId=${selectedSubjectId}`),
          ])

          if (!enrRes.ok || !gradesRes.ok || !assignsRes.ok || !usersRes.ok) throw new Error("Error fetching subject data")

          const enrollmentsRaw = (await enrRes.json()) as Array<Record<string, unknown>>
          const gradesData: Grade[] = await gradesRes.json()
          const assignmentsData: Assignment[] = await assignsRes.json()
          const allUsers: User[] = await usersRes.json()

          // Mapeo robusto para soportar studentId/student_id y assignmentId/assignment_id
          // Filtrar estudiantes únicos por ID
          const enrolledStudents = enrollmentsRaw
            .map((e) => {
              const sidRaw = e["studentId"] ?? e["student_id"] ?? e["student"] ?? null
              const sid = sidRaw != null ? Number(sidRaw) : null
              return sid != null ? allUsers.find((u) => u.id === sid) : undefined
            })
            .filter((u): u is User => !!u)
          // Si no hay inscripciones, usar todos los usuarios con rol estudiante
          const fallbackStudents = allUsers.filter((u) => normalizeRole(u.role ?? u.roleName) === "student");
          const uniqueStudents = enrolledStudents.length > 0
            ? Array.from(new Map(enrolledStudents.map((s) => [s.id, s])).values())
            : fallbackStudents;
          setStudents(uniqueStudents)
          setGrades(
            gradesData.map((g) => {
              const gr = g as unknown as Record<string, unknown>
              const studentId = Number(gr["studentId"] ?? gr["student_id"] ?? 0)
              const assignmentId = Number(gr["assignmentId"] ?? gr["assignment_id"] ?? 0)
              return { ...(g as object), studentId, assignmentId } as Grade
            })
          );
          setAssignments(
            assignmentsData.map((a) => ({
              ...a,
              name: a.name ?? "Desconocido",
            }))
          );

          // Fetch final grades for each student in parallel
          const uniqueStudentIds = Array.from(new Set(uniqueStudents.map((s) => s.id)))
          const finalsPromises = uniqueStudentIds.map((sid) =>
            fetch(`/api/teacher/calculate-final-grade?studentId=${sid}&subjectId=${selectedSubjectId}`).then((r) =>
              r.ok ? r.json().then((d) => ({ sid, final: d.finalGrade })) : { sid, final: null },
            ),
          )

          const finals = await Promise.all(finalsPromises)
          const finalsMap: Record<number, number | null> = {}
          finals.forEach((f) => {
            const fr = f as { sid: number; final: number | null }
            if (fr && fr.sid !== undefined) finalsMap[Number(fr.sid)] = fr.final
          })
          setFinalGradesMap(finalsMap)
          // reset skipped students when subject changes
          setSkippedStudentIds([])
        } catch (err) {
          console.error(err)
        }
      })()
    }
  }, [selectedSubjectId])

  const handleSubmit = (e?: React.FormEvent, keepOpen = false) => {
    if (e && typeof e.preventDefault === "function") e.preventDefault()

    ;(async () => {
      try {
        if (editingGrade) {
          const res = await fetch(`/api/teacher/grades`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: editingGrade.id, score: formData.score, comments: formData.comments }),
          })
          if (!res.ok) throw new Error("Error updating grade")
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

          const res = await fetch(`/api/teacher/grades`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              studentId: formData.studentId,
              assignmentId: formData.assignmentId,
              subjectId: selectedSubjectId,
              score: formData.score,
              comments: formData.comments,
              gradedBy: teacherId,
              gradedAt: new Date().toISOString(),
            }),
          })
          if (!res.ok) throw new Error("Error creating grade")
        }

        // reload grades
        const gradesRes = await fetch(`/api/teacher/grades?subjectId=${selectedSubjectId}`)
        if (!gradesRes.ok) throw new Error("Error fetching grades")
        const gradesData: Grade[] = await gradesRes.json()
        setGrades(
          gradesData.map((g) => {
            const gr = g as unknown as Record<string, unknown>
            const studentId = Number(gr["studentId"] ?? gr["student_id"] ?? 0)
            const assignmentId = Number(gr["assignmentId"] ?? gr["assignment_id"] ?? 0)
            return { ...(g as object), studentId, assignmentId } as Grade
          }),
        )
        // Notify other parts of the app that grades changed (so cards / stats can refresh)
        try {
          if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("grades:updated", { detail: { subjectId: selectedSubjectId } }))
          }
        } catch (e) {
          /* ignore */
        }

        if (!keepOpen || editingGrade) {
          setIsDialogOpen(false)
          resetForm()
        } else {
          // Avanzar al siguiente estudiante en modo ciclo usando la lista actualizada de calificaciones
          // gradesData contiene la lista actualizada de calificaciones recibida del servidor
          const newEligible = students.filter((s) => !gradesData.some((g) => g.studentId === s.id && g.assignmentId === formData.assignmentId))
          const total = newEligible.length
          if (total > 0) {
            // Si el estudiante actual fue removido de la lista (porque ya fue calificado), mantenemos el índice
            // pero aseguramos que esté dentro del nuevo rango
            const baseIndex = currentStudentIndex % total
            const next = (baseIndex + 1) % total
            setCurrentStudentIndex(next)
            setFormData({
              studentId: newEligible[next]?.id || 0,
              assignmentId: formData.assignmentId,
              score: 0,
              comments: "",
            })
            setDuplicateError("")
            // keep dialog abierto
          } else {
            setIsDialogOpen(false)
            resetForm()
          }
        }
      } catch (err) {
        console.error(err)
        alert("Error al guardar la calificación")
      }
    })()
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

  const handleSkip = () => {
    // Mark current student as skipped for this dialog session and advance
    const currentSid = editingGrade ? editingGrade.studentId : eligibleStudents[currentStudentIndex]?.id
    if (!currentSid) return
    const newSkipped = Array.from(new Set([...skippedStudentIds, Number(currentSid)]))
    setSkippedStudentIds(newSkipped)

    // compute new eligible after skipping
    const remaining = eligibleStudents.filter((s) => !newSkipped.includes(s.id))
    if (remaining.length === 0) {
      // close dialog if no one left
      setIsDialogOpen(false)
      resetForm()
      return
    }

    // advance index within the remaining list
    const nextIndex = 0 // always start from first in remaining after skip
    setCurrentStudentIndex(nextIndex)
    setFormData((prev) => ({ ...prev, studentId: remaining[nextIndex]?.id || 0 }))
    setDuplicateError("")
  }

  const handleDelete = (gradeId: number) => {
    ;(async () => {
      try {
        const res = await fetch(`/api/teacher/grades?id=${gradeId}`, { method: "DELETE" })
        if (!res.ok) throw new Error("Error deleting grade")
        const gradesRes = await fetch(`/api/teacher/grades?subjectId=${selectedSubjectId}`)
        const gradesData: Grade[] = await gradesRes.json()
        setGrades(gradesData)
        // Notify other parts of the app that grades changed after delete
        try {
          if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("grades:updated", { detail: { subjectId: selectedSubjectId } }))
          }
        } catch (e) {
          /* ignore */
        }
        setDeleteGradeId(null)
      } catch (err) {
        console.error(err)
        alert("No se pudo eliminar la calificación")
      }
    })()
  }

  const resetForm = () => {
    setEditingGrade(null)
    setDuplicateError("")
    setFormData({
      studentId: eligibleStudents[currentStudentIndex]?.id || students[0]?.id || 0,
      assignmentId: assignments[0]?.id || 0,
      score: 0,
      comments: "",
    })
  }

  // Lista de estudiantes elegibles para la evaluación seleccionada (sin calificación para esa evaluación)
  const eligibleStudents = useMemo(() => {
    const aid = formData.assignmentId
    if (!aid) return students
    return students.filter((s) => !grades.some((g) => g.studentId === s.id && g.assignmentId === aid) && !skippedStudentIds.includes(s.id))
  }, [students, grades, formData.assignmentId, skippedStudentIds])

  // Mantener formData.studentId sincronizado con eligibleStudents cuando cambia el assignment o la lista elegible
  useEffect(() => {
    if (!isDialogOpen || editingGrade) return
    const sid = eligibleStudents[currentStudentIndex]?.id || 0
    setFormData((prev) => ({ ...prev, studentId: sid }))
  }, [eligibleStudents, currentStudentIndex, isDialogOpen, editingGrade])

  const getStudentName = (studentId: number) => {
    const student = students.find((s) => s.id === studentId)
    if (student) {
      const name = `${student.firstName ?? ""} ${student.lastName ?? ""}`.trim();
      return name !== "" ? name : student.username ?? "Desconocido";
    }
    return "Desconocido";
  }

  const getAssignmentName = (assignmentId: number) => {
    const assignment = assignments.find((a) => a.id === assignmentId)
    if (assignment) {
      return assignment.name ?? assignment.description ?? "Desconocido";
    }
    return "Desconocido";
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

  const calculateFinalGrade = (studentId: number): number | null => {
    // Return cached final grade if available, otherwise null
    const val = finalGradesMap[studentId]
    return val !== undefined ? (val as number | null) : null
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
            if (open) {
              // iniciar ciclo desde el primer estudiante al abrir nuevo diálogo
              setEditingGrade(null)
              setCurrentStudentIndex(0)
                  setSkippedStudentIds([])
              setFormData({
                studentId: students[0]?.id || 0,
                assignmentId: assignments[0]?.id || 0,
                score: 0,
                comments: "",
              })
            } else {
              resetForm()
            }
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
                  {(!editingGrade && eligibleStudents.length > 0) || editingGrade ? (
                    <div className="flex items-center justify-between gap-4">
                      <div className="font-medium">
                        {getStudentName(editingGrade ? editingGrade.studentId : eligibleStudents[currentStudentIndex]?.id || 0)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {!editingGrade ? `${currentStudentIndex + 1}/${eligibleStudents.length}` : ""}
                      </div>
                    </div>
                  ) : (
                    <div className="text-muted-foreground">No hay estudiantes sin calificación para esta evaluación</div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="assignment">Evaluación</Label>
                  <Select
                    value={formData.assignmentId.toString()}
                    onValueChange={(value) => {
                      const newAid = Number.parseInt(value)
                      // calcular estudiantes elegibles para la nueva evaluación
                      const newEligible = students.filter((s) => !grades.some((g) => g.studentId === s.id && g.assignmentId === newAid))
                      setCurrentStudentIndex(0)
                      setFormData({ ...formData, assignmentId: newAid, studentId: newEligible[0]?.id || 0 })
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
                      let value = Number.isNaN(parsed) ? 0 : parsed
                      // Clamp to allowed range 0.0 - 5.0
                      if (value < 0) value = 0
                      if (value > 5) value = 5
                      setFormData({ ...formData, score: value })
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
                {!editingGrade && (
                  <>
                    <Button type="button" variant="outline" onClick={handleSkip} disabled={eligibleStudents.length === 0}>
                      Omitir
                    </Button>
                    <Button type="button" variant="secondary" onClick={() => handleSubmit(undefined, true)} disabled={eligibleStudents.length === 0}>
                      Seguir
                    </Button>
                  </>
                )}
                <Button type="submit" disabled={!editingGrade && eligibleStudents.length === 0}>{editingGrade ? "Guardar Cambios" : "Registrar Calificación"}</Button>
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
                            <span className={finalGrade >= 3.0 ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
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
