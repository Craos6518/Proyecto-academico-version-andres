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
      headers: {
        // Si usas JWT, agrega aquí el token
        // Authorization: `Bearer ${token}`
      },
    })
      .then((res) => res.json())
      .then((data) => {
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

        {average !== null && (
          <div className="text-right">
            <div className="flex items-center justify-end gap-1 text-sm text-muted-foreground mb-1">
              <Calculator className="w-4 h-4" />
              <span>Promedio Final</span>
            </div>
            <div className={`text-3xl font-bold ${average >= 3.0 ? "text-green-600" : "text-red-600"}`}>
              {average.toFixed(1)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">{average >= 3.0 ? "Aprobado" : "Reprobado"}</div>
          </div>
        )}
      </div>

      {/* Grades Table */}
      {selectedSubjectId && (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Materia</TableHead>
                <TableHead>Calificación</TableHead>
                <TableHead>Fecha</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {grades.filter((g) => g.subject_id === selectedSubjectId).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground">
                    No hay calificaciones registradas para esta materia
                  </TableCell>
                </TableRow>
              ) : (
                grades.filter((g) => g.subject_id === selectedSubjectId).map((grade, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{grade.name}</TableCell>
                    <TableCell>
                      <span className={`text-lg font-semibold ${grade.grade >= 3.0 ? "text-green-600" : "text-red-600"}`}>
                        {grade.grade}
                      </span>
                    </TableCell>
                    <TableCell>
                      {/* Si tienes fecha en la base, muéstrala aquí */}
                      {/* {grade.gradedAt ? new Date(grade.gradedAt).toLocaleDateString("es-ES") : "-"} */}
                      -
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
