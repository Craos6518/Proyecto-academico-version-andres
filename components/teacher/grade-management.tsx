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
  const [duplicateError, setDuplicateError] = useState<string>("")
  // Batch grading (iterative) states
  const [batchMode, setBatchMode] = useState(false)
  const [gradingQueue, setGradingQueue] = useState<number[]>([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [skippedStudents, setSkippedStudents] = useState<number[]>([])
  const [pendingStudents, setPendingStudents] = useState<number[]>([])
  const [currentBatchAssignmentId, setCurrentBatchAssignmentId] = useState<number | null>(null)
  const [pendingAssignmentId, setPendingAssignmentId] = useState<number | null>(null)

  // compute assignments that still have at least one student without grade
  const eligibleAssignments = useMemo(() => {
    if (!assignments || assignments.length === 0) return [] as typeof assignments
    // if no students known, return assignments (allow teacher to pick)
    if (!students || students.length === 0) return assignments
    return assignments.filter((a) => {
      const gradedStudentIds = new Set(grades.filter((g) => g.assignmentId === a.id).map((g) => g.studentId))
      return gradedStudentIds.size < students.length
    })
  }, [assignments, grades, students])

  const buildQueueForAssignment = (assignmentId: number) => {
    if (!assignmentId) return [] as number[]
    return students
      .filter((s) => !grades.some((g) => g.assignmentId === assignmentId && g.studentId === s.id))
      .map((s) => s.id)
  }
  const [formData, setFormData] = useState({
    studentId: 0,
    assignmentId: 0,
    score: 0,
    comments: "",
  })

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch(`/api/admin/subjects?teacherId=${teacherId}`)
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
            fetch(`/api/admin/enrollments?subjectId=${selectedSubjectId}`),
            fetch(`/api/teacher/grades?subjectId=${selectedSubjectId}`),
            fetch(`/api/teacher/assignments?subjectId=${selectedSubjectId}`),
            fetch(`/api/admin/users`),
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
        } catch (err) {
          console.error(err)
        }
      })()
    }
  }, [selectedSubjectId])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

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
            })
          )

        setIsDialogOpen(false)
        resetForm()
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

  const handleDelete = (gradeId: number) => {
    ;(async () => {
      try {
        const res = await fetch(`/api/teacher/grades?id=${gradeId}`, { method: "DELETE" })
        if (!res.ok) throw new Error("Error deleting grade")
        const gradesRes = await fetch(`/api/teacher/grades?subjectId=${selectedSubjectId}`)
        const gradesData: Grade[] = await gradesRes.json()
        setGrades(gradesData)
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
      studentId: students[0]?.id || 0,
      assignmentId: assignments[0]?.id || 0,
      score: 0,
      comments: "",
    })
  }

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
    return val !== undefined ? (val as number | null) : null;
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
                // If we opened dialog for creating (not editing), start batch grading for the first eligible assignment
                if (!editingGrade) {
                  const chosenAssignmentId = eligibleAssignments[0]?.id ?? assignments[0]?.id ?? 0
                  const queue = buildQueueForAssignment(chosenAssignmentId)
                  setGradingQueue(queue)
                  setCurrentIdx(0)
                  setSkippedStudents([])
                  setBatchMode(queue.length > 0)
                  setCurrentBatchAssignmentId(chosenAssignmentId || null)
                  setFormData({
                    studentId: queue[0] ?? 0,
                    assignmentId: chosenAssignmentId,
                    score: 0,
                    comments: "",
                  })
                }
              } else {
                resetForm()
                setBatchMode(false)
                setCurrentBatchAssignmentId(null)
              }
          }}
        >
          <DialogTrigger asChild>
            <Button disabled={selectedSubjectId === 0 || eligibleAssignments.length === 0}>
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
                {/* Student selector: in batchMode show one student at a time, otherwise keep select for single edit/create */}
                {batchMode ? (
                  <div className="space-y-2">
                    <Label>Estudiante</Label>
                    <div className="p-3 border rounded-md">
                      {students[currentIdx] ? (
                        <div>
                          <div className="font-medium">{students[currentIdx].firstName} {students[currentIdx].lastName}</div>
                          <div className="text-sm text-muted-foreground">{students[currentIdx].username}</div>
                        </div>
                      ) : (
                        <div className="text-muted-foreground">Sin estudiante</div>
                      )}
                    </div>
                  </div>
                ) : (
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
                        {(formData.assignmentId
                          ? students.filter((s) => !grades.some((g) => g.assignmentId === formData.assignmentId && g.studentId === s.id))
                          : students
                        ).map((student) => (
                          <SelectItem key={student.id} value={student.id.toString()}>
                            {student.firstName} {student.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="assignment">Evaluación</Label>
                  <Select
                    value={formData.assignmentId.toString()}
                    onValueChange={(value) => {
                      const aid = Number.parseInt(value)
                      setFormData({ ...formData, assignmentId: aid })
                      setDuplicateError("")
                      // if batchMode, rebuild queue for the selected assignment
                      if (batchMode && !editingGrade) {
                        const queue = buildQueueForAssignment(aid)
                        setGradingQueue(queue)
                        setCurrentIdx(0)
                        setFormData((fd) => ({ ...fd, studentId: queue[0] ?? 0 }))
                        setCurrentBatchAssignmentId(aid)
                      }
                    }}
                    disabled={!!editingGrade}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una evaluación" />
                    </SelectTrigger>
                    <SelectContent>
                      {eligibleAssignments.map((assignment) => (
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

              <DialogFooter className="flex items-center gap-2">
                {batchMode && !editingGrade ? (
                  <>
                    <Button
                      onClick={async () => {
                        // save current and move next
                        const studentId = gradingQueue[currentIdx]
                        if (!studentId) return
                        try {
                          // check duplicate
                          const existing = grades.find((g) => g.studentId === studentId && g.assignmentId === formData.assignmentId)
                          if (existing) {
                            setDuplicateError(
                              `Ya existe una calificación para ${getStudentName(studentId)} en ${getAssignmentName(
                                formData.assignmentId,
                              )}. Por favor, edita la calificación existente.`,
                            )
                            return
                          }
                          const res = await fetch(`/api/teacher/grades`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              studentId,
                              assignmentId: formData.assignmentId,
                              subjectId: selectedSubjectId,
                              score: formData.score,
                              comments: formData.comments,
                              gradedBy: teacherId,
                              gradedAt: new Date().toISOString(),
                            }),
                          })
                          if (!res.ok) throw new Error("Error creating grade")
                          // reload grades
                          const gradesRes = await fetch(`/api/teacher/grades?subjectId=${selectedSubjectId}`)
                          if (gradesRes.ok) {
                            const gradesData: Grade[] = await gradesRes.json()
                            setGrades(
                              gradesData.map((g) => {
                                const gr = g as unknown as Record<string, unknown>
                                const studentId = Number(gr["studentId"] ?? gr["student_id"] ?? 0)
                                const assignmentId = Number(gr["assignmentId"] ?? gr["assignment_id"] ?? 0)
                                return { ...(g as object), studentId, assignmentId } as Grade
                              }),
                            )
                          }
                          // move next
                          const next = currentIdx + 1
                          if (next >= gradingQueue.length) {
                            setIsDialogOpen(false)
                            setBatchMode(false)
                          } else {
                            setCurrentIdx(next)
                            setFormData({ ...formData, studentId: gradingQueue[next], score: 0, comments: "" })
                          }
                        } catch (err) {
                          console.error(err)
                          alert("Error al guardar la calificación")
                        }
                      }}
                    >
                      Guardar y Siguiente
                    </Button>

                    <Button
                      variant="ghost"
                      onClick={() => {
                        const studentId = gradingQueue[currentIdx]
                        if (!studentId) return
                        setSkippedStudents((s) => Array.from(new Set([...s, studentId])))
                        const next = currentIdx + 1
                        if (next >= gradingQueue.length) {
                          setIsDialogOpen(false)
                          setBatchMode(false)
                        } else {
                          setCurrentIdx(next)
                          setFormData({ ...formData, studentId: gradingQueue[next], score: 0, comments: "" })
                        }
                      }}
                    >
                      Omitir
                    </Button>

                    <Button
                      variant="secondary"
                      onClick={() => {
                        // finish without grading remaining
                        setIsDialogOpen(false)
                        setBatchMode(false)
                        // create pending list from remaining ungraded + skipped
                        const remaining = gradingQueue.slice(currentIdx).filter(Boolean)
                        const pendIds = Array.from(new Set([...skippedStudents, ...remaining]))
                        setPendingStudents(pendIds)
                      }}
                    >
                      Finalizar
                    </Button>
                  </>
                ) : (
                  <Button type="submit">{editingGrade ? "Guardar Cambios" : "Registrar Calificación"}</Button>
                )}
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {selectedSubjectId > 0 && (
        <div className="border rounded-lg">
          {/* Pending skipped students area */}
          {pendingStudents.length > 0 && (
            <div className="p-3 border-b flex items-center justify-between">
              <div>
                <div className="font-medium">Lista de pendientes</div>
                <div className="text-sm text-muted-foreground">{pendingStudents.length} estudiante(s) sin calificar</div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => {
                    // start grading only pending students for the pending assignment if available
                    const aid = pendingAssignmentId ?? eligibleAssignments[0]?.id ?? assignments[0]?.id ?? 0
                    const queue = pendingStudents.filter((id) => !grades.some((g) => g.assignmentId === aid && g.studentId === id))
                    setGradingQueue(queue)
                    setCurrentIdx(0)
                    setSkippedStudents([])
                    setBatchMode(queue.length > 0)
                    setIsDialogOpen(true)
                    const first = queue[0] ?? null
                    setFormData({ studentId: first ?? 0, assignmentId: aid, score: 0, comments: "" })
                    setPendingStudents([])
                    setPendingAssignmentId(null)
                    setCurrentBatchAssignmentId(aid)
                  }}
                >
                  Iniciar lista de pendientes
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setPendingStudents([])}
                >
                  Limpiar
                </Button>
              </div>
            </div>
          )}
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
