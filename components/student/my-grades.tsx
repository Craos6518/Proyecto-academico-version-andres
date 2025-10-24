"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
// Eliminado: lógica de simulación y mock-data
import { Calculator, Calendar } from "lucide-react"

interface MyGradesProps {
  studentId: string | number
}


export function MyGrades({ studentId }: MyGradesProps) {
  const [subjects, setSubjects] = useState<any[]>([])
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("")
  const [grades, setGrades] = useState<any[]>([])
  const [average, setAverage] = useState<number | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string>("")

  useEffect(() => {
    setLoading(true)
    fetch(`/api/student/secure-data`, {
      credentials: 'same-origin',
    })
      .then((res) => res.json())
      .then((data) => {
        try {
          console.debug('[MyGrades] fetched data:', data)
        } catch (e) {
          // noop
        }
        setSubjects(data.subjects || [])
        setGrades(data.grades || [])
        setAverage(data.average || null)
        if ((data.subjects || []).length > 0) {
          setSelectedSubjectId(data.subjects[0].subject_id || "")
        }
        setLoading(false)
      })
      .catch((err) => {
        setError("Error al cargar datos reales")
        setLoading(false)
      })
  }, [studentId])

  // Eliminado: useEffect para filtrar grades por materia

  // Puedes agregar lógica para mostrar el tipo de evaluación si tienes ese dato en la base
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

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Cargando datos...</div>
  }
  if (error) {
    return <div className="text-center py-8 text-red-600">{error}</div>
  }
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
            value={selectedSubjectId}
            onValueChange={(value) => setSelectedSubjectId(value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona una materia" />
            </SelectTrigger>
            <SelectContent>
              {subjects.map((subject) => (
                <SelectItem key={subject.subject_id} value={subject.subject_id}>
                  {subject.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Mostrar promedio de la materia seleccionada (calculated) */}
        {selectedSubjectId && (
          <div className="text-right">
            <div className="flex items-center justify-end gap-1 text-sm text-muted-foreground mb-1">
              <Calculator className="w-4 h-4" />
              <span>Promedio Materia</span>
            </div>
            <div className={`text-3xl font-bold ${(() => {
              const subj = (subjects || []).find((s) => String(s.subject_id) === String(selectedSubjectId))
              const subjAvg = subj?.grade ?? null
              return subjAvg !== null && subjAvg >= 3.0 ? "text-green-600" : "text-red-600"
            })()}`}>
              {(() => {
                const subj = (subjects || []).find((s) => String(s.subject_id) === String(selectedSubjectId))
                const subjAvg = subj?.grade ?? null
                return subjAvg !== null ? (Number(subjAvg).toFixed(2)) : "-"
              })()}
            </div>
            <div className="text-xs text-muted-foreground mt-1">{(() => {
              const subj = (subjects || []).find((s) => String(s.subject_id) === String(selectedSubjectId))
              const subjAvg = subj?.grade ?? null
              return subjAvg !== null ? (subjAvg >= 3.0 ? "Aprobado" : "Reprobado") : "-"
            })()}</div>
          </div>
        )}
      </div>

      {/* Grades Table */}
      {selectedSubjectId && (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Evaluación</TableHead>
                <TableHead>Calificación</TableHead>
                <TableHead>Fecha</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(() => {
                // construir lookup de assignments desde subjects
                const assignmentLookup: Record<string|number, any> = {}
                ;(subjects || []).forEach((s: any) => {
                  ;(s.assignments || []).forEach((a: any) => { if (a?.id) assignmentLookup[String(a.id)] = a })
                })

                const rawSelected = (grades || []).filter((g) => String(g.subject_id) === String(selectedSubjectId))
                if (rawSelected.length === 0) {
                  const subj = (subjects || []).find((s) => String(s.subject_id) === String(selectedSubjectId))
                  const derived = (subj?.assignments || []).map((a: any) => ({
                    id: a.id,
                    name: a.title || a.name || `Evaluación ${a.id}`,
                    score: a.studentGrade ?? null,
                    graded_at: a.graded_at ?? a.gradedAt ?? null,
                    comment: a.comment ?? a.description ?? null,
                  }))
                  if (derived.length === 0) {
                    return (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground">
                          No hay calificaciones registradas para esta materia
                        </TableCell>
                      </TableRow>
                    )
                  }
                  return derived.map((grade: any, idx: number) => (
                    <TableRow key={`d-${idx}`}>
                      <TableCell className="font-medium">
                        <div>{grade.name}</div>
                        {grade.comment && <div className="text-xs text-muted-foreground">{grade.comment}</div>}
                      </TableCell>
                      <TableCell>
                        <span className={`text-lg font-semibold ${(grade.score ?? 0) >= 3.0 ? "text-green-600" : "text-red-600"}`}>
                          {grade.score ?? "-"}
                        </span>
                      </TableCell>
                      <TableCell>{grade.graded_at ? new Date(grade.graded_at).toLocaleDateString("es-ES") : "-"}</TableCell>
                    </TableRow>
                  ))
                }

                // enriquecer los grades con metadata de assignmentLookup cuando falte
                const enriched = rawSelected.map((g: any) => {
                  const a = assignmentLookup[String(g.assignment_id)]
                  return {
                    ...g,
                    name: g.name ?? (a ? (a.title ?? a.name ?? `Evaluación ${g.assignment_id}`) : `Evaluación ${g.assignment_id}`),
                    comment: g.comment ?? (a ? (a.description ?? null) : null),
                    score: Number(g.score ?? g.grade ?? 0),
                  }
                })

                return enriched.map((g: any, idx: number) => (
                  <TableRow key={`g-${idx}`}>
                    <TableCell className="font-medium">
                      <div>{g.name}</div>
                      {g.comment && <div className="text-xs text-muted-foreground">{g.comment}</div>}
                    </TableCell>
                    <TableCell>
                      <span className={`text-lg font-semibold ${(g.score ?? 0) >= 3.0 ? "text-green-600" : "text-red-600"}`}>
                        {typeof g.score === 'number' ? g.score.toFixed(1) : (g.score ?? "-")}
                      </span>
                    </TableCell>
                    <TableCell>{g.graded_at ? new Date(g.graded_at).toLocaleDateString("es-ES") : "-"}</TableCell>
                  </TableRow>
                ))
              })()}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
