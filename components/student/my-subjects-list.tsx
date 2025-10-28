"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
// Eliminado: lógica de simulación y mock-data
import { BookOpen, Calculator, ChevronDown, ChevronUp, FileText } from "lucide-react"

interface MySubjectsListProps {
  studentId: string | number
}

export function MySubjectsList({ studentId }: MySubjectsListProps) {
  const [subjects, setSubjects] = useState<Array<Record<string, unknown>>>([])
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string>("")

  useEffect(() => {
    setLoading(true)
    fetch(`/api/student/secure-data`, {
      credentials: 'same-origin',
      headers: {},
    })
      .then((res) => res.json())
      .then((data) => {
        setSubjects((data?.subjects as Array<Record<string, unknown>>) || [])
        setLoading(false)
      })
      .catch(() => {
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
        const subj = subject as Record<string, unknown>
        const sid = subj["id"] ?? subj["subject_id"] ?? null
        const idStr = String(sid ?? "")
        const isExpanded = expandedSubject === idStr
        const finalGradeRaw = subj["grade"] ?? subj["finalGrade"] ?? null
        const finalGrade = finalGradeRaw != null ? Number(finalGradeRaw) : null
        const assignments = (subj["assignments"] as Array<Record<string, unknown>> | undefined) || []
        return (
          <div key={idStr} className="border rounded-lg overflow-hidden">
            <button
              onClick={() => toggleSubject(idStr)}
              className="w-full p-4 hover:bg-accent/50 transition-colors text-left"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <BookOpen className="w-4 h-4 text-muted-foreground" />
                    <h3 className="font-semibold">{String(subj["name"] ?? subj["title"] ?? "")}</h3>
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
                    <p className="text-sm text-muted-foreground pl-6">{String(subj["description"] ?? "Sin descripción")}</p>
                  </div>
                  <div className="mb-2">
                    <h4 className="font-semibold text-sm">Profesor</h4>
                    <p className="text-sm text-muted-foreground pl-6">{String(subj["teacherName"] ?? subj["teacher"] ?? "Desconocido")}</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      <h4 className="font-semibold text-sm">Evaluaciones</h4>
                    </div>
                    {assignments.length > 0 ? (
                      <div className="space-y-2 pl-6">
                        {assignments.map((a) => {
                          const asg = a as Record<string, unknown>
                          const title = String(asg["title"] ?? asg["name"] ?? asg["assignmentName"] ?? "Evaluación")
                          const desc = String(asg["description"] ?? asg["comment"] ?? "")
                          const studentGradeRaw = asg["studentGrade"] ?? asg["grade"] ?? null
                          const studentGrade = studentGradeRaw != null ? Number(studentGradeRaw) : null
                          return (
                            <div key={String(asg["id"] ?? asg["ID"] ?? title)} className="flex items-center gap-3">
                              <Badge variant="outline">{title}</Badge>
                              <div className="text-xs text-muted-foreground">{desc}</div>
                              <div className="ml-auto text-sm">{studentGrade !== null ? `Tu nota: ${studentGrade}` : "Sin nota"}</div>
                            </div>
                          )
                        })}
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
