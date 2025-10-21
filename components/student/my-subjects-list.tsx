"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
// Eliminado: lógica de simulación y mock-data
import { BookOpen, User, Calculator, ChevronDown, ChevronUp, FileText, Calendar, Percent } from "lucide-react"

interface MySubjectsListProps {
  studentId: string | number
}

export function MySubjectsList({ studentId }: MySubjectsListProps) {
  const [subjects, setSubjects] = useState<any[]>([])
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null)
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
        setLoading(false)
      })
      .catch((err) => {
        setError("Error al cargar datos reales")
        setLoading(false)
      })
  }, [studentId])

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Cargando datos...</div>
  }
  if (error) {
    return <div className="text-center py-8 text-red-600">{error}</div>
  }
  if (subjects.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No estás inscrito en ninguna materia</p>
      </div>
    )
  }

  const toggleSubject = (subjectId: string) => {
    setExpandedSubject(expandedSubject === subjectId ? null : subjectId)
  }

  return (
    <div className="space-y-4">
      {subjects.map((subject) => {
        const isExpanded = expandedSubject === String(subject.id || subject.subject_id)
        const finalGrade = subject.grade ?? null
        const assignments = subject.assignments || []
        return (
          <div key={subject.id || subject.subject_id} className="border rounded-lg overflow-hidden">
            <button
              onClick={() => toggleSubject(String(subject.id || subject.subject_id))}
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
                </div>
                {finalGrade !== null && (
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
                      <Calculator className="w-3 h-3" />
                      <span>Promedio</span>
                    </div>
                    <div className={`text-2xl font-bold ${finalGrade >= 3.0 ? "text-green-600" : "text-red-600"}`}>
                      {finalGrade !== null ? Number(finalGrade).toFixed(1) : "-"}
                    </div>
                  </div>
                )}
              </div>
            </button>
            {isExpanded && (
              <div className="border-t bg-muted/30 p-4 space-y-4">
                <div>
                  <div className="mb-2">
                    <h4 className="font-semibold text-sm">Descripción</h4>
                    <p className="text-sm text-muted-foreground pl-6">{subject.description || "Sin descripción"}</p>
                  </div>
                  <div className="mb-2">
                    <h4 className="font-semibold text-sm">Profesor</h4>
                    <p className="text-sm text-muted-foreground pl-6">{subject.teacherName || "Desconocido"}</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      <h4 className="font-semibold text-sm">Evaluaciones</h4>
                    </div>
                    {assignments.length > 0 ? (
                      <div className="space-y-2 pl-6">
                        {assignments.map((a: any) => (
                          <div key={a.id} className="flex items-center gap-3">
                            <Badge variant="outline">{a.title}</Badge>
                            <div className="text-xs text-muted-foreground">{a.description}</div>
                            <div className="ml-auto text-sm">{a.studentGrade !== null ? `Tu nota: ${a.studentGrade}` : "Sin nota"}</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground pl-6">No hay evaluaciones registradas</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
