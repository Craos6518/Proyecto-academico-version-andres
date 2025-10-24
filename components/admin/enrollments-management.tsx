"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { normalizeRole } from "@/lib/auth"
import type { Enrollment, User, Subject } from "@/lib/types"
import { Trash2, Search, UserPlus } from "lucide-react"

export function EnrollmentsManagement() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [students, setStudents] = useState<User[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<"all" | "student" | "subject">("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    studentId: 0,
    subjectId: 0,
    status: "active" as const,
  })
  const [deleteCandidate, setDeleteCandidate] = useState<Enrollment | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])
  const loadData = async () => {
    try {
      const [enrollRes, usersRes, subjectsRes] = await Promise.all([
        fetch("/api/admin/enrollments"),
        fetch("/api/admin/users"),
        fetch("/api/admin/subjects"),
      ])

      if (!enrollRes.ok || !usersRes.ok || !subjectsRes.ok) {
        throw new Error("Error fetching data")
      }

      const allEnrollments: Enrollment[] = await enrollRes.json()
      const allUsers: User[] = await usersRes.json()
      const allSubjects: Subject[] = await subjectsRes.json()

  const allStudents = allUsers.filter((u) => normalizeRole(u.role ?? u.roleName) === "student")

      setEnrollments(allEnrollments)
      setStudents(allStudents)
      setSubjects(allSubjects)

      if (allStudents.length > 0) {
        setFormData((prev) => ({ ...prev, studentId: allStudents[0].id }))
      }
      if (allSubjects.length > 0) {
        setFormData((prev) => ({ ...prev, subjectId: allSubjects[0].id }))
      }
    } catch (err) {
      console.error(err)
      alert("No se pudo cargar la información de inscripciones. Revisa la consola.")
    }
  }

  // Get enriched enrollment data with student and subject names
  const enrichedEnrollments = enrollments.map((enrollment) => {
    const student = students.find((s) => s.id === enrollment.studentId)
    const subject = subjects.find((s) => s.id === enrollment.subjectId)
    return {
      ...enrollment,
      studentName: student ? `${student.firstName} ${student.lastName}` : "Desconocido",
      subjectName: subject?.name || "Desconocido",
      subjectCode: subject?.code || "",
    }
  })

  const filteredEnrollments = enrichedEnrollments.filter((enrollment) => {
    const matchesSearch =
      enrollment.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      enrollment.subjectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      enrollment.subjectCode.toLowerCase().includes(searchTerm.toLowerCase())

    return matchesSearch
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Check if enrollment already exists
    const exists = enrollments.some((en) => en.studentId === formData.studentId && en.subjectId === formData.subjectId)

    if (exists) {
      alert("Este estudiante ya está inscrito en esta materia")
      return
    }

    ;(async () => {
      try {
        const res = await fetch("/api/admin/enrollments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            studentId: formData.studentId,
            subjectId: formData.subjectId,
            enrollmentDate: new Date().toISOString(),
            status: formData.status,
          }),
        })

        if (!res.ok) {
          const err = await res.text()
          throw new Error(err || "Error creating enrollment")
        }

        await loadData()
        setIsDialogOpen(false)
        resetForm()
      } catch (err) {
        console.error(err)
        alert("No se pudo crear la inscripción. Revisa la consola.")
      }
    })()
  }

  const handleDelete = (enrollment: Enrollment) => {
    setDeleteCandidate(enrollment)
    setDeleteErrorMessage(null)
    setIsDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!deleteCandidate) return
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/admin/enrollments?id=${deleteCandidate.id}`, { method: "DELETE" })
      if (!res.ok) {
        let msg = 'Error eliminando la inscripción'
        try { const body = await res.json(); msg = body?.error || JSON.stringify(body) } catch (e) { try { msg = await res.text() } catch(_){} }
        setDeleteErrorMessage(msg)
        return
      }
      setIsDeleteDialogOpen(false)
      setDeleteCandidate(null)
      setDeleteErrorMessage(null)
      await loadData()
    } catch (err) {
      console.error(err)
      setDeleteErrorMessage('No se pudo eliminar la inscripción. Revisa la consola.')
    } finally {
      setIsDeleting(false)
    }
  }

  const resetForm = () => {
    setFormData({
      studentId: students[0]?.id || 0,
      subjectId: subjects[0]?.id || 0,
      status: "active",
    })
  }

  // Get enrollment stats
  const stats = {
    total: enrollments.length,
    active: enrollments.filter((e) => e.status === "active").length,
    bySubject: subjects.map((subject) => ({
      subject: subject.name,
      count: enrollments.filter((e) => e.subjectId === subject.id).length,
    })),
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 border rounded-lg">
          <div className="text-sm text-muted-foreground">Total Inscripciones</div>
          <div className="text-2xl font-bold">{stats.total}</div>
        </div>
        <div className="p-4 border rounded-lg">
          <div className="text-sm text-muted-foreground">Inscripciones Activas</div>
          <div className="text-2xl font-bold">{stats.active}</div>
        </div>
        <div className="p-4 border rounded-lg">
          <div className="text-sm text-muted-foreground">Materias con Estudiantes</div>
          <div className="text-2xl font-bold">{stats.bySubject.filter((s) => s.count > 0).length}</div>
        </div>
      </div>

      {/* Search and Add */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por estudiante o materia..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        <Dialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            setIsDialogOpen(open)
            if (!open) resetForm()
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="w-4 h-4 mr-2" />
              Inscribir Estudiante
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Inscribir Estudiante a Materia</DialogTitle>
              <DialogDescription>Selecciona el estudiante y la materia para crear la inscripción</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="student">Estudiante</Label>
                  <Select
                    value={formData.studentId.toString()}
                    onValueChange={(value) => setFormData({ ...formData, studentId: Number.parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un estudiante" />
                    </SelectTrigger>
                    <SelectContent>
                      {students.map((student) => (
                        <SelectItem key={student.id} value={student.id.toString()}>
                          {student.firstName} {student.lastName} - {student.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">Materia</Label>
                  <Select
                    value={formData.subjectId.toString()}
                    onValueChange={(value) => setFormData({ ...formData, subjectId: Number.parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una materia" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((subject) => (
                        <SelectItem key={subject.id} value={subject.id.toString()}>
                          {subject.code} - {subject.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Estado</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: any) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Activo</SelectItem>
                      <SelectItem value="completed">Completado</SelectItem>
                      <SelectItem value="dropped">Retirado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Crear Inscripción</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      
        {/* Delete confirmation dialog for enrollments */}
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
                {deleteCandidate ? `Vas a eliminar la inscripción de ${deleteCandidate.studentId} en la materia ${deleteCandidate.subjectId}. Esta acción no se puede deshacer.` : '¿Estás seguro de eliminar esta inscripción?'}
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

      {/* Enrollments Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Estudiante</TableHead>
              <TableHead>Materia</TableHead>
              <TableHead>Código</TableHead>
              <TableHead>Fecha de Inscripción</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEnrollments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No se encontraron inscripciones
                </TableCell>
              </TableRow>
            ) : (
              filteredEnrollments.map((enrollment) => (
                <TableRow key={enrollment.id}>
                  <TableCell className="font-medium">{enrollment.studentName}</TableCell>
                  <TableCell>{enrollment.subjectName}</TableCell>
                  <TableCell>{enrollment.subjectCode}</TableCell>
                  <TableCell>{new Date(enrollment.enrollmentDate).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        enrollment.status === "active"
                          ? "default"
                          : enrollment.status === "completed"
                            ? "secondary"
                            : "destructive"
                      }
                    >
                      {enrollment.status === "active"
                        ? "Activo"
                        : enrollment.status === "completed"
                          ? "Completado"
                          : "Retirado"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(enrollment)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
