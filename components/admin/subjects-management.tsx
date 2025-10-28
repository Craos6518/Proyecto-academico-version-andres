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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Subject, User } from "@/lib/types"
import { Plus, Pencil, Trash2, Search } from "lucide-react"

export function SubjectsManagement() {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null)
  const [deleteCandidate, setDeleteCandidate] = useState<Subject | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    credits: 3,
    teacherId: 0,
  })

  const [teachers, setTeachers] = useState<User[]>([])

  useEffect(() => {
    loadSubjects()
    fetch('/api/admin/users')
      .then((r) => r.json())
      .then((data) => {
        const arr = (data || []) as Array<Record<string, unknown>>
        const profs: User[] = arr
          .filter((u) => ((u['roleName'] as string | undefined) ?? (u['role_name'] as string | undefined)) === 'Profesor')
          .map((u) => ({
            id: Number(u['id']),
            username: String(u['username'] ?? ''),
            email: String(u['email'] ?? ''),
            firstName: String(u['firstName'] ?? u['first_name'] ?? ''),
            lastName: String(u['lastName'] ?? u['last_name'] ?? ''),
            roleName: String((u['roleName'] ?? u['role_name']) ?? ''),
          }))

        setTeachers(profs)
      })
      .catch((err) => console.error('Failed to load teachers', err))
  }, [])

  const loadSubjects = () => {
    fetch('/api/admin/subjects')
      .then((r) => r.json())
      .then((data) => setSubjects(data || []))
      .catch((err) => console.error('Failed to load subjects', err))
  }

  const filteredSubjects = subjects.filter(
    (subject) =>
      subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subject.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
  (subject.teacherName || "").toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const teacher = teachers.find((t) => t.id === formData.teacherId)
    const payload = { ...formData, teacherName: teacher ? `${teacher.firstName} ${teacher.lastName}` : "" }

    if (editingSubject) {
      fetch('/api/admin/subjects', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editingSubject.id, ...payload }) })
        .then(() => { loadSubjects(); setIsDialogOpen(false); resetForm() })
        .catch((err) => console.error('Failed to update subject', err))
    } else {
      fetch('/api/admin/subjects', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
        .then(() => { loadSubjects(); setIsDialogOpen(false); resetForm() })
        .catch((err) => console.error('Failed to create subject', err))
    }
  }

  const handleEdit = (subject: Subject) => {
    setEditingSubject(subject)
    setFormData({
      name: subject.name,
      code: subject.code,
  description: subject.description || "",
  credits: subject.credits ?? 0,
  teacherId: subject.teacherId ?? 0,
    })
    setIsDialogOpen(true)
  }

  const handleDelete = (subject: Subject) => {
    setDeleteCandidate(subject)
    setDeleteErrorMessage(null)
    setIsDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!deleteCandidate) return
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/admin/subjects?id=${deleteCandidate.id}`, { method: 'DELETE' })
      if (!res.ok) {
        // try to parse JSON error, fallback to text
        let msg = 'Error eliminando materia'
        try {
          const body = await res.json()
          msg = body?.error || JSON.stringify(body)
        } catch {
          try { msg = await res.text() } catch {
            // ignore
          }
        }
        setDeleteErrorMessage(msg)
        return
      }
      setIsDeleteDialogOpen(false)
      setDeleteCandidate(null)
      setDeleteErrorMessage(null)
      await loadSubjects()
    } catch (err) {
      console.error('Failed to delete subject', err)
      setDeleteErrorMessage('Error al eliminar la materia. Revisa la consola.')
    } finally {
      setIsDeleting(false)
    }
  }

  const resetForm = () => {
    setEditingSubject(null)
    setFormData({
      name: "",
      code: "",
      description: "",
      credits: 3,
      teacherId: teachers[0]?.id || 0,
    })
  }

  return (
    <div className="space-y-4">
      {/* Search and Add */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar materias..."
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
              <Plus className="w-4 h-4 mr-2" />
              Nueva Materia
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingSubject ? "Editar Materia" : "Nueva Materia"}</DialogTitle>
              <DialogDescription>
                {editingSubject ? "Modifica los datos de la materia" : "Completa los datos de la nueva materia"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="code">Código</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="credits">Créditos</Label>
                  <Input
                    id="credits"
                    type="number"
                    min="1"
                    max="6"
                    value={formData.credits}
                    onChange={(e) => setFormData({ ...formData, credits: Number.parseInt(e.target.value) })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="teacher">Profesor</Label>
                  <Select
                    value={formData.teacherId.toString()}
                    onValueChange={(value) => setFormData({ ...formData, teacherId: Number.parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un profesor" />
                    </SelectTrigger>
                    <SelectContent>
                      {teachers.map((teacher) => (
                        <SelectItem key={teacher.id} value={teacher.id.toString()}>
                          {teacher.firstName} {teacher.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">{editingSubject ? "Guardar Cambios" : "Crear Materia"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      
        {/* Delete confirmation dialog for subjects */}
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
                {deleteCandidate ? `Vas a eliminar la materia "${deleteCandidate.name}" (código ${deleteCandidate.code}). Esta acción no se puede deshacer.` : '¿Estás seguro de eliminar esta materia?'}
              </DialogDescription>
            </DialogHeader>

            {deleteErrorMessage && (
              <div className="my-2 p-2 bg-red-50 border border-red-200 rounded text-sm">{deleteErrorMessage}</div>
            )}

            <div className="mt-4 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => { setIsDeleteDialogOpen(false); setDeleteErrorMessage(null); setDeleteCandidate(null); }} disabled={isDeleting}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={confirmDelete} disabled={isDeleting}>
                {isDeleting ? 'Eliminando...' : 'Eliminar'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Subjects Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Profesor</TableHead>
              <TableHead>Créditos</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSubjects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No se encontraron materias
                </TableCell>
              </TableRow>
            ) : (
              filteredSubjects.map((subject) => (
                <TableRow key={subject.id}>
                  <TableCell className="font-medium">{subject.code}</TableCell>
                  <TableCell>{subject.name}</TableCell>
                  <TableCell>{subject.teacherName}</TableCell>
                  <TableCell>{subject.credits}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(subject)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(subject)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
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
