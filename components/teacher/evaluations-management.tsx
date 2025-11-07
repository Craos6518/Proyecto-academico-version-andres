"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import type { Assignment, Subject } from "@/lib/types"
import { Plus, Pencil, Trash2, Calendar, FileText, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface EvaluationsManagementProps {
  teacherId: number
}

export function EvaluationsManagement({ teacherId }: EvaluationsManagementProps) {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [selectedSubject, setSelectedSubject] = useState<number | "all">("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null)
  const [deleteCandidate, setDeleteCandidate] = useState<Assignment | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    subjectId: 0,
    name: "",
    description: "",
    assignmentType: "parcial1" as "parcial1" | "parcial2" | "final",
    maxScore: 5.0,
    weight: 30,
    dueDate: "",
  })

  useEffect(() => {
    ;(async () => {
      try {
        const subjectsRes = await fetch(`/api/admin/subjects?teacherId=${teacherId}`)
        if (!subjectsRes.ok) throw new Error("Error fetching subjects")
  const teacherSubjects: Subject[] = await subjectsRes.json()
        setSubjects(teacherSubjects)

        const assignsRes = await fetch(`/api/teacher/assignments`)
        if (!assignsRes.ok) throw new Error("Error fetching assignments")
        const allAssignmentsRaw = (await assignsRes.json()) as Array<Record<string, unknown>>
        const teacherAssignments = allAssignmentsRaw
          .filter((a) => {
            const subjId = Number(a["subjectId"] ?? a["subject_id"] ?? 0)
            return teacherSubjects.some((s: Subject) => s.id === subjId)
          })
          .map((a) => {
            const id = Number(a["id"] ?? 0)
            const subjectId = Number(a["subjectId"] ?? a["subject_id"] ?? 0)
            const name = String(a["name"] ?? "")
            const description = a["description"] != null ? String(a["description"]) : undefined
            const rawType = String(a["assignmentType"] ?? a["assignment_type"] ?? "parcial1")
            const assignmentType = (rawType === "parcial1" || rawType === "parcial2" || rawType === "final")
              ? (rawType as Assignment["assignmentType"]) : ("parcial1" as Assignment["assignmentType"])
            const maxScore = a["maxScore"] != null ? Number(a["maxScore"]) : Number(a["max_score"] ?? 5)
            const weight = a["weight"] != null ? Number(a["weight"]) : Number(a["weight"] ?? 0)
            const dueDate = a["dueDate"] ?? a["due_date"] ?? ""
            const createdAt = a["createdAt"] != null ? String(a["createdAt"]) : undefined
            const updatedAt = a["updatedAt"] != null ? String(a["updatedAt"]) : undefined
            return {
              id,
              subjectId,
              name,
              description,
              assignmentType,
              maxScore,
              weight,
              dueDate: String(dueDate),
              createdAt,
              updatedAt,
            } as Assignment
          })
        setAssignments(teacherAssignments)
      } catch (err) {
        console.error(err)
      }
    })()
  }, [teacherId])

  const filteredAssignments =
    selectedSubject === "all" ? assignments : assignments.filter((a) => a.subjectId === selectedSubject)

  const getSubjectName = (subjectId: number) => {
    return subjects.find((s) => s.id === subjectId)?.name || "Desconocida"
  }

  const getAssignmentTypeLabel = (type: string) => {
    const labels = {
      parcial1: "Parcial 1",
      parcial2: "Parcial 2",
      final: "Final",
    }
    return labels[type as keyof typeof labels] || type
  }

  const getAssignmentTypeBadge = (type: string) => {
    type BadgeVariant = "default" | "secondary" | "destructive" | "outline"
    const variants: Record<string, BadgeVariant> = {
      parcial1: "default",
      parcial2: "secondary",
      final: "destructive",
    }
    return variants[type as keyof typeof variants] ?? "default"
  }

  const calculateWeightTotal = (subjectId: number, excludeId?: number) => {
    return assignments
      .filter((a) => a.subjectId === subjectId && a.id !== excludeId)
      .reduce((sum, a) => sum + a.weight, 0)
  }

  const handleOpenDialog = (assignment?: Assignment) => {
    if (assignment) {
      setEditingAssignment(assignment)
      setFormData({
        subjectId: assignment.subjectId,
        name: assignment.name,
  description: assignment.description || "",
        assignmentType: assignment.assignmentType,
        maxScore: assignment.maxScore,
        weight: assignment.weight,
        dueDate: assignment.dueDate,
      })
    } else {
      setEditingAssignment(null)
      setFormData({
        subjectId: subjects[0]?.id || 0,
        name: "",
        description: "",
        assignmentType: "parcial1",
        maxScore: 5.0,
        weight: 30,
        dueDate: "",
      })
    }
    setIsDialogOpen(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    ;(async () => {
      try {
        if (editingAssignment) {
          const res = await fetch(`/api/teacher/assignments`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: editingAssignment.id, ...formData }),
          })
          if (!res.ok) throw new Error("Error updating assignment")
        } else {
          const res = await fetch(`/api/teacher/assignments`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData),
          })
          if (!res.ok) throw new Error("Error creating assignment")
        }

        // reload
        const assignsRes = await fetch(`/api/teacher/assignments`)
        const allAssignmentsRaw = (await assignsRes.json()) as Array<Record<string, unknown>>
        const teacherAssignmentsReload = allAssignmentsRaw
          .filter((a) => subjects.some((s) => s.id === Number(a["subjectId"] ?? a["subject_id"] ?? 0)))
          .map((a) => ({
            id: Number(a["id"] ?? 0),
            subjectId: Number(a["subjectId"] ?? a["subject_id"] ?? 0),
            name: String(a["name"] ?? ""),
            description: a["description"] != null ? String(a["description"]) : undefined,
            assignmentType: (String(a["assignmentType"] ?? a["assignment_type"] ?? "parcial1") as Assignment["assignmentType"]),
            maxScore: a["maxScore"] != null ? Number(a["maxScore"]) : Number(a["max_score"] ?? 5),
            weight: a["weight"] != null ? Number(a["weight"]) : Number(a["weight"] ?? 0),
            dueDate: String(a["dueDate"] ?? a["due_date"] ?? ""),
            createdAt: a["createdAt"] != null ? String(a["createdAt"]) : undefined,
            updatedAt: a["updatedAt"] != null ? String(a["updatedAt"]) : undefined,
          })) as Assignment[]
        setAssignments(teacherAssignmentsReload)
        setIsDialogOpen(false)
      } catch (err) {
        console.error(err)
        alert("Error al guardar la evaluación")
      }
    })()
  }

  const handleDelete = (assignment: Assignment) => {
    setDeleteCandidate(assignment)
    setDeleteErrorMessage(null)
    setIsDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!deleteCandidate) return
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/teacher/assignments?id=${deleteCandidate.id}`, { method: "DELETE" })
      if (!res.ok) {
        let msg = 'Error eliminando la evaluación'
        try {
          const body = await res.json()
          msg = body?.error || JSON.stringify(body)
        } catch {
          try {
            msg = await res.text()
          } catch {
            // ignore
          }
        }
        setDeleteErrorMessage(msg)
        return
      }
        // reload assignments
        const assignsRes2 = await fetch(`/api/teacher/assignments`)
        const allAssignments2 = (await assignsRes2.json()) as Array<Record<string, unknown>>
        const teacherAssignments2 = allAssignments2
          .filter((a) => subjects.some((s) => s.id === Number(a["subjectId"] ?? a["subject_id"] ?? 0)))
          .map((a) => ({
            id: Number(a["id"] ?? 0),
            subjectId: Number(a["subjectId"] ?? a["subject_id"] ?? 0),
            name: String(a["name"] ?? ""),
            description: a["description"] != null ? String(a["description"]) : undefined,
            assignmentType: (String(a["assignmentType"] ?? a["assignment_type"] ?? "parcial1") as Assignment["assignmentType"]),
            maxScore: a["maxScore"] != null ? Number(a["maxScore"]) : Number(a["max_score"] ?? 5),
            weight: a["weight"] != null ? Number(a["weight"]) : Number(a["weight"] ?? 0),
            dueDate: String(a["dueDate"] ?? a["due_date"] ?? ""),
            createdAt: a["createdAt"] != null ? String(a["createdAt"]) : undefined,
            updatedAt: a["updatedAt"] != null ? String(a["updatedAt"]) : undefined,
          })) as Assignment[]
        setAssignments(teacherAssignments2)
      setIsDeleteDialogOpen(false)
      setDeleteCandidate(null)
      setDeleteErrorMessage(null)
    } catch (err) {
      console.error(err)
      setDeleteErrorMessage('No se pudo eliminar la evaluación')
    } finally {
      setIsDeleting(false)
    }
  }

  const currentWeightTotal = formData.subjectId ? calculateWeightTotal(formData.subjectId, editingAssignment?.id) : 0
  const remainingWeight = 100 - currentWeightTotal
  const isWeightValid = formData.weight <= remainingWeight

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Label htmlFor="subject-filter">Filtrar por materia:</Label>
          <Select
            value={selectedSubject.toString()}
            onValueChange={(value) => setSelectedSubject(value === "all" ? "all" : Number(value))}
          >
            <SelectTrigger id="subject-filter" className="w-[250px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las materias</SelectItem>
              {subjects.map((subject) => (
                <SelectItem key={subject.id} value={subject.id.toString()}>
                  {subject.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              Nueva Evaluación
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingAssignment ? "Editar Evaluación" : "Nueva Evaluación"}</DialogTitle>
              <DialogDescription>
                {editingAssignment
                  ? "Modifica los datos de la evaluación"
                  : "Crea una nueva evaluación para tus estudiantes"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="subject">Materia</Label>
                  <Select
                    value={formData.subjectId.toString()}
                    onValueChange={(value) => setFormData({ ...formData, subjectId: Number(value) })}
                  >
                    <SelectTrigger id="subject">
                      <SelectValue placeholder="Selecciona una materia" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((subject) => (
                        <SelectItem key={subject.id} value={subject.id.toString()}>
                          {subject.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="name">Nombre de la Evaluación</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ej: Parcial 1 - Derivadas"
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe el contenido de la evaluación"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="type">Tipo de Evaluación</Label>
                    <Select
                      value={formData.assignmentType}
                      onValueChange={(value: "parcial1" | "parcial2" | "final") =>
                        setFormData({ ...formData, assignmentType: value })
                      }
                    >
                      <SelectTrigger id="type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="parcial1">Parcial 1</SelectItem>
                        <SelectItem value="parcial2">Parcial 2</SelectItem>
                        <SelectItem value="final">Final</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="maxScore">Nota Máxima</Label>
                    <Input
                      id="maxScore"
                      type="number"
                      step="0.1"
                      min="0"
                      max="5"
                      value={formData.maxScore}
                      onChange={(e) => setFormData({ ...formData, maxScore: Number.parseFloat(e.target.value) })}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="weight">
                      Peso (%)
                      {formData.subjectId > 0 && (
                        <span className="text-xs text-muted-foreground ml-2">Disponible: {remainingWeight}%</span>
                      )}
                    </Label>
                    <Input
                      id="weight"
                      type="number"
                      min="0"
                      max="100"
                      value={formData.weight}
                      onChange={(e) => setFormData({ ...formData, weight: Number.parseInt(e.target.value) })}
                      required
                    />
                    {!isWeightValid && (
                      <Alert variant="destructive" className="py-2">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-xs">
                          El peso excede el disponible ({remainingWeight}%)
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="dueDate">Fecha de Entrega</Label>
                    <Input
                      id="dueDate"
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={!isWeightValid}>
                  {editingAssignment ? "Guardar Cambios" : "Crear Evaluación"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      
          {/* Delete confirmation dialog for assignments */}
          <Dialog
            open={isDeleteDialogOpen}
            onOpenChange={(open) => {
              setIsDeleteDialogOpen(open)
              if (!open) setDeleteCandidate(null)
            }}
          >
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Confirmar eliminación</DialogTitle>
                <DialogDescription>
                  {deleteCandidate ? `Vas a eliminar la evaluación "${deleteCandidate.name}" de la materia "${getSubjectName(deleteCandidate.subjectId)}". Esta acción no se puede deshacer.` : '¿Estás seguro de eliminar esta evaluación?'}
                  <div className="text-sm text-muted-foreground mt-2">Nota: Si la evaluación tiene calificaciones registradas, no podrá eliminarse y se mostrará un mensaje explicativo.</div>
                </DialogDescription>
              </DialogHeader>

              {deleteErrorMessage && (
                <div className="my-2 p-2 bg-red-50 border border-red-200 rounded text-sm">{deleteErrorMessage}</div>
              )}

              <div className="mt-4 flex justify-end gap-2">
                <Button variant="secondary" onClick={() => { setIsDeleteDialogOpen(false); setDeleteCandidate(null); setDeleteErrorMessage(null); }} disabled={isDeleting}>
                  Cancelar
                </Button>
                <Button variant="destructive" onClick={confirmDelete} disabled={isDeleting}>
                  {isDeleting ? 'Eliminando...' : 'Eliminar'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
      </div>

      {filteredAssignments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No hay evaluaciones creadas</p>
            <p className="text-sm text-muted-foreground">Crea tu primera evaluación para comenzar</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Evaluaciones</CardTitle>
            <CardDescription>Gestiona las evaluaciones de tus materias</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Materia</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Peso</TableHead>
                  <TableHead>Nota Máx.</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAssignments.map((assignment) => (
                  <TableRow key={assignment.id}>
                    <TableCell className="font-medium">{getSubjectName(assignment.subjectId)}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{assignment.name}</div>
                        {assignment.description && (
                          <div className="text-sm text-muted-foreground">{assignment.description}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getAssignmentTypeBadge(assignment.assignmentType)}>
                        {getAssignmentTypeLabel(assignment.assignmentType)}
                      </Badge>
                    </TableCell>
                    <TableCell>{assignment.weight}%</TableCell>
                    <TableCell>{assignment.maxScore}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="w-3 h-3" />
                        {new Date(assignment.dueDate).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(assignment)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(assignment)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
